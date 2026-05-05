# =============================================================================
# GTCX Compliance Module — AWS Config Rules
# =============================================================================
# Automated compliance validation for infrastructure configuration.
# Per AUDITABLE (3): Continuous compliance monitoring, not point-in-time
# Per SECURE (11): Detect configuration drift automatically
#
# What this creates:
#   1. AWS Config Recorder — captures resource configuration changes
#   2. Config Rules — validates resources against compliance policies
#   3. S3 bucket for configuration snapshots
# =============================================================================

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}

locals {
  common_tags = merge(var.tags, {
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "gtcx"
    Principle   = "AUDITABLE SECURE"
  })
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# -----------------------------------------------------------------------------
# S3 Bucket for Config Snapshots
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "config" {
  bucket = "gtcx-${var.environment}-config-snapshots"
  tags   = merge(local.common_tags, { Name = "gtcx-${var.environment}-config-snapshots" })
}

resource "aws_s3_bucket_versioning" "config" {
  bucket = aws_s3_bucket.config.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "config" {
  bucket = aws_s3_bucket.config.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "config" {
  bucket = aws_s3_bucket.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AWSConfigBucketPermissionsCheck"
        Effect    = "Allow"
        Principal = { Service = "config.amazonaws.com" }
        Action    = "s3:GetBucketAcl"
        Resource  = aws_s3_bucket.config.arn
      },
      {
        Sid       = "AWSConfigBucketDelivery"
        Effect    = "Allow"
        Principal = { Service = "config.amazonaws.com" }
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.config.arn}/AWSLogs/${data.aws_caller_identity.current.account_id}/Config/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
    ]
  })
}

# -----------------------------------------------------------------------------
# AWS Config Recorder
# -----------------------------------------------------------------------------

resource "aws_config_configuration_recorder" "main" {
  name     = "gtcx-${var.environment}"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported = true
  }
}

resource "aws_config_delivery_channel" "main" {
  name           = "gtcx-${var.environment}"
  s3_bucket_name = aws_s3_bucket.config.id

  snapshot_delivery_properties {
    delivery_frequency = "Six_Hours"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

resource "aws_iam_role" "config" {
  name = "gtcx-${var.environment}-config-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "config.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

resource "aws_iam_role_policy" "config_s3" {
  name = "gtcx-${var.environment}-config-s3-delivery"
  role = aws_iam_role.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:PutObject", "s3:GetBucketAcl"]
      Resource = [aws_s3_bucket.config.arn, "${aws_s3_bucket.config.arn}/*"]
    }]
  })
}

# -----------------------------------------------------------------------------
# Config Rules — Policy Enforcement
# -----------------------------------------------------------------------------

# Rule 1: RDS instances must have encryption enabled
resource "aws_config_config_rule" "rds_encrypted" {
  name = "gtcx-rds-storage-encrypted"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }

  tags = local.common_tags

  depends_on = [aws_config_configuration_recorder.main]
}

# Rule 2: S3 buckets must block public access
resource "aws_config_config_rule" "s3_public_access" {
  name = "gtcx-s3-bucket-public-read-prohibited"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }

  tags = local.common_tags

  depends_on = [aws_config_configuration_recorder.main]
}

# Rule 3: S3 buckets must have server-side encryption
resource "aws_config_config_rule" "s3_encrypted" {
  name = "gtcx-s3-bucket-server-side-encryption-enabled"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  tags = local.common_tags

  depends_on = [aws_config_configuration_recorder.main]
}

# Rule 4: EKS clusters must have secrets encryption enabled
resource "aws_config_config_rule" "eks_secrets_encrypted" {
  name = "gtcx-eks-secrets-encrypted"

  source {
    owner             = "AWS"
    source_identifier = "EKS_SECRETS_ENCRYPTED"
  }

  tags = local.common_tags

  depends_on = [aws_config_configuration_recorder.main]
}

# Rule 5: RDS instances must not be publicly accessible
resource "aws_config_config_rule" "rds_public_access" {
  name = "gtcx-rds-instance-public-access-check"

  source {
    owner             = "AWS"
    source_identifier = "RDS_INSTANCE_PUBLIC_ACCESS_CHECK"
  }

  tags = local.common_tags

  depends_on = [aws_config_configuration_recorder.main]
}

# Rule 6: IAM root account must have MFA enabled
resource "aws_config_config_rule" "root_mfa" {
  name = "gtcx-root-account-mfa-enabled"

  source {
    owner             = "AWS"
    source_identifier = "ROOT_ACCOUNT_MFA_ENABLED"
  }

  tags = local.common_tags

  depends_on = [aws_config_configuration_recorder.main]
}

# Rule 7: CloudTrail must be enabled
resource "aws_config_config_rule" "cloudtrail_enabled" {
  name = "gtcx-cloud-trail-enabled"

  source {
    owner             = "AWS"
    source_identifier = "CLOUD_TRAIL_ENABLED"
  }

  tags = local.common_tags

  depends_on = [aws_config_configuration_recorder.main]
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "config_recorder_id" {
  description = "AWS Config recorder ID"
  value       = aws_config_configuration_recorder.main.id
}

output "config_bucket" {
  description = "S3 bucket for Config snapshots"
  value       = aws_s3_bucket.config.id
}

output "compliance_rules" {
  description = "Active compliance rules"
  value = [
    aws_config_config_rule.rds_encrypted.name,
    aws_config_config_rule.s3_public_access.name,
    aws_config_config_rule.s3_encrypted.name,
    aws_config_config_rule.eks_secrets_encrypted.name,
    aws_config_config_rule.rds_public_access.name,
    aws_config_config_rule.root_mfa.name,
    aws_config_config_rule.cloudtrail_enabled.name,
  ]
}
