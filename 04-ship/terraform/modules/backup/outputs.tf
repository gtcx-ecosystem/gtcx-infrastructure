output "backup_bucket_name" {
  description = "Name of the S3 bucket for audit backup exports"
  value       = aws_s3_bucket.backup.id
}

output "backup_bucket_arn" {
  description = "ARN of the S3 bucket for audit backup exports"
  value       = aws_s3_bucket.backup.arn
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for backup encryption"
  value       = aws_kms_key.backup.arn
}

output "lambda_function_name" {
  description = "Name of the backup Lambda function"
  value       = aws_lambda_function.backup.function_name
}

output "rds_export_role_arn" {
  description = "IAM role ARN used by RDS to export snapshots to S3"
  value       = aws_iam_role.rds_export.arn
}

output "lambda_execution_role_arn" {
  description = "IAM role ARN used by the backup Lambda function"
  value       = aws_iam_role.lambda_execution.arn
}

output "immutable_backup_bucket_name" {
  description = "Name of the S3 bucket with Object Lock for immutable audit backups"
  value       = aws_s3_bucket.immutable_backup.id
}

output "immutable_backup_bucket_arn" {
  description = "ARN of the S3 bucket with Object Lock for immutable audit backups"
  value       = aws_s3_bucket.immutable_backup.arn
}
