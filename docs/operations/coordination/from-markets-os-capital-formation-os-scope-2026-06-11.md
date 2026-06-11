---
title: 'Handoff — expand PROG-TOKENIZATION-001 into Capital Formation OS'
status: open
date: 2026-06-11
from: markets-os
to: fabric-os
ticket: XR-MKT-FABRIC-002
program: PROG-CAPITAL-FORMATION-001
supersedes_scope: XR-MKT-FABRIC-001
protocol: P24
priority: P0
blocksIR: false
---

# Handoff: Capital Formation Operating System

## Direction

The human lead has directed that analysis of the Ghana, ZWCMP, and Kasai deal
corpora be translated into a robust product vision and specification for what
Markets OS **should, could, and would** be if built today.

The resulting product north star is:

`markets-os/docs/specs/capital-markets-operating-system-product-spec.md`

Fabric must expand its current tokenization programme coordination into the
broader Capital Formation OS programme described in that specification.

## Scope correction

`PROG-TOKENIZATION-001` correctly coordinates the controlled ownership and
tokenization lifecycle. It is now one workstream within a larger product.

The broader product takes opportunities through:

```text
discovery -> evidence -> rights -> bankability -> structuring -> capital stack
-> syndication -> controlled close -> ownership -> servicing -> liquidity/exit
-> learning and replication
```

Tokenization remains an optional ownership and distribution mechanism. It is
not the platform's primary identity.

## Source transaction archetypes

| Archetype                             | Example                   | Product requirement                                                                                              |
| ------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Sovereign commodity capital programme | Ghana SGCP                | Programme architecture, multi-instrument issuance, custody, regulator workflows, sovereign assurance             |
| Operator consortium                   | ZWCMP                     | Member onboarding, asset passports, equipment/working-capital facilities, offtake, borrowing base, distributions |
| Public-private verification programme | Kasai provincial platform | Programme governance, pilot milestones, verified flows, value-capture and royalty modeling                       |
| Early-stage permit portfolio          | Kasai AG INVEST           | Title/mandate verification, options, JV, staged exploration finance, issuance prevention gates                   |

## Required programme workstreams

| Workstream                            | Primary owner                                             | Required outcome                                                                                                          |
| ------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Programme orchestration               | fabric-os                                                 | Dependency graph, milestones, owner allocation, assurance, hub status                                                     |
| Transaction Graph                     | markets-os                                                | Canonical opportunity, claim, right, obligation, vehicle, instrument, transaction, evidence, exception, and outcome model |
| Opportunity and Evidence Graph        | markets-os + intelligence/authority owners                | Ingest fragmented material, resolve claims, expose contradictions and missing proof                                       |
| Asset Passport and authority registry | markets-os + terra-os + exploration-os + authority owners | Portable asset/project/programme identity with current evidence                                                           |
| Capital Compiler and Scenario Room    | markets-os                                                | Explainable ranked structures, capital stacks, waterfalls, covenants, scenarios                                           |
| Mandate and Capital Network           | markets-os                                                | Machine-readable capital-provider mandates, matching, syndication, and relationship status                                |
| Controlled close                      | markets-os                                                | Conditions precedent, approvals, commitments, payments, issuance, closing evidence                                        |
| Ownership and controlled instruments  | markets-os + ledger-ui                                    | Direct, SPV/fund, and permissioned digital ownership lifecycle                                                            |
| Servicing and covenant engine         | markets-os + authority owners                             | Obligations, performance, draws, distributions, monitoring, exception handling                                            |
| Workout and exit                      | markets-os + human/legal owners                           | Waiver, remediation, restructuring, enforcement, wind-down, redemption, exit                                              |
| Regulatory adapter                    | compliance-os + markets-os                                | Jurisdiction profiles, classification, filings, restrictions, regulator evidence                                          |
| Runtime and assurance                 | fabric-os                                                 | Secure runtime, secrets, observability, DR, external assurance, deployment proof                                          |
| Product UI and assisted channels      | ledger-ui + markets-os + mobile/messaging owners          | Decision-first role surfaces, field/offline/voice/local-language access                                                   |
| Human legal/regulatory authority      | human owners                                              | Enforceable rights, vehicles, instruments, approvals, agreements, regulated actions                                       |

## Product boundaries

Markets owns transaction state, listings, instruments, workflow orchestration,
ownership projections, servicing state, and transaction assurance.

Markets does not become authoritative for legal title, geology, identity, AML,
custody, payment finality, or regulatory approval. Required external authority
evidence remains fail-closed.

Fabric orchestrates the programme. It does not become a transaction or
regulatory system of record.

## Initial programme epics

### Epic 1 — Transaction Graph foundation

**Outcome:** One canonical, versioned graph connects opportunities, parties,
claims, rights, obligations, vehicles, instruments, capital stacks,
transactions, evidence, exceptions, and outcomes.

**Exit evidence:**

- typed contracts and persistence plan;
- claim-status taxonomy enforced in generated artifacts;
- migration map from Deal, EIX, fund, and tokenization objects;
- one Ghana, one ZWCMP, and one Kasai fixture.

### Epic 2 — Opportunity and Evidence Room

**Outcome:** Fragmented documents, calls, field data, and public records become
a queryable opportunity with claims, contradictions, evidence status, and
next-best diligence actions.

**Exit evidence:**

- corpus ingestion and claim extraction fixtures;
- evidence freshness and authority references;
- contradiction and claim-inflation controls;
- conditions-precedent and readiness output.

### Epic 3 — Capital Compiler and Scenario Room

**Outcome:** The platform converts rights, constraints, capital needs, and
objectives into ranked, explainable structures.

**Exit evidence:**

- instrument-template library across debt, equity, equipment finance,
  working capital, offtake, royalty, project/programme finance, funds, and
  controlled digital units;
- sources/uses, waterfall, covenant, security, guarantee, and scenario models;
- explainable recommendation and human approval record.

### Epic 4 — Mandate and Capital Network

**Outcome:** Capital-provider mandates are machine-readable and continuously
matched to eligible opportunities.

**Exit evidence:**

- mandate schema;
- match explanation, gaps, and shortest path to eligibility;
- relationship-status controls;
- multi-party capital-stack assembly workflow.

### Epic 5 — Transaction Workspace and Controlled Close

**Outcome:** One workspace governs terms, parties, conditions, approvals,
commitments, payments, ownership, and closing evidence.

**Exit evidence:**

- bounded transaction closes without bespoke engineering;
- idempotent funding and ownership mutations;
- complete signed close pack;
- segregation-of-duties and approval proof.

### Epic 6 — Servicing, Covenant, Workout, and Exit

**Outcome:** The platform remains useful after close and governs the full
economic lifecycle.

**Exit evidence:**

- monitored obligations and covenants;
- actual-versus-underwriting comparison;
- approved draws, distributions, notices, and interventions;
- default, restructuring, recovery, redemption, and wind-down fixtures.

### Epic 7 — Controlled Ownership and Tokenization

**Outcome:** Continue `PROG-TOKENIZATION-001` as the ownership/instrument
representation workstream inside the broader programme.

**Exit evidence:** Existing Fabric execution plan remains applicable, but its
scope and references point to the Capital Formation OS north star.

### Epic 8 — Network Intelligence and Sovereign Nodes

**Outcome:** Transaction outcomes improve future pricing, risk, matching, and
replication; independently governed nodes can use the shared kernel.

**Exit evidence:**

- outcome-learning and benchmark policy;
- node conformance and signed federation contracts;
- no shared mutable operational database;
- explicit sovereign data and authority controls.

## Requested Fabric actions

1. Acknowledge `XR-MKT-FABRIC-002` and assign
   `PROG-CAPITAL-FORMATION-001`.
2. Preserve `PROG-TOKENIZATION-001` as a child workstream.
3. Publish a cross-repo dependency graph and phased execution plan for the
   eight epics.
4. Map existing Markets, tokenization, EIX, regulatory-adapter, ledger-ui,
   authority, and runtime work into the broader programme.
5. Identify ambiguous ownership, duplicated capabilities, and missing systems.
6. Register Class S legal/regulatory gates separately from executable product
   work.
7. Coordinate parallel execution without blocking current Sprint 82 UI work.

## Recommended sequencing

| Phase                     | Outcome                                                                       |
| ------------------------- | ----------------------------------------------------------------------------- |
| P0 — Product foundation   | Transaction Graph, claim taxonomy, archetype fixtures, programme map          |
| P1 — Transaction factory  | Opportunity Room, Capital Compiler, Transaction Workspace, servicing baseline |
| P2 — Capital network      | Mandates, matching, syndication, reusable capital stacks                      |
| P3 — Controlled market    | Ownership mechanisms, approved liquidity, refinancing, portfolio operations   |
| P4 — Sovereign nodes      | Independently governed nodes and federation                                   |
| P5 — Intelligence utility | Outcome-driven benchmarks, pricing, policy, and capital allocation            |

## Acceptance criteria

1. Durable Fabric acknowledgement and programme identifier.
2. `PROG-TOKENIZATION-001` shown as a child, not the complete platform.
3. Cross-repo ownership and dependency graph for all eight epics.
4. Existing backlog mapped to the new programme with no loss of active work.
5. Initial executable stories for Transaction Graph and Opportunity/Evidence
   Room.
6. Human/legal gates and external assumptions explicitly separated.
7. Assurance plan that prevents unsupported claims and unauthorized money or
   ownership mutation.

## References

- `docs/specs/capital-markets-operating-system-product-spec.md`
- `docs/specs/tokenization-platform-requirements.md`
- `docs/specs/african-financial-markets-regulatory-adapter-requirements.md`
- `docs/strategy/e2e-transaction-shipping-spec-2026-06-09.md`
- `docs/operations/coordination/to-fabric-os-tokenization-platform-scope-2026-06-11.md`
- Fabric: `docs/operations/coordination/xr-mkt-fabric-001-tokenization-execution-plan-2026-06-11.md`

## Does NOT Cover

- Authorization to execute legal, regulated, production, funding, or ownership
  actions.
- Confirmation of partner, sovereign, financing, custody, or regulator
  commitments.
- Transfer of authority ownership to Markets or Fabric.
