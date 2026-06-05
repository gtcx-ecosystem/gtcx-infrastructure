output "bucket_name" {
  description = "Name of the WORM audit S3 bucket"
  value       = aws_s3_bucket.worm_audit.id
}

output "bucket_arn" {
  description = "ARN of the WORM audit S3 bucket"
  value       = aws_s3_bucket.worm_audit.arn
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for WORM audit encryption"
  value       = aws_kms_key.worm_audit.arn
}

output "kms_key_id" {
  description = "ID of the KMS key used for WORM audit encryption"
  value       = aws_kms_key.worm_audit.key_id
}
