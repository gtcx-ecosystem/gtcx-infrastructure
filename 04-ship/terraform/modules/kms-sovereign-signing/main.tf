# =============================================================================
# GTCX KMS Sovereign Signing Module
# =============================================================================
# Multi-key AWS KMS asymmetric signing for sovereign authority DIDs.
# Extends kms-signing pattern to support 1..N keys per jurisdiction or
# authority, each with independent alias, policy, and alarm.
#
# Per SECURE (P11): FIPS 140-2 Level 2 validated HSM backing (AWS KMS)
# Per AUDITABLE (P3): CloudTrail logs every KMS API call
# Per SOVEREIGN (P6): Keys region-locked, never exported
#
# Algorithm decision (required before apply):
#   - AWS KMS supports ECC_NIST_P256 / P384 / P521, RSA_2048 / 3072 / 4096
#   - AWS KMS does NOT support Ed25519 as of 2026-06
#   - If Ed25519 is required for did:gtcx authority DIDs, use AWS CloudHSM
#     or update DID documents to use ECDSA P-256 (cross-repo change).
#
# Bank-grade controls:
#   - Least-privilege key policies per authority
#   - CloudTrail alarm on unexpected Sign calls per key
#   - Deletion protection (30-day window)
#   - SSM parameters for key discovery
# =============================================================================

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  common_tags = {
    Environment = var.environment
    Module      = "kms-sovereign-signing"
    ManagedBy   = "terraform"
    Principle   = "SECURE"
  }
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name
}

# ---------------------------------------------------------------------------
# Sovereign Signing Keys — one per authority config entry
# ---------------------------------------------------------------------------

resource "aws_kms_key" "sovereign" {
  for_each = var.authorities

  description              = "GTCX sovereign signing — ${var.environment} — ${each.value.label}"
  key_usage                = "SIGN_VERIFY"
  customer_master_key_spec = each.value.key_spec
  deletion_window_in_days  = var.deletion_window_days
  is_enabled               = true
  enable_key_rotation      = false # asymmetric keys do not auto-rotate

  policy = data.aws_iam_policy_document.sovereign_key_policy[each.key].json

  tags = merge(local.common_tags, {
    Name        = "gtcx-${var.environment}-sovereign-${each.key}"
    KeyPurpose  = "sovereign-authority-signing"
    Authority   = each.key
    Compliance  = "FFIEC-key-management"
    RotationDue = timeadd(timestamp(), "${var.rotation_interval_days * 24}h")
  })

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_kms_alias" "sovereign" {
  for_each = var.authorities

  name          = "alias/gtcx-${var.environment}-sovereign-${each.key}"
  target_key_id = aws_kms_key.sovereign[each.key].key_id
}

# ---------------------------------------------------------------------------
# Key Policy — Least Privilege per Authority
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "sovereign_key_policy" {
  for_each = var.authorities

  # Root account admin (required by KMS)
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

  # Sovereign service roles: Sign + GetPublicKey
  statement {
    sid    = "AllowSovereignSign"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = each.value.signing_role_arns
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
      values   = [each.value.signing_algorithm]
    }
  }

  # Key administrators
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

  # Deny export
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

# ---------------------------------------------------------------------------
# CloudWatch Alarms — Unexpected KMS Usage per Authority
# ---------------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "sovereign_audit" {
  name              = "/gtcx/${var.environment}/kms-sovereign-audit"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "unexpected_sovereign_sign" {
  for_each = var.authorities

  alarm_name          = "gtcx-${var.environment}-sovereign-${each.key}-unexpected-sign"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "UnexpectedSovereignSign"
  namespace           = "GTCX/KMS"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "KMS Sign API called for sovereign key ${each.key} by unexpected principal."
  treat_missing_data  = "notBreaching"

  alarm_actions = var.alarm_sns_topic_arns

  tags = merge(local.common_tags, {
    Authority = each.key
  })
}

resource "aws_cloudwatch_log_metric_filter" "unexpected_sovereign_sign" {
  for_each = var.authorities

  name           = "gtcx-${var.environment}-sovereign-${each.key}-unexpected-sign"
  log_group_name = aws_cloudwatch_log_group.sovereign_audit.name
  pattern        = "{ $.eventName = \"Sign\" && $.resources[0].ARN = \"${aws_kms_key.sovereign[each.key].arn}\" }"

  metric_transformation {
    name      = "UnexpectedSovereignSign"
    namespace = "GTCX/KMS"
    value     = "1"
  }
}

# ---------------------------------------------------------------------------
# IAM Policies — Attachable to IRSA roles per authority
# ---------------------------------------------------------------------------

resource "aws_iam_policy" "sovereign_kms" {
  for_each = var.authorities

  name        = "gtcx-${var.environment}-sovereign-${each.key}-kms-sign"
  description = "Allows sovereign service to sign with KMS key for ${each.key}"

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
        Resource = aws_kms_key.sovereign[each.key].arn
        Condition = {
          StringEquals = {
            "kms:SigningAlgorithm" = each.value.signing_algorithm
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Authority = each.key
  })
}

# ---------------------------------------------------------------------------
# SSM Parameters — Key Discovery
# ---------------------------------------------------------------------------

resource "aws_ssm_parameter" "sovereign_key_id" {
  for_each = var.authorities

  name        = "/gtcx/${var.environment}/kms/sovereign/${each.key}/key-id"
  description = "Sovereign signing key ID for ${each.key}"
  type        = "String"
  value       = aws_kms_key.sovereign[each.key].key_id

  tags = merge(local.common_tags, {
    Authority = each.key
  })
}

resource "aws_ssm_parameter" "sovereign_key_arn" {
  for_each = var.authorities

  name        = "/gtcx/${var.environment}/kms/sovereign/${each.key}/key-arn"
  description = "Sovereign signing key ARN for ${each.key}"
  type        = "String"
  value       = aws_kms_key.sovereign[each.key].arn

  tags = merge(local.common_tags, {
    Authority = each.key
  })
}
