# =============================================================================
# GTCX Vault Module — AWS Secrets Engine
# =============================================================================
# Issues short-lived AWS credentials per workflow run. Pipeline jobs
# (fine-tune, eval, red-team) get scoped IAM credentials that expire
# after the job completes.
#
# Per SIGNAL L5: Per-workflow-run secrets — no standing AWS access
# =============================================================================

# -----------------------------------------------------------------------------
# AWS Secrets Engine
# -----------------------------------------------------------------------------

resource "vault_aws_secret_backend" "aws" {
  count = var.enable_aws_engine ? 1 : 0

  path        = "aws"
  description = "Dynamic AWS credentials for GTCX pipeline workloads"

  default_lease_ttl_seconds = 1800 # 30 minutes
  max_lease_ttl_seconds     = 7200 # 2 hours
}

# -----------------------------------------------------------------------------
# AWS Roles (dynamic from variable)
# -----------------------------------------------------------------------------
# Each role maps to an IAM policy — Vault creates temp IAM users on demand.

resource "vault_aws_secret_backend_role" "roles" {
  for_each = var.enable_aws_engine ? var.aws_credential_roles : {}

  backend         = vault_aws_secret_backend.aws[0].path
  name            = each.key
  credential_type = each.value.credential_type

  policy_arns     = each.value.policy_arns
  default_sts_ttl = each.value.default_ttl_seconds
  max_sts_ttl     = each.value.max_ttl_seconds
}

# -----------------------------------------------------------------------------
# Vault Policies for AWS Credentials
# -----------------------------------------------------------------------------

resource "vault_policy" "aws_roles" {
  for_each = var.enable_aws_engine ? var.aws_credential_roles : {}

  name = "aws-${each.key}"

  policy = <<-EOT
    path "aws/creds/${each.key}" {
      capabilities = ["read"]
    }
  EOT
}
