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

variable "immutable_replication_destination_bucket_arn" {
  description = "ARN of the cross-region destination bucket for immutable backup replication (empty = disabled)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
