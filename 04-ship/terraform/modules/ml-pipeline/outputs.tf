# =============================================================================
# GTCX ML Pipeline Module — Outputs
# =============================================================================

# -- Dataset Storage

output "dataset_bucket_name" {
  description = "S3 bucket name for training datasets"
  value       = aws_s3_bucket.datasets.id
}

output "dataset_bucket_arn" {
  description = "S3 bucket ARN for training datasets"
  value       = aws_s3_bucket.datasets.arn
}

# -- Model Storage

output "model_bucket_name" {
  description = "S3 bucket name for model artifacts"
  value       = aws_s3_bucket.models.id
}

output "model_bucket_arn" {
  description = "S3 bucket ARN for model artifacts"
  value       = aws_s3_bucket.models.arn
}

# -- Model Registry

output "registry_table_name" {
  description = "DynamoDB table name for model registry"
  value       = aws_dynamodb_table.model_registry.name
}

output "registry_table_arn" {
  description = "DynamoDB table ARN for model registry"
  value       = aws_dynamodb_table.model_registry.arn
}

# -- IRSA

output "pipeline_role_arn" {
  description = "IAM role ARN for ML pipeline service account (IRSA)"
  value       = aws_iam_role.pipeline.arn
}
