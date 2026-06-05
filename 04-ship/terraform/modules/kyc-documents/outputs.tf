output "bucket_name" {
  description = "KYC documents S3 bucket name — set as KYC_DOCUMENTS_BUCKET env var on platform pods"
  value       = aws_s3_bucket.kyc_documents.id
}

output "bucket_arn" {
  description = "KYC documents S3 bucket ARN"
  value       = aws_s3_bucket.kyc_documents.arn
}

output "kms_key_id" {
  description = "KMS key ID for KYC document encryption"
  value       = aws_kms_key.kyc_documents.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN"
  value       = aws_kms_key.kyc_documents.arn
}

output "kms_key_alias" {
  description = "KMS key alias"
  value       = aws_kms_alias.kyc_documents.name
}

output "irsa_role_arn" {
  description = "IAM role ARN for IRSA — annotate the platform service account with this"
  value       = aws_iam_role.platform_irsa.arn
}
