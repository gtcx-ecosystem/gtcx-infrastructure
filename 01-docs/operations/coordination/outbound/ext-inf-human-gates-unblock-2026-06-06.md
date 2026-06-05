---
title: 'EXT-INF human gates — who unblocks (gtcx-infrastructure)'
status: current
date: 2026-06-06
owner: gtcx-infrastructure
---

# EXT-INF human gates — unblock matrix (XC track)

**One-line read:** **gtcx-infrastructure** engineering is in **witness mode** for these gates. They affect **XC** (external clearance), not IR code lifts. Agents scaffold evidence only — **Class S** for signatures and owner assignment.

## Not agent-automatable

| Gate                  | ID              | Owner                  | What they deliver                                                                                           | Due (target) |
| --------------------- | --------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------- | ------------ |
| Pen-test SOW          | **EXT-INF-002** | Security + procurement | Signed vendor SOW; links ecosystem H-05 / INT-S12-01                                                        | 2026-06-13   |
| ZWCMP pilot owner     | **EXT-INF-013** | Leadership             | Named owner + first cadence call in [`pilot-success-criteria.md`](../../../audit/pilot-success-criteria.md) | 2026-06-07   |
| DPA + pilot agreement | **EXT-INF-014** | Legal + pilot owner    | Signed DPA (ZW ↔ af-south-1) + pilot PDFs under `01-docs/05-audit/vendor-outreach/zwcmp/`                   | 2026-06-21   |
| Indemnified SLA       | **EXT-INF-015** | Legal                  | SLA v1.0 legal review + insurance quote (`verification-sla-draft.md` base)                                  | 2026-06-21   |
| SOC 2 Type I auditor  | **EXT-INF-016** | CISO + Finance         | Auditor engagement + budget (distinct from EXT-INF-013 pilot owner)                                         | TBD          |

## Cross-repo pen-test (EXT-INF-002)

| Repo                | Role                                                                                                                                                                                               |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| gtcx-intelligence   | INT-S12-01 witness — [outbound chase](https://github.com/gtcx-ecosystem/gtcx-intelligence/blob/main/01-docs/04-ops/coordination/outbound/to-human-security-int-s12-01-pentest-chase-2026-06-06.md) |
| gtcx-core           | Vendor pack delivered — infra live-stack test owner                                                                                                                                                |
| gtcx-infrastructure | Intake evidence [`pen-test-intake-evidence-2026-05-31.md`](../../../audit/pen-test-intake-evidence-2026-05-31.md); **S2-13** blocked until SOW                                                     |

## Agent boundary

- `pnpm agent:next-work` → `backlogClear: true` (IR-3.4 / IR-4.1 / IR-5.2 **done** 2026-06-07); EXT-INF human gates **parallel** (Class S)
- **IR lifts** complete for current register — witness until EXT-INF signatures or new IR rows added
- **Forbidden:** mark S2-13 / EXT-INF rows `done` without human signature witness

## Register

[`external-dependencies-register-2026-05-31.md`](../../../audit/external-dependencies-register-2026-05-31.md)
