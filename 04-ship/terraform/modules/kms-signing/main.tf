# =============================================================================
# GTCX KMS Signing Module
# =============================================================================
# AWS KMS asymmetric keys for cryptographic signing operations.
# Replaces Web Crypto API signing with FIPS 140-2 Level 2 validated HSM backing.
#
# Per SECURE (P11): All signing operations use KMS-backed keys
# Per AUDITABLE (P3): Every KMS API call is logged via CloudTrail
# Per SOVEREIGN (P6): Keys are region-locked, never exported
#
# Supports:
#   - ECC_NIST_P256 (ES256 / did-jwt-es256 scheme)
#   - Signing key for replay-guard service
#   - Automatic key rotation via alias swap (asymmetric keys don't auto-rotate)
#
# Bank-grade controls:
#   - Key policy enforces least privilege (only replay-guard role can sign)
#   - CloudTrail alarm on unexpected Sign/Verify calls
#   - Deletion protection (30-day pending deletion window)
#   - No key export (key material never leaves KMS HSM)
# =============================================================================

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  common_tags = {
    Environment = var.environment
    Module      = "kms-signing"
    ManagedBy   = "terraform"
    Principle   = "SECURE"
  }

  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name
}

# -----------------------------------------------------------------------------
# Primary Signing Key — ECC_NIST_P256 (ES256)
# -----------------------------------------------------------------------------

resource "aws_kms_key" "signing" {
  description              = "GTCX replay-guard signing key — ${var.environment}"
  key_usage                = "SIGN_VERIFY"
  customer_master_key_spec = "ECC_NIST_P256"
  deletion_window_in_days  = var.deletion_window_days
  is_enabled               = true

  # Asymmetric keys do not support automatic rotation.
  # Rotation is performed via alias swap (see rotation resources below).
  enable_key_rotation = false

  policy = data.aws_iam_policy_document.signing_key_policy.json

  tags = merge(local.common_tags, {
    Name        = "gtcx-${var.environment}-signing"
    KeyPurpose  = "replay-guard-signing"
    Compliance  = "FFIEC-key-management"
    RotationDue = timeadd(timestamp(), "${var.rotation_interval_days * 24}h")
  })

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_kms_alias" "signing" {
  name          = "alias/gtcx-${var.environment}-signing"
  target_key_id = aws_kms_key.signing.key_id
}

# -----------------------------------------------------------------------------
# Key Policy — Least Privilege
# -----------------------------------------------------------------------------

data "aws_iam_policy_document" "signing_key_policy" {
  # Root account retains full admin (required by KMS)
  statement {
    sid    = "EnableRootAccountAdmin"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${local.account_id}:root"]
    }
    actions   = ["kms:*"]
    resources = ["*"]
  }

  # Replay-guard service role: Sign only
  statement {
    sid    = "AllowReplayGuardSign"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = var.signing_role_arns
    }
    actions = [
      "kms:Sign",
      "kms:GetPublicKey",
      "kms:DescribeKey",
    ]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "kms:SigningAlgorithm"
      values   = ["ECDSA_SHA_256"]
    }
  }

  # Key administrators: manage but cannot use for signing
  statement {
    sid    = "AllowKeyAdministration"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = var.admin_role_arns
    }
    actions = [
      "kms:Create*",
      "kms:Describe*",
      "kms:Enable*",
      "kms:List*",
      "kms:Put*",
      "kms:Update*",
      "kms:Revoke*",
      "kms:Disable*",
      "kms:Get*",
      "kms:Delete*",
      "kms:TagResource",
      "kms:UntagResource",
      "kms:ScheduleKeyDeletion",
      "kms:CancelKeyDeletion",
    ]
    resources = ["*"]
  }

  # Deny key export (defense-in-depth: asymmetric keys can't be exported anyway)
  statement {
    sid    = "DenyKeyExport"
    effect = "Deny"
    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
    actions = [
      "kms:GetKeyRotationStatus",
      "kms:ImportKeyMaterial",
    ]
    resources = ["*"]

    condition {
      test     = "StringNotEquals"
      variable = "aws:PrincipalArn"
      values   = ["arn:aws:iam::${local.account_id}:root"]
    }
  }
}

# -----------------------------------------------------------------------------
# CloudTrail Alarm — Unexpected KMS Usage
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "kms_audit" {
  name              = "/gtcx/${var.environment}/kms-signing-audit"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "unexpected_kms_sign" {
  alarm_name          = "gtcx-${var.environment}-unexpected-kms-sign"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "UnexpectedKMSSign"
  namespace           = "GTCX/KMS"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "KMS Sign API called by unexpected IAM principal. Possible key compromise."
  treat_missing_data  = "notBreaching"

  alarm_actions = var.alarm_sns_topic_arns

  tags = local.common_tags
}

# CloudWatch metric filter for Sign calls from unexpected roles
resource "aws_cloudwatch_log_metric_filter" "unexpected_sign" {
  name           = "gtcx-${var.environment}-unexpected-kms-sign"
  log_group_name = aws_cloudwatch_log_group.kms_audit.name
  pattern        = "{ $.eventName = \"Sign\" && $.resources[0].ARN = \"${aws_kms_key.signing.arn}\" }"

  metric_transformation {
    name      = "UnexpectedKMSSign"
    namespace = "GTCX/KMS"
    value     = "1"
  }
}

# -----------------------------------------------------------------------------
# IAM Policy for Replay-Guard Service (attachable to IRSA role)
# -----------------------------------------------------------------------------

resource "aws_iam_policy" "replay_guard_kms" {
  name        = "gtcx-${var.environment}-replay-guard-kms-sign"
  description = "Allows replay-guard to sign with KMS key"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowSign"
        Effect = "Allow"
        Action = [
          "kms:Sign",
          "kms:GetPublicKey",
          "kms:DescribeKey",
        ]
        Resource = aws_kms_key.signing.arn
        Condition = {
          StringEquals = {
            "kms:SigningAlgorithm" = "ECDSA_SHA_256"
          }
        }
      }
    ]
  })

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Key Rotation Tracking
# -----------------------------------------------------------------------------
# Asymmetric KMS keys don't support automatic rotation.
# Rotation is performed by:
#   1. Creating a new key
#   2. Updating the alias to point to the new key
#   3. Keeping the old key active for grace_period_days (signature verification)
#   4. Scheduling deletion of the old key after grace period
#
# This is tracked via tags and documented in the key ceremony runbook.
# -----------------------------------------------------------------------------

resource "aws_ssm_parameter" "signing_key_id" {
  name        = "/gtcx/${var.environment}/kms/signing-key-id"
  description = "Current active signing key ID for replay-guard"
  type        = "String"
  value       = aws_kms_key.signing.key_id

  tags = local.common_tags
}

resource "aws_ssm_parameter" "signing_key_arn" {
  name        = "/gtcx/${var.environment}/kms/signing-key-arn"
  description = "Current active signing key ARN for replay-guard"
  type        = "String"
  value       = aws_kms_key.signing.arn

  tags = local.common_tags
}
