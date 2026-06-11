---
title: 'Inbound — W2 hub #17 secrets spec (from compliance-os)'
status: received
date: 2026-06-05
updated: 2026-06-08
owner: fabric-os
from: compliance-os
to: fabric-os
priority: P0
hub_blocker: 17
responds_to_commit: 77dfa9b
phase_a_staging: complete
phase_b_prod: in_progress
infra_raise: 01-docs/04-ops/coordination/outbound/hub-17-prod-w2-close-raise-2026-06-08.md
---

# Inbound received — W2 prod secrets

**Full specification (canonical):**  
`compliance-os/01-docs/04-ops/coordination/to-fabric-os-w2-secrets-inbound-2026-06-04.md`

**Hub copy:** `baseline-os/workstream/coordination/inbound/from-compliance-os-w2-secrets-spec-2026-06-04.md`

## Ping `77dfa9b` — answered

| Field       | Answer                                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Env names   | `COMPLIANCE_OS_INTAKE_API_KEY`, `COMPLIANCE_OS_TERMINAL_API_KEY` confirmed; internal → **`COMPLIANCE_API_INTERNAL_TOKEN`** (+ org id, terminal URL, API URL) |
| Values      | Infra generates (`openssl rand -base64 32`); org id `org_prod_diligence`                                                                                     |
| Environment | Staging (`gtcx-staging`) then production                                                                                                                     |
| Pod scope   | **apps/web** + **compliance-api** — not sovereign; not gateway-only                                                                                          |

## Phase status (2026-06-08)

| Phase | Environment                          | Status          | Evidence                                                                                                                             |
| ----- | ------------------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **A** | `compliance-os-staging`              | **complete**    | [`from-fabric-os-w2-secrets-sealed-2026-06-05.md`](./from-fabric-os-w2-secrets-sealed-2026-06-05.md), ESO `3a794fa`, staging witness |
| **B** | prod `https://compliance.gtcx.trade` | **in progress** | Probe **525** — [`hub-17-prod-w2-close-raise-2026-06-08.md`](./outbound/hub-17-prod-w2-close-raise-2026-06-08.md)                    |

## Infra action (Phase B — prod close)

1. Seal prod secrets in AWS SM (`af-south-1`) → ESO → prod namespace (`compliance-os-production` / `gtcx-production`).
2. Ingress `compliance.gtcx.trade` → web deployment; align prod terminal URL/key.
3. Patch **web** + **compliance-api** `env.valueFrom.secretKeyRef`; rolling restart.
4. Post evidence (names only) → unblocks exploration `w2:prod:retest` → compliance PATCH proof → hub #17 close.

**Responds to:** [ping-fabric-os-w2-secrets-2026-06-04.md](./ping-fabric-os-w2-secrets-2026-06-04.md) (`77dfa9b`)
