# =============================================================================
# AWS Config Compliance Rules
# =============================================================================
# Managed rules for SOC 2 and security baseline compliance.
# =============================================================================

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}

# -----------------------------------------------------------------------------
# Managed Rules
# -----------------------------------------------------------------------------

resource "aws_config_config_rule" "cloudtrail_enabled" {
  name = "gtcx-${var.environment}-cloudtrail-enabled"

  source {
    owner             = "AWS"
    source_identifier = "CLOUD_TRAIL_ENABLED"
  }

  tags = merge(var.tags, {
    Name = "gtcx-${var.environment}-cloudtrail-enabled"
  })
}

resource "aws_config_config_rule" "ec2_volume_inuse" {
  name = "gtcx-${var.environment}-ec2-volume-inuse"

  source {
    owner             = "AWS"
    source_identifier = "EC2_VOLUME_INUSE_CHECK"
  }

  tags = merge(var.tags, {
    Name = "gtcx-${var.environment}-ec2-volume-inuse"
  })
}

resource "aws_config_config_rule" "s3_public_read" {
  name = "gtcx-${var.environment}-s3-public-read-prohibited"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }

  tags = merge(var.tags, {
    Name = "gtcx-${var.environment}-s3-public-read-prohibited"
  })
}

resource "aws_config_config_rule" "rds_storage_encrypted" {
  name = "gtcx-${var.environment}-rds-storage-encrypted"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }

  tags = merge(var.tags, {
    Name = "gtcx-${var.environment}-rds-storage-encrypted"
  })
}

resource "aws_config_config_rule" "restricted_ssh" {
  name = "gtcx-${var.environment}-restricted-ssh"

  source {
    owner             = "AWS"
    source_identifier = "INCOMING_SSH_DISABLED"
  }

  tags = merge(var.tags, {
    Name = "gtcx-${var.environment}-restricted-ssh"
  })
}

resource "aws_config_config_rule" "mfa_enabled_root" {
  name = "gtcx-${var.environment}-mfa-enabled-for-iam-console-access"

  source {
    owner             = "AWS"
    source_identifier = "MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS"
  }

  tags = merge(var.tags, {
    Name = "gtcx-${var.environment}-mfa-enabled-for-iam-console-access"
  })
}

resource "aws_config_config_rule" "s3_bucket_ssl" {
  name = "gtcx-${var.environment}-s3-bucket-ssl-requests-only"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SSL_REQUESTS_ONLY"
  }

  tags = merge(var.tags, {
    Name = "gtcx-${var.environment}-s3-bucket-ssl-requests-only"
  })
}
