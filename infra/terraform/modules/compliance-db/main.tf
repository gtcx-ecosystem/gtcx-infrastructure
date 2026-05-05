# =============================================================================
# Compliance DB — Dual-Database Module for Regulated African Fintech
# =============================================================================
# Combines operational + audit databases, KYC document storage, and automated
# backup into a single deployable module with jurisdiction-aware defaults.
#
# Principles:
#   SOVEREIGN (6)  — data stays in-region, jurisdiction drives config
#   AUDITABLE (3)  — append-only audit DB, 7-year backup retention
#   SECURE (11)    — encryption everywhere, Secrets Manager passwords
#   DEPLOYABLE (14) — single terraform apply, no manual steps
# =============================================================================

locals {
  # Jurisdiction → region mapping (closest AWS region with data residency)
  jurisdiction_regions = {
    zimbabwe = "af-south-1" # Cape Town — closest to Harare
    kenya    = "af-south-1" # Cape Town — closest to Nairobi (no EA region yet)
    ghana    = "eu-west-1"  # Ireland — BoG allows EU hosting
    nigeria  = "af-south-1" # Cape Town — CBN requires African data residency
    tanzania = "af-south-1" # Cape Town — BoT compliance
    rwanda   = "af-south-1" # Cape Town — BNR fintech sandbox
    generic  = var.region
  }

  effective_region = lookup(local.jurisdiction_regions, var.jurisdiction, var.region)
}

# -----------------------------------------------------------------------------
# Operational Database
# -----------------------------------------------------------------------------

module "database" {
  source = "../database"

  environment             = var.environment
  vpc_id                  = var.vpc_id
  subnet_ids              = var.subnet_ids
  instance_class          = var.operational_instance_class
  allocated_storage       = var.operational_storage_gb
  multi_az                = var.multi_az
  backup_retention_period = var.backup_retention_days
  deletion_protection     = var.deletion_protection
  allowed_security_groups = var.allowed_security_groups

  tags = merge(var.tags, {
    Jurisdiction = var.jurisdiction
    Module       = "compliance-db"
  })
}

# -----------------------------------------------------------------------------
# Audit Backup (S3 export + 7-year retention)
# -----------------------------------------------------------------------------

module "backup" {
  source = "../backup"

  environment   = var.environment
  region        = local.effective_region
  db_identifier = module.database.audit_db_identifier

  tags = merge(var.tags, {
    Jurisdiction = var.jurisdiction
    Module       = "compliance-db"
  })
}

# -----------------------------------------------------------------------------
# KYC Document Storage (presigned PUT, SSE-KMS, IRSA)
# -----------------------------------------------------------------------------

module "kyc_documents" {
  count  = var.enable_kyc_storage ? 1 : 0
  source = "../kyc-documents"

  environment              = var.environment
  region                   = local.effective_region
  eks_oidc_provider_arn    = var.eks_oidc_provider_arn
  eks_oidc_provider_url    = var.eks_oidc_provider_url
  platform_namespace       = var.platform_namespace
  platform_service_account = var.platform_service_account
  document_retention_days  = var.kyc_retention_days

  tags = merge(var.tags, {
    Jurisdiction = var.jurisdiction
    Module       = "compliance-db"
  })
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "operational_endpoint" {
  description = "Operational database endpoint"
  value       = module.database.operational_endpoint
}

output "audit_endpoint" {
  description = "Audit database endpoint"
  value       = module.database.audit_endpoint
}

output "operational_secret_arn" {
  description = "ARN of operational DB master password in AWS Secrets Manager"
  value       = module.database.operational_master_secret_arn
}

output "audit_secret_arn" {
  description = "ARN of audit DB master password in AWS Secrets Manager"
  value       = module.database.audit_master_secret_arn
}

output "security_group_id" {
  description = "Database security group ID — allow from compute nodes"
  value       = module.database.security_group_id
}

output "backup_bucket" {
  description = "S3 bucket for audit snapshot exports (7-year retention)"
  value       = module.backup.backup_bucket_name
}

output "kyc_bucket_name" {
  description = "S3 bucket for KYC document storage"
  value       = var.enable_kyc_storage ? module.kyc_documents[0].bucket_name : ""
}

output "kyc_irsa_role_arn" {
  description = "IRSA role ARN for K8s service account — annotate with eks.amazonaws.com/role-arn"
  value       = var.enable_kyc_storage ? module.kyc_documents[0].irsa_role_arn : ""
}
