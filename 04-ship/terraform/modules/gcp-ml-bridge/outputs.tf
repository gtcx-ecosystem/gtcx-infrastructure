output "enabled" {
  description = "Whether bridge resources were created"
  value       = local.enabled
}

output "role_arn" {
  description = "IAM role ARN for GCP Vertex pipeline to assume via WIF"
  value       = local.enabled ? aws_iam_role.gcp_ml_bridge[0].arn : null
}

output "oidc_provider_arn" {
  description = "AWS IAM OIDC provider ARN for accounts.google.com"
  value       = local.enabled ? aws_iam_openid_connect_provider.google[0].arn : null
}
