# =============================================================================
# Trace Pipeline Module — Terraform Native Tests
# =============================================================================
# Run: terraform test (from this directory)
# Validates S3 trace bucket, SQS queues, Tempo Helm, and IRSA.
# =============================================================================

variables {
  environment           = "test"
  trace_bucket_name     = "gtcx-test-intelligence-traces"
  trace_retention_days  = 90
  trace_s3_expiration_days = 120
  queue_name            = "test-intelligence-trace-events"
  queue_retention_days  = 14
  dlq_max_receive_count = 5
  tempo_chart_version   = "1.10.3"
  eks_oidc_provider_arn = "arn:aws:iam::123456789012:oidc-provider/oidc.eks.af-south-1.amazonaws.com/id/TEST"
  eks_oidc_provider_url = "oidc.eks.af-south-1.amazonaws.com/id/TEST"
}

# -----------------------------------------------------------------------------
# S3 Trace Bucket
# -----------------------------------------------------------------------------

run "trace_bucket_has_kms_encryption" {
  command = plan

  assert {
    condition     = aws_s3_bucket_server_side_encryption_configuration.traces.rule[0].apply_server_side_encryption_by_default[0].sse_algorithm == "aws:kms"
    error_message = "Trace bucket must use KMS encryption"
  }
}

run "trace_bucket_blocks_public_access" {
  command = plan

  assert {
    condition     = aws_s3_bucket_public_access_block.traces.block_public_acls == true
    error_message = "Trace bucket must block all public access"
  }
}

run "trace_bucket_has_expiration_lifecycle" {
  command = plan

  assert {
    condition     = aws_s3_bucket_lifecycle_configuration.traces.rule[0].expiration[0].days == 120
    error_message = "Trace bucket must expire objects after configured retention"
  }
}

# -----------------------------------------------------------------------------
# SQS Queues
# -----------------------------------------------------------------------------

run "queue_has_long_polling" {
  command = plan

  assert {
    condition     = aws_sqs_queue.trace_events.receive_wait_time_seconds == 10
    error_message = "Trace queue must use long polling (10s)"
  }
}

run "queue_has_encryption" {
  command = plan

  assert {
    condition     = aws_sqs_queue.trace_events.sqs_managed_sse_enabled == true
    error_message = "Trace queue must have SSE enabled"
  }
}

run "queue_has_dlq_redrive" {
  command = plan

  assert {
    condition     = can(jsondecode(aws_sqs_queue.trace_events.redrive_policy))
    error_message = "Trace queue must have a redrive policy to DLQ"
  }
}

run "dlq_has_encryption" {
  command = plan

  assert {
    condition     = aws_sqs_queue.trace_events_dlq.sqs_managed_sse_enabled == true
    error_message = "DLQ must have SSE enabled"
  }
}

# -----------------------------------------------------------------------------
# Tempo Helm
# -----------------------------------------------------------------------------

run "tempo_deploys_to_observability_namespace" {
  command = plan

  assert {
    condition     = helm_release.tempo.namespace == "observability"
    error_message = "Tempo must deploy to observability namespace"
  }
}

run "tempo_uses_correct_chart" {
  command = plan

  assert {
    condition     = helm_release.tempo.chart == "tempo-distributed"
    error_message = "Must use the tempo-distributed Helm chart"
  }
}

# -----------------------------------------------------------------------------
# IRSA
# -----------------------------------------------------------------------------

run "tempo_irsa_role_exists" {
  command = plan

  assert {
    condition     = aws_iam_role.tempo.name == "gtcx-test-tempo"
    error_message = "Tempo IRSA role must include environment name"
  }
}

run "trace_consumer_irsa_role_exists" {
  command = plan

  assert {
    condition     = aws_iam_role.trace_consumer.name == "gtcx-test-trace-consumer"
    error_message = "Trace consumer IRSA role must include environment name"
  }
}
