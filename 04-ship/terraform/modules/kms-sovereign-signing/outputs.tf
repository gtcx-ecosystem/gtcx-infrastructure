output "key_ids" {
  description = "Map of authority ID → KMS key ID"
  value       = { for k, v in aws_kms_key.sovereign : k => v.key_id }
}

output "key_arns" {
  description = "Map of authority ID → KMS key ARN"
  value       = { for k, v in aws_kms_key.sovereign : k => v.arn }
}

output "aliases" {
  description = "Map of authority ID → KMS alias name"
  value       = { for k, v in aws_kms_alias.sovereign : k => v.name }
}

output "iam_policy_arns" {
  description = "Map of authority ID → IAM policy ARN (attachable to IRSA roles)"
  value       = { for k, v in aws_iam_policy.sovereign_kms : k => v.arn }
}

output "ssm_key_id_paths" {
  description = "Map of authority ID → SSM parameter path for key ID"
  value       = { for k, v in aws_ssm_parameter.sovereign_key_id : k => v.name }
}

output "ssm_key_arn_paths" {
  description = "Map of authority ID → SSM parameter path for key ARN"
  value       = { for k, v in aws_ssm_parameter.sovereign_key_arn : k => v.name }
}
