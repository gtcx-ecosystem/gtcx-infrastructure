# =============================================================================
# KYC Documents Module — Terraform Native Tests
# =============================================================================
# Run: terraform test (from this directory)
# Validates FATF-compliant document storage: encryption, retention, access.
# =============================================================================

variables {
  environment              = "test"
  region                   = "af-south-1"
  eks_oidc_provider_arn    = "arn:aws:iam::123456789012:oidc-provider/oidc.eks.af-south-1.amazonaws.com/id/TEST"
  eks_oidc_provider_url    = "oidc.eks.af-south-1.amazonaws.com/id/TEST"
  platform_namespace       = "gtcx"
  platform_service_account = "gtcx-platform"
  document_retention_days  = 1825
}

# -----------------------------------------------------------------------------
# S3 bucket security
# -----------------------------------------------------------------------------

run "bucket_blocks_public_access" {
  command = plan

  assert {
    condition     = aws_s3_bucket_public_access_block.kyc_documents.block_public_acls == true
    error_message = "KYC bucket must block public ACLs"
  }

  assert {
    condition     = aws_s3_bucket_public_access_block.kyc_documents.restrict_public_buckets == true
    error_message = "KYC bucket must restrict public buckets"
  }
}

run "bucket_versioning_enabled" {
  command = plan

  assert {
    condition     = aws_s3_bucket_versioning.kyc_documents.versioning_configuration[0].status == "Enabled"
    error_message = "KYC bucket must have versioning for document integrity"
  }
}

# -----------------------------------------------------------------------------
# Encryption
# -----------------------------------------------------------------------------

run "bucket_encrypted_with_kms" {
  command = plan

  assert {
    condition     = aws_s3_bucket_server_side_encryption_configuration.kyc_documents.rule[0].apply_server_side_encryption_by_default[0].sse_algorithm == "aws:kms"
    error_message = "KYC bucket must use KMS encryption"
  }
}

run "kms_key_rotation_enabled" {
  command = plan

  assert {
    condition     = aws_kms_key.kyc_documents.enable_key_rotation == true
    error_message = "KYC KMS key must have automatic rotation"
  }
}

# -----------------------------------------------------------------------------
# Retention lifecycle
# -----------------------------------------------------------------------------

run "documents_retained_for_fatf_minimum" {
  command = plan

  assert {
    condition     = aws_s3_bucket_lifecycle_configuration.kyc_documents.rule[0].expiration[0].days == 1825
    error_message = "KYC documents must be retained for 1825 days (5 years FATF minimum)"
  }
}

run "documents_transition_to_glacier" {
  command = plan

  assert {
    condition     = aws_s3_bucket_lifecycle_configuration.kyc_documents.rule[0].transition[1].storage_class == "GLACIER_IR"
    error_message = "KYC documents must transition to Glacier IR at 365 days"
  }
}

# -----------------------------------------------------------------------------
# Bucket tagging
# -----------------------------------------------------------------------------

run "bucket_tagged_as_pii" {
  command = plan

  assert {
    condition     = aws_s3_bucket.kyc_documents.tags["DataClass"] == "PII"
    error_message = "KYC bucket must be tagged DataClass=PII for data classification"
  }
}
