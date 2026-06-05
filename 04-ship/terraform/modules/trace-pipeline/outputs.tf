# =============================================================================
# GTCX Trace Pipeline Module — Outputs
# =============================================================================

# -- Trace Storage

output "trace_bucket_name" {
  description = "S3 bucket name for Tempo trace backend"
  value       = aws_s3_bucket.traces.id
}

output "trace_bucket_arn" {
  description = "S3 bucket ARN for Tempo trace backend"
  value       = aws_s3_bucket.traces.arn
}

# -- SQS

output "queue_url" {
  description = "SQS queue URL for trace events"
  value       = aws_sqs_queue.trace_events.url
}

output "queue_arn" {
  description = "SQS queue ARN for trace events"
  value       = aws_sqs_queue.trace_events.arn
}

output "dlq_url" {
  description = "Dead letter queue URL for failed trace events"
  value       = aws_sqs_queue.trace_events_dlq.url
}

output "dlq_arn" {
  description = "Dead letter queue ARN for failed trace events"
  value       = aws_sqs_queue.trace_events_dlq.arn
}

# -- Tempo

output "tempo_namespace" {
  description = "Kubernetes namespace where Tempo is deployed"
  value       = helm_release.tempo.namespace
}

# -- IRSA

output "tempo_role_arn" {
  description = "IAM role ARN for Tempo service account (IRSA)"
  value       = aws_iam_role.tempo.arn
}

output "trace_consumer_role_arn" {
  description = "IAM role ARN for trace pipeline consumer (IRSA)"
  value       = aws_iam_role.trace_consumer.arn
}
