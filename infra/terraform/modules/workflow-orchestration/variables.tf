# =============================================================================
# GTCX Workflow Orchestration Module — Variables
# =============================================================================
# Per SIGNAL L5: Durable orchestration for fine-tune → eval → promote pipeline
# =============================================================================

variable "environment" {
  description = "Environment name (e.g., zimbabwe-pilot, ghana-prod)"
  type        = string
}

variable "namespace" {
  description = "Kubernetes namespace for Argo Workflows"
  type        = string
  default     = "argo-workflows"
}

variable "chart_version" {
  description = "Argo Workflows Helm chart version"
  type        = string
  default     = "0.41.14"
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

variable "workflow_service_account" {
  description = "Service account name for workflow runs"
  type        = string
  default     = "intelligence-workflow"
}

# -----------------------------------------------------------------------------
# Pipeline Access (S3, DynamoDB, SQS, ECR)
# -----------------------------------------------------------------------------

variable "dataset_bucket_arn" {
  description = "S3 dataset bucket ARN for pipeline access"
  type        = string
}

variable "model_bucket_arn" {
  description = "S3 model bucket ARN for pipeline access"
  type        = string
}

variable "registry_table_arn" {
  description = "DynamoDB model registry table ARN"
  type        = string
}

variable "trace_queue_arn" {
  description = "SQS trace events queue ARN"
  type        = string
}

variable "ecr_repository_arns" {
  description = "ECR repository ARNs that workflows need to pull from"
  type        = list(string)
  default     = []
}

# -----------------------------------------------------------------------------
# Workflow Scheduling
# -----------------------------------------------------------------------------

variable "fine_tune_schedule" {
  description = "Cron schedule for fine-tune cycle (default: 2 AM on 1st and 15th)"
  type        = string
  default     = "0 2 1,15 * *"
}

variable "fine_tune_timezone" {
  description = "Timezone for fine-tune cron schedule"
  type        = string
  default     = "Africa/Johannesburg"
}

variable "fine_tune_model_id" {
  description = "Default model ID for scheduled fine-tune cycles"
  type        = string
  default     = "cortex-anomaly-detector"
}

variable "eval_threshold" {
  description = "Minimum improvement over baseline to promote (0.0-1.0)"
  type        = string
  default     = "0.05"
}

variable "tags" {
  description = "Additional tags for AWS resources"
  type        = map(string)
  default     = {}
}
