# Roadmap

## Delivery Model

`gtcx-protocols` ships in phases. Each phase has explicit exit criteria. A phase is not complete until all criteria are met and human sign-off is recorded.

---

## v3.0 Delivery — Complete

All phases and milestones of the v3.0 delivery are complete as of 2026-02-21.

### Phases

| Phase                            | Focus                                        | Status   |
| -------------------------------- | -------------------------------------------- | -------- |
| Phase 0: Spec Alignment          | v3 spec mapped to backlog                    | Complete |
| Phase 1: Foundations             | Schemas, crypto baseline, network messaging  | Complete |
| Phase 2: Protocol MVPs           | TradePass, GeoTag, GCI, VaultMark MVPs       | Complete |
| Phase 3: Settlement + Governance | PvP, governance, compliance reporting        | Complete |
| Phase 4: Production Readiness    | Performance, observability, tests, docs      | Complete |
| Post-MVP: Agent SDK              | AI-native agent SDK, templates, test harness | Complete |
| Post-MVP: Production Crypto      | gtcx-core bindings wired into `@gtcx/crypto` | Complete |

### Milestones

| Milestone          | Outcome                                                                    | Status   |
| ------------------ | -------------------------------------------------------------------------- | -------- |
| M1: v3 Schema Core | `@gtcx/schemas` core types, registry, validation                           | Complete |
| M2: TradePass MVP  | DID issuance, biometrics, credential taxonomy, predicate model             | Complete |
| M3: GeoTag MVP     | Multi-source capture, spoof detection, licensed site registry, proof chain | Complete |
| M4: GCI MVP        | Scoring engine, update events, appeals                                     | Complete |
| M5: VaultMark MVP  | Custody states, events, seals                                              | Complete |
| M6: PvP MVP        | Escrow + PANX validation + settlement + disputes                           | Complete |
| M7: PANX Hardening | Consensus thresholds, validator weights, audit logs                        | Complete |
| M8: Compliance API | Regulatory reports, verification endpoints                                 | Complete |
| M9: Observability  | Logs, metrics, health endpoints                                            | Complete |
| M10: Certification | Protocol compliance test suite passing                                     | Complete |
| M11: Agent SDK     | AI-native agent SDK, templates, and test harness                           | Complete |

---

## Sprint History (2026 Q1)

| Sprint   | Goal                       | Dates        | Status   |
| -------- | -------------------------- | ------------ | -------- |
| Sprint 1 | Roadmap/Spec Alignment     | Feb 21–Mar 6 | Complete |
| Sprint 2 | Lint Gate Expansion        | Mar 7–Mar 20 | Complete |
| Sprint 3 | AI Agent SDK (BL-030)      | Mar 21–Apr 3 | Complete |
| Sprint 4 | Production Crypto Provider | Feb 21–Mar 6 | Complete |
| Sprint 5 | DID Document Model         | Mar 7–Mar 20 | Complete |
| Sprint 6 | Docs Canon Consolidation   | Feb 22–Mar 7 | Complete |

Sprint notes are saved under `sprints/`.

---

## Current State

The repo is in ongoing maintenance mode. v3.0 delivery is complete. Work is driven by:

- Security gap remediation from `_sop/2-docs/3-engineering/security/threat-models.md`
- Production store integration from `_sop/2-docs/4-operations/runbooks/production-store-integration.md`
- New backlog items added to `backlog.md` as scope is identified

---

## Next Sprint

New sprints are numbered sequentially from Sprint 7. Create `sprints/sprint-7-{date}.md` when the next sprint begins.

To start a sprint:

1. Select items from `backlog.md` that are `Open`
2. Define a single sprint goal
3. Write explicit exit criteria
4. Create the sprint notes file

---

_Source: `_archive/legacy/2-specs/_project/planning/roadmap.md`_
