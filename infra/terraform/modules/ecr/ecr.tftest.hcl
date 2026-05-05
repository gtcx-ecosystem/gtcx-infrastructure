# =============================================================================
# ECR Module — Terraform Native Tests
# =============================================================================
# Run: terraform test (from this directory)
# Validates container registry security, lifecycle, and encryption.
# =============================================================================

variables {
  environment        = "test"
  repositories       = ["gtcx-agx", "gtcx-protocols", "gtcx-crypto"]
  image_tag_mutability = "IMMUTABLE"
  max_image_count    = 30
}

# -----------------------------------------------------------------------------
# Repository configuration
# -----------------------------------------------------------------------------

run "creates_repositories_for_each_service" {
  command = plan

  assert {
    condition     = length(aws_ecr_repository.repos) == 3
    error_message = "Must create one ECR repository per service"
  }
}

run "image_scanning_enabled_on_push" {
  command = plan

  assert {
    condition     = aws_ecr_repository.repos["gtcx-agx"].image_scanning_configuration[0].scan_on_push == true
    error_message = "Image scanning on push must be enabled for security"
  }
}

run "tag_immutability_enforced" {
  command = plan

  assert {
    condition     = aws_ecr_repository.repos["gtcx-protocols"].image_tag_mutability == "IMMUTABLE"
    error_message = "Image tags must be immutable to prevent supply chain attacks"
  }
}

run "force_delete_disabled" {
  command = plan

  assert {
    condition     = aws_ecr_repository.repos["gtcx-crypto"].force_delete == false
    error_message = "Force delete must be disabled to prevent accidental image loss"
  }
}

# -----------------------------------------------------------------------------
# Encryption
# -----------------------------------------------------------------------------

run "kms_encryption_enabled" {
  command = plan

  assert {
    condition     = aws_ecr_repository.repos["gtcx-agx"].encryption_configuration[0].encryption_type == "KMS"
    error_message = "ECR repositories must use KMS encryption"
  }
}

run "kms_key_rotation_enabled" {
  command = plan

  assert {
    condition     = aws_kms_key.ecr.enable_key_rotation == true
    error_message = "ECR KMS key must have automatic rotation enabled"
  }
}
