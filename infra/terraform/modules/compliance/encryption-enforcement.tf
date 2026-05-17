# =============================================================================
# GTCX Encryption Enforcement — AWS Config Rules + Auto-Remediation
# =============================================================================
# Extends the compliance module with encryption-at-rest validation for all
# storage services. Includes auto-remediation for S3 and CloudWatch alarm
# on non-compliant resources.
#
# Per DATA CLASSIFICATION POLICY: Confidential and Restricted data require
# AES-256-GCM encryption at rest. These rules enforce that baseline.
# =============================================================================

# -----------------------------------------------------------------------------
# Config Rules — Encryption at Rest
# -----------------------------------------------------------------------------

# EBS volumes must be encrypted
resource "aws_config_config_rule" "ebs_encrypted" {
  name = "gtcx-encrypted-volumes"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  tags = local.common_tags

  depends_on = [aws_config_configuration_recorder.main]
}

# EFS file systems must be encrypted
resource "aws_config_config_rule" "efs_encrypted" {
  name = "gtcx-efs-encrypted-check"

  source {
    owner             = "AWS"
    source_identifier = "EFS_ENCRYPTED_CHECK"
  }

  tags = local.common_tags

  depends_on = [aws_config_configuration_recorder.main]
}

# RDS encryption already covered in main.tf (rds_encrypted)
# S3 encryption already covered in main.tf (s3_encrypted)

# Redshift clusters must be encrypted
resource "aws_config_config_rule" "redshift_encrypted" {
  name = "gtcx-redshift-cluster-configuration-check"

  source {
    owner             = "AWS"
    source_identifier = "REDSHIFT_CLUSTER_CONFIGURATION_CHECK"
  }

  input_parameters = jsonencode({
    clusterDbEncrypted = "true"
    nodeTypes          = "dc2.large,dc2.8xlarge,ra3.xlplus,ra3.4xlarge,ra3.16xlarge"
  })

  tags = local.common_tags

  depends_on = [aws_config_configuration_recorder.main]
}

# SQS queues must use server-side encryption
resource "aws_config_config_rule" "sqs_encrypted" {
  name = "gtcx-sqs-queue-encrypted"

  source {
    owner             = "AWS"
    source_identifier = "SQS_QUEUE_ENCRYPTED"
  }

  tags = local.common_tags

  depends_on = [aws_config_configuration_recorder.main]
}

# SNS topics must use KMS encryption
resource "aws_config_config_rule" "sns_encrypted" {
  name = "gtcx-sns-encrypted-kms"

  source {
    owner             = "AWS"
    source_identifier = "SNS_ENCRYPTED_KMS"
  }

  tags = local.common_tags

  depends_on = [aws_config_configuration_recorder.main]
}

# S3 buckets must use default encryption (belt-and-suspenders with s3_encrypted)
resource "aws_config_config_rule" "s3_default_encryption" {
  name = "gtcx-s3-default-encryption-kms"

  source {
    owner             = "AWS"
    source_identifier = "S3_DEFAULT_ENCRYPTION_KMS"
  }

  tags = local.common_tags

  depends_on = [aws_config_configuration_recorder.main]
}

# -----------------------------------------------------------------------------
# Auto-Remediation — S3 Bucket Encryption
# -----------------------------------------------------------------------------

resource "aws_iam_role" "remediation" {
  name = "gtcx-${var.environment}-config-remediation-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ssm.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "remediation_s3" {
  name = "gtcx-${var.environment}-s3-encryption-remediation"
  role = aws_iam_role.remediation.id

  # Scope S3 actions to GTCX-owned buckets only.
  # KMS actions are scoped to keys in the current AWS account.
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EncryptGTCXBuckets"
        Effect = "Allow"
        Action = [
          "s3:PutEncryptionConfiguration",
          "s3:GetEncryptionConfiguration",
        ]
        Resource = length(var.remediation_bucket_arns) > 0 ? var.remediation_bucket_arns : [
          aws_s3_bucket.config.arn,
          "${aws_s3_bucket.config.arn}/*",
        ]
      },
      {
        Sid    = "UseAccountKMSKeys"
        Effect = "Allow"
        Action = [
          "kms:Describe*",
          "kms:GenerateDataKey",
        ]
        Resource = "arn:aws:kms:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:key/*"
      },
    ]
  })
}

# SSM Automation document for enabling S3 default encryption
resource "aws_ssm_document" "s3_enable_encryption" {
  name            = "gtcx-${var.environment}-s3-enable-default-encryption"
  document_type   = "Automation"
  document_format = "YAML"

  content = yamlencode({
    schemaVersion = "0.3"
    description   = "Enable AES-256 default encryption on S3 buckets"
    assumeRole    = aws_iam_role.remediation.arn
    parameters = {
      BucketName = {
        type        = "String"
        description = "Name of the S3 bucket to remediate"
      }
    }
    mainSteps = [
      {
        name   = "EnableEncryption"
        action = "aws:executeAwsApi"
        inputs = {
          Service = "s3"
          Api     = "PutBucketEncryption"
          Bucket  = "{{ BucketName }}"
          ServerSideEncryptionConfiguration = {
            Rules = [{
              ApplyServerSideEncryptionByDefault = {
                SSEAlgorithm = "aws:kms"
              }
              BucketKeyEnabled = true
            }]
          }
        }
      }
    ]
  })

  tags = local.common_tags
}

# Auto-remediation configuration for S3 encryption rule
resource "aws_config_remediation_configuration" "s3_encryption" {
  config_rule_name = aws_config_config_rule.s3_default_encryption.name
  target_type      = "SSM_DOCUMENT"
  target_id        = aws_ssm_document.s3_enable_encryption.name

  parameter {
    name           = "BucketName"
    resource_value = "RESOURCE_ID"
  }

  automatic                  = true
  maximum_automatic_attempts = 3
  retry_attempt_seconds      = 60
}

# -----------------------------------------------------------------------------
# CloudWatch Alarm — Non-Compliant Resources
# -----------------------------------------------------------------------------

resource "aws_sns_topic" "compliance_alerts" {
  name              = "gtcx-${var.environment}-compliance-alerts"
  kms_master_key_id = "alias/aws/sns"
  tags              = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "encryption_noncompliant" {
  alarm_name          = "gtcx-${var.environment}-encryption-noncompliant-resources"
  alarm_description   = "Fires when AWS Config detects resources without required encryption"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "NonCompliantResourceCount"
  namespace           = "AWS/Config"
  period              = 300
  statistic           = "Maximum"
  threshold           = 0
  treat_missing_data  = "notBreaching"

  dimensions = {
    ConfigRuleName = aws_config_config_rule.s3_default_encryption.name
  }

  alarm_actions = [aws_sns_topic.compliance_alerts.arn]
  ok_actions    = [aws_sns_topic.compliance_alerts.arn]

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "ebs_encryption_noncompliant" {
  alarm_name          = "gtcx-${var.environment}-ebs-encryption-noncompliant"
  alarm_description   = "Fires when EBS volumes are detected without encryption"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "NonCompliantResourceCount"
  namespace           = "AWS/Config"
  period              = 300
  statistic           = "Maximum"
  threshold           = 0
  treat_missing_data  = "notBreaching"

  dimensions = {
    ConfigRuleName = aws_config_config_rule.ebs_encrypted.name
  }

  alarm_actions = [aws_sns_topic.compliance_alerts.arn]
  ok_actions    = [aws_sns_topic.compliance_alerts.arn]

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "encryption_enforcement_rules" {
  description = "Encryption enforcement Config rules"
  value = [
    aws_config_config_rule.ebs_encrypted.name,
    aws_config_config_rule.efs_encrypted.name,
    aws_config_config_rule.redshift_encrypted.name,
    aws_config_config_rule.sqs_encrypted.name,
    aws_config_config_rule.sns_encrypted.name,
    aws_config_config_rule.s3_default_encryption.name,
  ]
}

output "compliance_alerts_topic_arn" {
  description = "SNS topic ARN for compliance alerts"
  value       = aws_sns_topic.compliance_alerts.arn
}

output "remediation_role_arn" {
  description = "IAM role ARN for auto-remediation"
  value       = aws_iam_role.remediation.arn
}
