# =============================================================================
# Multi-Region Failover Module — Variables
# =============================================================================

variable "environment" {
  description = "Environment name (e.g., zimbabwe-pilot)"
  type        = string
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "af-south-1"
}

variable "secondary_region" {
  description = "Secondary (failover) AWS region"
  type        = string
  default     = "eu-west-1"
}

# -----------------------------------------------------------------------------
# DNS & Load Balancer
# -----------------------------------------------------------------------------

variable "domain_name" {
  description = "Domain name for Route53 failover record (e.g., api.gtcx.trade)"
  type        = string
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID for the domain"
  type        = string
}

variable "primary_alb_dns" {
  description = "DNS name of the primary region ALB"
  type        = string
}

variable "primary_alb_zone_id" {
  description = "Route53 hosted zone ID of the primary ALB"
  type        = string
}

variable "secondary_alb_dns" {
  description = "DNS name of the secondary region ALB"
  type        = string
}

variable "secondary_alb_zone_id" {
  description = "Route53 hosted zone ID of the secondary ALB"
  type        = string
}

variable "health_check_path" {
  description = "HTTP path for Route53 health check (e.g., /healthz)"
  type        = string
  default     = "/healthz"
}

# -----------------------------------------------------------------------------
# Database
# -----------------------------------------------------------------------------

variable "audit_db_arn" {
  description = "ARN of the primary audit RDS instance to replicate"
  type        = string
}

variable "replica_instance_class" {
  description = "RDS instance class for the cross-region audit replica"
  type        = string
  default     = "db.t3.medium"
}

variable "secondary_kms_key_arn" {
  description = "KMS key ARN in the secondary region for replica encryption"
  type        = string
}

variable "secondary_monitoring_role_arn" {
  description = "IAM role ARN for RDS enhanced monitoring in secondary region"
  type        = string
}

# -----------------------------------------------------------------------------
# S3 Backup Replication
# -----------------------------------------------------------------------------

variable "primary_backup_bucket_id" {
  description = "ID of the primary backup S3 bucket (source for replication)"
  type        = string
}

variable "primary_backup_bucket_arn" {
  description = "ARN of the primary backup S3 bucket"
  type        = string
}

variable "primary_kms_key_arn" {
  description = "KMS key ARN in the primary region for decrypt during replication"
  type        = string
}

# -----------------------------------------------------------------------------
# Alerting
# -----------------------------------------------------------------------------

variable "alarm_sns_topic_arns" {
  description = "SNS topic ARNs to notify on health check state changes"
  type        = list(string)
  default     = []
}

# -----------------------------------------------------------------------------
# Tags
# -----------------------------------------------------------------------------

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
