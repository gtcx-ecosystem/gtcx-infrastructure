---
title: 'Initiatives catalog — trade ecosystem domain model session'
status: draft
date: 2026-06-12
owner: fabric-os
initiative: INIT-GTCX-TRADE-ECOSYSTEM-LANES
tags: [initiatives, roadmap, canon, fabric, bridge]
---

# Initiatives catalog — from domain model session

Each initiative below was indicated in the 2026-06-11/12 strategy session. **Owner repo** is where execution lands; fabric-os rows describe infra obligations only.

---

## P0 — Canon & registry (fleet-wide)

### INIT-GTCX-TRADE-ECOSYSTEM-LANES

| Field          | Value                                                                          |
| -------------- | ------------------------------------------------------------------------------ |
| **Title**      | Trade ecosystem lane taxonomy                                                  |
| **Status**     | draft                                                                          |
| **Owner**      | fabric-os (spec author) → canon-os (ratification)                              |
| **Spec**       | `docs/specs/ecosystem/trade-ecosystem-lanes-spec.md`                           |
| **Machine**    | `pm/spec/trade-ecosystem-lanes.json`                                           |
| **Goal**       | Replace flat D1–D4 and P-tier diagrams with normative lane IDs                 |
| **Acceptance** | canon frame published; bridge registry synced; no repo lists gtcx-os under I/U |
| **Authority**  | R                                                                              |

**Features:**

- F-LANE-001 — Lane ID registry (T0, T0.5, C, L1–L4b, X, A, I, U, B, P-gov)
- F-LANE-002 — Supply chain order witness in bridge harness
- F-LANE-003 — Forbidden bucket lint (no experienceAndPrimitives)

---

### INIT-GTCX-CONSTITUTION-ART-IV-BIS

| Field          | Value                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- |
| **Title**      | Constitution Article IV bis — Trade lanes planes                                            |
| **Status**     | proposed                                                                                    |
| **Owner**      | canon-os                                                                                    |
| **Handoff**    | `docs/operations/coordination/to-canon-os-trade-ecosystem-lanes-2026-06-12.md`              |
| **Goal**       | Add Trade core (C), AI OS (A), Infra (I), Utilities (U), Program office (B) to constitution |
| **Acceptance** | CONSTITUTION-001 amended; quarterly review cycle                                            |
| **Authority**  | S for ratification; R for draft                                                             |

**Features:**

- F-CONST-001 — Article IV bis table
- F-CONST-002 — Cross-reference to trade-ecosystem-lanes.json

---

### INIT-CANON-INST-F-006

| Field          | Value                                                                    |
| -------------- | ------------------------------------------------------------------------ |
| **Title**      | Institutional frame INST-F-006 Trade Ecosystem Lanes                     |
| **Status**     | proposed                                                                 |
| **Owner**      | canon-os                                                                 |
| **Path**       | `canon-os/docs/governance/institutional/frames/trade-ecosystem-lanes.md` |
| **Goal**       | Persona-selectable frame for domain-model work                           |
| **Acceptance** | Listed in institutional README; linked from P22 persona map              |

---

### INIT-PROTOCOL-46-TRADE-OBJECT-CONTINUITY

| Field          | Value                                                                      |
| -------------- | -------------------------------------------------------------------------- |
| **Title**      | Protocol 46 — Trade object continuity (Apple Handoff analogue)             |
| **Status**     | proposed                                                                   |
| **Owner**      | canon-os (spec) + baseline-os (runtime)                                    |
| **Goal**       | Normative trade object graph sync across surfaces via GTCX ID              |
| **Scope**      | Object types: lot, permit, clearance, settlement, credential; not git sync |
| **Acceptance** | protocol.md in canon-os; baseline Handoff API sketch                       |
| **Authority**  | R draft; A for cross-repo witness                                          |

**Features:**

- F-P46-001 — Trade object type registry
- F-P46-002 — Surface binding matrix (mobile, NFC, desk, WhatsApp)
- F-P46-003 — agent_trace_id on object handoff events

---

### INIT-BRIDGE-LANES-REGISTRY-SYNC

| Field          | Value                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------- |
| **Title**      | Sync gtcx-execution-engine + fleet registry to lane taxonomy                             |
| **Status**     | proposed                                                                                 |
| **Owner**      | bridge-os                                                                                |
| **Handoff**    | `docs/operations/coordination/to-bridge-os-trade-ecosystem-lanes-registry-2026-06-12.md` |
| **Goal**       | Add `tradeCore` plane; remove gtcx-os from fabric/agentRuntime confusion                 |
| **Files**      | `pm/spec/gtcx-execution-engine.json`, `config/fleet-deploy-readiness-registry.json`      |
| **Acceptance** | `pnpm ecosystem:execution-engine:check` green with lane refs                             |

---

## P1 — fabric-os (infra I)

### INIT-FABRIC-LANE-DEPLOY-MATRIX

| Field          | Value                                                            |
| -------------- | ---------------------------------------------------------------- |
| **Title**      | Deploy matrix by trade lane                                      |
| **Status**     | draft                                                            |
| **Owner**      | fabric-os                                                        |
| **Spec**       | `docs/specs/ecosystem/lane-deploy-matrix.md`                     |
| **Goal**       | Tag every hosting obligation with lane ID                        |
| **Acceptance** | infra-per-repo matrix updated; handoff template requires lane ID |

**Features:**

- F-FAB-001 — Lane tags on infra-per-repo-action-matrix rows
- F-FAB-002 — Coordination handoff `laneId` field (required)
- F-FAB-003 — `pnpm fabric:lanes:check` script (future)

---

### INIT-FABRIC-README-SOR-REconcile

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| **Title**      | fabric-os README vs AGENTS.md SoR reconcile              |
| **Status**     | open                                                     |
| **Owner**      | fabric-os                                                |
| **Goal**       | README says active infra SoR, not archived redirect only |
| **Acceptance** | README matches AGENTS.md; link to lane spec              |

---

### INIT-GTCX-INFRA-DAAS (existing — extend)

| Field         | Value                                                      |
| ------------- | ---------------------------------------------------------- |
| **Title**     | DevOps-as-a-Service — lane-aware DaaS cards                |
| **Status**    | complete → extend                                          |
| **Owner**     | fabric-os                                                  |
| **Extension** | DaaS cards cite lane ID + deploy product (Sovereign/Cloud) |

---

### INIT-GTCX-INFRA-SECAS (existing — extend)

| Field         | Value                                                              |
| ------------- | ------------------------------------------------------------------ |
| **Title**     | Security-as-a-Service — lane-boundary in pentest scope             |
| **Status**    | in_progress                                                        |
| **Owner**     | fabric-os                                                          |
| **Extension** | Pentest scope maps CRX/SGX (L4a) vs AGX (L4b) vs T0 API separately |

---

## P1 — gtcx-os (trade core C)

### INIT-GTCX-OS-PLATFORM-HYGIENE (existing bridge initiative)

| Field     | Value                                             |
| --------- | ------------------------------------------------- |
| **Title** | Remove misplaced platform orphans                 |
| **Owner** | gtcx-os                                           |
| **Note**  | agile/agentic extracted; C domain map stays clean |

---

### INIT-GTCX-TWO-PRODUCT-DEPLOY-WITNESS

| Field          | Value                                            |
| -------------- | ------------------------------------------------ |
| **Title**      | ADR-007 Sovereign + Cloud deploy witness refresh |
| **Owner**      | gtcx-os + fabric-os                              |
| **Goal**       | E2E W2/W5/W6 with lane tags in evidence JSON     |
| **Acceptance** | `audit/evidence/sovereign-cloud-e2e-latest.json` |

---

## P2 — Strategy & UX frames

### INIT-GTCX-CONVERGENCE-FRAME

| Field        | Value                                                                                 |
| ------------ | ------------------------------------------------------------------------------------- |
| **Title**    | Ecosystem convergence frame (ClickUp 4.0 / workspace comps)                           |
| **Status**   | brainstorm captured                                                                   |
| **Owner**    | canon-os + bridge-os                                                                  |
| **Goal**     | Document experience / context / platform rings without "trust suite" label            |
| **Comps**    | Apple (continuity), Google (admin desk), AWS (trust cloud), HashiCorp (control plane) |
| **Artifact** | `bridge-os/pm/ux/design-research/ecosystem-convergence-frame.md` (proposed)           |

---

### INIT-GTCX-APPLE-CONTINUITY-MODEL

| Field      | Value                                                  |
| ---------- | ------------------------------------------------------ |
| **Title**  | GTCX ID + trade object Handoff model                   |
| **Status** | proposed                                               |
| **Owner**  | baseline-os                                            |
| **Parent** | INIT-PROTOCOL-46                                       |
| **Goal**   | Document Apple analogue in baseline charter cross-link |

---

### INIT-GTCX-HARDWARE-EDGE-H0

| Field      | Value                                                              |
| ---------- | ------------------------------------------------------------------ |
| **Title**  | Hardware edge lane (TapKit/VaultKit/IoT)                           |
| **Status** | accepted in taxonomy                                               |
| **Owner**  | gtcx-os/platform/hardware                                          |
| **Goal**   | H0 sub-lane under L1; VaultKit → baseline critical path documented |
| **fabric** | Device-key routes, SM for field pilots                             |

---

## P2 — Documentation hygiene

### INIT-ECOSYSTEM-README-REFRESH

| Field     | Value                                                   |
| --------- | ------------------------------------------------------- |
| **Title** | gtcx-ecosystem root README lane map                     |
| **Owner** | bridge-os or gtcx-os                                    |
| **Goal**  | Replace gtcx-docs refs with canon-os; full lane diagram |

---

### INIT-FABLE-REPORTS-LANE-REFRESH

| Field     | Value                                                |
| --------- | ---------------------------------------------------- |
| **Title** | Regenerate Fable pillar reports with lane taxonomy   |
| **Owner** | bridge-os                                            |
| **Path**  | `reports/fable-pillar-audit-2026-06-11/`             |
| **Goal**  | Include agile-os, canon-os, gtcx-os platform domains |

---

## Dependency graph

```text
INIT-GTCX-TRADE-ECOSYSTEM-LANES
  ├── INIT-FABRIC-LANE-DEPLOY-MATRIX (fabric-os)
  ├── INIT-BRIDGE-LANES-REGISTRY-SYNC (bridge-os)
  ├── INIT-CANON-INST-F-006 (canon-os)
  ├── INIT-GTCX-CONSTITUTION-ART-IV-BIS (canon-os, Class S ratify)
  └── INIT-PROTOCOL-46-TRADE-OBJECT-CONTINUITY (canon + baseline)
        └── INIT-GTCX-APPLE-CONTINUITY-MODEL (baseline-os)
```

---

_Catalog version 1.0.0 — 2026-06-12_
