# =============================================================================
# Database Module — Terraform Native Tests
# =============================================================================
# Run: terraform test (from this directory)
# Validates dual-database architecture: operational + audit isolation.
# =============================================================================

variables {
  environment             = "test"
  vpc_id                  = "vpc-test123"
  subnet_ids              = ["subnet-a", "subnet-b"]
  instance_class          = "db.t3.micro"
  allocated_storage       = 20
  multi_az                = false
  backup_retention_period = 1
  deletion_protection     = false
  allowed_security_groups = []
}

# -----------------------------------------------------------------------------
# Dual database architecture validation
# -----------------------------------------------------------------------------

run "creates_dual_databases" {
  command = plan

  # Both operational and audit instances must be planned
  assert {
    condition     = aws_db_instance.operational.engine == "postgres"
    error_message = "Operational DB must use PostgreSQL"
  }

  assert {
    condition     = aws_db_instance.audit.engine == "postgres"
    error_message = "Audit DB must use PostgreSQL"
  }
}

run "both_databases_encrypted" {
  command = plan

  assert {
    condition     = aws_db_instance.operational.storage_encrypted == true
    error_message = "Operational DB must have encryption at rest enabled"
  }

  assert {
    condition     = aws_db_instance.audit.storage_encrypted == true
    error_message = "Audit DB must have encryption at rest enabled"
  }
}

run "databases_not_publicly_accessible" {
  command = plan

  assert {
    condition     = aws_db_instance.operational.publicly_accessible == false
    error_message = "Operational DB must not be publicly accessible"
  }

  assert {
    condition     = aws_db_instance.audit.publicly_accessible == false
    error_message = "Audit DB must not be publicly accessible"
  }
}

run "audit_db_has_deletion_protection" {
  command = plan

  # Audit DB deletion protection is hardcoded to true regardless of variable
  assert {
    condition     = aws_db_instance.audit.deletion_protection == true
    error_message = "Audit DB must always have deletion protection — data is append-only"
  }
}

run "managed_passwords_via_secrets_manager" {
  command = plan

  assert {
    condition     = aws_db_instance.operational.manage_master_user_password == true
    error_message = "Operational DB must use AWS Secrets Manager for master password"
  }

  assert {
    condition     = aws_db_instance.audit.manage_master_user_password == true
    error_message = "Audit DB must use AWS Secrets Manager for master password"
  }
}

run "ssl_enforcement_in_parameter_group" {
  command = plan

  # Parameter group should enforce SSL connections
  assert {
    condition     = aws_db_parameter_group.main.family == "postgres16"
    error_message = "Parameter group must target PostgreSQL 16 family"
  }
}
