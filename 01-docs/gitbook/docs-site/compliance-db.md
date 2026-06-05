---
title: 'terraform-aws-compliance-db — Dual-Database Pattern'
status: 'draft'
date: '2026-05-27'
owner: 'platform-engineering'
tier: 'standard'
tags: ['docs-site', 'compliance-db', 'terraform', 'reference']
review_cycle: 'on-change'
role: 'protocol-architect'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# `terraform-aws-compliance-db`

Dual-database (operational + audit) Terraform module for regulated African fintech, with FATF-grade retention floors and a per-jurisdiction plugin catalog.

## Why dual-database?

Regulated workflows have two distinct data tenants that should never share a table, an IAM principal, or a backup policy:

1. **Operational** — current business state, fully mutable, optimized for read latency
2. **Audit** — append-only history, never deleted, optimized for compliance reads

Combining them in one database means either the operational store keeps history forever (a query-latency problem) or the audit store loses history when operational records are deleted (a compliance problem). The right answer is two databases with disjoint IAM grants.

## Install

The module is published at `github.com/amani-amina-anai/terraform-aws-compliance-db`. Once it's on the Terraform Registry, the canonical install will be:

```hcl
module "compliance_db" {
  source  = "amani-amina-anai/compliance-db/aws"
  version = "~> 0.1.0"

  jurisdiction = "zimbabwe"  # see "Jurisdiction Plugins" below
  environment  = "production"

  vpc_id              = module.vpc.vpc_id
  subnet_ids          = module.vpc.database_subnet_ids
  instance_class      = "db.t3.medium"
  allocated_storage_gb = 100
}
```

## Jurisdiction Plugins

Each jurisdiction encodes its own retention requirements derived from the local AML/CFT regulation. Phase 1 covers the Big 8:

- `zimbabwe` — RBZ AML/CFT, 5yr KYC / 7yr audit
- `south_africa` — FICA §22, 5yr / 7yr
- `nigeria` — CBN AML/CFT, 5yr / 7yr
- `egypt` — CBE, 5yr / 7yr
- `kenya` — CBK Prudential, 7yr / 7yr
- `ghana` — BoG, 6yr / 6yr
- `tanzania` — BoT, 5yr / 7yr
- `rwanda` — BNR, 5yr / 7yr

Phase 2 (regional blocs):

- `cemac` — BEAC regional
- `waemu` — BCEAO regional
- `generic` — FATF-aligned safe defaults for unmapped jurisdictions

Each plugin lives at `plugins/<jurisdiction>.tf` in the module source. Adding a new jurisdiction is a PR that fills `plugins/_template.tf` against a regulator citation.

## What the module provisions

Per environment, per jurisdiction:

- **Operational PostgreSQL** (`db.t3.small` default; configurable) on port 5432, multi-AZ, encrypted at rest with a dedicated KMS key.
- **Audit PostgreSQL** on port 5433 with the same instance class, running as a separate user with **no UPDATE or DELETE grants** at the database level.
- **KYC document S3 bucket** with per-jurisdiction retention floor (kebab-case `<jurisdiction>-kyc-<env>-<region>`), KMS-encrypted, IRSA-write-only.
- **Backup vault** with cross-region replication enabled (configurable; defaults to no replication for cost reasons).
- **Secrets Manager** entries for both DB master passwords; rotation lambdas wired.

## Outputs

```hcl
output "operational_endpoint" {}
output "audit_endpoint" {}
output "kyc_bucket_name" {}
output "secrets_arns" {}
```

## Compliance posture

The dual-DB pattern is the substrate behind GTCX's SIGNAL Integrity I2 (audit immutability) control. Live evidence:

- Audit DB privilege check: `04-ship/03-platform/scripts/test-audit-immutability.sh` in CI
- WORM bucket Object Lock: `aws s3api get-object-lock-configuration --bucket gtcx-worm-audit-production-af-south-1` returns COMPLIANCE mode with 2557-day retention

## When NOT to use this

- Unregulated workflows — the dual-DB tax doesn't earn its keep.
- Single-database systems that already have strong append-only properties (e.g., event-sourced architectures with immutable event stores).
- Jurisdictions outside the plugin catalog where you don't have regulator engagement to cite — `generic` is a safety net, not a substitute for jurisdiction-specific compliance work.

## Source

- GitHub: https://github.com/amani-amina-anai/terraform-aws-compliance-db
- Plugin catalog: `plugins/` directory in the source repo
- Terraform Registry: pending submission

## License

MIT.
