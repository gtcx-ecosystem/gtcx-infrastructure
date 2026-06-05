# =============================================================================
# WORM Audit Module — Terraform Native Tests
# =============================================================================
# Run: terraform test (from this directory)
# Validates WORM audit storage: Object Lock, retention, encryption, access.
# =============================================================================

variables {
  environment  = "test"
}

# -----------------------------------------------------------------------------
# Object Lock configuration
# -----------------------------------------------------------------------------

run "object_lock_enabled" {
  command = plan

  assert {
    condition     = aws_s3_bucket.worm.object_lock_enabled == true
    error_message = "WORM bucket must have Object Lock enabled"
  }
}

run "object_lock_compliance_mode" {
  command = plan

  assert {
    condition     = aws_s3_bucket_object_lock_configuration.worm.rule[0].default_retention[0].mode == "COMPLIANCE"
    error_message = "Object Lock must use COMPLIANCE mode (not GOVERNANCE)"
  }
}

run "retention_minimum_7_years" {
  command = plan

  assert {
    condition     = aws_s3_bucket_object_lock_configuration.worm.rule[0].default_retention[0].days >= 2557
    error_message = "Retention must be >= 2557 days (7 years)"
  }
}

# -----------------------------------------------------------------------------
# Versioning (required for Object Lock)
# -----------------------------------------------------------------------------

run "versioning_enabled" {
  command = plan

  assert {
    condition     = aws_s3_bucket_versioning.worm.versioning_configuration[0].status == "Enabled"
    error_message = "Versioning must be enabled (required for Object Lock)"
  }
}

# -----------------------------------------------------------------------------
# Encryption
# -----------------------------------------------------------------------------

run "kms_encryption_enabled" {
  command = plan

  assert {
    condition     = aws_s3_bucket_server_side_encryption_configuration.worm.rule[0].apply_server_side_encryption_by_default[0].sse_algorithm == "aws:kms"
    error_message = "WORM bucket must use KMS encryption, not AES-256"
  }
}

run "kms_key_rotation_enabled" {
  command = plan

  assert {
    condition     = aws_kms_key.worm.enable_key_rotation == true
    error_message = "KMS key must have automatic rotation enabled"
  }
}

# -----------------------------------------------------------------------------
# Public access blocked
# -----------------------------------------------------------------------------

run "public_access_blocked" {
  command = plan

  assert {
    condition     = aws_s3_bucket_public_access_block.worm.block_public_acls == true
    error_message = "WORM bucket must block public ACLs"
  }

  assert {
    condition     = aws_s3_bucket_public_access_block.worm.block_public_policy == true
    error_message = "WORM bucket must block public policy"
  }

  assert {
    condition     = aws_s3_bucket_public_access_block.worm.ignore_public_acls == true
    error_message = "WORM bucket must ignore public ACLs"
  }

  assert {
    condition     = aws_s3_bucket_public_access_block.worm.restrict_public_buckets == true
    error_message = "WORM bucket must restrict public buckets"
  }
}

# -----------------------------------------------------------------------------
# Lifecycle — Glacier Deep Archive at 90 days
# -----------------------------------------------------------------------------

run "deep_archive_transition" {
  command = plan

  assert {
    condition     = aws_s3_bucket_lifecycle_configuration.worm.rule[0].transition[0].days == 90
    error_message = "Objects must transition to Deep Archive at 90 days"
  }

  assert {
    condition     = aws_s3_bucket_lifecycle_configuration.worm.rule[0].transition[0].storage_class == "DEEP_ARCHIVE"
    error_message = "Storage class must be DEEP_ARCHIVE (not GLACIER)"
  }
}

# -----------------------------------------------------------------------------
# Naming convention
# -----------------------------------------------------------------------------

run "bucket_naming_convention" {
  command = plan

  assert {
    condition     = aws_s3_bucket.worm.bucket == "gtcx-test-worm-audit"
    error_message = "WORM bucket must follow naming convention: gtcx-{env}-worm-audit"
  }
}

run "kms_alias_naming_convention" {
  command = plan

  assert {
    condition     = aws_kms_alias.worm.name == "alias/gtcx-test-worm-audit"
    error_message = "KMS alias must follow naming convention"
  }
}
