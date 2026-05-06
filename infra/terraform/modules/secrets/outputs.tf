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
