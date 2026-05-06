# =============================================================================
# GTCX Testnet Pilot Environment
# =============================================================================
# Protocol evaluation environment for bank and government tenants.
# Region: af-south-1 (Cape Town) — data stays in Africa.
#
# Sized for evaluation workloads, not production traffic.
# Mirrors zimbabwe-pilot module structure with smaller instances.
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
    bucket         = "gtcx-terraform-state-testnet-pilot"
    key            = "environments/testnet-pilot/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "gtcx-terraform-locks-testnet-pilot"
  }
}

# -----------------------------------------------------------------------------
# Variables
# -----------------------------------------------------------------------------

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "testnet-pilot"
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
  default     = "10.2.0.0/16"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Database storage in GB"
  type        = number
  default     = 20
}

variable "eks_node_instance_types" {
  description = "EKS worker node instance types"
  type        = list(string)
  default     = ["t3.small"]
}

variable "eks_node_desired_size" {
  description = "Desired worker node count"
  type        = number
  default     = 1
}

variable "eks_node_min_size" {
  description = "Minimum worker node count"
  type        = number
  default     = 1
}

variable "eks_node_max_size" {
  description = "Maximum worker node count"
  type        = number
  default     = 3
}

variable "enable_public_api" {
  description = "Enable public EKS API endpoint"
  type        = bool
  default     = true
}

variable "admin_cidr_blocks" {
  description = "CIDR blocks allowed to access EKS API when enable_public_api is true."
  type        = list(string)
  default     = []
}

variable "domain_name" {
  description = "Domain name for ACM certificate (e.g., gtcxprotocol.org). Leave empty to skip."
  type        = string
  default     = "gtcxprotocol.org"
}

variable "smoke_evidence_base_url" {
  description = "Canonical external base URL for deployment smoke evidence in this environment"
  type        = string
  default     = "https://api.testnet.gtcx.io"
}

variable "provider_failure_mode" {
  description = "Provider routing mode for degraded-mode evidence: normal, sandbox, or forced-failure"
  type        = string
  default     = "sandbox"
}

variable "provider_failure_target" {
  description = "Target provider to force-fail during degraded-mode evidence runs: anthropic, openai, comply-advantage, or all"
  type        = string
  default     = "all"
}

variable "vault_address" {
  description = "Vault server address (e.g., http://vault.vault:8200 for in-cluster)"
  type        = string
  default     = "http://vault.vault:8200"
}

variable "vault_token" {
  description = "Vault root or admin token for initial configuration"
  type        = string
  sensitive   = true
  default     = "not-configured"
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
  region = var.region

  default_tags {
    tags = merge(var.tags, {
      Project     = "gtcx"
      Environment = var.environment
      ManagedBy   = "terraform"
      Deployment  = "TESTNET"
    })
  }
}

data "aws_eks_cluster" "main" {
  name = "gtcx-${var.environment}"
}

# Vault provider — configured after Vault Helm release is deployed.
# Initial apply will deploy Vault. Subsequent applies configure engines.
# Set VAULT_ADDR and VAULT_TOKEN in environment for the vault provider.
provider "vault" {
  address          = var.vault_address
  token            = var.vault_token
  skip_child_token = true
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
  multi_az                = false
  backup_retention_period = 7
  deletion_protection     = false
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
  cluster_size            = 1
  jetstream_storage_gb    = 5
  retention_days          = 30
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
# Secrets (Secrets Manager + ESO + IRSA)
# -----------------------------------------------------------------------------

module "secrets" {
  source = "../../modules/secrets"

  environment           = var.environment
  eks_cluster_name      = module.eks.cluster_name
  eks_oidc_provider_arn = module.eks.oidc_provider_arn

  tags = var.tags
}

# -----------------------------------------------------------------------------
# Vault (Dynamic Credentials — SIGNAL L4)
# -----------------------------------------------------------------------------

module "vault" {
  source = "../../modules/vault"

  environment           = var.environment
  namespace             = "vault"
  replicas              = 1 # single replica for testnet (HA in production)
  storage_size_gb       = 5
  eks_oidc_provider_arn = module.eks.oidc_provider_arn
  eks_oidc_provider_url = replace(module.eks.oidc_provider_url, "https://", "")

  rds_endpoint                       = module.database.operational_endpoint
  rds_database_name                  = "gtcx_development"
  vault_db_admin_password_secret_arn = module.database.operational_master_secret_arn

  enable_pki = true

  k8s_auth_roles = {
    "intelligence-prod" = {
      bound_service_account_names      = ["intelligence"]
      bound_service_account_namespaces = ["intelligence"]
      token_ttl_seconds                = 3600
      token_policies                   = ["db-intelligence-prod", "pki-intelligence"]
    }
    "protocols-prod" = {
      bound_service_account_names      = ["gtcx-platform"]
      bound_service_account_namespaces = ["gtcx"]
      token_ttl_seconds                = 3600
      token_policies                   = ["db-protocols-prod"]
    }
  }

  db_roles = {
    "intelligence-prod" = {
      db_name = "operational"
      creation_statements = [
        "CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";",
      ]
      revocation_statements = ["DROP ROLE IF EXISTS \"{{name}}\";"]
      default_ttl_seconds   = 3600
      max_ttl_seconds       = 86400
    }
    "protocols-prod" = {
      db_name = "operational"
      creation_statements = [
        "CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";",
      ]
      revocation_statements = ["DROP ROLE IF EXISTS \"{{name}}\";"]
      default_ttl_seconds   = 3600
      max_ttl_seconds       = 86400
    }
  }

  pki_roles = {
    "intelligence" = {
      allowed_domains  = ["intelligence.svc.cluster.local", "gtcx.svc.cluster.local"]
      allow_subdomains = true
      max_ttl_hours    = 72
      key_type         = "ec"
      key_bits         = 256
    }
  }

  tags = var.tags
}

# -----------------------------------------------------------------------------
# ML Pipeline Storage (SIGNAL L5)
# -----------------------------------------------------------------------------

module "ml_pipeline" {
  source = "../../modules/ml-pipeline"

  environment           = var.environment
  region                = var.region
  dataset_bucket_name   = "gtcx-${var.environment}-intelligence-datasets"
  model_bucket_name     = "gtcx-${var.environment}-intelligence-models"
  registry_table_name   = "gtcx-${var.environment}-model-registry"
  eks_oidc_provider_arn = module.eks.oidc_provider_arn
  eks_oidc_provider_url = replace(module.eks.oidc_provider_url, "https://", "")

  tags = var.tags
}

# -----------------------------------------------------------------------------
# Trace Pipeline (SIGNAL L5)
# -----------------------------------------------------------------------------

module "trace_pipeline" {
  source = "../../modules/trace-pipeline"

  environment           = var.environment
  trace_bucket_name     = "gtcx-${var.environment}-intelligence-traces"
  queue_name            = "gtcx-${var.environment}-trace-events"
  eks_oidc_provider_arn = module.eks.oidc_provider_arn
  eks_oidc_provider_url = replace(module.eks.oidc_provider_url, "https://", "")

  tags = var.tags
}

# -----------------------------------------------------------------------------
# Workflow Orchestration — Argo Workflows (SIGNAL L5)
# -----------------------------------------------------------------------------

module "workflow_orchestration" {
  source = "../../modules/workflow-orchestration"

  environment                  = var.environment
  eks_oidc_provider_arn        = module.eks.oidc_provider_arn
  eks_oidc_provider_url        = replace(module.eks.oidc_provider_url, "https://", "")
  dataset_bucket_arn           = module.ml_pipeline.dataset_bucket_arn
  model_bucket_arn             = module.ml_pipeline.model_bucket_arn
  registry_table_arn           = module.ml_pipeline.registry_table_arn
  trace_queue_arn              = module.trace_pipeline.queue_arn
  ecr_repository_arns          = module.ecr.repository_arns
  enable_fine_tune_workflow    = false
  enable_red_team_workflow     = false
  enablement_evidence_manifest = ""
  curator_image                = "${module.ecr.repository_urls["gtcx-intelligence-sdk"]}:sha-manual-pin-required"
  trainer_image                = "${module.ecr.repository_urls["gtcx-intelligence-trainer"]}:sha-manual-pin-required"
  evaluator_image              = "${module.ecr.repository_urls["gtcx-intelligence-sdk"]}:sha-manual-pin-required"
  promoter_image               = "${module.ecr.repository_urls["gtcx-intelligence-sdk"]}:sha-manual-pin-required"
  red_team_image               = ""

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

output "alb_controller_role_arn" {
  description = "ALB controller IAM role ARN"
  value       = module.alb.controller_role_arn
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
  description = "IAM role ARN for GitHub Actions"
  value       = module.ci.deploy_role_arn
}

# -- L4/L5 Infrastructure

output "vault_namespace" {
  description = "Vault Kubernetes namespace"
  value       = module.vault.vault_namespace
}

output "ml_pipeline_dataset_bucket" {
  description = "ML pipeline dataset S3 bucket"
  value       = module.ml_pipeline.dataset_bucket_name
}

output "ml_pipeline_model_bucket" {
  description = "ML pipeline model S3 bucket"
  value       = module.ml_pipeline.model_bucket_name
}

output "ml_pipeline_registry_table" {
  description = "Model registry DynamoDB table"
  value       = module.ml_pipeline.registry_table_name
}

output "trace_pipeline_queue_url" {
  description = "SQS trace events queue URL"
  value       = module.trace_pipeline.queue_url
}

output "smoke_evidence_base_url" {
  description = "Canonical base URL for deployment smoke evidence"
  value       = var.smoke_evidence_base_url
}

output "provider_failure_mode" {
  description = "Configured provider routing mode for degraded-mode evidence"
  value       = var.provider_failure_mode
}

output "provider_failure_target" {
  description = "Configured provider failure target for degraded-mode evidence"
  value       = var.provider_failure_target
}

output "sandbox_secret_arns" {
  description = "Secrets Manager ARNs for sandbox provider credentials and provider-mode toggles"
  value = {
    anthropic_sandbox        = module.secrets.anthropic_sandbox_api_key_secret_arn
    openai_sandbox           = module.secrets.openai_sandbox_api_key_secret_arn
    comply_advantage_sandbox = module.secrets.comply_advantage_sandbox_api_key_secret_arn
    provider_mode            = module.secrets.provider_mode_secret_arn
    provider_failure_target  = module.secrets.provider_failure_target_secret_arn
  }
  sensitive = true
}

output "argo_workflows_namespace" {
  description = "Argo Workflows namespace"
  value       = module.workflow_orchestration.namespace
}
