# =============================================================================
# GTCX ML Pipeline Module — Variables
# =============================================================================
# Per SIGNAL L5: Self-improving intelligence requires versioned datasets,
# model registry, and durable artifact storage.
# =============================================================================

variable "environment" {
  description = "Environment name (e.g., zimbabwe-pilot, ghana-prod)"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "af-south-1"
}

# -----------------------------------------------------------------------------
# Dataset Storage
# -----------------------------------------------------------------------------

variable "dataset_bucket_name" {
  description = "S3 bucket name for versioned training datasets"
  type        = string
  default     = "gtcx-intelligence-datasets"
}

variable "dataset_glacier_transition_days" {
  description = "Days before transitioning old dataset versions to Glacier IR"
  type        = number
  default     = 90
}

variable "dataset_noncurrent_expiration_days" {
  description = "Days before expiring non-current dataset versions"
  type        = number
  default     = 365
}

# -----------------------------------------------------------------------------
# Model Registry
# -----------------------------------------------------------------------------

variable "model_bucket_name" {
  description = "S3 bucket name for model artifacts (weights, adapters)"
  type        = string
  default     = "gtcx-intelligence-models"
}

variable "registry_table_name" {
  description = "DynamoDB table name for model metadata and lineage"
  type        = string
  default     = "intelligence-model-registry"
}

# -----------------------------------------------------------------------------
# IRSA
# -----------------------------------------------------------------------------

variable "eks_oidc_provider_arn" {
  description = "EKS OIDC provider ARN for IRSA trust policy"
  type        = string
}

variable "eks_oidc_provider_url" {
  description = "EKS OIDC provider URL (without https://)"
  type        = string
}

variable "pipeline_namespace" {
  description = "Kubernetes namespace for ML pipeline workloads"
  type        = string
  default     = "intelligence"
}

variable "pipeline_service_account" {
  description = "Kubernetes service account for ML pipeline jobs"
  type        = string
  default     = "intelligence-pipeline"
}

variable "tags" {
  description = "Additional tags for AWS resources"
  type        = map(string)
  default     = {}
}
