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
    kubectl = {
      source  = "gavinbunney/kubectl"
      version = ">= 1.14"
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

variable "apex_domain" {
  description = "Apex (root) domain managed by the public hosted zone. Subdomain (e.g. staging) is derived from environment."
  type        = string
  default     = "gtcx.trade"
}

variable "dns_hostnames" {
  description = "Hostname labels (under <environment>.<apex>) for which to create A (ALIAS) records pointing at the ALB. Defaults match the existing staging Ingress."
  type        = list(string)
  default     = ["api", "geotag"]
}

variable "alb_dns_name" {
  description = "DNS name of the ALB created by the AWS Load Balancer Controller. Empty on first apply (before Ingress deploys); set after kubectl applies the staging Ingress and the ALB exists. See INF-49 runbook."
  type        = string
  default     = ""
}

variable "alb_hosted_zone_id" {
  description = "Hosted zone ID of the ALB. af-south-1: Z268VQBMOI5EKX. Set together with alb_dns_name."
  type        = string
  default     = ""
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

data "aws_eks_cluster" "main" {
  name = module.eks.cluster_name
}

data "aws_eks_cluster_auth" "main" {
  name = module.eks.cluster_name
}

provider "helm" {
  kubernetes {
    host                   = data.aws_eks_cluster.main.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.main.certificate_authority[0].data)
    token                  = data.aws_eks_cluster_auth.main.token
  }
}

provider "kubectl" {
  host                   = data.aws_eks_cluster.main.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.main.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.main.token
  load_config_file       = false
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

  environment                = var.environment
  region                     = var.region
  vpc_id                     = module.vpc.vpc_id
  private_subnet_ids         = module.vpc.private_subnet_ids
  public_subnet_ids          = module.vpc.public_subnet_ids
  node_instance_types        = var.eks_node_instance_types
  node_desired_size          = var.eks_node_desired_size
  node_min_size              = var.eks_node_min_size
  node_max_size              = var.eks_node_max_size
  enable_public_access       = var.enable_public_api
  allowed_cidr_blocks        = var.admin_cidr_blocks
  database_security_group_id = module.database.security_group_id
  enable_database_access     = true

  tags = merge(var.tags, {
    Environment = "staging"
  })
}

# -----------------------------------------------------------------------------
# ALB Controller + ACM + WAF
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
  rate_limit             = 500 # 100/min for staging (TradePass Wire #2 §10.1)

  tags = merge(var.tags, {
    Environment = "staging"
  })
}

# -----------------------------------------------------------------------------
# Route53 — DNS for staging hostnames + ACM cert validation
# -----------------------------------------------------------------------------
# Unblocks gtcx-infrastructure#49 (INF-49): authority DID resolution at
#   api.staging.gtcx.trade and geotag.staging.gtcx.trade requires public
#   DNS records pointing at the ALB created by the K8s Ingress.
#
# First apply (before staging Ingress exists): leave alb_dns_name = "" so
#   only ACM validation records are managed. ACM cert validation completes;
#   the K8s Ingress can then be applied and the ALB created.
# Second apply (Ingress + ALB live): set alb_dns_name + alb_hosted_zone_id
#   from `kubectl get ingress -n gtcx-staging gtcx-api`. A records resolve.
#
# Long-term: replace the manual second-apply with external-dns inside the
# cluster. See docs/operations/runbooks/inf-49-staging-dns.md.

module "route53" {
  source = "../../modules/route53"

  environment            = var.environment
  apex_domain            = var.apex_domain
  subdomain              = "staging"
  hostnames              = var.dns_hostnames
  alb_dns_name           = var.alb_dns_name
  alb_zone_id            = var.alb_hosted_zone_id
  acm_validation_records = module.alb.certificate_domain_validation

  tags = merge(var.tags, {
    Environment = "staging"
    Purpose     = "inf-49-did-resolution"
  })
}

# -----------------------------------------------------------------------------
# CI/CD Shared Deploy Role
# -----------------------------------------------------------------------------

module "ci" {
  source = "../../modules/ci"

  environment             = var.environment
  repository_pattern      = "repo:gtcx-ecosystem/*:ref:refs/heads/main"
  create_oidc_provider    = true
  enable_broad_ecr_access = true

  tags = merge(var.tags, {
    Environment = "staging"
  })
}

# -----------------------------------------------------------------------------
# EKS Access Entry — Grant CI deploy role Kubernetes API access
# -----------------------------------------------------------------------------
# The CI deploy role has eks:DescribeCluster for kubeconfig, but also needs
# an EKS Access Entry to authenticate to the Kubernetes API server.
# Without this, kubectl apply fails with "server has asked for credentials".
# -----------------------------------------------------------------------------

resource "aws_eks_access_entry" "ci_deploy" {
  cluster_name  = module.eks.cluster_name
  principal_arn = module.ci.deploy_role_arn
  type          = "STANDARD"
}

resource "aws_eks_access_policy_association" "ci_deploy_admin" {
  cluster_name  = module.eks.cluster_name
  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
  principal_arn = module.ci.deploy_role_arn

  access_scope {
    type = "cluster"
  }

  depends_on = [aws_eks_access_entry.ci_deploy]
}

# -----------------------------------------------------------------------------
# WAF Module
# -----------------------------------------------------------------------------

module "waf" {
  source = "../../modules/waf"

  name_prefix = "gtcx-staging"
  scope       = "REGIONAL"
  rate_limit  = 500 # 100/min for staging (TradePass Wire #2 §10.1)
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
# WORM Audit Storage Module
# -----------------------------------------------------------------------------

module "worm_audit" {
  source = "../../modules/worm-audit"

  environment    = var.environment
  retention_days = 2557

  tags = merge(var.tags, {
    Environment = "staging"
  })
}

module "audit_flush_irsa" {
  source = "../../modules/audit-flush-irsa"

  environment       = var.environment
  oidc_provider_arn = module.eks.oidc_provider_arn
  oidc_provider_url = replace(module.eks.oidc_provider_url, "https://", "")
  worm_bucket_arn   = module.worm_audit.bucket_arn
  worm_kms_key_arn  = module.worm_audit.kms_key_arn

  tags = merge(var.tags, {
    Environment = "staging"
    Component   = "audit-flush"
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

output "audit_flush_role_arn" {
  description = "IAM role ARN to annotate the audit-flush ServiceAccount with"
  value       = module.audit_flush_irsa.role_arn
}

output "acm_certificate_arn" {
  description = "ACM certificate ARN for HTTPS ingress"
  value       = module.alb.certificate_arn
}

output "alb_waf_acl_arn" {
  description = "WAF Web ACL ARN for ALB protection"
  value       = module.alb.waf_web_acl_arn
}

output "route53_zone_id" {
  description = "Hosted zone ID for the apex domain"
  value       = module.route53.zone_id
}

output "route53_hostnames" {
  description = "FQDNs managed by the staging route53 module — these are the URLs the gtcx-protocols DID resolver must be reachable at"
  value       = module.route53.hostname_fqdns
}

output "route53_a_records_created" {
  description = "Whether DNS A records are wired (false on first apply before the ALB exists)"
  value       = module.route53.a_records_created
}
