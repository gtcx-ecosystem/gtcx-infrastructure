variable "name_prefix" {
  description = "Prefix for all WORM resources"
  type        = string
  default     = "gtcx"
}

variable "environment" {
  description = "Environment name (e.g., production, staging)"
  type        = string
}

variable "aws_region" {
  description = "AWS region for WORM bucket"
  type        = string
  default     = "af-south-1"
}

variable "retention_days" {
  description = "WORM retention period in days. Minimum 2557 (7 years) for regulatory compliance."
  type        = number
  default     = 2557

  validation {
    condition     = var.retention_days >= 2557
    error_message = "Retention must be >= 2557 days (7 years) to meet GTCX audit requirements."
  }
}

variable "replication_region" {
  description = "AWS region for cross-region replica bucket. Set to null to disable replication."
  type        = string
  default     = null
}

variable "alarm_sns_topic_arns" {
  description = "List of SNS topic ARNs to notify on deletion attempts and security alarms"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
