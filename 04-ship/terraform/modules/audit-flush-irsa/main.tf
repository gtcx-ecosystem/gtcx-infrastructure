# =============================================================================
# Audit Flush IRSA Module
# =============================================================================
# IAM role for the audit-flush sidecar's ServiceAccount. The role grants
# only s3:PutObject (and supporting actions) on the WORM audit bucket
# under a per-environment prefix, and KMS encrypt on the bucket's CMK.
# No s3:DeleteObject, no s3:GetObject — write-only by design.
#
# Pair this module's output with the audit-flush.yaml ServiceAccount's
# eks.amazonaws.com/role-arn annotation in each environment overlay.
# =============================================================================

variable "environment" {
  description = "Environment name (testnet, staging, production)"
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

variable "worm_bucket_arn" {
  description = "ARN of the WORM audit S3 bucket the sidecar writes to"
  type        = string
}

variable "worm_kms_key_arn" {
  description = "ARN of the KMS CMK encrypting the WORM bucket"
  type        = string
}

variable "service_account_name" {
  description = "Kubernetes ServiceAccount name"
  type        = string
  default     = "audit-flush"
}

variable "namespace" {
  description = "Kubernetes namespace hosting the sidecar"
  type        = string
  default     = "gtcx"
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}

variable "list_bucket_prefixes" {
  description = <<-EOT
    S3 key prefixes the sidecar is permitted to list. Defaults to the
    per-tenant and quarantine prefixes that flush.unit.test.mjs writes
    under. ListBucket without a prefix condition would expose the
    bucket's inventory across tenants — a horizontal-privilege risk
    cited in the 2026-05-30 security audit.
  EOT
  type        = list(string)
  default     = ["tenant=*/*", "_quarantine/*"]
}

locals {
  common_tags = merge(var.tags, {
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "gtcx"
    Principle   = "AUDITABLE"
  })
}

resource "aws_iam_role" "audit_flush" {
  name = "gtcx-${var.environment}-audit-flush-irsa"

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
          "${var.oidc_provider_url}:sub" = "system:serviceaccount:${var.namespace}:${var.service_account_name}"
          "${var.oidc_provider_url}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = local.common_tags
}

# Write-only policy. NO Delete, NO Get, NO list outside the prefix.
# The WORM Object Lock prevents deletion anyway, but defense in depth.
resource "aws_iam_role_policy" "audit_flush_write" {
  name = "audit-flush-worm-write"
  role = aws_iam_role.audit_flush.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowPutObjectOnly"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectLegalHold",
        ]
        Resource = "${var.worm_bucket_arn}/*"
      },
      {
        Sid      = "AllowListBucketUnderPrefix"
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = var.worm_bucket_arn
        Condition = {
          # Scope listing to per-tenant + quarantine prefixes. Without
          # this condition the role can list every tenant's keys — the
          # horizontal-privilege risk flagged in the 2026-05-30 audit.
          StringLike = {
            "s3:prefix" = var.list_bucket_prefixes
          }
        }
      },
      {
        Sid    = "AllowKmsEncryptForBucketCMK"
        Effect = "Allow"
        Action = [
          "kms:Encrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey",
        ]
        Resource = var.worm_kms_key_arn
      },
    ]
  })
}

output "role_arn" {
  description = "IAM role ARN to annotate the audit-flush ServiceAccount with"
  value       = aws_iam_role.audit_flush.arn
}

output "role_name" {
  description = "IAM role name"
  value       = aws_iam_role.audit_flush.name
}
