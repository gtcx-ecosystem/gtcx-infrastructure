# =============================================================================
# Vault Module — Terraform Native Tests
# =============================================================================
# Run: terraform test (from this directory)
# Validates KMS, IRSA, Helm configuration, auth roles, database engine, PKI.
# =============================================================================

variables {
  environment           = "test"
  namespace             = "vault"
  replicas              = 3
  storage_size_gb       = 10
  vault_version         = "0.28.1"
  vault_image_tag       = "1.17.2"
  kms_deletion_window_days = 7
  eks_oidc_provider_arn = "arn:aws:iam::123456789012:oidc-provider/oidc.eks.af-south-1.amazonaws.com/id/TEST"
  eks_oidc_provider_url = "oidc.eks.af-south-1.amazonaws.com/id/TEST"
  rds_endpoint          = "gtcx-test-operational.cluster-abc123.af-south-1.rds.amazonaws.com:5432"
  rds_database_name     = "gtcx_development"
  vault_db_admin_username          = "vault_admin"
  vault_db_admin_password_secret_arn = "arn:aws:secretsmanager:af-south-1:123456789012:secret:vault/db-admin-password-abc123"
  enable_pki            = true
  pki_common_name       = "gtcx-internal-ca"
  pki_max_ttl_hours     = 87600

  k8s_auth_roles = {
    "intelligence-prod" = {
      bound_service_account_names      = ["intelligence"]
      bound_service_account_namespaces = ["intelligence"]
      token_ttl_seconds                = 3600
      token_policies                   = ["db-intelligence-prod", "pki-intelligence"]
    }
    "intelligence-staging" = {
      bound_service_account_names      = ["staging-intelligence"]
      bound_service_account_namespaces = ["intelligence-staging"]
      token_ttl_seconds                = 3600
      token_policies                   = ["db-intelligence-staging"]
    }
    "protocols-prod" = {
      bound_service_account_names      = ["gtcx-platform"]
      bound_service_account_namespaces = ["gtcx"]
      token_ttl_seconds                = 3600
      token_policies                   = ["db-protocols-prod"]
    }
  }

  db_roles = {
    "intelligence-prod" = {
      db_name = "operational"
      creation_statements = [
        "CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";"
      ]
      revocation_statements = [
        "DROP ROLE IF EXISTS \"{{name}}\";"
      ]
      default_ttl_seconds = 3600
      max_ttl_seconds     = 86400
    }
    "intelligence-staging" = {
      db_name = "operational"
      creation_statements = [
        "CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";"
      ]
      revocation_statements = [
        "DROP ROLE IF EXISTS \"{{name}}\";"
      ]
      default_ttl_seconds = 3600
      max_ttl_seconds     = 86400
    }
    "protocols-prod" = {
      db_name = "operational"
      creation_statements = [
        "CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";"
      ]
      revocation_statements = [
        "DROP ROLE IF EXISTS \"{{name}}\";"
      ]
      default_ttl_seconds = 3600
      max_ttl_seconds     = 86400
    }
    "audit-readonly" = {
      db_name = "operational"
      creation_statements = [
        "CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"{{name}}\";"
      ]
      revocation_statements = [
        "DROP ROLE IF EXISTS \"{{name}}\";"
      ]
      default_ttl_seconds = 3600
      max_ttl_seconds     = 86400
    }
  }

  pki_roles = {
    "intelligence" = {
      allowed_domains  = ["intelligence.svc.cluster.local", "gtcx.svc.cluster.local"]
      allow_subdomains = true
      max_ttl_hours    = 72
      key_type         = "ec"
      key_bits         = 256
    }
    "nats" = {
      allowed_domains  = ["nats.svc.cluster.local"]
      allow_subdomains = true
      max_ttl_hours    = 72
      key_type         = "ec"
      key_bits         = 256
    }
  }
}

# -----------------------------------------------------------------------------
# KMS Key
# -----------------------------------------------------------------------------

run "kms_key_has_rotation_enabled" {
  command = plan

  assert {
    condition     = aws_kms_key.vault_unseal.enable_key_rotation == true
    error_message = "KMS key must have automatic rotation enabled"
  }
}

run "kms_key_deletion_window" {
  command = plan

  assert {
    condition     = aws_kms_key.vault_unseal.deletion_window_in_days == 7
    error_message = "KMS key deletion window must match variable"
  }
}

run "kms_alias_uses_environment" {
  command = plan

  assert {
    condition     = aws_kms_alias.vault_unseal.name == "alias/gtcx-test-vault-unseal"
    error_message = "KMS alias must include environment name"
  }
}

# -----------------------------------------------------------------------------
# IRSA Role
# -----------------------------------------------------------------------------

run "irsa_role_name_includes_environment" {
  command = plan

  assert {
    condition     = aws_iam_role.vault_server.name == "gtcx-test-vault-server"
    error_message = "IRSA role name must include environment"
  }
}

run "irsa_role_trusts_vault_service_account" {
  command = plan

  assert {
    condition     = can(regex("vault", aws_iam_role.vault_server.assume_role_policy))
    error_message = "IRSA role must trust the vault service account"
  }
}

# -----------------------------------------------------------------------------
# Helm Release
# -----------------------------------------------------------------------------

run "helm_release_in_vault_namespace" {
  command = plan

  assert {
    condition     = helm_release.vault.namespace == "vault"
    error_message = "Vault must be deployed in vault namespace"
  }
}

run "helm_release_uses_correct_chart" {
  command = plan

  assert {
    condition     = helm_release.vault.chart == "vault"
    error_message = "Must use the official HashiCorp Vault chart"
  }
}

# -----------------------------------------------------------------------------
# Database Secrets Engine
# -----------------------------------------------------------------------------

run "database_mount_default_ttl" {
  command = plan

  assert {
    condition     = vault_mount.database.default_lease_ttl_seconds == 3600
    error_message = "Database engine default TTL must be 1 hour"
  }
}

run "database_mount_max_ttl" {
  command = plan

  assert {
    condition     = vault_mount.database.max_lease_ttl_seconds == 86400
    error_message = "Database engine max TTL must be 24 hours"
  }
}

run "database_roles_created" {
  command = plan

  assert {
    condition     = length(vault_database_secret_backend_role.roles) == 4
    error_message = "Must create all 4 database roles"
  }
}

run "database_policies_created" {
  command = plan

  assert {
    condition     = length(vault_policy.db_roles) == 4
    error_message = "Must create a Vault policy for each database role"
  }
}

# -----------------------------------------------------------------------------
# Kubernetes Auth
# -----------------------------------------------------------------------------

run "k8s_auth_roles_created" {
  command = plan

  assert {
    condition     = length(vault_kubernetes_auth_backend_role.roles) == 3
    error_message = "Must create all 3 Kubernetes auth roles"
  }
}

# -----------------------------------------------------------------------------
# PKI Engine
# -----------------------------------------------------------------------------

run "pki_engine_enabled" {
  command = plan

  assert {
    condition     = length(vault_mount.pki) == 1
    error_message = "PKI engine must be enabled when enable_pki is true"
  }
}

run "pki_roles_created" {
  command = plan

  assert {
    condition     = length(vault_pki_secret_backend_role.roles) == 2
    error_message = "Must create intelligence and nats PKI roles"
  }
}

run "pki_ca_uses_ec_key" {
  command = plan

  assert {
    condition     = vault_pki_secret_backend_root_cert.internal_ca[0].key_type == "ec"
    error_message = "Root CA must use elliptic curve keys"
  }
}
