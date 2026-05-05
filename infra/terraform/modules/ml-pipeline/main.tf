# =============================================================================
# GTCX ML Pipeline Module — Main
# =============================================================================
# Storage infrastructure for the L5 self-improving intelligence pipeline:
# - Versioned training datasets (S3 + DVC)
# - Model artifact storage (S3)
# - Model registry with lineage tracking (DynamoDB)
# - IRSA role for pipeline service account
#
# Per SIGNAL L5: Production traces → curated dataset → fine-tune → eval → promote
# Per SOVEREIGN (6): All data stays in-region (af-south-1)
# =============================================================================

locals {
  common_tags = merge(var.tags, {
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "gtcx"
    Component   = "ml-pipeline"
    Principle   = "SIGNAL-L5 SOVEREIGN"
  })

  oidc_issuer = var.eks_oidc_provider_url
}

# -----------------------------------------------------------------------------
# S3 — Training Datasets (DVC-versioned)
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "datasets" {
  bucket = var.dataset_bucket_name

  tags = merge(local.common_tags, {
    Name    = var.dataset_bucket_name
    Purpose = "DVC-versioned training datasets from production traces"
  })
}

resource "aws_s3_bucket_versioning" "datasets" {
  bucket = aws_s3_bucket.datasets.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "datasets" {
  bucket = aws_s3_bucket.datasets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "datasets" {
  bucket = aws_s3_bucket.datasets.id

  rule {
    id     = "archive-old-datasets"
    status = "Enabled"

    transition {
      days          = var.dataset_glacier_transition_days
      storage_class = "GLACIER_IR"
    }

    noncurrent_version_expiration {
      noncurrent_days = var.dataset_noncurrent_expiration_days
    }
  }
}

resource "aws_s3_bucket_public_access_block" "datasets" {
  bucket = aws_s3_bucket.datasets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# -----------------------------------------------------------------------------
# S3 — Model Artifacts
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "models" {
  bucket = var.model_bucket_name

  tags = merge(local.common_tags, {
    Name    = var.model_bucket_name
    Purpose = "Model weights, LoRA adapters, and training artifacts"
  })
}

resource "aws_s3_bucket_versioning" "models" {
  bucket = aws_s3_bucket.models.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "models" {
  bucket = aws_s3_bucket.models.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "models" {
  bucket = aws_s3_bucket.models.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# -----------------------------------------------------------------------------
# DynamoDB — Model Registry
# -----------------------------------------------------------------------------
# Tracks all model versions with full lineage:
# training data → training job → eval results → red-team scan → deployment

resource "aws_dynamodb_table" "model_registry" {
  name         = var.registry_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "model_id"
  range_key    = "version"

  attribute {
    name = "model_id"
    type = "S"
  }

  attribute {
    name = "version"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name            = "status-index"
    hash_key        = "status"
    range_key       = "version"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name    = var.registry_table_name
    Purpose = "Model metadata, eval results, lineage tracking"
  })
}

# -----------------------------------------------------------------------------
# IAM — IRSA Role for ML Pipeline
# -----------------------------------------------------------------------------

resource "aws_iam_role" "pipeline" {
  name = "gtcx-${var.environment}-intelligence-pipeline"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = var.eks_oidc_provider_arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${local.oidc_issuer}:sub" = "system:serviceaccount:${var.pipeline_namespace}:${var.pipeline_service_account}"
          "${local.oidc_issuer}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "pipeline_s3" {
  name = "gtcx-${var.environment}-pipeline-s3"
  role = aws_iam_role.pipeline.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DatasetStorage"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket",
          "s3:DeleteObject",
        ]
        Resource = [
          aws_s3_bucket.datasets.arn,
          "${aws_s3_bucket.datasets.arn}/*",
        ]
      },
      {
        Sid    = "ModelStorage"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket",
        ]
        Resource = [
          aws_s3_bucket.models.arn,
          "${aws_s3_bucket.models.arn}/*",
        ]
      },
    ]
  })
}

resource "aws_iam_role_policy" "pipeline_dynamodb" {
  name = "gtcx-${var.environment}-pipeline-dynamodb"
  role = aws_iam_role.pipeline.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "ModelRegistry"
      Effect = "Allow"
      Action = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan",
      ]
      Resource = [
        aws_dynamodb_table.model_registry.arn,
        "${aws_dynamodb_table.model_registry.arn}/index/*",
      ]
    }]
  })
}
