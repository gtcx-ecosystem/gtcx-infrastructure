---
title: 'Handoff — Trade ecosystem lanes → fabric-os execution'
status: open
date: 2026-06-12
from: ecosystem-strategy-session
to: fabric-os
ticket: XR-FABRIC-TRADE-LANES-001
initiative: INIT-GTCX-TRADE-ECOSYSTEM-LANES
laneId: I
protocol: P24
priority: P1
blocksIR: false
authorityClass: R
supersedes: flat infra-per-repo matrix without lane taxonomy
---

# Handoff: Trade ecosystem lanes → fabric-os

> **Intent:** fabric-os adopts the **lane taxonomy** as the normative frame for all infra work, deploy matrix rows, and coordination handoffs.  
> **You are I (Infra), not C (trade core).** gtcx-os builds trade; fabric runs it.

---

## Executive summary

A multi-hour ecosystem strategy session produced a **corrected domain model** for the GTCX fleet. The session rejected:

1. Flat **D1–D4** field/land/compliance/markets only diagram
2. **"Trust suite"** as product category (trade ecosystem + proof rail instead)
3. Mixed **experience + protocols + core** bucket
4. Listing **gtcx-os** alongside fabric/baseline/bridge as "infrastructure intelligence"

**fabric-os action:** Implement **INIT-FABRIC-LANE-DEPLOY-MATRIX** and tag all hosting work with lane IDs.

---

## What changed (operator decisions)

| Before                             | After                                      |
| ---------------------------------- | ------------------------------------------ |
| gtcx-os in P-tier with fabric      | **C — Trade infrastructure core** (center) |
| baseline = "runtime/vault"         | **A — AI OS** (7 layers)                   |
| canon + agile unnamed              | **U — Utilities**                          |
| fabric grouped with "intel"        | **I — Infra only**                         |
| protocols + ledger-ui + core mixed | **T0 / T0.5 / X** separated                |
| Six businesses collapsed           | **L1–L4b** distinct product lanes          |

---

## Artifacts delivered in fabric-os (this handoff)

| Artifact                  | Path                                                                                              | Role                      |
| ------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------- |
| Raw session brainstorm    | `docs/specs/ecosystem/session-brainstorm-trade-domain-model-2026-06-12.md`                        | Narrative SoR             |
| Normative lane spec       | `docs/specs/ecosystem/trade-ecosystem-lanes-spec.md`                                              | Human spec                |
| Machine registry          | `pm/spec/trade-ecosystem-lanes.json`                                                              | Harness input             |
| Lane deploy matrix        | `docs/specs/ecosystem/lane-deploy-matrix.md`                                                      | **fabric execution view** |
| Initiatives catalog       | `docs/specs/ecosystem/initiatives-from-domain-model-2026-06-12.md`                                | Full INIT-\* list         |
| Share note                | `docs/operations/coordination/outbound/share-note-trade-ecosystem-lanes-for-fabric-2026-06-12.md` | Paste to team             |
| Canon handoff (outbound)  | `docs/operations/coordination/to-canon-os-trade-ecosystem-lanes-2026-06-12.md`                    | Ratification track        |
| Bridge handoff (outbound) | `docs/operations/coordination/to-bridge-os-trade-ecosystem-lanes-registry-2026-06-12.md`          | Registry sync             |

---

## fabric-os execution checklist

### Immediate (Class R)

- [x] **Read** normative spec + lane deploy matrix (30 min)
- [x] **Tag** existing P1 rows in `infra-per-repo-action-matrix-2026-06-05.md` with lane IDs (L1–L4b, C, I)
- [x] **Add** `laneId` field to coordination handoff template usage (see share note)
- [x] **Register** initiatives in `pm/roadmap/initiatives.json`:
  - `INIT-GTCX-TRADE-ECOSYSTEM-LANES`
  - `INIT-FABRIC-LANE-DEPLOY-MATRIX`
  - `INIT-FABRIC-README-SOR-REconcile`
- [x] **Append** `cross-repo-agent-log.md` when matrix tagging complete

### Short-term (Sprint)

- [x] **Extend** DaaS cards with `deployProduct: Sovereign | Cloud` per ADR-007
- [x] **Extend** SECAS pentest scope with L4a vs L4b vs T0 boundaries
- [x] **Implement** `pnpm fabric:lanes:check` (validate JSON vs deploy registry)
- [x] **Reconcile** README archived banner vs active AGENTS.md
- [x] **Publish** `audit/evidence/xr-lane-witness-latest.json` (XR-101/301/302/104 laneId)

### Coordination (P24)

- [x] **Ack** bridge handoff — `XR-BRIDGE-LANES-REGISTRY-001` done (bridge log 2026-06-11)
- [ ] **Ack** canon handoff when INST-F-006 frame published
- [x] **Do not** duplicate normative protocol text — link canon-os utilities
- [x] **Reply** sprint authority eval — `from-fabric-os-sprint-authority-eval-2026-06-12.md`

---

## fabric obligations by lane (quick reference)

| Lane    | fabric hosts                              | fabric does not            |
| ------- | ----------------------------------------- | -------------------------- |
| **C**   | T0 API, Sovereign bundle, Cloud AGX       | Own CRX/AGX business rules |
| **L1**  | exploration DNS, mobile SM, terra staging | Field app logic            |
| **L2**  | terminal EKS, intelligence auth gate      | FIFTY-FOUR features        |
| **L3**  | compliance hub #17, XR-104 gateway        | Compliance policy          |
| **L4a** | sovereign-staging/prod origins            | Permit issuance logic      |
| **L4b** | api.staging AGX, markets sibling hosting  | Capital formation logic    |
| **X**   | ledger-ui hosting per register            | Desk UX                    |
| **A**   | optional baseline pilot tunnel            | Vault SoR                  |
| **I**   | _(this repo)_                             | —                          |
| **U/B** | link only                                 | deploy canon/agile/bridge  |

Full matrix: [`lane-deploy-matrix.md`](../../specs/ecosystem/lane-deploy-matrix.md).

---

## Supply chain (infra witness order)

When closing staging E2E, publish witnesses in lane order:

```text
T0 health → L1 mobile SM → L4a sovereign health → L4b AGX health → L3 gateway → X desk probe
```

Existing XR-101/301/302/104 map to this chain — add `laneId` to evidence JSON on next capture.

---

## Five-pillar acceptance lens

| Pillar               | fabric requirement                                                |
| -------------------- | ----------------------------------------------------------------- |
| Compliance           | Lane spec + deploy matrix are durable SoR; handoffs cite laneId   |
| Technical excellence | Single machine JSON; future lint gate                             |
| Craft                | No duplicate canon prose in fabric docs — href only               |
| World-class          | Infra tagged by business lane — integrators know what they deploy |
| Trust & safety       | T0 hosting separated from X desk hosting in pentest scope         |

---

## Open questions (fabric input welcome)

1. Sunset timeline for `gtcx-os/platform/infrastructure` shadow vs fabric-only edit
2. terminal-os / nyota-ai / griot-ai hosting promotion schedule in repo register
3. Whether `pnpm fabric:lanes:check` lives in fabric-os or bridge-os fleet harness

---

## Resume when

- fabric-os agent completes **Immediate checklist** and appends log entry
- OR blocker on canon ratification (Class S) — infra tagging continues in parallel (`blocksIR: false`)

---

**Authority class:** R — execute tagging and registry updates without sovereign sign-off.  
**Override:** Reply **stop**, **correct:**, or story ID `XR-FABRIC-TRADE-LANES-001`.

---

_Handoff XR-FABRIC-TRADE-LANES-001 · 2026-06-12_
