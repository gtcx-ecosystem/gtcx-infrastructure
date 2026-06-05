# =============================================================================
# GTCX Vault Module — Outputs
# =============================================================================

# -- KMS

output "kms_key_arn" {
  description = "ARN of the KMS key used for Vault auto-unseal"
  value       = aws_kms_key.vault_unseal.arn
}

output "kms_key_id" {
  description = "ID of the KMS key used for Vault auto-unseal"
  value       = aws_kms_key.vault_unseal.key_id
}

# -- IRSA

output "vault_server_role_arn" {
  description = "IAM role ARN for Vault server pods (IRSA)"
  value       = aws_iam_role.vault_server.arn
}

# -- Helm

output "vault_namespace" {
  description = "Kubernetes namespace where Vault is deployed"
  value       = helm_release.vault.namespace
}

output "vault_release_name" {
  description = "Helm release name for Vault"
  value       = helm_release.vault.name
}

# -- Database Secrets Engine

output "db_credential_paths" {
  description = "Map of role name to Vault credential read path"
  value       = { for k, v in vault_database_secret_backend_role.roles : k => "database/creds/${k}" }
}

output "db_policy_names" {
  description = "Map of role name to Vault policy name for database access"
  value       = { for k, v in vault_policy.db_roles : k => v.name }
}

# -- Kubernetes Auth

output "k8s_auth_role_names" {
  description = "Map of role name to Vault Kubernetes auth role"
  value       = { for k, v in vault_kubernetes_auth_backend_role.roles : k => v.role_name }
}

# -- PKI

output "pki_ca_cert" {
  description = "PEM-encoded root CA certificate (empty if PKI disabled)"
  value       = var.enable_pki ? vault_pki_secret_backend_root_cert.internal_ca[0].certificate : ""
}

output "pki_policy_names" {
  description = "Map of PKI role name to Vault policy name"
  value       = { for k, v in vault_policy.pki_roles : k => v.name }
}

# -- AWS Secrets Engine

output "aws_credential_paths" {
  description = "Map of role name to Vault AWS credential read path"
  value       = { for k, v in vault_aws_secret_backend_role.roles : k => "aws/creds/${k}" }
}

output "aws_policy_names" {
  description = "Map of role name to Vault policy name for AWS credentials"
  value       = { for k, v in vault_policy.aws_roles : k => v.name }
}
