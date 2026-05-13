# =============================================================================
# GTCX Production Environment
# =============================================================================
# Live environment for all protocol traffic.
#
# DEPLOYMENT CHECKLIST:
#   1. Backend bucket and lock table must exist (see bootstrap.sh)
#   2. Review terraform.tfvars before every apply
#   3. Never apply without -out plan file and second-person review
#   4. Require approval ticket in commit message
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
    bucket         = "gtcx-terraform-state-production"
    key            = "environments/production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "gtcx-terraform-locks-production"
  }
}

provider "aws" {
  region            = var.region
  use_fips_endpoint = contains(["us-east-1", "us-east-2", "us-west-1", "us-west-2", "us-gov-west-1", "us-gov-east-1"], var.region)

  default_tags {
    tags = merge(var.tags, {
      Project     = "gtcx"
      Environment = "production"
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
  default     = "production"
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
  default     = "10.4.0.0/16"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 100
}

variable "eks_node_instance_types" {
  description = "EKS node instance types"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "eks_node_desired_size" {
  description = "EKS node desired size"
  type        = number
  default     = 3
}

variable "eks_node_min_size" {
  description = "EKS node minimum size"
  type        = number
  default     = 3
}

variable "eks_node_max_size" {
  description = "EKS node maximum size"
  type        = number
  default     = 6
}

variable "enable_public_api" {
  description = "Enable public EKS API endpoint"
  type        = bool
  default     = false
}

variable "admin_cidr_blocks" {
  description = "CIDR blocks allowed for admin access"
  type        = list(string)
  default     = []
}

variable "domain_name" {
  description = "Domain name for ACM certificate"
  type        = string
  default     = "gtcx.trade"
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}

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
    Environment = "production"
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
    Environment = "production"
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
    Environment = "production"
  })
}

# -----------------------------------------------------------------------------
# CI/CD Shared Deploy Role
# -----------------------------------------------------------------------------

module "ci" {
  source = "../../modules/ci"

  environment           = var.environment
  repository_pattern    = "repo:gtcx-ecosystem/*:ref:refs/heads/main"
  create_oidc_provider  = false  # Already created by staging
  enable_broad_ecr_access = true

  tags = merge(var.tags, {
    Environment = "production"
  })
}

# -----------------------------------------------------------------------------
# WAF Module
# -----------------------------------------------------------------------------

module "waf" {
  source = "../../modules/waf"

  name_prefix = "gtcx-production"
  scope       = "REGIONAL"
  rate_limit  = 5000  # Higher than staging for production traffic
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
  name_prefix        = "gtcx-production"
}

# -----------------------------------------------------------------------------
# AWS Config Compliance Rules
# -----------------------------------------------------------------------------

module "config_rules" {
  source = "../../modules/config-rules"

  environment = var.environment

  tags = merge(var.tags, {
    Environment = "production"
  })
}

# -----------------------------------------------------------------------------
# WORM Audit Storage Module
# -----------------------------------------------------------------------------

module "worm_audit" {
  source = "../../modules/worm-audit"

  environment    = var.environment
  retention_days = 2557

  tags = merge(var.tags, {
    Environment = "production"
  })
}

# -----------------------------------------------------------------------------
# Detective Controls — CloudTrail + GuardDuty
# -----------------------------------------------------------------------------
# GuardDuty already enabled manually (detector e2cf...); set enable_guardduty
# = false to avoid conflict. CloudTrail is created by this module.
# -----------------------------------------------------------------------------

module "detective" {
  source = "../../modules/detective"

  environment      = var.environment
  region           = var.region
  enable_guardduty = false

  tags = merge(var.tags, {
    Environment = "production"
  })
}

# -----------------------------------------------------------------------------
# KMS Signing Keys — Asymmetric ECC_NIST_P256 for protocol signing
# -----------------------------------------------------------------------------
# Per SECURE (P11): FIPS 140-2 Level 2 validated HSM backing.
# Per AUDITABLE (P3): Every KMS API call logged via CloudTrail.
# -----------------------------------------------------------------------------

module "kms_signing" {
  source = "../../modules/kms-signing"

  environment            = var.environment
  signing_role_arns      = [module.irsa_platform.platforms_role_arn]
  admin_role_arns        = [module.ci.deploy_role_arn]
  alarm_sns_topic_arns   = [module.detective.security_alerts_topic_arn]
}

# -----------------------------------------------------------------------------
# IRSA — gtcx-platforms Service Account
# -----------------------------------------------------------------------------
# Allows gtcx-platforms pods in the gtcx namespace to assume AWS IAM roles
# and call KMS Sign for protocol signing operations.
# -----------------------------------------------------------------------------

module "irsa_platform" {
  source = "../../modules/irsa-platform"

  environment         = var.environment
  oidc_provider_arn   = module.eks.oidc_provider_arn
  oidc_provider_url   = replace(module.eks.oidc_provider_url, "https://", "")
  kms_signing_key_arn = "" # Attached below after kms_signing is created

  tags = merge(var.tags, {
    Environment = "production"
  })
}

# Attach KMS signing policy to platforms IRSA role after key exists
resource "aws_iam_role_policy" "platforms_kms" {
  name = "gtcx-production-platforms-kms-sign"
  role = module.irsa_platform.platforms_role_name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "AllowKmsSign"
      Effect = "Allow"
      Action = [
        "kms:Sign",
        "kms:GetPublicKey",
        "kms:DescribeKey",
      ]
      Resource = module.kms_signing.signing_key_arn
      Condition = {
        StringEquals = {
          "kms:SigningAlgorithm" = "ECDSA_SHA_256"
        }
      }
    }]
  })
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

output "worm_audit_bucket_name" {
  description = "WORM audit S3 bucket name"
  value       = module.worm_audit.bucket_name
}

output "worm_audit_bucket_arn" {
  description = "WORM audit S3 bucket ARN"
  value       = module.worm_audit.bucket_arn
}

output "worm_audit_kms_key_arn" {
  description = "WORM audit KMS key ARN"
  value       = module.worm_audit.kms_key_arn
}
