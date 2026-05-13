# =============================================================================
# GTCX Platforms IRSA Module
# =============================================================================
# IAM Roles for Service Accounts (IRSA) for gtcx-platforms workloads.
# Allows pods in the gtcx namespace to assume AWS IAM roles via OIDC.
# =============================================================================

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "oidc_provider_arn" {
  description = "EKS OIDC provider ARN"
  type        = string
}

variable "oidc_provider_url" {
  description = "EKS OIDC provider URL (without https:// prefix)"
  type        = string
}

variable "kms_signing_key_arn" {
  description = "KMS signing key ARN (optional — policy attached externally if not provided)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}

locals {
  common_tags = merge(var.tags, {
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "gtcx"
    Principle   = "SECURE"
  })
  account_id = data.aws_caller_identity.current.account_id
}

data "aws_caller_identity" "current" {}

# -----------------------------------------------------------------------------
# gtcx-platforms Service Account IAM Role
# -----------------------------------------------------------------------------

resource "aws_iam_role" "platforms" {
  name = "gtcx-${var.environment}-platforms-irsa"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = var.oidc_provider_arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${var.oidc_provider_url}:sub" = "system:serviceaccount:gtcx:gtcx-platforms"
          "${var.oidc_provider_url}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = local.common_tags
}

# KMS signing permissions for gtcx-platforms (attached only if key ARN provided)
resource "aws_iam_role_policy" "platforms_kms" {
  count = var.kms_signing_key_arn != "" ? 1 : 0

  name = "gtcx-${var.environment}-platforms-kms-sign"
  role = aws_iam_role.platforms.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "AllowKmsSign"
      Effect = "Allow"
      Action = [
        "kms:Sign",
        "kms:GetPublicKey",
        "kms:DescribeKey",
      ]
      Resource = var.kms_signing_key_arn
      Condition = {
        StringEquals = {
          "kms:SigningAlgorithm" = "ECDSA_SHA_256"
        }
      }
    }]
  })
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "platforms_role_arn" {
  description = "IAM role ARN for gtcx-platforms IRSA"
  value       = aws_iam_role.platforms.arn
}

output "platforms_role_name" {
  description = "IAM role name for gtcx-platforms IRSA"
  value       = aws_iam_role.platforms.name
}
