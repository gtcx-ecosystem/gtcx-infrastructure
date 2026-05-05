# =============================================================================
# KYC Document Storage
# =============================================================================
# Jurisdiction-agnostic S3 bucket for KYC document storage.
# Documents are operator-scoped, SSE-KMS encrypted, versioned, and retained
# for the configured period (default 1825 days / 5 years per FATF).
#
# Upload pattern: presigned PUT URL (mobile uploads directly to S3 — no
# double-hop through the API server, critical for 2G field connectivity).
#
# Key structure: kyc/{encoded-did}/{documentType}/{uuid}.{ext}
#
# Principles:
#   SOVEREIGN (6): bucket lives in the same region as the deployment
#   AUDITABLE (3): versioning + CloudTrail on KMS key
#   SECURED (P1): SSE-KMS, block public access, deny non-SSL
# =============================================================================

locals {
  name_prefix = "gtcx-${var.environment}"
}

# -----------------------------------------------------------------------------
# KMS Key — one per environment, not per jurisdiction
# -----------------------------------------------------------------------------

resource "aws_kms_key" "kyc_documents" {
  description             = "KYC document encryption key — ${var.environment}"
  deletion_window_in_days = var.kms_deletion_window_days
  enable_key_rotation     = true

  tags = merge(var.tags, {
    Name      = "${local.name_prefix}-kyc-documents-key"
    Component = "kyc-documents"
  })
}

resource "aws_kms_alias" "kyc_documents" {
  name          = "alias/${local.name_prefix}-kyc-documents"
  target_key_id = aws_kms_key.kyc_documents.key_id
}

# -----------------------------------------------------------------------------
# S3 Bucket
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "kyc_documents" {
  bucket = "${local.name_prefix}-kyc-documents"

  # Prevent accidental destruction — documents are regulatory evidence
  lifecycle {
    prevent_destroy = true
  }

  tags = merge(var.tags, {
    Name      = "${local.name_prefix}-kyc-documents"
    Component = "kyc-documents"
    DataClass = "PII"
  })
}

resource "aws_s3_bucket_versioning" "kyc_documents" {
  bucket = aws_s3_bucket.kyc_documents.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "kyc_documents" {
  bucket = aws_s3_bucket.kyc_documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.kyc_documents.arn
    }
    bucket_key_enabled = true # reduces KMS API costs
  }
}

resource "aws_s3_bucket_public_access_block" "kyc_documents" {
  bucket = aws_s3_bucket.kyc_documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Deny all non-SSL access
resource "aws_s3_bucket_policy" "kyc_documents" {
  bucket = aws_s3_bucket.kyc_documents.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyNonSSL"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.kyc_documents.arn,
          "${aws_s3_bucket.kyc_documents.arn}/*"
        ]
        Condition = {
          Bool = { "aws:SecureTransport" = "false" }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.kyc_documents]
}

# Lifecycle: transition to cheaper storage tiers, expire after retention period
resource "aws_s3_bucket_lifecycle_configuration" "kyc_documents" {
  bucket = aws_s3_bucket.kyc_documents.id

  rule {
    id     = "kyc-document-lifecycle"
    status = "Enabled"

    filter {
      prefix = "kyc/"
    }

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 365
      storage_class = "GLACIER_IR"
    }

    expiration {
      days = var.document_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}
