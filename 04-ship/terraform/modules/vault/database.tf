# =============================================================================
# GTCX Vault Module — Database Secrets Engine
# =============================================================================
# Issues short-lived PostgreSQL credentials on demand. Services receive
# temporary users with scoped grants that expire automatically.
#
# Per SIGNAL L4: Zero standing database credentials
# Per SECURE: Leaked credentials auto-expire (1h default TTL)
# =============================================================================

# -----------------------------------------------------------------------------
# Enable Database Secrets Engine
# -----------------------------------------------------------------------------

resource "vault_mount" "database" {
  path        = "database"
  type        = "database"
  description = "Dynamic database credentials for GTCX services"

  default_lease_ttl_seconds = 3600  # 1 hour
  max_lease_ttl_seconds     = 86400 # 24 hours
}

# -----------------------------------------------------------------------------
# Database Connection — RDS Operational
# -----------------------------------------------------------------------------
# Vault connects to RDS as vault_admin and creates/drops temp users.

resource "vault_database_secret_backend_connection" "operational" {
  backend       = vault_mount.database.path
  name          = "operational"
  allowed_roles = keys(var.db_roles)

  postgresql {
    connection_url = "postgresql://{{username}}:{{password}}@${var.rds_endpoint}/${var.rds_database_name}?sslmode=require"
    username       = var.vault_db_admin_username
    password       = data.aws_secretsmanager_secret_version.vault_db_password.secret_string
  }
}

# -----------------------------------------------------------------------------
# Dynamic Credential Roles
# -----------------------------------------------------------------------------
# Each role defines CREATE/DROP ROLE statements and TTL.
# Spec roles:
#   intelligence-prod    → SELECT, INSERT, UPDATE on public (1h)
#   intelligence-staging → SELECT, INSERT, UPDATE on public (1h)
#   protocols-prod       → SELECT, INSERT, UPDATE, DELETE on protocol tables (1h)
#   audit-readonly       → SELECT on audit schema (1h)

resource "vault_database_secret_backend_role" "roles" {
  for_each = var.db_roles

  backend     = vault_mount.database.path
  name        = each.key
  db_name     = vault_database_secret_backend_connection.operational.name
  default_ttl = each.value.default_ttl_seconds
  max_ttl     = each.value.max_ttl_seconds

  creation_statements   = each.value.creation_statements
  revocation_statements = each.value.revocation_statements
}

# -----------------------------------------------------------------------------
# Vault Policies for Database Access
# -----------------------------------------------------------------------------
# One policy per role granting read access to its dynamic credentials path.

resource "vault_policy" "db_roles" {
  for_each = var.db_roles

  name = "db-${each.key}"

  policy = <<-EOT
    path "database/creds/${each.key}" {
      capabilities = ["read"]
    }
  EOT
}

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------

data "aws_secretsmanager_secret_version" "vault_db_password" {
  secret_id = var.vault_db_admin_password_secret_arn
}
