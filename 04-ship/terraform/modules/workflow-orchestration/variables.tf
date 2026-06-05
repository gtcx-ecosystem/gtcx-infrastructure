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

variable "enable_fine_tune_workflow" {
  description = "Whether to create the fine-tune WorkflowTemplate and CronWorkflow"
  type        = bool
  default     = false
}

variable "enable_red_team_workflow" {
  description = "Whether to include the optional red-team scan step in the fine-tune workflow"
  type        = bool
  default     = false
}

variable "enablement_evidence_manifest" {
  description = "Path to the JSON evidence manifest required before enabling the fine-tune workflow"
  type        = string
  default     = ""
}

variable "curator_image" {
  description = "Container image for dataset curation steps; must be set explicitly by consuming environments"
  type        = string
  default     = ""

  validation {
    condition     = trimspace(var.curator_image) == "" || !can(regex(":latest$", trimspace(var.curator_image)))
    error_message = "curator_image must use an immutable SHA or release tag, not :latest."
  }
}

variable "trainer_image" {
  description = "Container image for model training steps; leave empty to disable training"
  type        = string
  default     = ""

  validation {
    condition     = trimspace(var.trainer_image) == "" || !can(regex(":latest$", trimspace(var.trainer_image)))
    error_message = "trainer_image must use an immutable SHA or release tag, not :latest."
  }
}

variable "evaluator_image" {
  description = "Container image for evaluation steps; must be set explicitly by consuming environments"
  type        = string
  default     = ""

  validation {
    condition     = trimspace(var.evaluator_image) == "" || !can(regex(":latest$", trimspace(var.evaluator_image)))
    error_message = "evaluator_image must use an immutable SHA or release tag, not :latest."
  }
}

variable "promoter_image" {
  description = "Container image for promotion-gate steps; must be set explicitly by consuming environments"
  type        = string
  default     = ""

  validation {
    condition     = trimspace(var.promoter_image) == "" || !can(regex(":latest$", trimspace(var.promoter_image)))
    error_message = "promoter_image must use an immutable SHA or release tag, not :latest."
  }
}

variable "red_team_image" {
  description = "Optional container image for the red-team scan step; leave empty to disable the step"
  type        = string
  default     = ""

  validation {
    condition     = trimspace(var.red_team_image) == "" || !can(regex(":latest$", trimspace(var.red_team_image)))
    error_message = "red_team_image must use an immutable SHA or release tag, not :latest."
  }
}

variable "tags" {
  description = "Additional tags for AWS resources"
  type        = map(string)
  default     = {}
}
