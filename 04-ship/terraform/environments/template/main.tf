# =============================================================================
# GTCX Terraform Environment Template
# =============================================================================
# Copy this directory for each new deployment (e.g., ghana-pilot, kenya-prod)
#
# Principles Implemented:
#   - SOVEREIGN (6): Per-country infrastructure isolation
#   - DEPLOYABLE (14): Reproducible infrastructure
#   - DOCUMENTED (27): Clear configuration
#
# Usage:
#   1. Copy this directory: cp -r template ghana-pilot
#   2. Edit terraform.tfvars with country-specific values
#   3. Run: terraform init && terraform plan && terraform apply
# =============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend configuration — MUST be customized per environment.
  # terraform init will fail if CHANGE-ME values are not replaced.
  backend "s3" {
    bucket         = "CHANGE-ME-gtcx-terraform-state" # Required: unique bucket name
    key            = "CHANGE-ME/terraform.tfstate"    # Required: state file path
    region         = "CHANGE-ME"                      # Required: AWS region
    encrypt        = true
    dynamodb_table = "CHANGE-ME-terraform-locks" # Required: lock table name
  }
}

# -----------------------------------------------------------------------------
# Variables
# -----------------------------------------------------------------------------

variable "environment" {
  description = "Environment name (e.g., ghana-pilot, kenya-prod)"
  type        = string
}

variable "region" {
  description = "AWS region for deployment"
  type        = string
}

variable "availability_zones" {
  description = "Availability zones for high availability"
  type        = list(string)
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "Allocated storage for databases (GB)"
  type        = number
  default     = 100
}

variable "enable_multi_az" {
  description = "Enable Multi-AZ for high availability"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags for all resources"
  type        = map(string)
  default     = {}
}

# -----------------------------------------------------------------------------
# Provider Configuration
# -----------------------------------------------------------------------------

provider "aws" {
  region            = var.region
  use_fips_endpoint = true

  default_tags {
    tags = merge(var.tags, {
      Project     = "gtcx"
      Environment = var.environment
      ManagedBy   = "terraform"
    })
  }
}

# -----------------------------------------------------------------------------
# Modules
# -----------------------------------------------------------------------------

module "vpc" {
  source = "../../modules/vpc"

  environment        = var.environment
  region             = var.region
  cidr_block         = var.vpc_cidr
  availability_zones = var.availability_zones
  enable_nat_gateway = true
  enable_vpn_gateway = false

  tags = var.tags
}

module "database" {
  source = "../../modules/database"

  environment             = var.environment
  vpc_id                  = module.vpc.vpc_id
  subnet_ids              = module.vpc.database_subnet_ids
  instance_class          = var.db_instance_class
  allocated_storage       = var.db_allocated_storage
  multi_az                = var.enable_multi_az
  backup_retention_period = 30
  deletion_protection     = true
  allowed_security_groups = [] # Add EKS node security group

  tags = var.tags
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "database_endpoints" {
  description = "Database endpoints"
  value = {
    operational = module.database.operational_endpoint
    audit       = module.database.audit_endpoint
  }
  sensitive = true
}

output "private_subnet_ids" {
  description = "Private subnet IDs for EKS"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "Public subnet IDs for load balancers"
  value       = module.vpc.public_subnet_ids
}
