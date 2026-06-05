# =============================================================================
# GTCX Secrets Module — Outputs
# =============================================================================

output "anthropic_api_key_secret_arn" {
  description = "ARN of the Anthropic API key secret"
  value       = aws_secretsmanager_secret.anthropic_api_key.arn
}

output "openai_api_key_secret_arn" {
  description = "ARN of the OpenAI API key secret"
  value       = aws_secretsmanager_secret.openai_api_key.arn
}

output "comply_advantage_api_key_secret_arn" {
  description = "ARN of the ComplyAdvantage API key secret"
  value       = aws_secretsmanager_secret.comply_advantage_api_key.arn
}

output "anthropic_sandbox_api_key_secret_arn" {
  description = "ARN of the Anthropic sandbox API key secret"
  value       = aws_secretsmanager_secret.anthropic_sandbox_api_key.arn
}

output "openai_sandbox_api_key_secret_arn" {
  description = "ARN of the OpenAI sandbox API key secret"
  value       = aws_secretsmanager_secret.openai_sandbox_api_key.arn
}

output "comply_advantage_sandbox_api_key_secret_arn" {
  description = "ARN of the ComplyAdvantage sandbox API key secret"
  value       = aws_secretsmanager_secret.comply_advantage_sandbox_api_key.arn
}

output "provider_mode_secret_arn" {
  description = "ARN of the provider routing mode secret"
  value       = aws_secretsmanager_secret.provider_mode.arn
}

output "provider_failure_target_secret_arn" {
  description = "ARN of the provider failure target secret"
  value       = aws_secretsmanager_secret.provider_failure_target.arn
}

output "database_url_secret_arn" {
  description = "ARN of the intelligence database URL secret"
  value       = aws_secretsmanager_secret.database_url.arn
}

output "secrets_reader_policy_arn" {
  description = "ARN of the IAM policy for reading intelligence secrets"
  value       = aws_iam_policy.intelligence_secrets_reader.arn
}

output "intelligence_secrets_role_arn" {
  description = "IRSA role ARN for intelligence service account (ESO → SM)"
  value       = aws_iam_role.intelligence_secrets.arn
}

output "intelligence_auth_keys_secret_arn" {
  description = "ARN of the intelligence AUTH_API_KEYS bundle (EAP sync target)"
  value       = aws_secretsmanager_secret.intelligence_auth_keys.arn
}

output "intelligence_auth_keys_secret_name" {
  description = "Secrets Manager name for intelligence auth bundle"
  value       = aws_secretsmanager_secret.intelligence_auth_keys.name
}

output "eap_admin_role_arn" {
  description = "IAM role ARN for EAP admin service (IRSA)"
  value       = aws_iam_role.eap_admin.arn
}

output "eap_admin_policy_arn" {
  description = "IAM policy ARN for EAP admin operations"
  value       = aws_iam_policy.eap_admin.arn
}

output "compliance_os_secrets_role_arn" {
  description = "IRSA role ARN for compliance-os ESO (Hub #17)"
  value       = aws_iam_role.compliance_os_secrets.arn
}

output "compliance_os_sm_secret_names" {
  description = "AWS SM secret names (shells) for compliance-os ESO"
  value = [
    aws_secretsmanager_secret.compliance_os_ghcr_pull.name,
    aws_secretsmanager_secret.compliance_os_w2.name,
    aws_secretsmanager_secret.compliance_os_compliance_api.name,
    aws_secretsmanager_secret.compliance_os_caas.name,
    aws_secretsmanager_secret.compliance_os_core12.name,
    aws_secretsmanager_secret.compliance_os_via.name,
    aws_secretsmanager_secret.compliance_os_vxa.name,
    aws_secretsmanager_secret.compliance_os_minio.name,
  ]
}
