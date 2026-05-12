# =============================================================================
# GTCX Staging Environment
# =============================================================================
# Pre-production environment for integration testing, pen-tests, and
# chaos engineering experiments.
#
# Sizing: Between testnet-pilot and zimbabwe-pilot.
#   - 2 EKS nodes (vs 1 testnet, 3 production)
#   - db.t3.small RDS (vs micro testnet, medium production)
#   - Same region: af-south-1 (Cape Town)
#
# Principles:
#   - TESTED (P29): Runs full integration suite before production promotion
#   - SECURE (P11): TLS-only, WAF, NetworkPolicies
#   - RESILIENT (P12): Multi-AZ, HPA, PDB
#
# Usage:
#   terraform init
#   terraform plan -var-file=terraform.tfvars
#   terraform apply -var-file=terraform.tfvars
# =============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.12"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.25"
    }
    vault = {
      source  = "hashicorp/vault"
      version = "~> 4.2"
    }
  }

  backend "s3" {
    bucket         = "gtcx-terraform-state-staging"
    key            = "environments/staging/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "gtcx-terraform-locks-staging"
  }
}

provider "aws" {
  region            = var.region
  use_fips_endpoint = contains(["us-east-1", "us-east-2", "us-west-1", "us-west-2", "us-gov-west-1", "us-gov-east-1"], var.region)

  default_tags {
    tags = merge(var.tags, {
      Project     = "gtcx"
      Environment = "staging"
      ManagedBy   = "terraform"
    })
  }
}

# -----------------------------------------------------------------------------
# Variables
# -----------------------------------------------------------------------------

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "staging"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "af-south-1"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["af-south-1a", "af-south-1b", "af-south-1c"]
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.3.0.0/16"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.small"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage (GB)"
  type        = number
  default     = 50
}

variable "eks_node_instance_types" {
  description = "EKS node instance types"
  type        = list(string)
  default     = ["t3.small"]
}

variable "eks_node_desired_size" {
  description = "EKS node desired size"
  type        = number
  default     = 2
}

variable "eks_node_min_size" {
  description = "EKS node minimum size"
  type        = number
  default     = 2
}

variable "eks_node_max_size" {
  description = "EKS node maximum size"
  type        = number
  default     = 4
}

variable "enable_public_api" {
  description = "Enable public EKS API endpoint"
  type        = bool
  default     = true
}

variable "admin_cidr_blocks" {
  description = "Admin CIDR blocks for EKS API access"
  type        = list(string)
  default     = []
}

variable "domain_name" {
  description = "Domain name for ACM certificate"
  type        = string
  default     = "gtcx.trade"
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}

# -----------------------------------------------------------------------------
# Data sources
# -----------------------------------------------------------------------------

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# -----------------------------------------------------------------------------
# VPC Module
# -----------------------------------------------------------------------------

module "vpc" {
  source = "../../modules/vpc"

  environment        = var.environment
  region             = var.region
  availability_zones = var.availability_zones
  cidr_block         = var.vpc_cidr

  tags = merge(var.tags, {
    Environment = "staging"
  })
}

# -----------------------------------------------------------------------------
# Database Module
# -----------------------------------------------------------------------------

module "database" {
  source = "../../modules/database"

  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  subnet_ids        = module.vpc.database_subnet_ids
  instance_class    = var.db_instance_class
  allocated_storage = var.db_allocated_storage

  tags = merge(var.tags, {
    Environment = "staging"
  })
}

# -----------------------------------------------------------------------------
# EKS Module
# -----------------------------------------------------------------------------

module "eks" {
  source = "../../modules/eks"

  environment             = var.environment
  region                  = var.region
  vpc_id                  = module.vpc.vpc_id
  private_subnet_ids      = module.vpc.private_subnet_ids
  public_subnet_ids       = module.vpc.public_subnet_ids
  node_instance_types     = var.eks_node_instance_types
  node_desired_size       = var.eks_node_desired_size
  node_min_size           = var.eks_node_min_size
  node_max_size           = var.eks_node_max_size
  enable_public_access    = var.enable_public_api
  allowed_cidr_blocks     = var.admin_cidr_blocks
  database_security_group_id = module.database.security_group_id
  enable_database_access  = true

  tags = merge(var.tags, {
    Environment = "staging"
  })
}

# -----------------------------------------------------------------------------
# CI/CD Shared Deploy Role
# -----------------------------------------------------------------------------

module "ci" {
  source = "../../modules/ci"

  environment           = var.environment
  repository_pattern    = "repo:gtcx-ecosystem/*:ref:refs/heads/main"
  create_oidc_provider  = true
  enable_broad_ecr_access = true

  tags = merge(var.tags, {
    Environment = "staging"
  })
}

# -----------------------------------------------------------------------------
# WAF Module
# -----------------------------------------------------------------------------

module "waf" {
  source = "../../modules/waf"

  name_prefix = "gtcx-staging"
  scope       = "REGIONAL"
  rate_limit  = 2000
  aws_region  = var.region
}

# -----------------------------------------------------------------------------
# VPC Flow Logs Module
# -----------------------------------------------------------------------------

module "flow_logs" {
  source = "../../modules/flow-logs"

  vpc_id             = module.vpc.vpc_id
  traffic_type       = "ALL"
  log_retention_days = 365
  name_prefix        = "gtcx-staging"
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = module.database.operational_endpoint
  sensitive   = true
}

output "rds_audit_endpoint" {
  description = "RDS audit endpoint"
  value       = module.database.audit_endpoint
  sensitive   = true
}

output "deploy_role_arn" {
  description = "Shared GitHub Actions deploy role ARN"
  value       = module.ci.deploy_role_arn
}

output "github_oidc_provider_arn" {
  description = "GitHub OIDC provider ARN"
  value       = module.ci.github_oidc_provider_arn
}

output "waf_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = module.waf.web_acl_arn
}

output "waf_acl_id" {
  description = "WAF Web ACL ID"
  value       = module.waf.web_acl_id
}

output "flow_log_cloudwatch_log_group" {
  description = "VPC Flow Logs CloudWatch Log Group"
  value       = module.flow_logs.cloudwatch_log_group_arn
}

output "flow_log_id" {
  description = "VPC Flow Log ID"
  value       = module.flow_logs.flow_log_id
}
