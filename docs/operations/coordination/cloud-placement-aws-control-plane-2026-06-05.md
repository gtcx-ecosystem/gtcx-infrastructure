---
title: 'Cloud placement — AWS control plane (gtcx-infrastructure)'
status: current
date: 2026-06-05
owner: gtcx-infrastructure
role: platform-engineer
---

# AWS control plane — gtcx-infrastructure

**Canonical ecosystem spec (SoR: gtcx-docs):** [`gtcx-docs/docs/architecture/cloud-placement/README.md`](../../../../gtcx-docs/docs/architecture/cloud-placement/README.md) → [`gtcx-ecosystem-2026-06-05.md`](../../../../gtcx-docs/docs/architecture/cloud-placement/gtcx-ecosystem-2026-06-05.md) · **Per-repo register:** [`repo-register-2026-06-05.md`](../../../../gtcx-docs/docs/architecture/cloud-placement/repo-register-2026-06-05.md)

## Infra owns (optimize here)

| Capability     | Examples in this repo                                                      |
| -------------- | -------------------------------------------------------------------------- |
| EKS workloads  | `compliance-gateway`, `intelligence-orchestrator`, `compliance-os-staging` |
| Secrets        | AWS SM → ESO → K8s (`compliance-os-w2-secrets`, gateway audit keys)        |
| Data stores    | RDS, Redis, Postgres init scripts, DR (`rds-live-restore`)                 |
| Object storage | S3 regional, WORM audit, model artifact **receipt** from GCP bridge        |
| IAM / IRSA     | Pod identity, `intelligence-gcp-ml-bridge` role (Phase 3)                  |
| CI gates       | validate-all, secret-scan, SLSA, coverage on gateway packages              |

## Infra does not own

| Capability                   | Owner                                             |
| ---------------------------- | ------------------------------------------------- |
| Vertex AI training pipelines | gtcx-intelligence (GCP)                           |
| BigQuery eval lineage tables | gtcx-intelligence (GCP)                           |
| Compliance application code  | compliance-os, platforms                          |
| Vercel terminal deploy       | terminal-os ops (keys must pair with AWS secrets) |

## Intelligence on AWS (runtime)

- Keep **intelligence** namespace on EKS for orchestrator, cost router, health probes.
- **INT-R2-03 / ER-2-02:** `ENABLE_COST_ROUTER=1` on Deployment — **done** (`dac128d`).
- **INT-S9-01:** staging auth token wiring — infra enables cluster/route; intelligence runs smoke.

## GCP bridge (when Phase 3 starts)

**Epic + module:** [`intelligence-phase-3-gcp-ml-bridge-epic-2026-06-05.md`](../intelligence-phase-3-gcp-ml-bridge-epic-2026-06-05.md) · `infra/terraform/modules/gcp-ml-bridge/` (disabled until GCP SA `unique_id` supplied).

- WIF OIDC + IAM role `gtcx-<env>-intelligence-gcp-ml-bridge`
- S3 model bucket + DynamoDB registry from existing `ml-pipeline` module

**No** compliance-os RDS or evidence buckets in GCP.

## Sprint alignment

New infra automatable work defaults to **AWS**. Do not open “migrate compliance to GCP” unless product files a migration epic with DR/secret re-proof.
