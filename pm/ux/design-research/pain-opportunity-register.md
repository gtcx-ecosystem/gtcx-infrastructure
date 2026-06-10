---
title: Pain → opportunity register
date: 2026-06-10
---

# Pain → opportunity register

| ID     | Pain                                                                  | Opportunity                                                            | Persona            | JTBD                         | Priority | Evidence                                                                               |
| ------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------ | ---------------------------- | -------- | -------------------------------------------------------------------------------------- |
| UX-P01 | Agent dumps `aws`/`kubectl` runbooks to human (P27 violation)         | Enforce repo scripts + Status Update with exit codes                   | platform-operator  | JTBD-staging-substrate-ready | P0       | `validated` — master-audit 2026-06-10, `.cursor/rules/agent-p27-no-operator-dumps.mdc` |
| UX-P02 | External hostname probe fails while in-cluster healthy                | In-cluster fallback in fleet probe; document CF origin gaps separately | platform-operator  | JTBD-fleet-health-witness    | P0       | `validated` — compliance-gateway 525 vs in-cluster 200, commit e97bab2                 |
| UX-P03 | Sibling integrator unclear when infra handoff is "done"               | Standard outbound seal template + DaaS card per repo                   | sibling-integrator | JTBD-staging-substrate-ready | P0       | `validated` — DAAS-S2 cards                                                            |
| UX-P04 | Sovereign approval conflated with vendor completion                   | Split sovereign vs friction registers (P42)                            | security-operator  | JTBD-security-evidence-path  | P0       | `validated` — EXT-INF-002 approved vs SEC-PENTEST-01 open                              |
| UX-P05 | No pm/ux SoR — engineering specs accumulate without operator journeys | This `pm/ux` tree + EXR operator pack                                  | platform-operator  | all P0 JTBDs                 | P0       | `inferred-from-audit` — A1 gap                                                         |
| UX-P06 | Staging cluster CPU contention blocks rollouts                        | Replicas patches + capacity runbook row                                | platform-operator  | JTBD-staging-substrate-ready | P1       | `validated` — session 2026-06-10                                                       |
| UX-P07 | Product PM asked to own pen-test scheduling                           | SECaaS program ownership explicit in UX + PRD                          | security-operator  | JTBD-security-evidence-path  | P1       | `validated` — security-as-a-service.md                                                 |

## Promoted lifts (next PRD/story)

1. **UX-P05** → complete traceability (this pass) + `pm:ux:check` in bridge-os fleet harness.
2. **UX-P02** → track CF origin wiring for compliance-gateway external hostname (infra follow-up).
3. **UX-P04** → auto-friction transition when sovereign register updates.
