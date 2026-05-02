variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region for RDS export task ARN construction"
  type        = string
}

variable "db_identifier" {
  description = "The audit database RDS instance identifier"
  type        = string
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
