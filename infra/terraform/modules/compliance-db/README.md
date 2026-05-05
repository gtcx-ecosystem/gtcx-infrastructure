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

| Jurisdiction | Region            | KYC Retention                     | Backup Retention | Notes                           |
| ------------ | ----------------- | --------------------------------- | ---------------- | ------------------------------- |
| `zimbabwe`   | af-south-1        | 1825 days (5 years, FATF minimum) | 7 years          | ZWCMP compliance                |
| `kenya`      | af-south-1        | 1825 days                         | 7 years          | CBK requirements                |
| `ghana`      | eu-west-1         | 1825 days                         | 7 years          | BoG requirements                |
| `generic`    | (from var.region) | 1825 days                         | 7 years          | No jurisdiction-specific config |

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
