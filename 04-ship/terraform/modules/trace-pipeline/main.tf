# =============================================================================
# GTCX Trace Pipeline Module — Main
# =============================================================================
# Long-term trace storage (Tempo with S3 backend) and async event stream
# (SQS) for the L5 intelligence pipeline.
#
# Flow: OTEL Collector → Tempo (durable, 90-day) → SQS → Trace Quality Scorer
#
# Per SIGNAL L5: Production traces feed the fine-tuning pipeline
# Per SOVEREIGN (6): Traces stored in-region (af-south-1)
# =============================================================================

locals {
  common_tags = merge(var.tags, {
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "gtcx"
    Component   = "trace-pipeline"
    Principle   = "SIGNAL-L5 SOVEREIGN"
  })

  oidc_issuer = var.eks_oidc_provider_url
}

# -----------------------------------------------------------------------------
# S3 — Tempo Trace Backend
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "traces" {
  bucket = var.trace_bucket_name

  tags = merge(local.common_tags, {
    Name    = var.trace_bucket_name
    Purpose = "Long-term production trace storage for L5 pipeline"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "traces" {
  bucket = aws_s3_bucket.traces.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "traces" {
  bucket = aws_s3_bucket.traces.id

  rule {
    id     = "expire-old-traces"
    status = "Enabled"

    filter {}

    expiration {
      days = var.trace_s3_expiration_days
    }
  }
}

resource "aws_s3_bucket_public_access_block" "traces" {
  bucket = aws_s3_bucket.traces.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# -----------------------------------------------------------------------------
# SQS — Trace Event Queue
# -----------------------------------------------------------------------------
# Decouples trace collection from dataset curation. The trace quality scorer
# consumes events asynchronously — backpressure handled by SQS visibility
# timeout and DLQ.

resource "aws_sqs_queue" "trace_events" {
  name                       = var.queue_name
  visibility_timeout_seconds = var.queue_visibility_timeout
  message_retention_seconds  = var.queue_retention_days * 86400
  receive_wait_time_seconds  = 10 # long polling

  sqs_managed_sse_enabled = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.trace_events_dlq.arn
    maxReceiveCount     = var.dlq_max_receive_count
  })

  tags = merge(local.common_tags, {
    Name    = var.queue_name
    Purpose = "Async trace events from OTEL to quality scorer"
  })
}

resource "aws_sqs_queue" "trace_events_dlq" {
  name                      = "${var.queue_name}-dlq"
  message_retention_seconds = var.queue_retention_days * 86400

  sqs_managed_sse_enabled = true

  tags = merge(local.common_tags, {
    Name    = "${var.queue_name}-dlq"
    Purpose = "Dead letter queue for failed trace event processing"
  })
}

# -----------------------------------------------------------------------------
# Helm Release — Tempo Distributed (S3 Backend)
# -----------------------------------------------------------------------------

resource "helm_release" "tempo" {
  name             = "tempo"
  repository       = "https://grafana.github.io/helm-charts"
  chart            = "tempo"
  version          = var.tempo_chart_version
  namespace        = var.tempo_namespace
  create_namespace = true

  wait    = true
  timeout = 600

  values = [yamlencode({
    storage = {
      trace = {
        backend = "s3"
        s3 = {
          bucket   = aws_s3_bucket.traces.id
          region   = data.aws_region.current.name
          endpoint = "s3.${data.aws_region.current.name}.amazonaws.com"
        }
      }
    }

    compactor = {
      compaction = {
        block_retention = "${var.trace_retention_days * 24}h"
      }
    }

    global_overrides = {
      max_traces_per_user = 0       # unlimited
      max_bytes_per_trace = 5000000 # 5MB
    }

    ingester = {
      resources = {
        requests = {
          cpu    = var.tempo_resources.cpu_request
          memory = var.tempo_resources.memory_request
        }
        limits = {
          cpu    = var.tempo_resources.cpu_limit
          memory = var.tempo_resources.memory_limit
        }
      }
    }

    querier = {
      resources = {
        requests = {
          cpu    = var.tempo_resources.cpu_request
          memory = var.tempo_resources.memory_request
        }
        limits = {
          cpu    = var.tempo_resources.cpu_limit
          memory = var.tempo_resources.memory_limit
        }
      }
    }

    serviceAccount = {
      annotations = {
        "eks.amazonaws.com/role-arn" = aws_iam_role.tempo.arn
      }
    }
  })]
}

# -----------------------------------------------------------------------------
# IAM — IRSA Role for Tempo (S3 access)
# -----------------------------------------------------------------------------

resource "aws_iam_role" "tempo" {
  name = "gtcx-${var.environment}-tempo"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = var.eks_oidc_provider_arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${local.oidc_issuer}:sub" = "system:serviceaccount:${var.tempo_namespace}:tempo"
          "${local.oidc_issuer}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "tempo_s3" {
  name = "gtcx-${var.environment}-tempo-s3"
  role = aws_iam_role.tempo.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket",
      ]
      Resource = [
        aws_s3_bucket.traces.arn,
        "${aws_s3_bucket.traces.arn}/*",
      ]
    }]
  })
}

# -----------------------------------------------------------------------------
# IAM — SQS Access for Pipeline Consumer
# -----------------------------------------------------------------------------

resource "aws_iam_role" "trace_consumer" {
  name = "gtcx-${var.environment}-trace-consumer"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = var.eks_oidc_provider_arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${local.oidc_issuer}:sub" = "system:serviceaccount:${var.pipeline_namespace}:${var.pipeline_service_account}"
          "${local.oidc_issuer}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "trace_consumer_sqs" {
  name = "gtcx-${var.environment}-trace-consumer-sqs"
  role = aws_iam_role.trace_consumer.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "SQSTraceEvents"
      Effect = "Allow"
      Action = [
        "sqs:SendMessage",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes",
      ]
      Resource = [
        aws_sqs_queue.trace_events.arn,
        aws_sqs_queue.trace_events_dlq.arn,
      ]
    }]
  })
}

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------

data "aws_region" "current" {}
