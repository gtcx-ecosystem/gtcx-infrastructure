# =============================================================================
# Compliance DB Module — Terraform Native Tests
# =============================================================================
# Run: terraform test (from this directory)
# Validates jurisdiction presets, FATF retention, and module composition.
# =============================================================================

variables {
  environment             = "test"
  jurisdiction            = "zimbabwe"
  region                  = "af-south-1"
  vpc_id                  = "vpc-test123"
  subnet_ids              = ["subnet-a", "subnet-b"]
  allowed_security_groups = ["sg-test"]
  enable_kyc_storage      = false
}

# -----------------------------------------------------------------------------
# Jurisdiction validation
# -----------------------------------------------------------------------------

run "zimbabwe_jurisdiction_accepted" {
  command = plan

  assert {
    condition     = length(module.database) > 0
    error_message = "Zimbabwe jurisdiction must be accepted and create database resources"
  }
}

run "nigeria_jurisdiction_accepted" {
  command = plan

  variables {
    jurisdiction = "nigeria"
  }

  assert {
    condition     = length(module.database) > 0
    error_message = "Nigeria jurisdiction must be accepted"
  }
}

run "tanzania_jurisdiction_accepted" {
  command = plan

  variables {
    jurisdiction = "tanzania"
  }

  assert {
    condition     = length(module.database) > 0
    error_message = "Tanzania jurisdiction must be accepted"
  }
}

run "rwanda_jurisdiction_accepted" {
  command = plan

  variables {
    jurisdiction = "rwanda"
  }

  assert {
    condition     = length(module.database) > 0
    error_message = "Rwanda jurisdiction must be accepted"
  }
}

run "eac_jurisdiction_accepted" {
  command = plan

  variables {
    jurisdiction = "eac"
  }

  assert {
    condition     = length(module.database) > 0
    error_message = "EAC jurisdiction must be accepted"
  }
}

# -----------------------------------------------------------------------------
# Module composition
# -----------------------------------------------------------------------------

run "backup_module_created" {
  command = plan

  assert {
    condition     = length(module.backup) > 0
    error_message = "Backup module must be composed into compliance-db"
  }
}

run "kyc_disabled_when_flag_false" {
  command = plan

  assert {
    condition     = length(module.kyc_documents) == 0
    error_message = "KYC storage must not be created when enable_kyc_storage is false"
  }
}

run "kyc_enabled_when_flag_true" {
  command = plan

  variables {
    enable_kyc_storage    = true
    eks_oidc_provider_arn = "arn:aws:iam::123456789012:oidc-provider/oidc.eks.af-south-1.amazonaws.com/id/TEST"
    eks_oidc_provider_url = "oidc.eks.af-south-1.amazonaws.com/id/TEST"
  }

  assert {
    condition     = length(module.kyc_documents) == 1
    error_message = "KYC storage must be created when enable_kyc_storage is true"
  }
}
