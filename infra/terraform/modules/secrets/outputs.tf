# =============================================================================
# GTCX Secrets Module — Outputs
# =============================================================================

output "anthropic_api_key_secret_arn" {
  description = "ARN of the Anthropic API key secret"
  value       = aws_secretsmanager_secret.anthropic_api_key.arn
}

output "comply_advantage_api_key_secret_arn" {
  description = "ARN of the ComplyAdvantage API key secret"
  value       = aws_secretsmanager_secret.comply_advantage_api_key.arn
}

output "database_url_secret_arn" {
  description = "ARN of the intelligence database URL secret"
  value       = aws_secretsmanager_secret.database_url.arn
}

output "secrets_reader_policy_arn" {
  description = "ARN of the IAM policy for reading intelligence secrets"
  value       = aws_iam_policy.intelligence_secrets_reader.arn
}
