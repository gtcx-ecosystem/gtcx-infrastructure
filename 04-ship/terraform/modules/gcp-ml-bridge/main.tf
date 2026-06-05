# =============================================================================
# GCP → AWS ML bridge (Phase 3)
# =============================================================================
# Allows GCP Vertex pipeline SA to write model artifacts to AWS S3 and
# update DynamoDB registry. No customer PII — artifacts and metadata only.
#
# Canonical HCL: gtcx-intelligence/docs/roadmap/global-trade-phase-3-ml-pipeline.md
# Ecosystem spec: gtcx-docs/docs/architecture/cloud-placement/gtcx-ecosystem-2026-06-05.md
# =============================================================================

locals {
  enabled = var.enabled && var.gcp_service_account_unique_id != ""
  tags = merge(var.tags, {
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "gtcx"
    Component   = "gcp-ml-bridge"
  })
  # Google OIDC thumbprint (accounts.google.com) — standard for AWS-GCP WIF
  google_oidc_thumbprint = "6938fd4d98f03fb8f84d923e27058e77ee27e9bb"
}

resource "aws_iam_openid_connect_provider" "google" {
  count = local.enabled ? 1 : 0

  url             = "https://accounts.google.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [local.google_oidc_thumbprint]

  tags = local.tags
}

resource "aws_iam_role" "gcp_ml_bridge" {
  count = local.enabled ? 1 : 0
  name  = "gtcx-${var.environment}-intelligence-gcp-ml-bridge"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.google[0].arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "accounts.google.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          "accounts.google.com:sub" = var.gcp_service_account_unique_id
        }
      }
    }]
  })

  tags = local.tags
}

resource "aws_iam_role_policy" "gcp_ml_bridge" {
  count = local.enabled ? 1 : 0
  name  = "gtcx-${var.environment}-gcp-ml-bridge-policy"
  role  = aws_iam_role.gcp_ml_bridge[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ModelArtifacts"
        Effect = "Allow"
        Action = ["s3:PutObject", "s3:GetObject", "s3:ListBucket"]
        Resource = [
          var.model_bucket_arn,
          "${var.model_bucket_arn}/*",
        ]
      },
      {
        Sid    = "ModelRegistry"
        Effect = "Allow"
        Action = ["dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:GetItem"]
        Resource = [
          var.registry_table_arn,
          "${var.registry_table_arn}/index/*",
        ]
      },
    ]
  })
}
