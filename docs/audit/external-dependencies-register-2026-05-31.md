---
title: 'gtcx-infrastructure — External Dependencies Register'
status: 'current'
date: '2026-05-31'
owner: 'gtcx-infrastructure'
role: 'quality-evidence-lead'
tier: 'critical'
tags: ['audit', 'external', 'dependencies', '10-10', 'zwcmp', 'pilot']
review_cycle: 'weekly'
internal_readiness: 6.8
certified_composite: 6.2
supersedes: docs/audit/external-dependencies-register-2026-05-28.md
---

# gtcx-infrastructure — External Dependencies Register (2026-05-31)

> Supersedes `external-dependencies-register-2026-05-28.md`. Scoring baseline
> updated to match the 2026-05-30 audit cluster (post-roadmap-session = 6.8/6.2)
> per Q3 of `docs/audit/execution-roadmap.md`. The 8.8/10 figure in the prior
> register assumed Phase 0 gates green at HEAD; the 2026-05-30 audit showed
> they were not.

---

## What changed since 2026-05-28

| Change                                                                      | Source                                                          |
| --------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Scoring baseline lowered (10.0/8.8 → 6.8/6.2)                               | post-roadmap-session-2026-05-30.md §"Scoring delta"             |
| **NEW EXT-INF-013** — ZWCMP pilot owner + cadence call                      | post-roadmap-session-2026-05-30.md §"What blocks ZWCMP" + S1-09 |
| **NEW EXT-INF-014** — DPA ZW ↔ af-south-1 + pilot agreement signature       | execution-roadmap.md S3-11 + post-roadmap "Bet 2"               |
| **NEW EXT-INF-015** — Indemnified verification SLA legal review + insurance | execution-roadmap.md S3-08 + commit `a490fb6` (draft)           |
| EXT-INF-002 escalated (P0 in execution-roadmap S2-13)                       | execution-roadmap.md Q5                                         |

---

## Itemized register — net-new entries (2026-05-31)

| ID              | Dependency                                                                      | Type             | Owner                                                                                                                                                         | Blocker for                                       | Status                                                                                              | Target ETA                | Evidence when complete                                                              | Score impact                 |
| --------------- | ------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------- | ---------------------------- |
| **EXT-INF-013** | **ZWCMP pilot — named GTCX owner + first cadence call** (S1-09)                 | External / GTM   | **TBD — profile decided 2026-05-31: senior pilot-facing operator, regulator-comfort + Chamber-of-Mines fluency, prior African-central-bank pilot experience** | Bet 2 (sign ZWCMP); Sprint 1 close                | **open** — placeholder in `pilot-success-criteria.md:27`; Q6 answered, awaiting candidate selection | 2026-06-07 (Sprint 1 end) | Owner name in `pilot-success-criteria.md`; calendar link committed to this register | Bet 2 unblock                |
| **EXT-INF-014** | DPA (Zimbabwe ↔ AWS af-south-1) + pilot agreement signature                     | Legal / external | legal-lead + EXT-INF-013 owner                                                                                                                                | First signed evidence-bundle delivery             | **open** — drafting blocked on EXT-INF-013                                                          | 2026-06-21 (Sprint 3 end) | DPA PDF + pilot agreement PDF in `docs/audit/vendor-outreach/zwcmp/`                | Bet 2 close                  |
| **EXT-INF-015** | Indemnified verification SLA — legal review + insurance quote + cap negotiation | Legal / external | legal-lead                                                                                                                                                    | Pilot agreement (EXT-INF-014) references SLA v1.0 | **open** — `verification-sla-draft.md` shipped (commit `a490fb6`)                                   | 2026-06-21                | SLA v1.0 PDF + insurance quote + commit to `docs/compliance/`                       | Bet 2 close + Composite +0.4 |

## Carried forward from 2026-05-28 register (still open)

The 12 EXT-INF-001 through EXT-INF-012 entries from `external-dependencies-register-2026-05-28.md` remain valid. Status changes:

| ID              | Prior status              | 2026-05-31 status                                                                                                                                    |
| --------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| EXT-INF-001     | open — kickoff pack ready | unchanged                                                                                                                                            |
| **EXT-INF-002** | open — RFP/scope ready    | escalated to P0 in execution-roadmap S2-13; Q5 ANSWERED 2026-05-31 (pen-test AFTER Sprint 1) — SOW signature in Sprint 2 targets post-Sprint-1 state |
| EXT-INF-003     | open — script not wired   | unchanged                                                                                                                                            |
| EXT-INF-004     | open                      | INF-49 substrate landed (commit `dd46907`); DNS + cert still TBD                                                                                     |
| EXT-INF-005     | open                      | unchanged                                                                                                                                            |
| EXT-INF-006     | open                      | mapped to S3-02 in execution-roadmap                                                                                                                 |
| EXT-INF-007     | open                      | unchanged                                                                                                                                            |
| EXT-INF-008     | conditional               | unchanged                                                                                                                                            |
| EXT-INF-009     | de-scoped (ADR-023)       | unchanged                                                                                                                                            |
| EXT-INF-010     | open                      | EXT-INF-015 (SLA) tracks parallel work                                                                                                               |
| EXT-INF-011     | open                      | unchanged                                                                                                                                            |
| EXT-INF-012     | open                      | unchanged                                                                                                                                            |

---

## Decisions needed from leadership (mirrored from execution-roadmap.md)

These are the Q1–Q7 items from `execution-roadmap.md`. Until they're answered,
the owners + ETAs above are best guesses.

- **Q5 (Pen-test ordering)** — **ANSWERED 2026-05-31: AFTER.** Ratify Sprint 1 + execute first (already done); commission pen-test against the post-Sprint-1 state. EXT-INF-002 ETA stays on the post-SoW schedule (no +4w delay).
- **Q6 (Product motion)** — **ANSWERED 2026-05-31: SALES-LED.** EXT-INF-013 owner profile = senior pilot-facing operator, regulator-comfort + Chamber-of-Mines political fluency, prior African-central-bank pilot experience. Sprint 3 headline is S3-11 (ZWCMP signature); S3-07 (publish primitives) runs in parallel but does not gate.

---

## How to use this file

- Status is `open | in-progress | blocked | done | de-scoped`.
- When an item closes, link the evidence (PDF, commit SHA, dashboard screenshot) inline.
- Re-issue (don't edit) when the audit baseline changes — supersede the prior file via `supersedes:` in frontmatter.
