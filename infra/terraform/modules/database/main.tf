# =============================================================================
# GTCX Database Module
# =============================================================================
# PostgreSQL configuration for operational and audit databases
# Per SOVEREIGN (6): Data stays in-country
# Per AUDITABLE (3): Append-only audit database
# Per OPEN (7): Uses open-source PostgreSQL
# =============================================================================

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for database deployment"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for database (should be database-tier subnets)"
  type        = list(string)
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 100
}

variable "engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "16.6"
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = true
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 30 # Per AUDITABLE principle
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = true
}

variable "allowed_security_groups" {
  description = "Security group IDs allowed to access the database"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}

# -----------------------------------------------------------------------------
# Locals
# -----------------------------------------------------------------------------

locals {
  common_tags = merge(var.tags, {
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "gtcx"
    Principle   = "SOVEREIGN AUDITABLE"
  })
}

# -----------------------------------------------------------------------------
# Subnet Group
# -----------------------------------------------------------------------------

resource "aws_db_subnet_group" "main" {
  name       = "gtcx-${var.environment}-db-subnet"
  subnet_ids = var.subnet_ids

  tags = merge(local.common_tags, {
    Name = "gtcx-${var.environment}-db-subnet-group"
  })
}

# -----------------------------------------------------------------------------
# Security Group
# -----------------------------------------------------------------------------

resource "aws_security_group" "database" {
  name        = "gtcx-${var.environment}-db-sg"
  description = "Security group for GTCX databases"
  vpc_id      = var.vpc_id

  # PostgreSQL from allowed security groups only
  ingress {
    description     = "PostgreSQL from application"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = var.allowed_security_groups
  }

  # No egress (database doesn't initiate connections)
  egress {
    description = "No outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = []
  }

  tags = merge(local.common_tags, {
    Name = "gtcx-${var.environment}-db-sg"
  })
}

# -----------------------------------------------------------------------------
# Parameter Group
# -----------------------------------------------------------------------------

resource "aws_db_parameter_group" "main" {
  family = "postgres16"
  name   = "gtcx-${var.environment}-pg-params"

  # SSL enforcement (per SECURE principle)
  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }

  # Logging parameters (per AUDITABLE principle)
  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # Log queries taking > 1s
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  # Performance parameters — static, requires DB reboot to take effect
  parameter {
    name         = "shared_preload_libraries"
    value        = "pg_stat_statements"
    apply_method = "pending-reboot"
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Primary Database (Operational)
# -----------------------------------------------------------------------------

resource "aws_db_instance" "operational" {
  identifier = "gtcx-${var.environment}-operational"

  # Engine
  engine                = "postgres"
  engine_version        = var.engine_version
  instance_class        = var.instance_class
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.allocated_storage * 2 # Auto-scaling
  storage_type          = "gp3"
  storage_encrypted     = true # Per SECURE principle

  # Network
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.database.id]
  publicly_accessible    = false # Per SOVEREIGN principle
  multi_az               = var.multi_az

  # Database
  db_name                     = "gtcx_${replace(var.environment, "-", "_")}"
  username                    = "gtcx_admin"
  manage_master_user_password = true # AWS Secrets Manager

  # Backup (per AUDITABLE principle)
  backup_retention_period = var.backup_retention_period
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"
  copy_tags_to_snapshot   = true

  # Parameters
  parameter_group_name = aws_db_parameter_group.main.name

  # Protection
  deletion_protection       = var.deletion_protection
  skip_final_snapshot       = false
  final_snapshot_identifier = "gtcx-${var.environment}-operational-final"

  # Monitoring (per OBSERVABLE principle)
  performance_insights_enabled          = true
  performance_insights_retention_period = 7
  monitoring_interval                   = 60
  monitoring_role_arn                   = aws_iam_role.rds_monitoring.arn
  enabled_cloudwatch_logs_exports       = ["postgresql", "upgrade"]

  tags = merge(local.common_tags, {
    Name     = "gtcx-${var.environment}-operational"
    Database = "operational"
  })
}

# -----------------------------------------------------------------------------
# Audit Database (Append-Only)
# -----------------------------------------------------------------------------

resource "aws_db_instance" "audit" {
  identifier = "gtcx-${var.environment}-audit"

  # Engine
  engine                = "postgres"
  engine_version        = var.engine_version
  instance_class        = var.instance_class
  allocated_storage     = var.allocated_storage * 2 # Audit needs more storage
  max_allocated_storage = var.allocated_storage * 4
  storage_type          = "gp3"
  storage_encrypted     = true

  # Network
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.database.id]
  publicly_accessible    = false
  multi_az               = var.multi_az

  # Database
  db_name                     = "gtcx_${replace(var.environment, "-", "_")}_audit"
  username                    = "gtcx_audit_admin"
  manage_master_user_password = true

  # Backup (extended for audit - per AUDITABLE principle)
  backup_retention_period = 35 # max RDS allows (use S3 export for longer audit retention)
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"
  copy_tags_to_snapshot   = true

  # Parameters
  parameter_group_name = aws_db_parameter_group.main.name

  # Protection (critical for audit)
  deletion_protection       = true # Always protected
  skip_final_snapshot       = false
  final_snapshot_identifier = "gtcx-${var.environment}-audit-final"

  # Monitoring
  performance_insights_enabled          = true
  performance_insights_retention_period = 31
  monitoring_interval                   = 60
  monitoring_role_arn                   = aws_iam_role.rds_monitoring.arn
  enabled_cloudwatch_logs_exports       = ["postgresql", "upgrade"]

  tags = merge(local.common_tags, {
    Name      = "gtcx-${var.environment}-audit"
    Database  = "audit"
    Principle = "IMMUTABLE" # No UPDATE/DELETE
  })
}

# -----------------------------------------------------------------------------
# Enhanced Monitoring Role
# -----------------------------------------------------------------------------

resource "aws_iam_role" "rds_monitoring" {
  name = "gtcx-${var.environment}-rds-monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "monitoring.rds.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "operational_endpoint" {
  description = "Operational database endpoint"
  value       = aws_db_instance.operational.endpoint
}

output "operational_port" {
  description = "Operational database port"
  value       = aws_db_instance.operational.port
}

output "audit_endpoint" {
  description = "Audit database endpoint"
  value       = aws_db_instance.audit.endpoint
}

output "audit_port" {
  description = "Audit database port"
  value       = aws_db_instance.audit.port
}

output "security_group_id" {
  description = "Database security group ID"
  value       = aws_security_group.database.id
}

output "audit_db_identifier" {
  description = "Audit database RDS instance identifier"
  value       = aws_db_instance.audit.identifier
}

output "operational_master_secret_arn" {
  description = "ARN of operational DB master password in AWS Secrets Manager (managed by RDS)"
  value       = aws_db_instance.operational.master_user_secret[0].secret_arn
}

output "audit_master_secret_arn" {
  description = "ARN of audit DB master password in AWS Secrets Manager (managed by RDS)"
  value       = aws_db_instance.audit.master_user_secret[0].secret_arn
}
