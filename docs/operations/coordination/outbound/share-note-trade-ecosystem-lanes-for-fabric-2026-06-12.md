---
title: 'Share note — trade ecosystem lanes for fabric-os team'
status: current
date: 2026-06-12
owner: fabric-os
audience: fabric-os builders, platform operators, sibling integrators
copy_paste: true
laneId: I
ticket: XR-FABRIC-TRADE-LANES-001
tags: [share, fabric, lanes, handoff]
---

# Share note — trade ecosystem lanes (fabric-os)

**Date:** 2026-06-12  
**From:** Ecosystem strategy session (domain model brainstorm)  
**To:** fabric-os team  
**Ticket:** `XR-FABRIC-TRADE-LANES-001`  
**Authority:** Class R — execute without waiting on canon ratification

---

## TL;DR

We fixed the ecosystem map. **fabric-os is Infra (I)** — you deploy and operate the trade stack; you are **not** the trade core. **gtcx-os is C** — protocols, CRX/SGX/AGX/Pathways, mobile, hardware live there. **baseline-os is an AI OS (A)**, not infra. **canon-os + agile-os are utilities (U)**. **bridge-os is program office (B)**.

Full specs are in fabric-os already — start with the handoff doc.

---

## Start here (read order)

1. **Handoff (your execution checklist)**  
   `docs/operations/coordination/from-ecosystem-strategy-to-fabric-os-trade-lanes-2026-06-12.md`

2. **Normative spec**  
   `docs/specs/ecosystem/trade-ecosystem-lanes-spec.md`

3. **Your deploy matrix**  
   `docs/specs/ecosystem/lane-deploy-matrix.md`

4. **Machine registry (for future lint)**  
   `pm/spec/trade-ecosystem-lanes.json`

5. **Raw brainstorm (context)**  
   `docs/specs/ecosystem/session-brainstorm-trade-domain-model-2026-06-12.md`

---

## Lane cheat sheet

| ID      | Name                      | Repo(s)                              | fabric role                               |
| ------- | ------------------------- | ------------------------------------ | ----------------------------------------- |
| **C**   | Trade infrastructure core | **gtcx-os**                          | Host T0 API, Sovereign + Cloud bundles    |
| **T0**  | Trade protocol rail       | inside gtcx-os                       | Ingress/secrets only — not your semantics |
| **L1**  | Site verification         | mobile, hardware, exploration, terra | SM, DNS, staging substrate                |
| **L2**  | Market intelligence       | terminal, nyota, griot               | EKS, auth gates                           |
| **L3**  | Compliance & attestation  | compliance-os, veritas               | Hub #17, XR-104 gateway                   |
| **L4a** | Civic / sovereign         | CRX, SGX, Pathways, sensei           | sovereign-staging/prod origins            |
| **L4b** | Exchange / investment     | AGX, markets-os                      | api.staging AGX + sibling hosting         |
| **X**   | Experience                | ledger-ui                            | Hosting per register                      |
| **A**   | AI OS                     | baseline-os                          | Optional pilot — vault is not fabric      |
| **I**   | Infra                     | **fabric-os**                        | **You**                                   |
| **U**   | Utilities                 | canon, agile                         | Link only                                 |
| **B**   | Program office            | bridge                               | Fleet gates — consume witnesses           |

---

## What we need from fabric-os this sprint

1. Tag every row in `infra-per-repo-action-matrix-2026-06-05.md` with a **lane ID**
2. Add **`laneId`** to new coordination handoffs (template field)
3. Register initiatives in `pm/roadmap/initiatives.json` (see handoff)
4. Append completion note to `cross-repo-agent-log.md`

**Do not** wait for canon-os constitution amendment to start tagging — ratification is parallel (`blocksIR: false`).

---

## Key operator rules (non-negotiable)

- **GTCX = full-stack commodity trade ecosystem** — not a "trust suite"
- **Never list gtcx-os under infra/utilities**
- **Never mix trade protocols (T0) with ledger-ui (X)**
- **compliance-os ≠ CRX** — enterprise product vs sovereign permit desk
- **markets-os ≠ AGX** — sibling capital formation vs Cloud marketplace module
- **Trade objects sync across surfaces** (Apple model) — not git repo sync

---

## Deploy products (ADR-007)

| Product            | Modules                        | fabric origins               |
| ------------------ | ------------------------------ | ---------------------------- |
| **GTCX Sovereign** | CRX, SGX, Pathways, Operations | sovereign-staging.gtcx.trade |
| **GTCX Cloud**     | AGX, TradePass, Veritas        | api.staging.gtcx.trade       |

E2E witness order: **T0 → L1 → L4a → L4b → L3 → X**

---

## Questions?

Reply on `cross-repo-agent-log.md` or open a correction on ticket `XR-FABRIC-TRADE-LANES-001`.

---

_Copy-paste friendly — link paths relative to fabric-os repo root._
