---
title: 'Trade ecosystem lanes — normative specification'
status: draft
date: 2026-06-12
owner: fabric-os
document_id: SPEC-TRADE-LANES-001
initiative: INIT-GTCX-TRADE-ECOSYSTEM-LANES
authority_class: R
supersedes: simplified D1–D4 domain diagram; flat P-tier "infrastructure intelligence"
related:
  - ./session-brainstorm-trade-domain-model-2026-06-12.md
  - ../../pm/spec/trade-ecosystem-lanes.v1.json
  - ../../operations/coordination/from-ecosystem-strategy-to-fabric-os-trade-lanes-2026-06-12.md
tags: [canon, domain-model, lanes, gtcx-os, fabric, baseline]
---

# Trade ecosystem lanes — normative specification

> **GTCX is a full-stack sovereign commodity trade ecosystem.** Proof and trust are the **rail**, not the product category. This spec defines **lanes** (business + platform tiers) so canon, infra, and product repos do not collapse distinct businesses into one bucket.

---

## 1. Scope

| In scope                                          | Out of scope                          |
| ------------------------------------------------- | ------------------------------------- |
| Lane IDs, members, boundaries, supply chain order | Per-story sprint execution (agile-os) |
| Deploy product split (ADR-007)                    | Individual XR ticket status           |
| fabric-os deploy obligations by lane              | Product feature PRDs                  |
| Canon amendment proposals                         | Legal ratification (Class S)          |

**Audience:** fabric-os (infra **I**), gtcx-os (core **C**), bridge-os (**B**), canon-os (**U**), baseline-os (**A**), domain product repos (**L1–L4b**).

---

## 2. Principles (non-negotiable)

1. **Separate businesses, separate lanes** — field verification ≠ market intelligence ≠ compliance ≠ civic infra ≠ exchange.
2. **Trade protocols are T0** — industry-standard verification primitives; never filed under experience or utilities.
3. **gtcx-os is C, not I/U/B** — the trade infrastructure core monorepo; not a fleet enabler.
4. **baseline-os is an AI OS (A)** — seven-layer agent runtime; not infra, not a utility.
5. **canon-os and agile-os are utilities (U)** — fleet law and sprint plumbing; not domain products.
6. **fabric-os is infra (I)** — deploys and operates trade stack on AWS; does not define trade protocols.
7. **Trade objects sync, not repo files** — Apple-style continuity via GTCX ID (baseline-os) across surfaces.
8. **Two deploy products** — GTCX Sovereign vs GTCX Cloud (ADR-007); modules are not separately deployable products.

---

## 3. Lane taxonomy

### 3.1 Overview diagram

```text
                    L1–L4b  DOMAIN PRODUCT REPOS (siblings)
         exploration · terra · compliance · markets · terminal
         nyota · griot · sensei · veritas-ai
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  X  EXPERIENCE — ledger-ui only        │
         └────────────────────┬───────────────────┘
                              │
    ╔═════════════════════════▼══════════════════════════════╗
    ║  C  TRADE INFRASTRUCTURE CORE — gtcx-os                 ║
    ║  T0 protocols · T0.5 core · platforms · mobile ·       ║
    ║  hardware · operations · intelligence (domains)        ║
    ╚═════════════════════════╤══════════════════════════════╝
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
 ┌─────────────┐      ┌─────────────┐      ┌──────────────┐
 │ A  AI OS    │      │ I  INFRA    │      │ U  UTILITIES │
 │ baseline    │      │ fabric      │      │ canon · agile│
 └──────┬──────┘      └──────┬──────┘      └──────┬───────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             ▼
                  ┌─────────────────────┐
                  │ B  PROGRAM OFFICE   │
                  │ bridge              │
                  └─────────────────────┘
```

### 3.2 Lane registry

| Lane ID   | Name                             | Tier type             | Primary SoR                  | Members                                                                               |
| --------- | -------------------------------- | --------------------- | ---------------------------- | ------------------------------------------------------------------------------------- |
| **T0**    | Trade protocol rail              | Foundation (inside C) | `gtcx-os/platform/protocols` | TradePass, GeoTag, GCI, VaultMark, PvP, PANX; CSPs; commodity hierarchy; Schema Forge |
| **T0.5**  | Core substrate                   | Foundation (inside C) | `gtcx-os/platform/core`      | `@gtcx/crypto`, schemas, WorkProof/TradeCV types, SDK packages                        |
| **C**     | Trade infrastructure core        | Platform center       | `gtcx-os`                    | Monorepo + all `platform/*` domains except shadow-only pointers                       |
| **L1**    | Site verification & intelligence | Product               | Mixed C + siblings           | **C:** mobile, hardware, operations · **Sibling:** exploration-os, terra-os           |
| **L2**    | Market intelligence              | Product               | Siblings + C bridge          | terminal-os, nyota-ai, griot-ai · **C:** platform/intelligence                        |
| **L3**    | Compliance & attestation         | Product               | Siblings + C module          | compliance-os, veritas-ai · **C:** platforms Veritas module                           |
| **L4a**   | Civic digital infrastructure     | Product               | C modules + sibling          | **C:** CRX, SGX, Pathways, Operations · **Sibling:** sensei-os                        |
| **L4b**   | Market exchange & investment     | Product               | C modules + sibling          | **C:** AGX, Pathways · **Sibling:** markets-os                                        |
| **X**     | Experience                       | Cross-cut UI          | ledger-ui                    | Institutional desk shell — CRX/AGX/SGX surfaces                                       |
| **A**     | AI OS                            | Platform support      | baseline-os                  | Lang, Frame, Studio, Persona, Autonomy, Experience, Govern; vault; MCP; offline/USSD  |
| **I**     | Infra                            | Platform support      | fabric-os                    | AWS EKS, terraform, SM/ESO, WAF, IAM, staging/prod                                    |
| **U**     | Utilities                        | Platform support      | canon-os, agile-os           | Law + doc utilities; fleet ZenHub/sprint graph                                        |
| **B**     | Program office                   | Platform support      | bridge-os                    | Five-pillar gates, PM engine, fleet harness, cutover witness                          |
| **P-gov** | Governance protocols             | Utility sub-lane      | canon-os                     | P1–P45 agent/fleet law — **not** trade protocols                                      |

---

## 4. Lane specifications

### 4.1 T0 — Trade protocol rail

**Definition:** Jurisdiction-neutral, commodity-agnostic verification primitives consumable by verifiers, lenders, regulators, and industrial buyers.

**Canonical quote (gtcx-protocols README):** _"A protocol suite, not a product platform."_

| Protocol  | Function                                 |
| --------- | ---------------------------------------- |
| TradePass | Identity, CSP ratification, operator DID |
| GeoTag    | Location proof                           |
| GCI       | Compliance scoring                       |
| VaultMark | Custody verification                     |
| PvP       | Settlement                               |
| PANX      | Oracle consensus                         |

**Extensions:** Country Support Packages (CSPs), Layer 1–4 commodity hierarchy, regulatory overlays.

**Forbidden:**

- Listing T0 under experience (X) or utilities (U)
- Treating governance protocols (P-gov) as trade protocols
- Product repos forking protocol SPECs without canon-os jurisdiction review

**fabric-os obligation:** Host T0 runtime on staging/prod (EKS, secrets, ingress); never own protocol semantics.

---

### 4.2 T0.5 — Core substrate

**Definition:** Lowest-level implementation dependency — crypto, types, attestation schemas — that **implements and consumes** T0.

**fabric-os obligation:** None on semantics; deploy artifacts built from core packages as part of C deploy matrix.

---

### 4.3 C — Trade infrastructure core (gtcx-os)

**Definition:** The monorepo trunk where the trade stack is built and shipped.

| Domain path                | Legacy repo         | Lane contribution                     |
| -------------------------- | ------------------- | ------------------------------------- |
| `platform/protocols/`      | gtcx-protocols      | T0                                    |
| `platform/core/`           | gtcx-core           | T0.5                                  |
| `platform/platforms/`      | gtcx-platforms      | L4a, L4b, L3 (Veritas module)         |
| `platform/mobile/`         | gtcx-mobile         | L1                                    |
| `platform/hardware/`       | gtcx-hardware       | L1 / H0 edge                          |
| `platform/operations/`     | gtcx-operations     | L1 ops packages                       |
| `platform/intelligence/`   | gtcx-intelligence   | L2 bridge                             |
| `platform/infrastructure/` | gtcx-infrastructure | **Shadow** → live SoR = fabric-os (I) |
| `platform/markets/`        | gtcx-markets        | **Pointer only** → markets-os sibling |

**ADR-007 deploy bundles inside C:**

| Deploy product | Modules                        |
| -------------- | ------------------------------ |
| GTCX Sovereign | CRX, SGX, Pathways, Operations |
| GTCX Cloud     | AGX, TradePass, Veritas        |

**fabric-os obligation:** Deploy both products per [`lane-deploy-matrix.md`](./lane-deploy-matrix.md); consume health/smoke witnesses from C owners.

---

### 4.4 L1 — Site verification & intelligence

**Job:** Capture and prove truth at origin — mine, farm, land, device.

| Member         | Location | Role                                  |
| -------------- | -------- | ------------------------------------- |
| gtcx-mobile    | C        | Offline field capture, VXA/VIA        |
| hardware       | C        | TapKit, VaultKit, NFC, native signing |
| operations     | C        | TradeCV, WorkProof, field evidence    |
| exploration-os | sibling  | Site assessment, mobile-v2            |
| terra-os       | sibling  | Land/cadastre intelligence            |

**Supply chain position:** Upstream of L4a gates; feeds Pathways Stage 3 via VIA.

**fabric-os obligation:** SM secrets for mobile E2E; device-key routes; Pages/custom domains per XR matrix.

---

### 4.5 L2 — Market intelligence

**Job:** Sense-making for traders, producers, jurisdictions — **not** trade execution.

| Member                | Role                                                  |
| --------------------- | ----------------------------------------------------- |
| terminal-os           | FIFTY-FOUR — TradeDesk, TradeBook, DealRoom, RegIntel |
| nyota-ai              | Producer commodity intelligence (WhatsApp/Telegram)   |
| griot-ai              | Narrative + jurisdiction media (54 markets)           |
| platform/intelligence | Scoring/screening bridge in C                         |

**Distinct from L4b:** intelligence informs; exchange settles.

**fabric-os obligation:** Host terminal-os EKS workloads; intelligence-staging auth (XR-201 pattern).

---

### 4.6 L3 — Compliance & attestation

**Job:** Enterprise compliance automation + lot-level truth/screening.

| Member            | Role                                                  |
| ----------------- | ----------------------------------------------------- |
| compliance-os     | Enterprise trade compliance (mining, ag, extractives) |
| veritas-ai        | Verify, screen, GCI-style attestation                 |
| platforms Veritas | Buyer evidence module (CSDDD, indices)                |

**Distinct from L4a CRX:** compliance-os = enterprise operator product; CRX = sovereign permit desk.

**fabric-os obligation:** Hub #17 staging substrate; compliance gateway (XR-104); WAF rules per runbook.

---

### 4.7 L4a — Civic digital infrastructure

**Job:** Sovereign government rails — permits, export gate, producer formalization, gov digitization feed.

| Member    | Location    | Role                                            |
| --------- | ----------- | ----------------------------------------------- |
| CRX       | C / app-crx | Digital mining permits, regulatory exchange     |
| SGX       | C / app-sgx | Export clearance, duties, quotas, revenue       |
| Pathways  | C spec      | ASM six-stage formalization; Stage 3 → CRX gate |
| sensei-os | sibling     | Gov/enterprise digitization → feeds CRX/SGX     |

**Deploy:** GTCX Sovereign product bundle.

**fabric-os obligation:** sovereign-staging/production origins; WAF; DB migrate witness (XR-301).

---

### 4.8 L4b — Market exchange & investment

**Job:** Liquidity, capital formation, international authenticated exchange.

| Member     | Location    | Role                                             |
| ---------- | ----------- | ------------------------------------------------ |
| AGX        | C / app-agx | International buyer marketplace, PvP             |
| Pathways   | C           | Producer funnel into tradable formal status      |
| markets-os | sibling     | Capital Formation OS — structure, close, custody |

**Deploy:** AGX in GTCX Cloud; markets-os separate product repo (ADR-0005).

**fabric-os obligation:** api.staging/production routes; JWT secrets; AGX DB migrate (XR-302).

---

### 4.9 X — Experience

**Job:** Institutional desk shell — how operators **see** sovereign and exchange desks.

| Member    | Role                                |
| --------- | ----------------------------------- |
| ledger-ui | SEF Tier 1 institutional trading UI |

**Forbidden:** Protocol authority, crypto primitives, or governance law in X.

---

### 4.10 A — AI OS (baseline-os)

**Job:** Seven-layer AI operating system powering every agent session.

| Layer      | Function                     |
| ---------- | ---------------------------- |
| Lang       | Command/lexicon construction |
| Frame      | Contextual lens              |
| Studio     | Production engine            |
| Persona    | Agent gear shift             |
| Autonomy   | Sovereignty journey          |
| Experience | Oracle / feedback loop       |
| Govern     | Living compliance cascade    |

Plus: vault, MCP, offline queue, USSD adapter, GTCX ID continuity.

**fabric-os obligation:** Host baseline API health endpoints on pilot cluster if configured; **do not** conflate with I-tier terraform ownership.

---

### 4.11 I — Infra (fabric-os)

**Job:** Cloud control plane — deploy, seal secrets, operate, witness substrate health.

| Owns                                      | Does not own             |
| ----------------------------------------- | ------------------------ |
| EKS, RDS, S3, SM→ESO, WAF, IAM, GHCR pull | Trade protocol semantics |
| Staging/prod apply witnesses              | Product sprint priority  |
| DaaS/SECaaS registers                     | Domain business logic    |

**Relationship to C:** fabric **runs** gtcx-os; gtcx-os **defines** what runs.

---

### 4.12 U — Utilities

| Utility | Repo     | Serves                                                         |
| ------- | -------- | -------------------------------------------------------------- |
| Canon   | canon-os | Constitution, governance protocols, audit framework, templates |
| Agile   | agile-os | ZenHub plan, sprint backlog, dependency rollup                 |

**fabric-os obligation:** Link to canon utilities; never duplicate normative protocol text in fabric docs.

---

### 4.13 B — Program office (bridge-os)

**Job:** Fleet gates, PM engine, ecosystem rollout, five-pillar harness, cutover witness.

**fabric-os obligation:** Consume bridge fleet checks; publish infra witnesses to `audit/evidence/`; execute REM stories delegated via service fabric.

---

## 5. Supply chain (normative order)

```text
T0 Protocol
  → L1 capture (mobile, hardware, exploration, terra, operations)
  → L4a Pathways Stage 3 → CRX permit → SGX clearance
  → L4b AGX trade + markets-os capital formation
  → L3 Veritas / veritas-ai attestation
  → X ledger-ui desk presentation
```

Parallel: **L2** intelligence feeds decisions at any stage; **A** baseline powers agents; **I** fabric hosts; **B** bridge assures.

---

## 6. Apple continuity model (operator intent)

| Apple                      | GTCX                                                    |
| -------------------------- | ------------------------------------------------------- |
| Apple ID                   | GTCX ID (baseline-os)                                   |
| iCloud object sync         | Trade object graph (lot, permit, clearance, settlement) |
| Secure Enclave / APFS spec | T0 trade protocols                                      |
| CryptoKit                  | T0.5 core                                               |
| Finder / Settings          | X ledger-ui                                             |
| iOS + frameworks           | C gtcx-os                                               |
| Data centers               | I fabric-os                                             |
| HIG + App Store rules      | U canon-os                                              |

**Canon rule:** Continuity is **trade objects**, not git repo sync.

---

## 7. Constitution amendment proposal (canon-os)

Proposed **Article IV bis — Trade lanes** (draft for canon-os ratification):

| Plane                  | Repo                  | Role                             |
| ---------------------- | --------------------- | -------------------------------- |
| **Trade core (C)**     | gtcx-os               | Protocol rail + platform domains |
| **Product (L\*)**      | Domain `-os` siblings | Businesses orbiting C            |
| **AI OS (A)**          | baseline-os           | Agent runtime                    |
| **Infra (I)**          | fabric-os             | Cloud control plane              |
| **Utilities (U)**      | canon-os, agile-os    | Law + sprints                    |
| **Program office (B)** | bridge-os             | Fleet assurance                  |

See handoff: [`to-canon-os-trade-ecosystem-lanes-2026-06-12.md`](../operations/coordination/to-canon-os-trade-ecosystem-lanes-2026-06-12.md).

---

## 8. Verification

| Gate                      | Command                                                                                     | Owner     |
| ------------------------- | ------------------------------------------------------------------------------------------- | --------- |
| Lane JSON schema          | `node -e "JSON.parse(require('fs').readFileSync('pm/spec/trade-ecosystem-lanes.v1.json'))"` | fabric-os |
| Fabric lane deploy matrix | Manual review + future `pnpm fabric:lanes:check`                                            | fabric-os |
| Bridge registry sync      | `pnpm ecosystem:execution-engine:check` (after bridge update)                               | bridge-os |
| Canon frame               | `pnpm validate:hub-scope` (canon-os)                                                        | canon-os  |

---

## 9. Related initiatives

See [`initiatives-from-domain-model-2026-06-12.md`](./initiatives-from-domain-model-2026-06-12.md).

---

_Draft — ecosystem strategy session 2026-06-12. Ratification: canon-os + bridge-os registry sync._
