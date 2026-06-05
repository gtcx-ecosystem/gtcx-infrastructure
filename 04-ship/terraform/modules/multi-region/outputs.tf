# =============================================================================
# Multi-Region Failover Module — Outputs
# =============================================================================

output "primary_health_check_id" {
  description = "Route53 health check ID for the primary ALB"
  value       = aws_route53_health_check.primary.id
}

output "secondary_health_check_id" {
  description = "Route53 health check ID for the secondary ALB"
  value       = aws_route53_health_check.secondary.id
}

output "failover_fqdn" {
  description = "FQDN of the Route53 failover record"
  value       = aws_route53_record.primary.fqdn
}

output "audit_replica_endpoint" {
  description = "Endpoint of the cross-region audit database replica"
  value       = aws_db_instance.audit_replica.endpoint
}

output "audit_replica_arn" {
  description = "ARN of the cross-region audit database replica"
  value       = aws_db_instance.audit_replica.arn
}

output "backup_replica_bucket_arn" {
  description = "ARN of the S3 backup replica bucket in secondary region"
  value       = aws_s3_bucket.backup_replica.arn
}

output "backup_replica_bucket_name" {
  description = "Name of the S3 backup replica bucket in secondary region"
  value       = aws_s3_bucket.backup_replica.id
}

output "replication_role_arn" {
  description = "IAM role ARN used for S3 cross-region replication"
  value       = aws_iam_role.replication.arn
}

output "health_check_alarm_arn" {
  description = "CloudWatch alarm ARN for primary health check failure"
  value       = aws_cloudwatch_metric_alarm.health_check_failed.arn
}
