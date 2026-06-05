# terraform-aws-compliance-db

Compliance-ready dual-database infrastructure for regulated African fintech.

Deploys a dual PostgreSQL architecture (operational + append-only audit) with FATF-compliant KYC document storage, automated backups with 7-year Glacier retention, and encryption everywhere.

## What it creates

- **Operational Database** (RDS PostgreSQL) — read/write, auto-scaling storage, Multi-AZ optional
- **Audit Database** (RDS PostgreSQL) — append-only, deletion protection always enabled, extended backup retention
- **KYC Document Storage** (S3) — presigned URL access, KMS encryption, FATF-minimum 5-year retention, Glacier lifecycle
- **Backup Export** (Lambda + EventBridge) — monthly snapshot export to S3 with 7-year retention
- All resources encrypted at rest via KMS with auto-rotation

## Quick start

```hcl
module "compliance_db" {
  source = "./modules/compliance-db"

  environment  = "zimbabwe-pilot"
  jurisdiction = "zimbabwe"
  region       = "af-south-1"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.database_subnet_ids

  eks_oidc_provider_arn = module.eks.oidc_provider_arn
  eks_oidc_provider_url = module.eks.oidc_provider_url

  allowed_security_groups = [module.eks.node_security_group_id]
}
```

## Jurisdiction presets

### Phase 1 — Big 8 (~85% of African fintech volume)

| Jurisdiction   | Region     | KYC Retention  | Audit Retention | Regulator | Data Protection Law                         |
| -------------- | ---------- | -------------- | --------------- | --------- | ------------------------------------------- |
| `zimbabwe`     | af-south-1 | 1825 days (5y) | 2555 days (7y)  | RBZ       | Cyber and Data Protection Act (2021)        |
| `south_africa` | af-south-1 | 1825 days (5y) | 2555 days (7y)  | SARB      | POPIA (2013)                                |
| `nigeria`      | af-south-1 | 2190 days (6y) | 2555 days (7y)  | CBN       | NDPA (2023)                                 |
| `egypt`        | me-south-1 | 1825 days (5y) | 3650 days (10y) | CBE       | Personal Data Protection Law No. 151 (2020) |
| `kenya`        | af-south-1 | 1825 days (5y) | 2555 days (7y)  | CBK       | Data Protection Act (2019)                  |
| `ghana`        | eu-west-1  | 1825 days (5y) | 2555 days (7y)  | BoG       | Data Protection Act (Act 843, 2012)         |
| `tanzania`     | af-south-1 | 1825 days (5y) | 2555 days (7y)  | BoT       | Pending (TCRA interim)                      |
| `rwanda`       | af-south-1 | 1825 days (5y) | 2555 days (7y)  | BNR       | Law N° 058/2021                             |

### Phase 2 — Regional Blocs (covers 14 additional countries)

| Jurisdiction | Region     | Countries                                                                     | Regulator | Notes                                    |
| ------------ | ---------- | ----------------------------------------------------------------------------- | --------- | ---------------------------------------- |
| `waemu`      | eu-west-3  | Benin, Burkina Faso, Cote d'Ivoire, Guinea-Bissau, Mali, Niger, Senegal, Togo | BCEAO     | 10y audit (OHADA). CFA franc zone.       |
| `cemac`      | eu-west-3  | Cameroon, CAR, Chad, Congo, Equatorial Guinea, Gabon                          | BEAC      | 10y audit (OHADA). CFA franc (XAF) zone. |
| `eac`        | af-south-1 | Kenya, Tanzania, Uganda, Rwanda, Burundi, South Sudan, DRC                    | EAC CBs   | EAC Financial Integration Framework.     |

### Generic

| Jurisdiction | Region            | Notes                                        |
| ------------ | ----------------- | -------------------------------------------- |
| `generic`    | (from var.region) | FATF baseline. Override retention as needed. |

### Outputs

The `jurisdiction_metadata` output provides full regulatory context:

```hcl
output "jurisdiction_metadata" {
  # regulator, data_protection_law, data_protection_authority,
  # kyc_retention_days, audit_retention_days, cross_border_allowed,
  # cross_border_conditions, notes
}
```

## Outputs

| Output                   | Description                                                |
| ------------------------ | ---------------------------------------------------------- |
| `operational_endpoint`   | Operational DB connection endpoint                         |
| `audit_endpoint`         | Audit DB connection endpoint                               |
| `operational_secret_arn` | AWS Secrets Manager ARN for operational DB master password |
| `audit_secret_arn`       | AWS Secrets Manager ARN for audit DB master password       |
| `kyc_bucket_name`        | S3 bucket for KYC document storage                         |
| `kyc_irsa_role_arn`      | IRSA role ARN for K8s service account annotation           |
| `backup_bucket`          | S3 bucket for audit snapshot exports                       |

## Design principles

- **SOVEREIGN**: Data stays in-region. Each jurisdiction maps to an AWS region.
- **AUDITABLE**: Audit database is append-only with deletion protection. Backups retained 7 years.
- **SECURE**: All data encrypted at rest (KMS) and in transit (SSL enforced). Passwords managed by AWS Secrets Manager.
- **DEPLOYABLE**: Single `terraform apply` creates the complete stack. No manual steps.
