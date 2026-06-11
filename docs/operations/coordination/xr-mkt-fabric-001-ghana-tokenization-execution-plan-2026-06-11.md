---
title: 'PROG-GHANA-TOKENIZATION-001 — cross-repo execution plan'
status: current
date: 2026-06-11
owner: fabric-os
canonical_repo: gtcx-infrastructure
program: PROG-GHANA-TOKENIZATION-001
ticket: XR-MKT-FABRIC-001
protocol: P24
priority: P0
blocksIR: false
---

# PROG-GHANA-TOKENIZATION-001 — Ghana sovereign mining and tokenization

> **North star:** One bounded Ghana transaction — verified asset → investable
> instrument → compliant issuance → transfer → distribution → redemption — with
> regulator-ready evidence.
>
> **Fabric role:** Program orchestration only. Authority SoR remains with named
> product, protocol, institution, and human owners below.

**Ack:** [`from-gtcx-infrastructure-xr-mkt-fabric-001-ack-2026-06-11.md`](./from-gtcx-infrastructure-xr-mkt-fabric-001-ack-2026-06-11.md)  
**Originating handoff:** markets-os `to-fabric-os-ghana-tokenization-platform-scope-2026-06-11.md`

---

## 1. Phase map

```
P0 contracts ──► P1 bounded Ghana pilot ──► P2 live permissioned tokenization ──► P3 portfolio expansion
     │                    │                           │                                    │
  Markets +           one asset +                  audited contracts +               multi-asset +
  ledger-ui           one instrument +             live custody/settlement           sovereign nodes
  fixtures            one investor cohort
```

| Phase  | Label                                  | Exit witness                                                                                 |
| ------ | -------------------------------------- | -------------------------------------------------------------------------------------------- |
| **P0** | Contracts and demonstrable workflow    | Typed lifecycle contracts frozen; ledger-ui fixtures; Markets stub-to-API wiring green in CI |
| **P1** | Bounded Ghana pilot                    | One end-to-end subscription → issuance → transfer → redemption + daily reconciliation pack   |
| **P2** | Live permissioned tokenization         | Regulatory approval + production chain + live custody attestations                           |
| **P3** | Portfolio and sovereign-node expansion | Multi-asset onboarding + federation corridors                                                |

---

## 2. Dependency graph (authority ownership)

```mermaid
flowchart TB
  subgraph fabric["fabric-os (gtcx-infrastructure)"]
    ORCH[Program orchestration + assurance]
  end
  subgraph product["Product execution"]
    MKT[markets-os — transaction kernel]
    UI[ledger-ui — reusable tokenization UI]
  end
  subgraph identity["Identity & eligibility"]
    TP[TradePass / Veritas / GCI owners]
  end
  subgraph asset["Asset & spatial authority"]
    TERRA[terra-os / exploration-os / Ghana authorities]
  end
  subgraph compliance["Compliance & reporting"]
    COS[compliance-os + protocol owners]
  end
  subgraph custody["Custody & reserves"]
    VAULT[VaultMark / GoldBod integration owners]
  end
  subgraph settlement["Payment & settlement"]
    PVP[PvP / PANX / infrastructure owners]
  end
  subgraph runtime["Runtime & assurance"]
    INF[gtcx-infrastructure — chains, secrets, DR, pen-test]
  end
  subgraph legal["Legal & regulatory"]
    HUMAN[Human legal/regulatory owners — Class S]
  end

  ORCH --> MKT
  ORCH --> UI
  MKT --> TP
  MKT --> TERRA
  MKT --> COS
  MKT --> VAULT
  MKT --> PVP
  MKT --> INF
  UI --> MKT
  MKT --> HUMAN
  COS --> HUMAN
  VAULT --> HUMAN
```

**Hard rule:** Fabric, bridge-os, and baseline-os **do not** own transaction state,
legal register, chain supply, or compliance decisions.

---

## 3. Parallel workplan

### 3a. markets-os (backend track) — primary executor

| Story     | Title                                       | Acceptance evidence                  | Depends on                       |
| --------- | ------------------------------------------- | ------------------------------------ | -------------------------------- |
| MKT-GH-00 | Freeze tokenization lifecycle API contracts | OpenAPI/types PR + CI contract tests | —                                |
| MKT-GH-01 | Production issuance + allotment path        | Integration tests + signed receipt   | MKT-GH-00, identity stubs → live |
| MKT-GH-02 | Transfer policy + concentration limits      | Fail-closed transfer tests           | MKT-GH-01, TP claims             |
| MKT-GH-03 | Distribution + redemption orchestration     | End-to-end pilot script              | MKT-GH-02, PvP stubs → live      |
| MKT-GH-04 | Multi-ledger reconciliation job             | Daily reconciliation report JSON     | MKT-GH-03                        |
| MKT-GH-05 | Operator + investor API routes              | Route tests + auth matrix            | MKT-GH-00                        |

**Existing baseline:** pilot engines documented in originating handoff; chain,
custody, GoldBod, and fund-admin integrations remain stubbed until P1 gates clear.

### 3b. ledger-ui (design track) — parallel from P0

| Story    | Title                                                | Acceptance evidence            | Depends on               |
| -------- | ---------------------------------------------------- | ------------------------------ | ------------------------ |
| UI-GH-00 | Tokenization lifecycle fixture pack                  | Storybook/fixture JSON in repo | MKT-GH-00 contract draft |
| UI-GH-01 | Lifecycle stepper + assurance timeline               | Component tests + a11y         | UI-GH-00                 |
| UI-GH-02 | Issuance wizard primitives                           | Fixture-driven stories         | UI-GH-00                 |
| UI-GH-03 | Reserve attestation + claims matrix panels           | Visual regression              | UI-GH-00                 |
| UI-GH-04 | Ownership register + transfer/redemption patterns    | Component tests                | UI-GH-01                 |
| UI-GH-05 | Reconciliation drift + kill-switch recommendation UI | Fixture: normal + drift states | UI-GH-04                 |

**Split:** ledger-ui owns **reusable, fixture-driven components**; markets-os
owns routes, permissions, API clients, regulatory behavior, and integration tests.

**Inbound to ledger-ui:** fabric-os to open
`to-ledger-ui-ghana-tokenization-ui-track-2026-06-11.md` in ledger-ui repo
(owner-repo action).

### 3c. fabric-os (orchestration track)

| Story     | Title                                | Acceptance evidence                           |
| --------- | ------------------------------------ | --------------------------------------------- |
| FAB-GH-00 | Ack + execution plan                 | This document + ack                           |
| FAB-GH-01 | Phase 0 assurance at contract freeze | `audit/evidence/fabric-assurance-latest.json` |
| FAB-GH-02 | Hub milestone rows per phase seal    | baseline-os agentic-state update              |
| FAB-GH-03 | Runtime readiness matrix for P1      | Infra staging matrix + pen-test window        |

---

## 4. Named owners (live dependencies)

| Domain                         | Primary owner                                       | Fabric coordination                  |
| ------------------------------ | --------------------------------------------------- | ------------------------------------ |
| Transaction kernel             | **markets-os**                                      | Weekly status via hub                |
| Tokenization UI primitives     | **ledger-ui**                                       | Parallel track from P0               |
| Identity / AML / accreditation | TradePass / Veritas / GCI                           | Block MKT-GH-02 until claims live    |
| Cadastre / asset passport      | **terra-os**, **exploration-os**, Ghana authorities | Block P1 asset selection             |
| Compliance decisions / filings | **compliance-os**, protocol owners                  | Evidence pack template               |
| Custody / reserves             | VaultMark / GoldBod integrators                     | Block P2                             |
| Settlement / DvP               | PvP / PANX / **gtcx-infrastructure**                | XR-MKT-011 authority matrix extended |
| Runtime / DR / pen-test        | **gtcx-infrastructure**                             | EXT-INF-002 window 2026-06-17..21    |
| Legal / regulatory             | **Human (Class S)**                                 | See §7                               |
| ZenHub / fleet gates           | **bridge-os**                                       | `pnpm ecosystem:fabric:check`        |

---

## 5. Phase 0 stories (immediate)

| ID        | Owner               | Done when                                                            |
| --------- | ------------------- | -------------------------------------------------------------------- |
| MKT-GH-00 | markets-os          | Lifecycle types + OpenAPI frozen; CI contract gate green             |
| UI-GH-00  | ledger-ui           | Fixture pack covers normal, rejected, pending, default, drift        |
| FAB-GH-00 | fabric-os           | Ack + plan published (**done**)                                      |
| COS-GH-00 | compliance-os       | Instrument classification checklist for first SPV/right type         |
| INF-GH-00 | gtcx-infrastructure | Staging secrets matrix row for tokenization operators (no prod keys) |

**P0 exit:** Interactive operator + investor workflows against controlled stubs;
fail-closed behavior and signed evidence chain preserved.

---

## 6. Phase 1 stories (bounded Ghana pilot)

| ID         | Owner                             | Done when                                                      |
| ---------- | --------------------------------- | -------------------------------------------------------------- |
| P1-ASSET   | terra-os + exploration-os + human | One verified cooperative/project cohort selected               |
| P1-LEGAL   | human (Class S)                   | One SPV or issuance vehicle + offering terms executed          |
| P1-ID      | TradePass / Veritas               | One investor cohort with live claims                           |
| P1-TX      | markets-os                        | Subscription → issuance → distribution → transfer → redemption |
| P1-RECON   | markets-os                        | Daily multi-ledger reconciliation + regulator evidence pack    |
| P1-RUNTIME | gtcx-infrastructure               | Staging deploy proof + observability + incident runbook        |

**P1 exit:** Single bounded transaction with daily reconciliation and exportable
evidence pack. **Not** national scale, **not** committed $250M financing.

---

## 7. Human / legal gates (Class S — parallel, not repo-blocked)

| Gate                                            | Owner                     | Blocks                |
| ----------------------------------------------- | ------------------------- | --------------------- |
| Instrument legal structure + offering docs      | Human legal               | P1-LEGAL              |
| Regulatory sandbox / VASP approval              | Human regulatory          | P2                    |
| Custody + reserve attestation agreements        | Human + VaultMark/GoldBod | P2                    |
| Partner LOIs (government, refinery, fund admin) | Human GTM                 | P1 asset selection    |
| EXT-INF-002 pen-test SOW countersign            | Human Security            | Production assurance  |
| EXT-INF-014 DPA + pilot agreement               | Human Legal               | ZWCMP-adjacent pilots |
| Production issuance / fund movement             | Human sovereign           | P2+                   |

Fabric **records** these gates; it does **not** execute Class S approvals.

---

## 8. Assumptions (explicit — no false claims)

- Source proposal documents (`GTCX-Ghana-Detailed-Proposal*.docx`) are **not** in
  repo; scope is captured only via the markets handoff.
- Partner commitments, financing amounts, and regulatory approvals are **not**
  assumed production-ready without dated evidence artifacts.
- Permissioned-token mainnet deployment requires P2 gates; P0–P1 use controlled
  stubs or approved sandbox only.
- National-scale expansion is **P3**; not in scope for current sprint selection.

---

## 9. Sequencing (next 14 days)

| Week | Markets                   | ledger-ui               | fabric-os                     | bridge-os                                     |
| ---- | ------------------------- | ----------------------- | ----------------------------- | --------------------------------------------- |
| W1   | MKT-GH-00 contract freeze | UI-GH-00 fixtures       | FAB-GH-01 assurance at freeze | ZenHub epic under PROG-GHANA-TOKENIZATION-001 |
| W2   | MKT-GH-01 issuance path   | UI-GH-01..02 components | INF-GH-00 staging matrix      | Fleet fabric check                            |
| W3   | MKT-GH-02 transfers       | UI-GH-03..04            | P1 gate review                | Delegate REM-\* from assurance                |

---

## 10. References

- markets-os: `docs/architecture/eix/fractionalization.md`, `authority-model.md`
- gtcx-infrastructure: XR-MKT-011 authority URL matrix
- bridge-os: `pm/spec/service-fabric.v1.json`, `pm/spec/gtcx-execution-engine.v1.json`
- compliance-os: cloud placement + W2 hub witnesses
