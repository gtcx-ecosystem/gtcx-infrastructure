# =============================================================================
# GTCX Audit Backup Module
# =============================================================================
# Automated RDS snapshot export to S3 for long-term audit retention
# Per AUDITABLE principle (3): 7-year retention, encrypted, immutable
# Per SOVEREIGN principle (6): Data stays in-region
# =============================================================================

# -----------------------------------------------------------------------------
# Locals
# -----------------------------------------------------------------------------

locals {
  common_tags = merge(var.tags, {
    Environment = var.environment
    ManagedBy   = "Terraform"
    Project     = "GTCX"
    Principle   = "AUDITABLE"
  })
}

# -----------------------------------------------------------------------------
# S3 Bucket for Snapshot Exports
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "backup" {
  bucket = "gtcx-${var.environment}-audit-backups"
  tags   = merge(local.common_tags, { Name = "gtcx-${var.environment}-audit-backups" })
}

resource "aws_s3_bucket_versioning" "backup" {
  bucket = aws_s3_bucket.backup.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backup" {
  bucket = aws_s3_bucket.backup.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.backup.arn
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backup" {
  bucket = aws_s3_bucket.backup.id

  rule {
    id     = "audit-retention"
    status = "Enabled"

    filter {}

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 2555
    }
  }
}

resource "aws_s3_bucket_public_access_block" "backup" {
  bucket = aws_s3_bucket.backup.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# -----------------------------------------------------------------------------
# KMS Key for Export Encryption
# -----------------------------------------------------------------------------

resource "aws_kms_key" "backup" {
  description             = "GTCX ${var.environment} audit backup encryption key"
  enable_key_rotation     = true
  deletion_window_in_days = 30
  tags                    = local.common_tags
}

resource "aws_kms_alias" "backup" {
  name          = "alias/gtcx-${var.environment}-audit-backup"
  target_key_id = aws_kms_key.backup.key_id
}

# -----------------------------------------------------------------------------
# IAM Role for RDS Export
# -----------------------------------------------------------------------------

resource "aws_iam_role" "rds_export" {
  name = "gtcx-${var.environment}-rds-export"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "export.rds.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "rds_export" {
  name = "gtcx-${var.environment}-rds-export-policy"
  role = aws_iam_role.rds_export.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetBucketLocation"
        ]
        Resource = [
          aws_s3_bucket.backup.arn,
          "${aws_s3_bucket.backup.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:GenerateDataKey*",
          "kms:Decrypt"
        ]
        Resource = [aws_kms_key.backup.arn]
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# EventBridge Rule (30-day schedule)
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_event_rule" "backup_schedule" {
  name                = "gtcx-${var.environment}-audit-backup"
  description         = "Trigger audit DB snapshot export every 30 days"
  schedule_expression = "rate(30 days)"
  tags                = local.common_tags
}

resource "aws_cloudwatch_event_target" "backup_lambda" {
  rule      = aws_cloudwatch_event_rule.backup_schedule.name
  target_id = "audit-backup-lambda"
  arn       = aws_lambda_function.backup.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.backup.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.backup_schedule.arn
}

# -----------------------------------------------------------------------------
# Lambda Function for Snapshot Export
# -----------------------------------------------------------------------------

data "archive_file" "backup_lambda" {
  type        = "zip"
  output_path = "${path.module}/lambda.zip"

  source {
    content  = <<-PYTHON
import boto3
import os
import datetime

def handler(event, context):
    rds = boto3.client('rds')
    db_identifier = os.environ['DB_IDENTIFIER']
    bucket_name = os.environ['BACKUP_BUCKET']
    kms_key_arn = os.environ['KMS_KEY_ARN']

    # Get the latest automated snapshot
    response = rds.describe_db_snapshots(
        DBInstanceIdentifier=db_identifier,
        SnapshotType='automated',
        MaxRecords=20,
    )

    snapshots = sorted(
        response.get('DBSnapshots', []),
        key=lambda s: s.get('SnapshotCreateTime', datetime.datetime.min.replace(tzinfo=datetime.timezone.utc)),
        reverse=True,
    )

    if not snapshots:
        print(f"No automated snapshots found for {db_identifier}")
        return {'status': 'no_snapshots'}

    snapshot = snapshots[0]
    snapshot_arn = snapshot['DBSnapshotArn']
    snapshot_id = snapshot['DBSnapshotIdentifier']
    timestamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d-%H%M%S')
    export_id = f"gtcx-audit-export-{timestamp}"

    print(f"Starting export of snapshot {snapshot_id} to s3://{bucket_name}/{export_id}")

    rds.start_export_task(
        ExportTaskIdentifier=export_id,
        SourceArn=snapshot_arn,
        S3BucketName=bucket_name,
        IamRoleArn=os.environ.get('EXPORT_ROLE_ARN', ''),
        KmsKeyId=kms_key_arn,
        S3Prefix=export_id,
    )

    return {
        'status': 'export_started',
        'export_id': export_id,
        'snapshot_id': snapshot_id,
    }
PYTHON
    filename = "index.py"
  }
}

resource "aws_lambda_function" "backup" {
  function_name    = "gtcx-${var.environment}-audit-backup"
  filename         = data.archive_file.backup_lambda.output_path
  source_code_hash = data.archive_file.backup_lambda.output_base64sha256
  handler          = "index.handler"
  runtime          = "python3.12"
  timeout          = 300
  role             = aws_iam_role.lambda_execution.arn

  environment {
    variables = {
      BACKUP_BUCKET  = aws_s3_bucket.backup.id
      KMS_KEY_ARN    = aws_kms_key.backup.arn
      DB_IDENTIFIER  = var.db_identifier
      EXPORT_ROLE_ARN = aws_iam_role.rds_export.arn
    }
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Lambda Execution Role
# -----------------------------------------------------------------------------

resource "aws_iam_role" "lambda_execution" {
  name = "gtcx-${var.environment}-audit-backup-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "lambda_execution" {
  name = "gtcx-${var.environment}-audit-backup-lambda-policy"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBSnapshots",
          "rds:StartExportTask"
        ]
        Resource = "arn:aws:rds:${var.region}:*:db:gtcx-${var.environment}-*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:log-group:/aws/lambda/gtcx-${var.environment}-audit-backup:*"
      },
      {
        Effect = "Allow"
        Action = "iam:PassRole"
        Resource = aws_iam_role.rds_export.arn
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# CloudWatch Log Group
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "backup_lambda" {
  name              = "/aws/lambda/gtcx-${var.environment}-audit-backup"
  retention_in_days = 30
  tags              = local.common_tags
}
