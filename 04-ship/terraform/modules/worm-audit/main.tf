# =============================================================================
# WORM Audit Storage — Write-Once-Read-Many S3 Bucket with Object Lock
# =============================================================================
# Implements SIGNAL Integrity control I4: WORM audit storage.
# All audit events are archived to S3 with Object Lock in COMPLIANCE mode,
# preventing deletion or overwrite for the configured retention period.
#
# Verification:
#   aws s3api get-object-lock-configuration --bucket <bucket_name>
# =============================================================================

resource "aws_s3_bucket" "worm_audit" {
  bucket = "${var.name_prefix}-worm-audit-${var.environment}-${var.aws_region}"

  tags = {
    Name        = "${var.name_prefix}-worm-audit"
    Environment = var.environment
    Purpose     = "institutional-controls-phase4"
    ManagedBy   = "terraform"
    Compliance  = "WORM"
  }
}

resource "aws_s3_bucket_versioning" "worm_audit" {
  bucket = aws_s3_bucket.worm_audit.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_object_lock_configuration" "worm_audit" {
  bucket = aws_s3_bucket.worm_audit.id

  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = var.retention_days
    }
  }

  depends_on = [aws_s3_bucket_versioning.worm_audit]
}

resource "aws_s3_bucket_server_side_encryption_configuration" "worm_audit" {
  bucket = aws_s3_bucket.worm_audit.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.worm_audit.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_kms_key" "worm_audit" {
  description             = "KMS key for WORM audit storage encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name      = "${var.name_prefix}-worm-audit-key"
    Purpose   = "institutional-controls-phase4"
    ManagedBy = "terraform"
  }
}

resource "aws_kms_alias" "worm_audit" {
  name          = "alias/${var.name_prefix}-worm-audit-${var.environment}"
  target_key_id = aws_kms_key.worm_audit.key_id
}

resource "aws_s3_bucket_public_access_block" "worm_audit" {
  bucket = aws_s3_bucket.worm_audit.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "worm_audit" {
  bucket = aws_s3_bucket.worm_audit.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyUnencryptedUploads"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.worm_audit.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid       = "DenyNonSSL"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.worm_audit.arn,
          "${aws_s3_bucket.worm_audit.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}


