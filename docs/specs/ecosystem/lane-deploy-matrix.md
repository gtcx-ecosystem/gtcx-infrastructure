---
title: 'Lane deploy matrix — fabric-os obligations by trade lane'
status: draft
date: 2026-06-12
owner: fabric-os
document_id: SPEC-FABRIC-LANE-DEPLOY-001
initiative: INIT-FABRIC-LANE-DEPLOY-MATRIX
parent: SPEC-TRADE-LANES-001
tags: [fabric, deploy, lanes, eks, staging]
---

# Lane deploy matrix — fabric-os obligations

**Audience:** fabric-os agents and sibling integrators.  
**Normative lanes:** [`trade-ecosystem-lanes-spec.md`](./trade-ecosystem-lanes-spec.md)

---

## Rule

fabric-os (**I**) **hosts** workloads for lanes **C, L1–L4b, X, A (pilot)**. It **does not** own business semantics, protocol SPECs, or sprint priority.

| fabric does                           | fabric does not                |
| ------------------------------------- | ------------------------------ |
| EKS deploy, SM→ESO, WAF, IAM, origins | Define CRX permit rules        |
| Seal secrets; publish apply witnesses | Choose active product sprint   |
| Enable smoke routes                   | Run product smoke (owner repo) |

---

## Deploy matrix by lane

### C — gtcx-os (trade core)

| Workload               | Environment   | Infra action                                   | Owner smoke         | XR / ref |
| ---------------------- | ------------- | ---------------------------------------------- | ------------------- | -------- |
| T0 protocols API       | staging, prod | Ingress, SM, IRSA, GHCR pull                   | gtcx-os / protocols | XR-101   |
| GTCX Sovereign bundle  | staging       | sovereign-staging origin, WAF `/api/*`         | gtcx-platforms      | XR-301   |
| GTCX Cloud AGX         | staging       | api.staging origin, JWT SM, DB migrate         | gtcx-platforms      | XR-302   |
| Mobile audit E2E creds | staging       | SM `gtcx/staging/mobile-audit-e2e-credentials` | gtcx-mobile         | XR-003   |

### L1 — Site verification

| Repo / domain   | Infra action                               | Evidence                      |
| --------------- | ------------------------------------------ | ----------------------------- |
| exploration-os  | DNS, Pages custom domain, Supabase witness | XR-507/508                    |
| terra-os        | Staging deploy substrate                   | terra-os staging blockers doc |
| platform/mobile | SM, cluster routes for pilot               | XR-102                        |

### L2 — Market intelligence

| Repo               | Infra action                            | Evidence                     |
| ------------------ | --------------------------------------- | ---------------------------- |
| terminal-os        | EKS namespace, staging routes           | terminal-os EKS coordination |
| gtcx-intelligence  | Auth gate, SDK deploy                   | XR-201 runbook               |
| nyota-ai, griot-ai | Hosting per repo register when promoted | TBD — link repo register     |

### L3 — Compliance & attestation

| Repo               | Infra action                  | Evidence               |
| ------------------ | ----------------------------- | ---------------------- |
| compliance-os      | Hub #17 staging SM, ESO, GHCR | W2-OPS-001 runbooks    |
| compliance gateway | XR-104 image + signing key    | staging-xr-104 runbook |

### L4a — Civic (Sovereign product)

| Module   | Staging origin                  | Health probe      |
| -------- | ------------------------------- | ----------------- |
| CRX      | sovereign-staging.gtcx.trade    | `/api/health` 200 |
| SGX      | sovereign-staging.gtcx.trade    | `/api/health` 200 |
| Pathways | API routes via Sovereign bundle | stage gate APIs   |

### L4b — Exchange (Cloud product)

| Module     | Staging origin               | Health probe             |
| ---------- | ---------------------------- | ------------------------ |
| AGX        | api.staging.gtcx.trade       | `/api/health` 200        |
| markets-os | Per ADR-0005 sibling hosting | markets-os deploy matrix |

### X — Experience

| Repo      | Infra action                                             |
| --------- | -------------------------------------------------------- |
| ledger-ui | Static/hosting per repo register; link CRX/AGX desk URLs |

### A — AI OS (baseline)

| Workload           | Infra action                          |
| ------------------ | ------------------------------------- |
| baseline API pilot | EKS testnet pilot tunnel (optional)   |
| Vault              | Not fabric SM — baseline-os vault SoR |

### U / B — Utilities / Program office

| Repo      | fabric relationship                              |
| --------- | ------------------------------------------------ |
| canon-os  | Link only — no deploy                            |
| agile-os  | Link only — no deploy                            |
| bridge-os | Consume fleet checks; fabric publishes witnesses |

---

## Cloud placement (default)

All **I-tier** workloads default **AWS `af-south-1`** per OPS-CLOUD-PLACE-001. GCP ML bridge disabled until Phase 3.

See [`../operations/coordination/cloud-placement-aws-control-plane-2026-06-05.md`](../operations/coordination/cloud-placement-aws-control-plane-2026-06-05.md).

---

## Acceptance (INIT-FABRIC-LANE-DEPLOY-MATRIX)

- [x] Each P1 hosting row in [`infra-per-repo-action-matrix-2026-06-05.md`](../operations/coordination/infra-per-repo-action-matrix-2026-06-05.md) tagged with lane ID
- [x] New deploy requests cite lane ID in coordination handoff
- [ ] `pnpm fabric:lanes:check` (future) validates JSON lane members vs deploy registry

---

_Draft 2026-06-12_
