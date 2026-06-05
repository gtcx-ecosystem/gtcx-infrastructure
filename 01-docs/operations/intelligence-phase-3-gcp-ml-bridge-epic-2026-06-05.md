---
title: 'Epic — Intelligence Phase 3 GCP→AWS ML bridge (Terraform)'
status: planned
date: 2026-06-05
owner: gtcx-infrastructure
partner: gtcx-intelligence
epic_id: INF-PHASE3-GCP-BRIDGE-001
---

# Epic — GCP→AWS ML bridge (Phase 3)

**Ecosystem placement:** [`gtcx-docs/01-docs/architecture/cloud-placement/gtcx-ecosystem-2026-06-05.md`](../../../gtcx-docs/01-docs/architecture/cloud-placement/gtcx-ecosystem-2026-06-05.md)

**Intelligence roadmap:** [`gtcx-intelligence/01-docs/roadmap/global-trade-phase-3-ml-pipeline.md`](../../../gtcx-intelligence/01-docs/roadmap/global-trade-phase-3-ml-pipeline.md)

## Goal

Allow **Vertex AI pipelines** (GCP) to publish **non-PII model artifacts** to AWS S3 and update the **DynamoDB model registry** so the **intelligence orchestrator on EKS** can shadow-deploy candidates.

## Terraform (shipped — disabled by default)

| Path                                       | Purpose                                                   |
| ------------------------------------------ | --------------------------------------------------------- |
| `04-ship/terraform/modules/gcp-ml-bridge/` | WIF OIDC provider + `intelligence-gcp-ml-bridge` IAM role |
| `04-ship/terraform/modules/ml-pipeline/`   | AWS S3 datasets/models + DynamoDB registry (existing)     |

## Activation checklist

| #   | Owner               | Task                                                                      |
| --- | ------------------- | ------------------------------------------------------------------------- |
| 1   | gtcx-intelligence   | Create GCP project + SA (`intelligence-ml`); enable Vertex/GCS/BQ APIs    |
| 2   | gtcx-intelligence   | Export `unique_id` of GCP SA to infra (secure channel)                    |
| 3   | gtcx-infrastructure | Wire `module.gcp_ml_bridge` in target env `main.tf` with `enabled = true` |
| 4   | gtcx-infrastructure | `terraform plan` — no compliance RDS/S3 changes                           |
| 5   | gtcx-intelligence   | Vertex pipeline dry-run → S3 object + DynamoDB row                        |
| 6   | Both                | Evidence: Phase 3 acceptance in intelligence roadmap                      |

## Example wiring (testnet-pilot / staging)

After step 2, append to environment `main.tf` below `module.ml_pipeline`:

```hcl
module "gcp_ml_bridge" {
  source = "../../modules/gcp-ml-bridge"

  environment                   = var.environment
  enabled                       = true
  gcp_service_account_unique_id = var.gcp_ml_sa_unique_id # new tfvar — not in git
  model_bucket_arn              = module.ml_pipeline.model_bucket_arn
  registry_table_arn            = module.ml_pipeline.registry_table_arn
  tags                          = var.tags
}
```

**Do not** store `gcp_service_account_unique_id` in plaintext tfvars in git — use CI secret or `-var` at apply time.

## Out of scope

- Migrating compliance-os or gateway to GCP
- Hosting intelligence orchestrator on GKE (runtime stays EKS until separate epic)
- Copying diligence/evidence Postgres to GCP

## Acceptance

- [ ] Bridge module applied in at least one non-prod environment
- [ ] Vertex pipeline writes test artifact to `gtcx-*-intelligence-models`
- [ ] Registry row visible with `status = candidate`
- [ ] Audit confirms zero customer PII in GCS training buckets
