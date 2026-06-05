# =============================================================================
# GTCX Multi-Region Failover Module
# =============================================================================
# Active-passive multi-region failover for bank-grade operational resilience.
# Primary: af-south-1 (Cape Town) — closest to Southern/East Africa markets
# Secondary: eu-west-1 (Ireland) — lowest-latency EU fallback
#
# Per SOVEREIGN principle (6): Primary data stays in-region
# Per AUDITABLE principle (3): Cross-region replica for audit continuity
# =============================================================================
#
# FAILOVER PROCEDURE
# ------------------
# 1. Route53 health check detects primary ALB failure (3 consecutive failures)
# 2. DNS automatically routes traffic to secondary ALB (TTL 60s propagation)
# 3. Secondary region serves from RDS read replica (read-only until promoted)
# 4. To promote secondary to read-write:
#    a. Run: aws rds promote-read-replica --db-instance-identifier gtcx-<env>-audit-replica --region eu-west-1
#    b. Update application config to point to promoted instance
#    c. Verify write capability with: SELECT pg_is_in_recovery(); -- should return false
#    d. Notify operations team and update incident ticket
#
# FAILBACK PROCEDURE
# ------------------
# 1. Restore primary region infrastructure and verify health
# 2. Create new RDS replica in primary region from promoted secondary:
#    a. Run: aws rds create-db-instance-read-replica \
#         --db-instance-identifier gtcx-<env>-audit-primary-restore \
#         --source-db-instance-identifier gtcx-<env>-audit-replica \
#         --source-region eu-west-1 --region af-south-1
#    b. Wait for replica to reach "available" state
# 3. Promote the primary-region replica to standalone
# 4. Update Route53 health check to point to restored primary ALB
# 5. Verify health check passes (3 consecutive successes)
# 6. DNS will automatically route traffic back to primary
# 7. Re-create cross-region read replica for future failover
# 8. Document failback in incident report with timestamps
# =============================================================================

# -----------------------------------------------------------------------------
# Locals
# -----------------------------------------------------------------------------

locals {
  common_tags = merge(var.tags, {
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "gtcx"
    Module      = "multi-region"
    Principle   = "SOVEREIGN RESILIENT"
  })
}

# -----------------------------------------------------------------------------
# Route53 Health Check — Primary ALB
# -----------------------------------------------------------------------------

resource "aws_route53_health_check" "primary" {
  fqdn              = var.primary_alb_dns
  port              = 443
  type              = "HTTPS"
  resource_path     = var.health_check_path
  failure_threshold = 3
  request_interval  = 10
  measure_latency   = true
  regions           = ["us-east-1", "eu-west-1", "ap-southeast-1"]

  tags = merge(local.common_tags, {
    Name = "gtcx-${var.environment}-primary-health"
  })
}

# -----------------------------------------------------------------------------
# Route53 Health Check — Secondary ALB
# -----------------------------------------------------------------------------

resource "aws_route53_health_check" "secondary" {
  fqdn              = var.secondary_alb_dns
  port              = 443
  type              = "HTTPS"
  resource_path     = var.health_check_path
  failure_threshold = 3
  request_interval  = 10
  measure_latency   = true
  regions           = ["us-east-1", "eu-west-1", "ap-southeast-1"]

  tags = merge(local.common_tags, {
    Name = "gtcx-${var.environment}-secondary-health"
  })
}

# -----------------------------------------------------------------------------
# Route53 Failover Routing Policy
# -----------------------------------------------------------------------------

resource "aws_route53_record" "primary" {
  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "A"

  failover_routing_policy {
    type = "PRIMARY"
  }

  set_identifier  = "primary"
  health_check_id = aws_route53_health_check.primary.id

  alias {
    name                   = var.primary_alb_dns
    zone_id                = var.primary_alb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "secondary" {
  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "A"

  failover_routing_policy {
    type = "SECONDARY"
  }

  set_identifier  = "secondary"
  health_check_id = aws_route53_health_check.secondary.id

  alias {
    name                   = var.secondary_alb_dns
    zone_id                = var.secondary_alb_zone_id
    evaluate_target_health = true
  }
}

# -----------------------------------------------------------------------------
# RDS Cross-Region Read Replica — Audit Database
# -----------------------------------------------------------------------------
# The audit database is the most critical data store. A cross-region replica
# ensures RPO <= 5 minutes for audit data (async replication lag).
# The operational database uses Multi-AZ within af-south-1 for HA.
# -----------------------------------------------------------------------------

resource "aws_db_instance" "audit_replica" {
  provider = aws.secondary

  identifier          = "gtcx-${var.environment}-audit-replica"
  replicate_source_db = var.audit_db_arn

  instance_class            = var.replica_instance_class
  storage_encrypted         = true
  kms_key_id                = var.secondary_kms_key_arn
  publicly_accessible       = false
  multi_az                  = false # Single-AZ replica (cost optimization — promoted to Multi-AZ on failover)
  deletion_protection       = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "gtcx-${var.environment}-audit-replica-final"

  performance_insights_enabled          = true
  performance_insights_retention_period = 7
  monitoring_interval                   = 60
  monitoring_role_arn                   = var.secondary_monitoring_role_arn

  tags = merge(local.common_tags, {
    Name      = "gtcx-${var.environment}-audit-replica"
    Database  = "audit-replica"
    Region    = var.secondary_region
    Principle = "IMMUTABLE"
  })
}

# -----------------------------------------------------------------------------
# S3 Cross-Region Replication — Backup Bucket
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "backup_replica" {
  provider = aws.secondary

  bucket = "gtcx-${var.environment}-audit-backups-replica"
  tags   = merge(local.common_tags, { Name = "gtcx-${var.environment}-audit-backups-replica" })
}

resource "aws_s3_bucket_versioning" "backup_replica" {
  provider = aws.secondary

  bucket = aws_s3_bucket.backup_replica.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backup_replica" {
  provider = aws.secondary

  bucket = aws_s3_bucket.backup_replica.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = var.secondary_kms_key_arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "backup_replica" {
  provider = aws.secondary

  bucket = aws_s3_bucket.backup_replica.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM role for S3 replication
resource "aws_iam_role" "replication" {
  name = "gtcx-${var.environment}-s3-replication"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "s3.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "replication" {
  name = "gtcx-${var.environment}-s3-replication-policy"
  role = aws_iam_role.replication.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = [var.primary_backup_bucket_arn]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = ["${var.primary_backup_bucket_arn}/*"]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = ["${aws_s3_bucket.backup_replica.arn}/*"]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = [var.primary_kms_key_arn]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Encrypt"
        ]
        Resource = [var.secondary_kms_key_arn]
      }
    ]
  })
}

# Replication configuration on the primary backup bucket
resource "aws_s3_bucket_replication_configuration" "backup" {
  bucket = var.primary_backup_bucket_id
  role   = aws_iam_role.replication.arn

  rule {
    id     = "audit-backup-replication"
    status = "Enabled"

    filter {}

    destination {
      bucket        = aws_s3_bucket.backup_replica.arn
      storage_class = "STANDARD_IA"

      encryption_configuration {
        replica_kms_key_id = var.secondary_kms_key_arn
      }
    }

    source_selection_criteria {
      sse_kms_encrypted_objects {
        status = "Enabled"
      }
    }

    delete_marker_replication {
      status = "Enabled"
    }
  }
}

# -----------------------------------------------------------------------------
# CloudWatch Alarms — Failover Monitoring
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "health_check_failed" {
  alarm_name          = "gtcx-${var.environment}-primary-unhealthy"
  alarm_description   = "Primary region health check has failed — failover may be active"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = 60
  statistic           = "Minimum"
  threshold           = 1
  treat_missing_data  = "breaching"

  dimensions = {
    HealthCheckId = aws_route53_health_check.primary.id
  }

  alarm_actions = var.alarm_sns_topic_arns
  ok_actions    = var.alarm_sns_topic_arns

  tags = local.common_tags
}
