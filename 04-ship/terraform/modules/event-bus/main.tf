# =============================================================================
# GTCX Event Bus Module — NATS with JetStream
# =============================================================================
# Cross-service pub/sub for domain events (trade execution, settlement,
# clearance, compliance). JetStream provides at-least-once delivery with
# persistent streams for audit and replay.
#
# Per RESILIENT (12): Message persistence survives broker restart
# Per AUDITABLE (3): Event streams retained for compliance replay
# Per SOVEREIGN (6): Deployed in-region alongside data stores
# Per SCALABLE (24): NATS cluster scales horizontally
# =============================================================================

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for event bus deployment"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for event bus (private subnets)"
  type        = list(string)
}

variable "availability_zones" {
  description = "Availability zones corresponding to subnet_ids (for EBS volume placement)"
  type        = list(string)
  default     = []
}

variable "allowed_security_groups" {
  description = "Security groups allowed to connect to NATS"
  type        = list(string)
  default     = []
}

variable "instance_type" {
  description = "EC2 instance type for NATS nodes (EKS-managed when null)"
  type        = string
  default     = null
}

variable "cluster_size" {
  description = "Number of NATS nodes (3 for production HA, 1 for pilot)"
  type        = number
  default     = 1
}

variable "jetstream_storage_gb" {
  description = "JetStream persistent storage per node (GB)"
  type        = number
  default     = 10
}

variable "max_payload_kb" {
  description = "Maximum message payload size (KB)"
  type        = number
  default     = 1024
}

variable "retention_days" {
  description = "Event stream retention period (days)"
  type        = number
  default     = 90
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
    Component   = "event-bus"
    Principle   = "RESILIENT AUDITABLE SOVEREIGN"
  })

  nats_port    = 4222
  cluster_port = 6222
  monitor_port = 8222
}

# -----------------------------------------------------------------------------
# Security Group
# -----------------------------------------------------------------------------

resource "aws_security_group" "nats" {
  name_prefix = "gtcx-${var.environment}-nats-"
  description = "NATS event bus security group"
  vpc_id      = var.vpc_id

  # Client connections (from allowed services)
  dynamic "ingress" {
    for_each = var.allowed_security_groups
    content {
      description     = "NATS client from ${ingress.value}"
      from_port       = local.nats_port
      to_port         = local.nats_port
      protocol        = "tcp"
      security_groups = [ingress.value]
    }
  }

  # Cluster routing (inter-node)
  ingress {
    description = "NATS cluster routing"
    from_port   = local.cluster_port
    to_port     = local.cluster_port
    protocol    = "tcp"
    self        = true
  }

  # Monitoring endpoint
  ingress {
    description = "NATS monitoring"
    from_port   = local.monitor_port
    to_port     = local.monitor_port
    protocol    = "tcp"
    self        = true
  }

  # Allow monitoring from allowed security groups
  dynamic "ingress" {
    for_each = var.allowed_security_groups
    content {
      description     = "NATS monitoring from ${ingress.value}"
      from_port       = local.monitor_port
      to_port         = local.monitor_port
      protocol        = "tcp"
      security_groups = [ingress.value]
    }
  }

  egress {
    description = "Allow outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "gtcx-${var.environment}-nats-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# -----------------------------------------------------------------------------
# EBS Volume for JetStream persistence (per node)
# -----------------------------------------------------------------------------

resource "aws_ebs_volume" "jetstream" {
  count = var.cluster_size

  availability_zone = length(var.availability_zones) > 0 ? var.availability_zones[count.index % length(var.availability_zones)] : var.availability_zones[0]
  size              = var.jetstream_storage_gb
  type              = "gp3"
  encrypted         = true

  tags = merge(local.common_tags, {
    Name = "gtcx-${var.environment}-nats-jetstream-${count.index}"
  })
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "security_group_id" {
  description = "NATS security group ID"
  value       = aws_security_group.nats.id
}

output "nats_port" {
  description = "NATS client port"
  value       = local.nats_port
}

output "cluster_port" {
  description = "NATS cluster routing port"
  value       = local.cluster_port
}

output "monitor_port" {
  description = "NATS monitoring port"
  value       = local.monitor_port
}

output "connection_url" {
  description = "NATS connection URL (K8s internal)"
  value       = "nats://gtcx-nats:${local.nats_port}"
}

output "jetstream_volume_ids" {
  description = "EBS volume IDs for JetStream persistence"
  value       = aws_ebs_volume.jetstream[*].id
}

output "config" {
  description = "NATS configuration values for downstream services"
  value = {
    url               = "nats://gtcx-nats:${local.nats_port}"
    cluster_size      = var.cluster_size
    max_payload_kb    = var.max_payload_kb
    retention_days    = var.retention_days
    jetstream_enabled = true
  }
}
