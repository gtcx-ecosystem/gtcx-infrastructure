variable "environment" {
  description = "Deployment environment (e.g. 'pilot', 'staging', 'production')"
  type        = string
}

variable "region" {
  description = "AWS region for the bucket"
  type        = string
}

variable "eks_oidc_provider_arn" {
  description = "OIDC provider ARN from the EKS cluster (for IRSA)"
  type        = string
}

variable "eks_oidc_provider_url" {
  description = "OIDC provider URL from the EKS cluster (without https://)"
  type        = string
}

variable "platform_namespace" {
  description = "Kubernetes namespace the platform service account lives in"
  type        = string
  default     = "default"
}

variable "platform_service_account" {
  description = "Kubernetes service account name for the platform pods"
  type        = string
  default     = "gtcx-platform"
}

variable "document_retention_days" {
  description = "Days to retain KYC documents (FATF minimum: 5 years = 1825 days)"
  type        = number
  default     = 1825
}

variable "kms_deletion_window_days" {
  description = "KMS key deletion window (days). Minimum 7, maximum 30."
  type        = number
  default     = 30

  validation {
    condition     = var.kms_deletion_window_days >= 7 && var.kms_deletion_window_days <= 30
    error_message = "kms_deletion_window_days must be between 7 and 30."
  }
}

variable "tags" {
  description = "Additional resource tags"
  type        = map(string)
  default     = {}
}
