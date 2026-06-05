# =============================================================================
# Backup Module — Terraform Native Tests
# =============================================================================
# Run: terraform test (from this directory)
# Validates audit backup pipeline: S3, KMS, Lambda, EventBridge.
# =============================================================================

variables {
  environment   = "test"
  region        = "af-south-1"
  db_identifier = "gtcx-test-audit"
}

# -----------------------------------------------------------------------------
# S3 bucket configuration
# -----------------------------------------------------------------------------

run "backup_bucket_created" {
  command = plan

  assert {
    condition     = aws_s3_bucket.backup.bucket == "gtcx-test-audit-backups"
    error_message = "Backup bucket must follow naming convention"
  }
}

run "backup_bucket_versioning_enabled" {
  command = plan

  assert {
    condition     = aws_s3_bucket_versioning.backup.versioning_configuration[0].status == "Enabled"
    error_message = "Backup bucket must have versioning enabled for audit integrity"
  }
}

run "backup_bucket_blocks_public_access" {
  command = plan

  assert {
    condition     = aws_s3_bucket_public_access_block.backup.block_public_acls == true
    error_message = "Backup bucket must block public ACLs"
  }

  assert {
    condition     = aws_s3_bucket_public_access_block.backup.block_public_policy == true
    error_message = "Backup bucket must block public policy"
  }

  assert {
    condition     = aws_s3_bucket_public_access_block.backup.restrict_public_buckets == true
    error_message = "Backup bucket must restrict public buckets"
  }
}

# -----------------------------------------------------------------------------
# Encryption
# -----------------------------------------------------------------------------

run "kms_key_has_rotation_enabled" {
  command = plan

  assert {
    condition     = aws_kms_key.backup.enable_key_rotation == true
    error_message = "Backup KMS key must have automatic rotation enabled"
  }
}

run "s3_encryption_uses_kms" {
  command = plan

  assert {
    condition     = aws_s3_bucket_server_side_encryption_configuration.backup.rule[0].apply_server_side_encryption_by_default[0].sse_algorithm == "aws:kms"
    error_message = "Backup bucket must use KMS encryption, not AES-256"
  }
}

# -----------------------------------------------------------------------------
# Lambda configuration
# -----------------------------------------------------------------------------

run "lambda_timeout_sufficient" {
  command = plan

  assert {
    condition     = aws_lambda_function.backup.timeout == 300
    error_message = "Backup Lambda must have 300s timeout for large snapshot exports"
  }

  assert {
    condition     = aws_lambda_function.backup.runtime == "python3.12"
    error_message = "Backup Lambda must use Python 3.12 runtime"
  }
}

# -----------------------------------------------------------------------------
# Lifecycle retention
# -----------------------------------------------------------------------------

run "glacier_transition_at_90_days" {
  command = plan

  assert {
    condition     = aws_s3_bucket_lifecycle_configuration.backup.rule[0].transition[0].days == 90
    error_message = "Backup data must transition to Glacier at 90 days"
  }

  assert {
    condition     = aws_s3_bucket_lifecycle_configuration.backup.rule[0].expiration[0].days == 2555
    error_message = "Backup data must be retained for 7 years (2555 days)"
  }
}
