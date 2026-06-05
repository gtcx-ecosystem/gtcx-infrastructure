# =============================================================================
# GTCX Immutable Backup Configuration
# =============================================================================
# S3 Object Lock (compliance mode) on the audit backup bucket.
# Per AUDITABLE principle (3): Backups cannot be deleted or overwritten.
# Per SOVEREIGN principle (6): Retention enforced at the storage layer.
#
# IMPORTANT: S3 Object Lock can only be enabled at bucket creation time.
# If the existing backup bucket was created without Object Lock, this
# configuration must be applied to a new bucket and data migrated.
# =============================================================================
#
# ANNUAL RESTORE-FROM-SCRATCH TEST PROCEDURE
# -------------------------------------------
# Frequency: Once per year, aligned with Q2 DR test schedule
# Owner: Infrastructure team + External auditor witness
#
# 1. Pre-test preparation:
#    a. Select a backup snapshot from >= 30 days ago (proves retention works)
#    b. Provision an isolated VPC with no connectivity to production
#    c. Notify regulator witness of test date and scope
#
# 2. Restore procedure:
#    a. Download the selected S3 export from the immutable backup bucket:
#       aws s3 cp s3://gtcx-<env>-audit-backups-immutable/<export-id>/ /tmp/restore/ --recursive
#    b. Provision a fresh RDS instance in the isolated VPC:
#       aws rds restore-db-instance-from-s3 \
#         --db-instance-identifier gtcx-restore-test-<date> \
#         --s3-bucket-name gtcx-<env>-audit-backups-immutable \
#         --s3-prefix <export-id> \
#         --source-engine postgres --source-engine-version 16.6 \
#         --db-instance-class db.t3.medium \
#         --engine postgres
#    c. Wait for instance to reach "available" state
#
# 3. Validation:
#    a. Connect and verify row counts match the original snapshot manifest
#    b. Run referential integrity checks on all foreign keys
#    c. Verify audit trail continuity (no sequence gaps)
#    d. Query a known transaction by ID and verify all fields match
#    e. Confirm encryption at rest is active: SHOW ssl;
#
# 4. Cleanup:
#    a. Export test results and sign with auditor witness
#    b. Delete the test RDS instance (isolated VPC only)
#    c. Delete the isolated VPC
#    d. File restore test report in compliance evidence store
#
# 5. Success criteria:
#    - Restore completes within 2 hours
#    - All data integrity checks pass
#    - Zero data loss compared to snapshot manifest
#    - Encryption verified at rest and in transit
# =============================================================================

# -----------------------------------------------------------------------------
# Immutable Backup Bucket (Object Lock enabled)
# -----------------------------------------------------------------------------
# Note: Object Lock requires a separate bucket created with object_lock_enabled.
# The existing backup bucket (aws_s3_bucket.backup) retains its current role.
# This bucket provides the compliance-mode immutable layer.
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "immutable_backup" {
  bucket              = "gtcx-${var.environment}-audit-backups-immutable"
  object_lock_enabled = true

  tags = merge(local.common_tags, {
    Name      = "gtcx-${var.environment}-audit-backups-immutable"
    Principle = "IMMUTABLE"
  })
}

resource "aws_s3_bucket_versioning" "immutable_backup" {
  bucket = aws_s3_bucket.immutable_backup.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_object_lock_configuration" "immutable_backup" {
  bucket = aws_s3_bucket.immutable_backup.id

  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = 30
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "immutable_backup" {
  bucket = aws_s3_bucket.immutable_backup.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.backup.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "immutable_backup" {
  bucket = aws_s3_bucket.immutable_backup.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "immutable_backup" {
  bucket = aws_s3_bucket.immutable_backup.id

  rule {
    id     = "immutable-audit-retention"
    status = "Enabled"

    filter {}

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    # 7-year retention per AUDITABLE principle
    expiration {
      days = 2555
    }
  }
}

# -----------------------------------------------------------------------------
# Cross-Region Replication for Immutable Bucket
# -----------------------------------------------------------------------------

resource "aws_s3_bucket_replication_configuration" "immutable_backup" {
  count  = var.immutable_replication_destination_bucket_arn != "" ? 1 : 0
  bucket = aws_s3_bucket.immutable_backup.id
  role   = aws_iam_role.rds_export.arn

  rule {
    id     = "immutable-backup-replication"
    status = "Enabled"

    filter {}

    destination {
      bucket        = var.immutable_replication_destination_bucket_arn
      storage_class = "STANDARD_IA"
    }

    delete_marker_replication {
      status = "Enabled"
    }
  }
}
