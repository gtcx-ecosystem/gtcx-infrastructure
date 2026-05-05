# =============================================================================
# GTCX Trace Pipeline Module — Variables
# =============================================================================
# Per SIGNAL L5: Production traces are the raw material for self-improvement.
# Long-term storage + async event stream decouples collection from curation.
# =============================================================================

variable "environment" {
  description = "Environment name (e.g., zimbabwe-pilot, ghana-prod)"
  type        = string
}

# -----------------------------------------------------------------------------
# Trace Storage (Tempo + S3)
# -----------------------------------------------------------------------------

variable "trace_bucket_name" {
  description = "S3 bucket name for long-term trace storage (Tempo backend)"
  type        = string
  default     = "gtcx-intelligence-traces"
}

variable "trace_retention_days" {
  description = "Days to retain traces in Tempo (S3 expiration adds buffer)"
  type        = number
  default     = 90
}

variable "trace_s3_expiration_days" {
  description = "S3 object expiration (should exceed Tempo retention for safety)"
  type        = number
  default     = 120
}

variable "tempo_namespace" {
  description = "Kubernetes namespace for Tempo deployment"
  type        = string
  default     = "observability"
}

variable "tempo_chart_version" {
  description = "Grafana Tempo Helm chart version"
  type        = string
  default     = "1.10.3"
}

# -----------------------------------------------------------------------------
# Event Stream (SQS)
# -----------------------------------------------------------------------------

variable "queue_name" {
  description = "SQS queue name for trace events"
  type        = string
  default     = "intelligence-trace-events"
}

variable "queue_visibility_timeout" {
  description = "SQS visibility timeout in seconds"
  type        = number
  default     = 300
}

variable "queue_retention_days" {
  description = "SQS message retention in days"
  type        = number
  default     = 14
}

variable "dlq_max_receive_count" {
  description = "Max receive count before sending to DLQ"
  type        = number
  default     = 5
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
  description = "Kubernetes namespace for pipeline consumers"
  type        = string
  default     = "intelligence"
}

variable "pipeline_service_account" {
  description = "Kubernetes service account for trace pipeline consumers"
  type        = string
  default     = "intelligence-pipeline"
}

# -----------------------------------------------------------------------------
# Tempo Resources
# -----------------------------------------------------------------------------

variable "tempo_resources" {
  description = "Resource requests/limits for Tempo pods"
  type = object({
    cpu_request    = string
    memory_request = string
    cpu_limit      = string
    memory_limit   = string
  })
  default = {
    cpu_request    = "100m"
    memory_request = "256Mi"
    cpu_limit      = "500m"
    memory_limit   = "1Gi"
  }
}

variable "tags" {
  description = "Additional tags for AWS resources"
  type        = map(string)
  default     = {}
}
