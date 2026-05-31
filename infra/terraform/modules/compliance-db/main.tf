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
  # ---------------------------------------------------------------------------
  # Jurisdiction Configuration — Regulatory Knowledge as Code
  # ---------------------------------------------------------------------------
  # Each preset encodes: AWS region, KYC retention, audit retention, regulator,
  # data protection authority, data protection law, and cross-border rules.
  #
  # Sources: central bank circulars, data protection acts, FATF mutual
  # evaluation reports, and direct regulatory engagement.
  #
  # Phase 1: Big 8 (covers ~85% of African fintech + gov activity)
  # Phase 2: Francophone + regional blocs (WAEMU, CEMAC, EAC)
  # ---------------------------------------------------------------------------

  jurisdiction_config = {
    # =========================================================================
    # PHASE 1 — Big 8
    # =========================================================================

    zimbabwe = {
      region                    = "af-south-1"
      kyc_retention_days        = 1825 # 5 years — FATF baseline, RBZ AML/CFT regs
      audit_retention_days      = 2555 # 7 years — Companies and Other Business Entities Act
      regulator                 = "RBZ"
      regulator_full            = "Reserve Bank of Zimbabwe"
      data_protection_law       = "Cyber and Data Protection Act (2021)"
      data_protection_authority = "Postal and Telecommunications Regulatory Authority (POTRAZ)"
      cross_border_allowed      = true
      cross_border_conditions   = "Adequate safeguards required, POTRAZ notification"
      notes                     = "ZWCMP compliance for mobile money. RBZ National Payment Systems regulations."
    }

    south_africa = {
      region                    = "af-south-1"
      kyc_retention_days        = 1825 # 5 years — FICA §22
      audit_retention_days      = 2555 # 7 years — Companies Act §24
      regulator                 = "SARB"
      regulator_full            = "South African Reserve Bank"
      data_protection_law       = "Protection of Personal Information Act (POPIA, 2013)"
      data_protection_authority = "Information Regulator"
      cross_border_allowed      = true
      cross_border_conditions   = "Consent or adequate jurisdiction (POPIA §72). Binding corporate rules accepted."
      notes                     = "FSCA regulates markets. FIC handles AML. Most mature regulatory framework on the continent."
    }

    nigeria = {
      region                    = "af-south-1"
      kyc_retention_days        = 2190 # 6 years — CBN AML/CFT Regulation §18
      audit_retention_days      = 2555 # 7 years — CAMA 2020
      regulator                 = "CBN"
      regulator_full            = "Central Bank of Nigeria"
      data_protection_law       = "Nigeria Data Protection Act (NDPA, 2023)"
      data_protection_authority = "Nigeria Data Protection Commission (NDPC)"
      cross_border_allowed      = true
      cross_border_conditions   = "Adequacy assessment or NDPC approval. CBN requires African data residency for financial data."
      notes                     = "Largest fintech market in Africa. CBN licensing framework for PSPs, MMOs, and switching companies."
    }

    egypt = {
      region                    = "me-south-1"
      kyc_retention_days        = 1825 # 5 years — AML Law No. 80/2002
      audit_retention_days      = 3650 # 10 years — Egyptian Commercial Code
      regulator                 = "CBE"
      regulator_full            = "Central Bank of Egypt"
      data_protection_law       = "Personal Data Protection Law No. 151 (2020)"
      data_protection_authority = "Data Protection Center (under Ministry of Communications)"
      cross_border_allowed      = true
      cross_border_conditions   = "DPC approval required. Financial data must remain accessible to CBE."
      notes                     = "me-south-1 (Bahrain) is closest. FRA regulates non-banking financial services. Growing fintech licensing."
    }

    kenya = {
      region                    = "af-south-1"
      kyc_retention_days        = 1825 # 5 years — Proceeds of Crime and AML Act §47
      audit_retention_days      = 2555 # 7 years — Companies Act
      regulator                 = "CBK"
      regulator_full            = "Central Bank of Kenya"
      data_protection_law       = "Data Protection Act (DPA, 2019)"
      data_protection_authority = "Office of the Data Protection Commissioner (ODPC)"
      cross_border_allowed      = true
      cross_border_conditions   = "Adequate safeguards proven to ODPC. Data sovereignty not strictly required but CBK preference."
      notes                     = "M-Pesa market. CBK Payment Service Providers Regulations 2014. CMA regulates securities."
    }

    ghana = {
      region                    = "eu-west-1"
      kyc_retention_days        = 1825 # 5 years — AML Act 2020
      audit_retention_days      = 2555 # 7 years — Companies Act
      regulator                 = "BoG"
      regulator_full            = "Bank of Ghana"
      data_protection_law       = "Data Protection Act (Act 843, 2012)"
      data_protection_authority = "Data Protection Commission"
      cross_border_allowed      = true
      cross_border_conditions   = "DPC registration required. BoG allows EU-hosted infrastructure for financial data."
      notes                     = "BoG Payment Systems and Services Act 2019. E-money issuer licensing. eu-west-1 permitted."
    }

    tanzania = {
      region                    = "af-south-1"
      kyc_retention_days        = 1825 # 5 years — AML Act 2006 (amended 2022)
      audit_retention_days      = 2555 # 7 years — Tanzania Revenue Authority requirements
      regulator                 = "BoT"
      regulator_full            = "Bank of Tanzania"
      data_protection_law       = "Personal Data Protection Act (draft, expected 2025)"
      data_protection_authority = "Tanzania Communications Regulatory Authority (TCRA) (interim)"
      cross_border_allowed      = true
      cross_border_conditions   = "No formal restrictions yet. BoT prefers regional data residency."
      notes                     = "National Payment Systems Act 2015. TCRA licenses mobile money. Data protection law pending."
    }

    rwanda = {
      region                    = "af-south-1"
      kyc_retention_days        = 1825 # 5 years — AML/CFT Law (2021)
      audit_retention_days      = 2555 # 7 years
      regulator                 = "BNR"
      regulator_full            = "National Bank of Rwanda"
      data_protection_law       = "Law Relating to the Protection of Personal Data and Privacy (Law N° 058/2021)"
      data_protection_authority = "National Cyber Security Authority (NCSA)"
      cross_border_allowed      = true
      cross_border_conditions   = "NCSA authorization required for transfers outside Rwanda."
      notes                     = "Kigali International Financial Centre. BNR fintech sandbox. iRembo digital services platform."
    }

    # =========================================================================
    # PHASE 2 — Regional Blocs (one preset covers multiple countries)
    # =========================================================================

    # WAEMU: Benin, Burkina Faso, Cote d'Ivoire, Guinea-Bissau, Mali, Niger, Senegal, Togo
    waemu = {
      region                    = "eu-west-3"
      kyc_retention_days        = 1825 # 5 years — BCEAO Instruction 01/2017
      audit_retention_days      = 3650 # 10 years — OHADA Uniform Act
      regulator                 = "BCEAO"
      regulator_full            = "Banque Centrale des États de l'Afrique de l'Ouest"
      data_protection_law       = "Varies by country (Senegal: Loi 2008-12, Cote d'Ivoire: Loi 2013-450)"
      data_protection_authority = "Varies (Senegal: CDP, Cote d'Ivoire: ARTCI)"
      cross_border_allowed      = true
      cross_border_conditions   = "Free flow within WAEMU zone. External transfers require national DPA approval."
      notes                     = "Single central bank for 8 countries. eu-west-3 (Paris) for cultural and regulatory alignment. CFA franc zone."
    }

    # EAC: Kenya, Tanzania, Uganda, Rwanda, Burundi, South Sudan, DRC
    eac = {
      region                    = "af-south-1"
      kyc_retention_days        = 1825 # 5 years — member state AML baselines
      audit_retention_days      = 2555 # 7 years — regional integration framework
      regulator                 = "EAC member central banks"
      regulator_full            = "East African Community"
      data_protection_law       = "EAC Cyber Laws Framework (2008)"
      data_protection_authority = "Member state authorities"
      cross_border_allowed      = true
      cross_border_conditions   = "EAC Financial Integration Framework facilitates cross-border data flows."
      notes                     = "Regional bloc preset. Individual member state laws take precedence."
    }

    # CEMAC: Cameroon, CAR, Chad, Congo, Equatorial Guinea, Gabon
    cemac = {
      region                    = "eu-west-3"
      kyc_retention_days        = 1825 # 5 years — COBAC regulations
      audit_retention_days      = 3650 # 10 years — OHADA Uniform Act
      regulator                 = "BEAC"
      regulator_full            = "Banque des États de l'Afrique Centrale"
      data_protection_law       = "Varies by country (Cameroon: Law 2010/012)"
      data_protection_authority = "Varies (Cameroon: Ministry of Posts and Telecommunications)"
      cross_border_allowed      = true
      cross_border_conditions   = "Free flow within CEMAC zone. External transfers per national law."
      notes                     = "Single central bank for 6 countries. COBAC is the banking commission. CFA franc (XAF) zone."
    }

    generic = {
      region                    = "af-south-1"
      kyc_retention_days        = 1825
      audit_retention_days      = 2555
      regulator                 = ""
      regulator_full            = ""
      data_protection_law       = ""
      data_protection_authority = ""
      cross_border_allowed      = true
      cross_border_conditions   = ""
      notes                     = "Generic preset — uses FATF baseline. Override kyc_retention_days and region as needed."
    }
  }

  # Resolve effective config for the selected jurisdiction
  config           = local.jurisdiction_config[var.jurisdiction]
  effective_region = var.jurisdiction == "generic" ? var.region : local.config.region

  # Use jurisdiction-specific KYC retention unless explicitly overridden
  effective_kyc_retention = var.kyc_retention_days_override != null ? var.kyc_retention_days_override : local.config.kyc_retention_days
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
  document_retention_days  = local.effective_kyc_retention

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

output "jurisdiction_metadata" {
  description = "Regulatory metadata for the selected jurisdiction — regulator, data protection law, retention periods, cross-border rules"
  value = {
    jurisdiction              = var.jurisdiction
    region                    = local.effective_region
    regulator                 = local.config.regulator
    regulator_full            = local.config.regulator_full
    data_protection_law       = local.config.data_protection_law
    data_protection_authority = local.config.data_protection_authority
    kyc_retention_days        = local.effective_kyc_retention
    audit_retention_days      = local.config.audit_retention_days
    cross_border_allowed      = local.config.cross_border_allowed
    cross_border_conditions   = local.config.cross_border_conditions
    notes                     = local.config.notes
  }
}
