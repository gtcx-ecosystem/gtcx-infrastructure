# GCP → AWS bridge for Vertex training artifacts (Phase 3).
# See docs/operations/intelligence-phase-3-gcp-ml-bridge-epic-2026-06-05.md

variable "environment" {
  description = "Environment name (e.g. staging, testnet-pilot)"
  type        = string
}

variable "enabled" {
  description = "Create bridge IAM resources (requires gcp_service_account_unique_id)"
  type        = bool
  default     = false
}

variable "gcp_service_account_unique_id" {
  description = "GCP SA unique_id for intelligence-ml (from google_service_account.ml_pipeline)"
  type        = string
  default     = ""
}

variable "model_bucket_arn" {
  description = "S3 bucket ARN for model artifacts (ml-pipeline module output)"
  type        = string
}

variable "registry_table_arn" {
  description = "DynamoDB model registry table ARN (ml-pipeline module output)"
  type        = string
}

variable "tags" {
  description = "Common resource tags"
  type        = map(string)
  default     = {}
}
