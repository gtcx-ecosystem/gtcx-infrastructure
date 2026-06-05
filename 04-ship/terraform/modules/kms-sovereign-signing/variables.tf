variable "environment" {
  description = "Environment name (e.g. staging, production)"
  type        = string
}

variable "authorities" {
  description = <<EOF
Map of authority IDs to signing key configurations.
Each authority gets an independent KMS asymmetric key,
alias, IAM policy, CloudWatch alarm, and SSM parameters.

Example:
  authorities = {
    "gh-bog" = {
      label             = "Ghana Bogoso"
      key_spec          = "ECC_NIST_P256"
      signing_algorithm = "ECDSA_SHA_256"
      signing_role_arns = ["arn:aws:iam::...:role/gtcx-production-protocols-irsa"]
    }
  }
EOF
  type = map(object({
    label             = string
    key_spec          = string
    signing_algorithm = string
    signing_role_arns = list(string)
  }))

  validation {
    condition     = length(var.authorities) > 0
    error_message = "At least one authority signing key must be configured."
  }
}

variable "admin_role_arns" {
  description = "IAM role ARNs with key administration permissions (no signing)"
  type        = list(string)

  validation {
    condition     = length(var.admin_role_arns) > 0
    error_message = "At least one admin role ARN is required."
  }
}

variable "alarm_sns_topic_arns" {
  description = "SNS topic ARNs for KMS security alarms"
  type        = list(string)
  default     = []
}

variable "deletion_window_days" {
  description = "Waiting period before key deletion (7-30 days)"
  type        = number
  default     = 30

  validation {
    condition     = var.deletion_window_days >= 7 && var.deletion_window_days <= 30
    error_message = "Deletion window must be 7-30 days."
  }
}

variable "rotation_interval_days" {
  description = "Key rotation interval in days (tracked via tags; manual rotation for asymmetric keys)"
  type        = number
  default     = 90

  validation {
    condition     = var.rotation_interval_days >= 30 && var.rotation_interval_days <= 365
    error_message = "Rotation interval must be 30-365 days."
  }
}

variable "log_retention_days" {
  description = "CloudWatch log retention for KMS audit logs"
  type        = number
  default     = 2557 # ~7 years

  validation {
    condition     = var.log_retention_days >= 365
    error_message = "KMS audit logs must be retained for at least 1 year (bank-grade: 7 years)."
  }
}
