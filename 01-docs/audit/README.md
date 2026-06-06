---
title: 'Audit'
status: 'current'
date: '2026-06-01'
owner: 'quality-evidence-lead'
role: 'quality-evidence-lead'
tier: 'critical'
tags: ['audit', 'evidence']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 95
autonomy_level: 'sovereign'
---

# Audit

Audit reports, evidence, execution planning, and **canonical scoring** for `gtcx-infrastructure`.

## Canonical scores (rubric v2)

| Track  | Name                           | Measures                                                                 | Does **not** measure         |
| ------ | ------------------------------ | ------------------------------------------------------------------------ | ---------------------------- |
| **IR** | Internal Engineering Readiness | Unblocked in-repo engineering: gates, code, tests, structural automation | Whether outsiders signed off |
| **XC** | External / GTM Clearance       | Legal, pilot, pen-test SOW, operator-run live ops (EXT-INF register)     | Engineering velocity         |

**IR and XC are independent.** External blockers affect **XC only** — they do **not** subtract from IR.

| Resource                                                                                         | Purpose                                           |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| [`SCORING.md`](./SCORING.md)                                                                     | Formulas, dimensions, retired v1 terms            |
| [`scoring-rubric.json`](./scoring-rubric.json)                                                   | Machine rubric (`gtcx-infra-canonical-v2`)        |
| [`latest.json`](./latest.json)                                                                   | Current IR / XC (from `pnpm score:compute`)       |
| [`AUDIT-RECONCILIATION.md`](./AUDIT-RECONCILIATION.md)                                           | Why old docs show 6.6 / 6.8 / 9.0                 |
| [`ir-10-10-roadmap.md`](./ir-10-10-roadmap.md)                                                   | **IR 7.6 → 10.0** — canonical internal 10/10 plan |
| [`execution-roadmap.md`](./execution-roadmap.md)                                                 | Sprint story tracker (cross-ref IR phases)        |
| [`external-dependencies-register-2026-05-31.md`](./external-dependencies-register-2026-05-31.md) | XC blockers (not IR)                              |

**Retired (do not publish as headline scores):** `certifiedReadiness`, `certified composite`, `CR = IR − gap`.

```bash
node 03-platform/tools/scripts/compute-audit-scores.mjs --write   # refresh latest.json
```

## Historical documents

Older audits may still use v1 terms (`certified composite`, `internal 6.8 / certified 6.2`). Treat those as **historical snapshots**; map them using [`AUDIT-RECONCILIATION.md`](./AUDIT-RECONCILIATION.md). Superseded plans live under [`archive/`](./archive/) and [`historical-cycles/`](./historical-cycles/).

## Active entry points

| Document                                                     | Role                                 |
| ------------------------------------------------------------ | ------------------------------------ |
| [`full-audit-2026-06-01.md`](./full-audit-2026-06-01.md)     | Latest six-phase full audit          |
| [`master-audit-2026-05-30.md`](./master-audit-2026-05-30.md) | Latest master audit cluster          |
| [`prompts/`](./prompts/)                                     | Grade-tier audit prompts (P/E/I/B/G) |
| [`evidence/`](./evidence/)                                   | Evidence staging                     |

---

_Updated: 2026-06-01 (scoring v2)_
