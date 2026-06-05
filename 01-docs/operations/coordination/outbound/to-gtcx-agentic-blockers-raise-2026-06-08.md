---
title: 'Outbound — gtcx-infrastructure blockers raise (human + XC)'
status: current
date: 2026-06-08
owner: gtcx-infrastructure
to: gtcx-agentic
from: gtcx-infrastructure
protocol: gtcx-docs/01-docs/governance/protocols/24-cross-repo-coordination/protocol.md
document_id: INFRA-OUT-AGENTIC-BLOCKERS-001
priority: P0
tags: ['coordination', 'outbound', 'human-gates', 'ext-inf', 'witness']
---

# Outbound — raise blockers to gtcx-agentic

**One-line read:** `gtcx-infrastructure` **IR witness is green** (`validate-all` 50/50, lane-1 **7.9**, bank-grade **8.3**). **XC human gates block pilot revenue** — route Class S pings through **gtcx-agentic** human-external queue; infra agents scaffold evidence only.

**From:** gtcx-infrastructure @ `089ee5e` (+ uncommitted S4-06 README sweep)  
**To:** gtcx-agentic coordination + human-gates runners  
**Authority:** Protocol 24 step 3 inbound · Protocol 28 Class S for signatures

---

## Infra engineering state (not blockers for agentic)

| Signal             | Value                | Evidence                                                                            |
| ------------------ | -------------------- | ----------------------------------------------------------------------------------- |
| Implement queue    | `backlogClear: true` | `pnpm agent:next-work`                                                              |
| validate-all       | **50/50 PASS**       | `node 03-platform/tools/03-platform/scripts/validate-all.mjs`                       |
| Lane 1 engineering | **7.9**              | [`engineering-audit-2026-06-07.md`](../../../audit/engineering-audit-2026-06-07.md) |
| Lane 4 bank-grade  | **8.3**              | [`bank-grade-audit-2026-06-07.md`](../../../audit/bank-grade-audit-2026-06-07.md)   |
| Sprint 4 code      | S4-04/05/06 **done** | [`execution-roadmap.md`](../../../audit/execution-roadmap.md)                       |
| Optional P2        | S4-07 test flake     | `pnpm test` quick 1/359 — does not block validate-all                               |

**Forbidden:** Treat EXT-INF as merge freeze on infra IR; parallel witness required.

---

## Blockers to raise (agentic pickup)

| ID                                     | Work                                 | Class            | Infra status                                                                          | Agentic ask                                                                                                                                                                    |
| -------------------------------------- | ------------------------------------ | ---------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **EXT-INF-002** / **S2-13** / **H-05** | Pen-test **SOW** signed              | **S**            | Intake + vendor pack ack **done**; SOW **open** (target 2026-06-13)                   | Escalate Security/procurement; attach [`pen-test-intake-evidence-2026-05-31.md`](../../../audit/pen-test-intake-evidence-2026-05-31.md) + core FA-S6-02 pack to H-05 one-liner |
| **EXT-INF-013**                        | ZWCMP **pilot owner** + cadence      | **S**            | **Overdue** (Sprint 1 target 2026-06-07)                                              | Leadership ping per Q6 profile; update [`pilot-success-criteria.md`](../../../audit/pilot-success-criteria.md)                                                                 |
| **EXT-INF-014**                        | DPA + pilot agreement                | **S**            | Blocked on EXT-INF-013                                                                | Legal packet when owner named; witness `01-docs/05-audit/vendor-outreach/zwcmp/`                                                                                               |
| **EXT-INF-015**                        | Indemnified SLA legal + insurance    | **S**            | Draft at [`verification-sla-draft.md`](../../../compliance/verification-sla-draft.md) | Legal review scheduling                                                                                                                                                        |
| **EXT-INF-016**                        | SOC 2 Type I auditor                 | **S**            | Not engaged                                                                           | CISO + Finance engagement (distinct from EXT-INF-013)                                                                                                                          |
| **EXT-INF-003**                        | Recurring **WORM** upload on main    | **A** (operator) | Workflow exists; operator recurrence open                                             | Coordinate operator runbook witness with infra ops                                                                                                                             |
| **S4-03**                              | PRD-002 Tier B DID resolver contract | external         | Blocked on **gtcx-protocols**                                                         | Link protocols contract alignment; infra staging route ready                                                                                                                   |
| **H-03**                               | Sovereign CSP countersign            | **S**            | Infra XR-402 ceremony **done**; protocols preimage ready                              | Agentic ceremony witness per register — unblocks **#61** / **XR-518** infra scale                                                                                              |
| **MA-003 / XR-518**                    | Issuer scale post H-03               | **A**            | Prep-ready in protocols                                                               | Schedule infra custodian apply after H-03                                                                                                                                      |

---

## Evidence pointers (infra SoR)

| Topic                | Path                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| XC register          | [`external-dependencies-register-2026-05-31.md`](../../../audit/external-dependencies-register-2026-05-31.md)                  |
| Human gate matrix    | [`ext-inf-human-gates-unblock-2026-06-06.md`](./ext-inf-human-gates-unblock-2026-06-06.md)                                     |
| Pen-test intake      | [`pen-test-intake-evidence-2026-05-31.md`](../../../audit/pen-test-intake-evidence-2026-05-31.md)                              |
| GTM audit (GR-T3)    | [`gtm-audit-2026-06-05.md`](../../../audit/gtm-audit-2026-06-05.md)                                                            |
| Launch focus         | `.baseline/launch-focus.json` — `sessionMode: witness`, human: EXT-INF-002                                                     |
| EXT-INF-002 pack ack | [`from-gtcx-infrastructure-ext-inf-002-pack-ack-2026-06-07.md`](./from-gtcx-infrastructure-ext-inf-002-pack-ack-2026-06-07.md) |

---

## Requested agentic deliverables

1. **Ack** this outbound → `from-gtcx-infrastructure-blockers-raise-2026-06-08.md` on gtcx-agentic.
2. **Update** [`human-external-blocker-register-2026-06.md`](https://github.com/gtcx-ecosystem/gtcx-agentic/blob/main/01-docs/04-ops/coordination/human-external-blocker-register-2026-06.md) — add **INF-XC** rows for EXT-INF-013/014/015/016 + overdue flag on 013.
3. **Hub / human batch** — one Status Update block for program lead (P26): EXT-INF-013 overdue + EXT-INF-002 SOW due 2026-06-13.
4. **`pnpm agent:human-gates:check`** after manifest/register update.
5. **Optional:** `ecosystem:repo:report-work --repo=gtcx-infrastructure --item="XC human gates raised to agentic" --status=blocked` from baseline-os.

---

## Explicitly not requesting from agentic

| Item                       | Owner                                             |
| -------------------------- | ------------------------------------------------- |
| S4-06 README sweep commit  | gtcx-infrastructure (uncommitted in working tree) |
| S4-07 test flake fix       | gtcx-infrastructure P2                            |
| `git push` sandbox unblock | Operator / Cursor permissions                     |
| IR dimension lifts         | Infra witness — backlog clear                     |
