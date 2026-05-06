# =============================================================================
# GTCX ECR Module
# =============================================================================
# Container registry for GTCX service images.
# Per SOVEREIGN (6): Images stored in-region
# Per SECURE: Image scanning enabled, lifecycle policies enforced
# =============================================================================

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "repositories" {
  description = "List of ECR repository names"
  type        = list(string)
  default = [
    "gtcx-agx",
    "gtcx-protocols",
    "gtcx-anisa",
    "gtcx-intelligence-sdk",
    "gtcx-intelligence-trainer",
    "gtcx-intelligence-redteam",
  ]
}

variable "image_tag_mutability" {
  description = "Tag mutability setting (MUTABLE or IMMUTABLE)"
  type        = string
  default     = "IMMUTABLE"
}

variable "max_image_count" {
  description = "Maximum number of images to retain per repository"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}

# -----------------------------------------------------------------------------
# Locals
# -----------------------------------------------------------------------------

locals {
  common_tags = merge(var.tags, {
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "gtcx"
    Principle   = "SOVEREIGN SECURE"
  })
}

# -----------------------------------------------------------------------------
# KMS Key for ECR Encryption (per SECURE principle)
# -----------------------------------------------------------------------------

resource "aws_kms_key" "ecr" {
  description         = "GTCX ECR image encryption — ${var.environment}"
  enable_key_rotation = true

  tags = merge(local.common_tags, {
    Name = "gtcx-${var.environment}-ecr-kms"
  })
}

resource "aws_kms_alias" "ecr" {
  name          = "alias/gtcx-${var.environment}-ecr"
  target_key_id = aws_kms_key.ecr.key_id
}

# -----------------------------------------------------------------------------
# ECR Repositories
# -----------------------------------------------------------------------------

resource "aws_ecr_repository" "repos" {
  for_each = toset(var.repositories)

  name                 = each.value
  image_tag_mutability = var.image_tag_mutability
  force_delete         = false

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = aws_kms_key.ecr.arn
  }

  tags = merge(local.common_tags, {
    Name = each.value
  })
}

# -----------------------------------------------------------------------------
# Lifecycle Policies — Retain only N images
# -----------------------------------------------------------------------------

resource "aws_ecr_lifecycle_policy" "repos" {
  for_each   = toset(var.repositories)
  repository = aws_ecr_repository.repos[each.key].name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Expire untagged images after 7 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Keep only the last ${var.max_image_count} tagged images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = var.max_image_count
        }
        action = {
          type = "expire"
        }
      },
    ]
  })
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "repository_urls" {
  description = "Map of repository name to URL"
  value       = { for name, repo in aws_ecr_repository.repos : name => repo.repository_url }
}

output "registry_id" {
  description = "ECR registry ID"
  value       = values(aws_ecr_repository.repos)[0].registry_id
}

# ---------------------------------------------------------------------------
# Repository Policy — Restrict push to account CI role, block public access
# ---------------------------------------------------------------------------
variable "trusted_ci_role_arn" {
  description = "IAM role ARN allowed to push images (e.g., GitHub Actions OIDC role)"
  type        = string
  default     = ""
}

resource "aws_ecr_repository_policy" "restrict_push" {
  for_each   = toset(var.repositories)
  repository = aws_ecr_repository.repos[each.key].name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowPull"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
      },
      {
        Sid    = "AllowPushFromCI"
        Effect = "Allow"
        Principal = {
          AWS = var.trusted_ci_role_arn != "" ? var.trusted_ci_role_arn : "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = [
          "ecr:CompleteLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:InitiateLayerUpload",
          "ecr:BatchCheckLayerAvailability",
          "ecr:PutImage"
        ]
      }
    ]
  })
}

# ---------------------------------------------------------------------------
# Lifecycle Policy — Expire :latest quickly to discourage use
# ---------------------------------------------------------------------------
resource "aws_ecr_lifecycle_policy" "expire_latest" {
  for_each   = toset(var.repositories)
  repository = aws_ecr_repository.repos[each.key].name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Expire latest tag after 1 day"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["latest"]
          countType     = "sinceImagePushed"
          countUnit     = "days"
          countNumber   = 1
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# ---------------------------------------------------------------------------
# Data
# ---------------------------------------------------------------------------
data "aws_caller_identity" "current" {}

# ---------------------------------------------------------------------------
# Outputs
# ---------------------------------------------------------------------------

output "repository_arns" {
  description = "List of ECR repository ARNs"
  value       = [for repo in aws_ecr_repository.repos : repo.arn]
}
