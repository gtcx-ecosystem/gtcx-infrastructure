# =============================================================================
# GTCX Zimbabwe Pilot Environment
# =============================================================================
# First deployment: ZWCMP — 200+ licensed female mine operators.
# Region: af-south-1 (Cape Town) — closest AWS region to Zimbabwe (~30ms).
#
# Principles:
#   - SOVEREIGN (6): Zimbabwe data stays in Africa
#   - DEPLOYABLE (14): Reproducible from this file
#   - AUDITABLE (3): Dual database (operational + audit)
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
  }

  # Per SOVEREIGN (6): State stored in-region alongside compute and data.
  # Migration from us-east-1: run infra/scripts/migrate-state.sh
  backend "s3" {
    bucket         = "gtcx-terraform-state-zimbabwe-pilot"
    key            = "environments/zimbabwe-pilot/terraform.tfstate"
    region         = "af-south-1"
    encrypt        = true
    dynamodb_table = "gtcx-terraform-locks-zimbabwe-pilot"
  }
}

# -----------------------------------------------------------------------------
# Variables
# -----------------------------------------------------------------------------

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "zimbabwe-pilot"
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
  default     = "10.1.0.0/16"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "Database storage in GB"
  type        = number
  default     = 100
}

variable "eks_node_instance_types" {
  description = "EKS worker node instance types"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "eks_node_desired_size" {
  description = "Desired worker node count"
  type        = number
  default     = 2
}

variable "eks_node_min_size" {
  description = "Minimum worker node count"
  type        = number
  default     = 1
}

variable "eks_node_max_size" {
  description = "Maximum worker node count"
  type        = number
  default     = 5
}

variable "enable_public_api" {
  description = "Enable public EKS API endpoint (for initial setup; disable in production)"
  type        = bool
  default     = true
}

variable "admin_cidr_blocks" {
  description = "CIDR blocks allowed to access EKS API when enable_public_api is true. Must be non-empty when enabling public access — open 0.0.0.0/0 is not permitted."
  type        = list(string)
  default     = []
}

variable "domain_name" {
  description = "Domain name for ACM certificate (e.g., api.gtcx.trade). Leave empty to skip."
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}

# -----------------------------------------------------------------------------
# Provider
# -----------------------------------------------------------------------------

provider "aws" {
  region            = var.region
  use_fips_endpoint = contains(["us-east-1", "us-east-2", "us-west-1", "us-west-2", "us-gov-west-1", "us-gov-east-1"], var.region)

  default_tags {
    tags = merge(var.tags, {
      Project     = "gtcx"
      Environment = var.environment
      ManagedBy   = "terraform"
      Deployment  = "ZWCMP"
    })
  }
}

data "aws_eks_cluster" "main" {
  name = "gtcx-${var.environment}"
}

provider "kubernetes" {
  host                   = data.aws_eks_cluster.main.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.main.certificate_authority[0].data)
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = ["eks", "get-token", "--cluster-name", "gtcx-${var.environment}", "--region", var.region]
  }
}

provider "helm" {
  kubernetes {
    host                   = data.aws_eks_cluster.main.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.main.certificate_authority[0].data)
    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args        = ["eks", "get-token", "--cluster-name", "gtcx-${var.environment}", "--region", var.region]
    }
  }
}

# -----------------------------------------------------------------------------
# Networking
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

# -----------------------------------------------------------------------------
# Databases (Operational + Audit)
# -----------------------------------------------------------------------------

module "database" {
  source = "../../modules/database"

  environment             = var.environment
  vpc_id                  = module.vpc.vpc_id
  subnet_ids              = module.vpc.database_subnet_ids
  instance_class          = var.db_instance_class
  allocated_storage       = var.db_allocated_storage
  multi_az                = false # pilot — flip to true for production
  backup_retention_period = 30
  deletion_protection     = false # pilot — flip to true for production
  allowed_security_groups = [module.eks.node_security_group_id]

  tags = var.tags
}

# -----------------------------------------------------------------------------
# Event Bus (NATS with JetStream)
# -----------------------------------------------------------------------------

module "event_bus" {
  source = "../../modules/event-bus"

  environment             = var.environment
  vpc_id                  = module.vpc.vpc_id
  subnet_ids              = module.vpc.private_subnet_ids
  availability_zones      = var.availability_zones
  cluster_size            = 1 # pilot — increase to 3 for production HA
  jetstream_storage_gb    = 10
  retention_days          = 90
  allowed_security_groups = [module.eks.node_security_group_id]

  tags = var.tags
}

# -----------------------------------------------------------------------------
# Container Registry
# -----------------------------------------------------------------------------

module "ecr" {
  source = "../../modules/ecr"

  environment = var.environment

  tags = var.tags
}

# -----------------------------------------------------------------------------
# Kubernetes Cluster
# -----------------------------------------------------------------------------

module "eks" {
  source = "../../modules/eks"

  environment        = var.environment
  region             = var.region
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  public_subnet_ids  = module.vpc.public_subnet_ids

  cluster_version     = "1.31"
  node_instance_types = var.eks_node_instance_types
  node_desired_size   = var.eks_node_desired_size
  node_min_size       = var.eks_node_min_size
  node_max_size       = var.eks_node_max_size

  enable_public_access       = var.enable_public_api
  allowed_cidr_blocks        = var.admin_cidr_blocks
  database_security_group_id = module.database.security_group_id
  enable_database_access     = true

  tags = var.tags
}

# -----------------------------------------------------------------------------
# ALB Controller (AWS Load Balancer Controller + ACM)
# -----------------------------------------------------------------------------

module "alb" {
  source = "../../modules/alb"

  environment            = var.environment
  cluster_name           = module.eks.cluster_name
  cluster_endpoint       = module.eks.cluster_endpoint
  cluster_ca_certificate = module.eks.cluster_ca_certificate
  oidc_provider_arn      = module.eks.oidc_provider_arn
  vpc_id                 = module.vpc.vpc_id
  domain_name            = var.domain_name

  tags = var.tags
}

# -----------------------------------------------------------------------------
# KYC Document Storage (presigned PUT, SSE-KMS, IRSA)
# -----------------------------------------------------------------------------

module "kyc_documents" {
  source = "../../modules/kyc-documents"

  environment              = var.environment
  region                   = var.region
  eks_oidc_provider_arn    = module.eks.oidc_provider_arn
  eks_oidc_provider_url    = replace(module.eks.oidc_provider_url, "https://", "")
  platform_namespace       = "default"
  platform_service_account = "gtcx-platform"
  document_retention_days  = 1825 # 5 years — FATF minimum

  tags = var.tags
}

# -----------------------------------------------------------------------------
# Audit Backup (S3 export + 7-year retention)
# -----------------------------------------------------------------------------

module "backup" {
  source        = "../../modules/backup"
  environment   = var.environment
  region        = var.region
  db_identifier = module.database.audit_db_identifier
  tags          = var.tags
}

# -----------------------------------------------------------------------------
# CI/CD — GitHub Actions OIDC + Deploy Role
# -----------------------------------------------------------------------------

module "ci" {
  source = "../../modules/ci"

  environment         = var.environment
  github_org          = "gtcx-ecosystem"
  github_repo         = "gtcx-infrastructure"
  ecr_repository_arns = module.ecr.repository_arns

  tags = var.tags
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
  description = "EKS cluster API endpoint"
  value       = module.eks.cluster_endpoint
}

output "database_endpoints" {
  description = "Database endpoints"
  value = {
    operational = module.database.operational_endpoint
    audit       = module.database.audit_endpoint
  }
  sensitive = true
}

output "ecr_repository_urls" {
  description = "ECR repository URLs"
  value       = module.ecr.repository_urls
}

output "nats_connection_url" {
  description = "NATS event bus connection URL"
  value       = module.event_bus.connection_url
}

output "nats_security_group_id" {
  description = "NATS security group ID"
  value       = module.event_bus.security_group_id
}

output "alb_controller_role_arn" {
  description = "ALB controller IAM role ARN"
  value       = module.alb.controller_role_arn
}

output "kyc_documents_bucket" {
  description = "KYC documents S3 bucket name — set as KYC_DOCUMENTS_BUCKET on platform pods"
  value       = module.kyc_documents.bucket_name
}

output "kyc_documents_irsa_role_arn" {
  description = "IRSA role ARN — annotate gtcx-platform service account with eks.amazonaws.com/role-arn"
  value       = module.kyc_documents.irsa_role_arn
}

output "acm_certificate_arn" {
  description = "ACM certificate ARN for HTTPS"
  value       = module.alb.certificate_arn
}

output "db_master_secret_arns" {
  description = "RDS master password secret ARNs — retrieve with: aws secretsmanager get-secret-value --secret-id <arn>"
  value = {
    operational = module.database.operational_master_secret_arn
    audit       = module.database.audit_master_secret_arn
  }
}

output "kubeconfig_command" {
  description = "Command to configure kubectl"
  value       = "aws eks update-kubeconfig --name ${module.eks.cluster_name} --region ${var.region}"
}

output "github_deploy_role_arn" {
  description = "IAM role ARN for GitHub Actions — set as AWS_DEPLOY_ROLE_ARN secret in GitHub"
  value       = module.ci.deploy_role_arn
}
