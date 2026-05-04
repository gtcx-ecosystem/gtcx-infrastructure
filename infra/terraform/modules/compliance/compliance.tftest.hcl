# =============================================================================
# Compliance Module — Terraform Native Tests
# =============================================================================
# Run: terraform test (from this directory)
# Validates AWS Config recorder and 7 managed compliance rules.
# =============================================================================

variables {
  environment = "test"
}

# -----------------------------------------------------------------------------
# Config recorder
# -----------------------------------------------------------------------------

run "config_recorder_captures_all_resources" {
  command = plan

  assert {
    condition     = aws_config_configuration_recorder.main.recording_group[0].all_supported == true
    error_message = "Config recorder must capture all supported resource types"
  }
}

run "config_recorder_is_enabled" {
  command = plan

  assert {
    condition     = aws_config_configuration_recorder_status.main.is_enabled == true
    error_message = "Config recorder must be enabled"
  }
}

# -----------------------------------------------------------------------------
# S3 bucket security
# -----------------------------------------------------------------------------

run "config_bucket_blocks_public_access" {
  command = plan

  assert {
    condition     = aws_s3_bucket_public_access_block.config.block_public_acls == true
    error_message = "Config bucket must block public ACLs"
  }

  assert {
    condition     = aws_s3_bucket_public_access_block.config.block_public_policy == true
    error_message = "Config bucket must block public policy"
  }
}

run "config_bucket_versioning_enabled" {
  command = plan

  assert {
    condition     = aws_s3_bucket_versioning.config.versioning_configuration[0].status == "Enabled"
    error_message = "Config bucket must have versioning enabled"
  }
}

# -----------------------------------------------------------------------------
# Compliance rules — all 7 must exist
# -----------------------------------------------------------------------------

run "rds_encryption_rule_exists" {
  command = plan

  assert {
    condition     = aws_config_config_rule.rds_encrypted.source[0].source_identifier == "RDS_STORAGE_ENCRYPTED"
    error_message = "Must have RDS storage encryption compliance rule"
  }
}

run "s3_public_access_rule_exists" {
  command = plan

  assert {
    condition     = aws_config_config_rule.s3_public_access.source[0].source_identifier == "S3_BUCKET_PUBLIC_READ_PROHIBITED"
    error_message = "Must have S3 public read prohibition rule"
  }
}

run "eks_secrets_encryption_rule_exists" {
  command = plan

  assert {
    condition     = aws_config_config_rule.eks_secrets_encrypted.source[0].source_identifier == "EKS_SECRETS_ENCRYPTED"
    error_message = "Must have EKS secrets encryption rule"
  }
}

run "root_mfa_rule_exists" {
  command = plan

  assert {
    condition     = aws_config_config_rule.root_mfa.source[0].source_identifier == "ROOT_ACCOUNT_MFA_ENABLED"
    error_message = "Must have root account MFA rule"
  }
}

run "cloudtrail_enabled_rule_exists" {
  command = plan

  assert {
    condition     = aws_config_config_rule.cloudtrail_enabled.source[0].source_identifier == "CLOUD_TRAIL_ENABLED"
    error_message = "Must have CloudTrail enabled rule"
  }
}
