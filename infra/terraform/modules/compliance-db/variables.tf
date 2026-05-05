# =============================================================================
# Compliance DB — Variables
# =============================================================================

# -----------------------------------------------------------------------------
# Required
# -----------------------------------------------------------------------------

variable "environment" {
  description = "Environment name (e.g., zimbabwe-pilot, ghana-prod)"
  type        = string
}

variable "jurisdiction" {
  description = "Jurisdiction identifier — drives region and compliance defaults. Options: zimbabwe, kenya, ghana, generic"
  type        = string

  validation {
    condition     = contains(["zimbabwe", "kenya", "ghana", "nigeria", "tanzania", "rwanda", "generic"], var.jurisdiction)
    error_message = "jurisdiction must be one of: zimbabwe, kenya, ghana, nigeria, tanzania, rwanda, generic"
  }
}

variable "region" {
  description = "AWS region (used when jurisdiction is 'generic')"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for database deployment"
  type        = string
}

variable "subnet_ids" {
  description = "Database subnet IDs (isolated tier)"
  type        = list(string)
}

variable "allowed_security_groups" {
  description = "Security group IDs allowed to connect to databases"
  type        = list(string)
}

# -----------------------------------------------------------------------------
# KYC Storage (requires EKS OIDC)
# -----------------------------------------------------------------------------

variable "enable_kyc_storage" {
  description = "Enable KYC document storage (S3 + IRSA). Requires eks_oidc_provider_arn."
  type        = bool
  default     = true
}

variable "eks_oidc_provider_arn" {
  description = "EKS OIDC provider ARN for IRSA (required if enable_kyc_storage = true)"
  type        = string
  default     = ""
}

variable "eks_oidc_provider_url" {
  description = "EKS OIDC provider URL without https:// (required if enable_kyc_storage = true)"
  type        = string
  default     = ""
}

variable "platform_namespace" {
  description = "K8s namespace for the platform service account"
  type        = string
  default     = "default"
}

variable "platform_service_account" {
  description = "K8s service account name for platform pods"
  type        = string
  default     = "gtcx-platform"
}

# -----------------------------------------------------------------------------
# Database sizing
# -----------------------------------------------------------------------------

variable "operational_instance_class" {
  description = "RDS instance class for operational database"
  type        = string
  default     = "db.t3.medium"
}

variable "operational_storage_gb" {
  description = "Allocated storage in GB for operational database"
  type        = number
  default     = 100
}

variable "multi_az" {
  description = "Enable Multi-AZ for high availability (recommended for production)"
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "Enable deletion protection on operational DB (audit DB always has it)"
  type        = bool
  default     = true
}

# -----------------------------------------------------------------------------
# Compliance / retention
# -----------------------------------------------------------------------------

variable "backup_retention_days" {
  description = "Automated backup retention period in days"
  type        = number
  default     = 30
}

variable "kyc_retention_days" {
  description = "KYC document retention in days (FATF minimum: 1825 = 5 years)"
  type        = number
  default     = 1825

  validation {
    condition     = var.kyc_retention_days >= 1825
    error_message = "kyc_retention_days must be >= 1825 (5 years) to meet FATF minimum requirements"
  }
}

# -----------------------------------------------------------------------------
# Tags
# -----------------------------------------------------------------------------

variable "tags" {
  description = "Additional resource tags"
  type        = map(string)
  default     = {}
}
