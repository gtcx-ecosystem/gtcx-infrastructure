# =============================================================================
# Detective Controls Module — Terraform Native Tests
# =============================================================================
# Run: terraform test (from this directory)
# Validates CloudTrail + GuardDuty + SNS alerting pipeline.
# =============================================================================

variables {
  environment = "test"
  region      = "af-south-1"
}

# -----------------------------------------------------------------------------
# CloudTrail configuration
# -----------------------------------------------------------------------------

run "cloudtrail_has_log_validation" {
  command = plan

  assert {
    condition     = aws_cloudtrail.main.enable_log_file_validation == true
    error_message = "CloudTrail must have log file validation enabled for tamper detection"
  }
}

run "cloudtrail_includes_global_events" {
  command = plan

  assert {
    condition     = aws_cloudtrail.main.include_global_service_events == true
    error_message = "CloudTrail must include global service events (IAM, STS, etc.)"
  }
}

# -----------------------------------------------------------------------------
# S3 bucket security
# -----------------------------------------------------------------------------

run "cloudtrail_bucket_blocks_public_access" {
  command = plan

  assert {
    condition     = aws_s3_bucket_public_access_block.cloudtrail.block_public_acls == true
    error_message = "CloudTrail bucket must block public ACLs"
  }

  assert {
    condition     = aws_s3_bucket_public_access_block.cloudtrail.restrict_public_buckets == true
    error_message = "CloudTrail bucket must restrict public access"
  }
}

run "cloudtrail_bucket_versioning_enabled" {
  command = plan

  assert {
    condition     = aws_s3_bucket_versioning.cloudtrail.versioning_configuration[0].status == "Enabled"
    error_message = "CloudTrail bucket must have versioning for log integrity"
  }
}

run "cloudtrail_bucket_encrypted_with_kms" {
  command = plan

  assert {
    condition     = aws_s3_bucket_server_side_encryption_configuration.cloudtrail.rule[0].apply_server_side_encryption_by_default[0].sse_algorithm == "aws:kms"
    error_message = "CloudTrail bucket must use KMS encryption"
  }
}

# -----------------------------------------------------------------------------
# KMS key
# -----------------------------------------------------------------------------

run "cloudtrail_kms_key_rotation_enabled" {
  command = plan

  assert {
    condition     = aws_kms_key.cloudtrail.enable_key_rotation == true
    error_message = "CloudTrail KMS key must have automatic rotation enabled"
  }
}

# -----------------------------------------------------------------------------
# GuardDuty
# -----------------------------------------------------------------------------

run "guardduty_enabled" {
  command = plan

  assert {
    condition     = aws_guardduty_detector.main.enable == true
    error_message = "GuardDuty detector must be enabled"
  }
}

# -----------------------------------------------------------------------------
# Retention
# -----------------------------------------------------------------------------

run "cloudtrail_logs_retained_7_years" {
  command = plan

  assert {
    condition     = aws_s3_bucket_lifecycle_configuration.cloudtrail.rule[0].expiration[0].days == 2555
    error_message = "CloudTrail logs must be retained for 7 years (2555 days)"
  }

  assert {
    condition     = aws_s3_bucket_lifecycle_configuration.cloudtrail.rule[0].transition[0].storage_class == "GLACIER"
    error_message = "CloudTrail logs must transition to Glacier for cost efficiency"
  }
}
