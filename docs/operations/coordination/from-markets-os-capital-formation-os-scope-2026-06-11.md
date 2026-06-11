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

## Summary

Expand PROG-TOKENIZATION-001 into **Capital Formation OS** per `docs/specs/capital-markets-operating-system-product-spec.md` and time-boxed market protocol spec. fabric-os owns programme coordination and infra delegation.

## Requested action

1. Adopt PROG-CAPITAL-FORMATION-001 scope (supersedes XR-MKT-FABRIC-001 tokenization-only framing).
2. Publish fabric programme plan linking Ghana / ZWCMP / Kasai corpora to deployable milestones.
3. Route XR-MKT-FABRIC-002 acceptance through fabric-os outbound ack.

## Witness

`bridge-os/pm/ci/production-deploy-witness-latest.json` · markets-os `docs/operations/deployment-profile.json`

## Direction

The human lead has directed that analysis of the Ghana, ZWCMP, and Kasai deal
corpora be translated into a robust product vision and specification for what
Markets OS **should, could, and would** be if built today.

The resulting product north star is:

`markets-os/docs/specs/capital-markets-operating-system-product-spec.md`

Fabric must expand its current tokenization programme coordination into the
broader Capital Formation OS programme described in that specification.

The time-to-close and controlled-market protocol is:

`markets-os/docs/specs/time-boxed-capital-formation-market-protocol.md`

The professional-firm and independent-assurance network is:

`markets-os/docs/specs/institutional-assurance-network-product-spec.md`

The GTCX-native capability and external-authority composition map is:

`markets-os/docs/specs/gtcx-native-capability-and-authority-map.md`

The primary commercial engine is:
`markets-os/docs/specs/capital-discovery-and-formation-intelligence-product-spec.md`

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

| Workstream                                     | Primary owner                                             | Required outcome                                                                                                                                              |
| ---------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Programme orchestration                        | fabric-os                                                 | Dependency graph, milestones, owner allocation, assurance, hub status                                                                                         |
| Transaction Graph                              | markets-os                                                | Canonical opportunity, claim, right, obligation, vehicle, instrument, transaction, evidence, exception, and outcome model                                     |
| Opportunity and Evidence Graph                 | markets-os + intelligence/authority owners                | Ingest fragmented material, resolve claims, expose contradictions and missing proof                                                                           |
| Asset Passport and authority registry          | markets-os + terra-os + exploration-os + authority owners | Portable asset/project/programme identity with current evidence                                                                                               |
| Capital Compiler and Scenario Room             | markets-os                                                | Explainable ranked structures, capital stacks, waterfalls, covenants, scenarios                                                                               |
| Bankability Dependency and Commitment Graph    | markets-os + intelligence/authority owners                | Encode LOIs, MOUs, offtake, insurance, guarantees, support, conversion paths, and learned close configurations                                                |
| Capital Discovery and Formation Intelligence   | markets-os + griot-ai + terminal-os                       | Mandate-triggered pre-market, Capital Graph, qualified soft-circling, fundraising strategy, syndication, and outcome learning                                 |
| Two-sided Deal Team OS                         | markets-os + professional-service owners                  | Dedicated lister and investor teams combining governed agents with accountable human professionals                                                            |
| Institutional Assurance Network                | markets-os + independent professional owners              | Counsel-led deal channel and portable legal, valuation, model, technical, bankability, and settlement assurance                                               |
| GTCX-native transaction stack                  | fabric-os + ecosystem owners                              | Compose Terminal OS, Griot AI, Veritas, Compliance OS, protocols, Exploration OS, Terra OS, Ledger UI, and external authorities without duplicating ownership |
| Time-boxed primary market                      | markets-os + fabric-os                                    | Close-ready admission and terminal market outcome inside declared 7/14/30-day windows                                                                         |
| Controlled close                               | markets-os                                                | Conditions precedent, approvals, commitments, payments, issuance, closing evidence                                                                            |
| Ownership and controlled instruments           | markets-os + ledger-ui                                    | Direct, SPV/fund, and permissioned digital ownership lifecycle                                                                                                |
| Servicing and covenant engine                  | markets-os + authority owners                             | Obligations, performance, draws, distributions, monitoring, exception handling                                                                                |
| Workout and exit                               | markets-os + human/legal owners                           | Waiver, remediation, restructuring, enforcement, wind-down, redemption, exit                                                                                  |
| Controlled secondary liquidity                 | markets-os + authority owners                             | RFQ, block trade, periodic auction, buyback, redemption, and qualified continuous-market pathways                                                             |
| Regulatory adapter                             | compliance-os + markets-os                                | Jurisdiction profiles, classification, filings, restrictions, regulator evidence                                                                              |
| Runtime and assurance                          | fabric-os                                                 | Secure runtime, secrets, observability, DR, external assurance, deployment proof                                                                              |
| Product UI and assisted channels               | ledger-ui + markets-os + mobile/messaging owners          | Decision-first role surfaces, field/offline/voice/local-language access                                                                                       |
| Government and Institutional Authority Gateway | markets-os + compliance-os + authority owners             | Scoped approvals, confirmations, no-objections, policy support, endorsements, and continuing authority monitoring                                             |

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

### Epics 9–11 — Controlled Market and Assurance

| Epic                                            | Outcome                                                                                            | Required exit evidence                                                                                                                              |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 9 — Transaction Certainty and Time-Boxed Market | Every live listing is close-ready and reaches a declared terminal outcome inside 7, 14, or 30 days | Certainty Record, Close Readiness Score, deadline state machine, governed exceptions, two-sided deal teams, measured live-to-close performance      |
| 10 — Controlled Secondary Market                | Holders have compliant exit pathways appropriate to instrument liquidity and legal form            | Assignment, RFQ, block trade, call auction, buyback/redemption, transfer simulation, DvP/PvP, register reconciliation, gated continuous-market path |
| 11 — Institutional Assurance Network            | Professional firms use Markets for client deals and issue scoped, signed, portable conclusions     | Counsel channel, Assurance Passport, review modules, independence controls, explicit authority distinctions, one completed Assured Deal Programme   |

## Requested Fabric actions

1. Acknowledge `XR-MKT-FABRIC-002` and assign
   `PROG-CAPITAL-FORMATION-001`.
2. Preserve `PROG-TOKENIZATION-001` as a child workstream.
3. Publish a cross-repo dependency graph and phased execution plan for the
   ten epics.
4. Map existing Markets, tokenization, EIX, regulatory-adapter, ledger-ui,
   authority, and runtime work into the broader programme.
5. Identify ambiguous ownership, duplicated capabilities, and missing systems.
6. Register Class S legal/regulatory gates separately from executable product
   work.
7. Coordinate parallel execution without blocking current Sprint 82 UI work.
8. Treat the Transaction Certainty Record, time-boxed live market, and
   controlled secondary-liquidity ladder as programme-level capabilities.
9. Map the Two-Sided Deal Team OS across agent runtime, professional-service
   marketplace, identity, conflicts, privilege, billing, and licensed-human
   authority owners.
10. Add the Institutional Assurance Network as a programme workstream and
    identify legal, valuation, assurance, technical, banking, rating, custody,
    settlement, and regulatory owner dependencies.
11. Use the GTCX-native capability map as the owner-allocation baseline; treat
    external vendors as adapters, data providers, professional authorities, or
    execution rails rather than default product owners.
12. Elevate Capital Discovery and Formation Intelligence to the primary
    commercial workstream; mandate acceptance starts confidential pre-market,
    and no live listing proceeds below its qualified soft-circle threshold.

## Recommended sequencing

| Phase                     | Outcome                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| P0 — Product foundation   | Transaction Graph, claim taxonomy, archetype fixtures, programme map                           |
| P1 — Transaction factory  | Opportunity Room, Capital Compiler, Transaction Workspace, servicing baseline                  |
| P2 — Capital network      | Mandates, matching, syndication, reusable capital stacks, time-boxed live market               |
| P3 — Controlled market    | Ownership mechanisms, controlled secondary-liquidity ladder, refinancing, portfolio operations |
| P4 — Sovereign nodes      | Independently governed nodes and federation                                                    |
| P5 — Intelligence utility | Outcome-driven benchmarks, pricing, policy, and capital allocation                             |

## Acceptance criteria

1. Durable Fabric acknowledgement and programme identifier.
2. `PROG-TOKENIZATION-001` shown as a child, not the complete platform.
3. Cross-repo ownership and dependency graph for all ten epics.
4. Existing backlog mapped to the new programme with no loss of active work.
5. Initial executable stories for Transaction Graph and Opportunity/Evidence
   Room.
6. Human/legal gates and external assumptions explicitly separated.
7. Assurance plan that prevents unsupported claims and unauthorized money or
   ownership mutation.

## References

- `docs/specs/capital-markets-operating-system-product-spec.md`
- `docs/specs/time-boxed-capital-formation-market-protocol.md`
- `docs/specs/institutional-assurance-network-product-spec.md`
- `docs/specs/government-and-institutional-authority-gateway-product-spec.md`
- `docs/specs/gtcx-native-capability-and-authority-map.md`
- `docs/specs/capital-discovery-and-formation-intelligence-product-spec.md`
- `docs/specs/bankability-dependency-and-commitment-graph-product-spec.md`
- `docs/specs/tokenization-platform-requirements.md`
- `docs/specs/african-financial-markets-regulatory-adapter-requirements.md`
- `docs/strategy/e2e-transaction-shipping-spec-2026-06-09.md`
- `docs/operations/coordination/to-fabric-os-tokenization-platform-scope-2026-06-11.md`
- Fabric: `docs/operations/coordination/xr-mkt-fabric-001-tokenization-execution-plan-2026-06-11.md`

## Does NOT Cover

- Authorization to execute legal, regulated, production, funding, or ownership actions.
- Confirmation of partner, sovereign, financing, custody, or regulator commitments.
- Transfer of authority ownership to Markets or Fabric.
