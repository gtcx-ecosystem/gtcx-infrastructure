---
title: 'Session brainstorm — trade ecosystem domain model (raw discussion)'
status: draft
date: 2026-06-12
owner: fabric-os
session_id: fabric-os-domain-model-2026-06-12
participants: operator, ecosystem-strategy-agent
source: cursor-session-0bc17772
tags: [brainstorm, domain-model, canon, lanes, raw-notes]
---

# Session brainstorm — trade ecosystem domain model

> **Purpose:** Preserve the **raw discussion arc** from the 2026-06-11/12 strategy session that produced the trade ecosystem lane taxonomy. This is the narrative SoR before normative specs.  
> **Normative spec:** [`trade-ecosystem-lanes-spec.md`](./trade-ecosystem-lanes-spec.md) · [`../../../pm/spec/trade-ecosystem-lanes.json`](../../../pm/spec/trade-ecosystem-lanes.json)

---

## 1. Session arc (chronological)

### 1.1 Starting point — simplified four-domain diagram (rejected)

An early visual grouped the fleet into four rows:

```text
D1 FIELD          D2 LAND           D3 COMPLIANCE     D4 MARKETS
exploration-os    terra-os          compliance-os     markets-os
nyota-ai                                            terminal-os
```

**Operator correction:** This misses mobile, platform desks (CRX/SGX/AGX/Pathways), market intelligence split, civic infrastructure, hardware, and the monorepo core.

### 1.2 Expanded product lanes (accepted direction)

Six **business domains** emerged from operator input:

| Domain                               | Constituents                                                      |
| ------------------------------------ | ----------------------------------------------------------------- |
| **Site verification & intelligence** | gtcx-mobile, exploration-os, terra-os, hardware (TapKit/VaultKit) |
| **Market intelligence**              | terminal-os (FIFTY-FOUR), nyota-ai, griot-ai                      |
| **Compliance & attestation**         | compliance-os, veritas-ai                                         |
| **Market exchange & investment**     | Pathways, markets-os, AGX                                         |
| **Civic digital infrastructure**     | CRX, SGX, sensei-os                                               |
| **Infrastructure intelligence**      | fabric, bridge, canon, agile, gtcx-os _(later corrected)_         |

**Key insight:** Field ≠ markets. Financial markets ≠ compliance platforms. Sovereign gov rails ≠ enterprise compliance product.

### 1.3 "Trust suite" framing (rejected)

An interim label described GTCX as a "trust suite" comparable to Google Workspace intelligence.

**Operator correction:** GTCX is a **full-stack sovereign commodity trade ecosystem**. Proof/trust is the **rail**, not the product category. One-liners and canon must lead with trade, not trust-as-category.

### 1.4 Apple / iCloud continuity (accepted)

Operator prefers **Apple** over Google as the primary UX comp:

- One account (GTCX ID / baseline-os)
- Invisible sync of **trade objects** (not repo files)
- Handoff across phone, NFC, desk, WhatsApp, minister portal
- Hardware matters — rejected "GTCX won't ship devices"

**Hardware path:** `gtcx-os/platform/hardware/` — TapKit, VaultKit, NFC, native signing; drones/wearables/IoT planned.

### 1.5 Mixed "Experience & primitives" bucket (rejected)

An early cross-cut tier **X** lumped `ledger-ui`, `platform/core`, and `platform/protocols`.

**Operator correction:** Do not mix these. Trade protocols are **major industry-standard verification primitives** — a protocol suite, not a product platform. ledger-ui is experience only. core is implementation substrate.

**Three-way split:**

| Layer    | Members                      | Role                                                |
| -------- | ---------------------------- | --------------------------------------------------- |
| **T0**   | `gtcx-os/platform/protocols` | TradePass, GeoTag, GCI, VaultMark, PvP, PANX + CSPs |
| **T0.5** | `gtcx-os/platform/core`      | Crypto, schemas, SDK types — implements T0          |
| **X**    | `ledger-ui`                  | Institutional desk shell only                       |

### 1.6 gtcx-os in "Infrastructure intelligence" (rejected)

Listing `gtcx-os` beside fabric, baseline, bridge, canon, agile under a flat **P** tier was rejected.

**Operator correction:** **gtcx-os is the MAIN core of trade infrastructure** — the monorepo hosting protocol rail, platform desks, mobile, hardware, operations. It is not a fleet enabler.

### 1.7 Supporting layer refinement (accepted)

Final operator taxonomy for the five sibling "platform" repos:

| Repo            | Category                          | One line                                 |
| --------------- | --------------------------------- | ---------------------------------------- |
| **gtcx-os**     | **C — Trade infrastructure core** | Where trade is built                     |
| **baseline-os** | **A — AI OS**                     | 7-layer agent runtime — not "vault only" |
| **fabric-os**   | **I — Infra**                     | AWS/EKS/terraform — deploys C            |
| **canon-os**    | **U — Utility**                   | Constitution + governance protocols      |
| **agile-os**    | **U — Utility**                   | Fleet sprint graph                       |
| **bridge-os**   | **B — Program office**            | Gates, PM harness, fleet coordination    |

**No combined "P — Infrastructure intelligence" bucket.**

### 1.8 Competitive stack (brainstorm, not canon yet)

Partial comps discussed for world-class rubric:

| Comp                                       | GTCX analogue                                          |
| ------------------------------------------ | ------------------------------------------------------ |
| **Apple**                                  | Operator continuity, GTCX ID, trade object handoff     |
| **Google Workspace**                       | Admin desk, search (bridge + agile Teams Hub analogue) |
| **AWS**                                    | Trust cloud, org, audit trail (fabric)                 |
| **HashiCorp**                              | Control plane workflow (fabric + baseline vault)       |
| **Stripe / Bloomberg / Palantir / M-Pesa** | Partial comps per domain                               |

---

## 2. Supply chain (from platforms SoR — retained)

From `gtcx-os/platform/platforms/01-docs/platforms/README.md`:

```text
Protocol (T0) → Pathways/VIA + field capture (L1)
             → CRX permit (L4a)
             → SGX clearance (L4a)
             → AGX trade + markets-os (L4b)
             → Veritas buyer evidence (L3)
```

**Two deploy products (ADR-007):**

| Product            | Modules                        |
| ------------------ | ------------------------------ |
| **GTCX Sovereign** | CRX, SGX, Pathways, Operations |
| **GTCX Cloud**     | AGX, TradePass, Veritas        |

---

## 3. Boundary clarifications (operator + codebase)

| Pair                                             | Distinction                                                           |
| ------------------------------------------------ | --------------------------------------------------------------------- |
| **compliance-os vs CRX**                         | Enterprise trade compliance product vs sovereign permit desk          |
| **markets-os vs AGX**                            | Capital formation sibling repo vs international marketplace desk in C |
| **terminal-os vs markets-os**                    | Market intelligence vs capital formation / execution                  |
| **veritas-ai vs platforms Veritas**              | Attestation product vs buyer-evidence module                          |
| **exploration-os vs gtcx-mobile**                | Domain product vs field capture surface in C                          |
| **Trade protocols vs canon P1–P45**              | Industry verification rail vs agent fleet law                         |
| **fabric-os vs gtcx-os/platform/infrastructure** | Live infra SoR vs P34 shadow domain                                   |

---

## 4. Known drift flagged in session

| Item                                | Issue                                                        | Triage (2026-06-12)                                          |
| ----------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Root `gtcx-ecosystem/README.md`     | Still references `gtcx-docs`; narrow compliance framing      | **Open** — bridge-os `INIT-ECOSYSTEM-README-REFRESH`         |
| `fabric-os/README.md`               | ~~Says "archived"~~ **fixed 2026-06-12** — active I-tier SoR | **Resolved** — README is active I-tier SoR                   |
| Fable pillar reports (2026-06-11)   | Missing agile-os, canon-os naming, full platform map         | **Open** — bridge `INIT-FABLE-REPORTS-LANE-REFRESH`          |
| Constitution Article IV             | Planes omit explicit **Trade core** plane for gtcx-os        | **Open** — canon Class S `INIT-GTCX-CONSTITUTION-ART-IV-BIS` |
| bridge `gtcx-execution-engine.json` | Planes list fabric/baseline/canon/bridge — no **C** tier     | **Resolved** — XR-BRIDGE-LANES-REGISTRY-001 complete         |

---

## 5. Documentation deliverables requested (this session)

Operator asked to:

1. Document raw brainstorming (this file)
2. Craft comprehensive specs for indicated initiatives/features/canon
3. Create/update fabric-os handoff
4. Provide shareable note for fabric-os team

**Downstream artifacts:**

| Artifact               | Path                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| Normative lane spec    | `docs/specs/ecosystem/trade-ecosystem-lanes-spec.md`                                              |
| Machine registry       | `pm/spec/trade-ecosystem-lanes.json`                                                              |
| Initiatives catalog    | `docs/specs/ecosystem/initiatives-from-domain-model-2026-06-12.md`                                |
| Fabric handoff         | `docs/operations/coordination/from-ecosystem-strategy-to-fabric-os-trade-lanes-2026-06-12.md`     |
| Share note             | `docs/operations/coordination/outbound/share-note-trade-ecosystem-lanes-for-fabric-2026-06-12.md` |
| Canon handoff (draft)  | `docs/operations/coordination/to-canon-os-trade-ecosystem-lanes-2026-06-12.md`                    |
| Bridge handoff (draft) | `docs/operations/coordination/to-bridge-os-trade-ecosystem-lanes-registry-2026-06-12.md`          |

---

## 6. Open questions (defer to product owners)

1. **terminal-os vs markets-os vs AGX** — canonical customer-facing boundary for "market exchange" UX
2. **veritas-ai promotion** — sibling repo vs platforms module only long-term
3. **gtcx-os/platform/infrastructure shadow** — sunset timeline vs fabric-os as sole edit SoR
4. **Constitution Article VIII** — ratification path for trade-lane plane model
5. **Protocol 46** — trade object continuity spec scope vs baseline Handoff API

---

_End of raw session capture._
