---
title: 'Audit score reconciliation'
status: current
date: '2026-06-01'
owner: quality-evidence-lead
tier: critical
tags: ['audit', 'scoring', 'reconciliation']
review_cycle: on-change
---

# Audit score reconciliation (2026-06-01)

## Authoritative scores (v2 rubric)

Run: `node 03-platform/tools/scripts/compute-audit-scores.mjs --write`

| Track              | ID     | Meaning                                             | Typical use                       |
| ------------------ | ------ | --------------------------------------------------- | --------------------------------- |
| **Engineering**    | **IR** | In-repo gates, code, structural automation          | Sprint planning, merge confidence |
| **External / GTM** | **XC** | EXT-INF blockers (legal, pilot, pen-test, live ops) | Leadership, pilot unblock         |

**IR and XC are independent.** Engineering does not get a lower IR because a lawyer has not signed a DPA.

## Retired (do not cite)

| Retired term                                 | Was                 | Replaced by                                     |
| -------------------------------------------- | ------------------- | ----------------------------------------------- |
| `certifiedReadiness` / `certified composite` | IR − external gap   | **IR** + **XC** separately                      |
| `composite` (as 6.6)                         | Same as certified   | `internalEngineeringReadiness` for engineering  |
| `core-weighted` 9.0                          | Old ledger headline | **IR** dimensions                               |
| Post-roadmap “certified 6.2”                 | v1 combined score   | **XC** ≈ 9.0 (1.0 burden) at same time IR ≈ 7.6 |

## Why historical numbers looked like a drop

| Era      | What happened                                                     |
| -------- | ----------------------------------------------------------------- |
| May 27   | Self-grade **9.0** (gates-only)                                   |
| May 30   | Independent **6.8** IR-style + **6.2** combined (v1 CR)           |
| May 31   | Ledger reconciliation; v1 still subtracted external from headline |
| Jun 1 v2 | **Split tracks** — IR **7.6**, XC **9.0** (not 6.6)               |

The repo **improved** after #85; **IR** reflects that. **XC** was hidden inside “certified 6.6” before v2.

## v2 ledger notes (engineering dimensions only)

Reconciliation entries at `6834b47` adjusted ledger bases for **IR** dimensions only. External items live in `scoring-rubric.json` → `externalBlockers`, not in the seven IR weights.

## When scores change

| Track  | Change when                                                   |
| ------ | ------------------------------------------------------------- |
| **IR** | Ledger dimension history append, or `ci-snapshot.json` update |
| **XC** | `externalBlockers[].status` → `done` in rubric + register     |

Full audits must not invent new /10 figures.
