output "signing_key_id" {
  description = "KMS signing key ID"
  value       = aws_kms_key.signing.key_id
}

output "signing_key_arn" {
  description = "KMS signing key ARN"
  value       = aws_kms_key.signing.arn
  sensitive   = true
}

output "signing_key_alias" {
  description = "KMS signing key alias"
  value       = aws_kms_alias.signing.name
}

output "replay_guard_kms_policy_arn" {
  description = "IAM policy ARN for replay-guard KMS signing permissions"
  value       = aws_iam_policy.replay_guard_kms.arn
}

output "kms_audit_log_group" {
  description = "CloudWatch log group for KMS audit events"
  value       = aws_cloudwatch_log_group.kms_audit.name
}
