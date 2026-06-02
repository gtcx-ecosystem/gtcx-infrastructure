---
title: 'Infrastructure as Code — Terraform'
status: current
date: '2026-06-02'
owner: devops
tags: ['terraform', 'iac', 'aws', 'af-south-1']
---

# Infrastructure as Code — Terraform

This directory contains Terraform modules and environment configurations for the GTCX AWS estate.

## Structure

| Path                       | Purpose                                                                  |
| -------------------------- | ------------------------------------------------------------------------ |
| `modules/`                 | Reusable modules: VPC, EKS, RDS, Route53, WAF, S3/WORM, IAM/OIDC         |
| `environments/staging/`    | Staging environment: `af-south-1`, single AZ for cost control            |
| `environments/production/` | Production environment: `af-south-1` multi-AZ, DR standby in `eu-west-1` |

## Key Modules

| Module    | Resources                                         | Notes                                                  |
| --------- | ------------------------------------------------- | ------------------------------------------------------ |
| `vpc`     | VPC, subnets, NAT gateways, VPC endpoints         | IPv6 enabled; private subnets for pods                 |
| `eks`     | EKS cluster, managed node groups, IRSA            | Node group: `m6i.large` amd64; GPU nodes for inference |
| `rds`     | Postgres primary + read replica, parameter groups | Encrypted at rest; automated backups 7d                |
| `route53` | Hosted zones, records, health checks              | `api.staging.gtcx.trade`, `api.gtcx.trade`             |
| `waf`     | AWS WAFv2 WebACL, managed rules, custom rules     | Browser-UA challenge on `/health`; rate limiting       |
| `s3-worm` | WORM bucket with Object Lock, lifecycle           | Compliance evidence; 7-year retention                  |

## Usage

```bash
cd infra/terraform/environments/staging
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply
```

## State

- Remote state in S3 with DynamoDB locking.
- State encryption via AWS KMS.
- See `docs/operations/runbooks/terraform-state-recovery.md` for DR procedures.
