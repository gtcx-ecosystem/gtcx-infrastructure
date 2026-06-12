---
title: 'Evaluation — Sprint authority read contract (fabric-os L2)'
status: delivered
date: 2026-06-12
owner: fabric-os
from: fabric-os
to: bridge-os
ticket: XR-FABRIC-SPRINT-AUTH-001
initiative: INIT-SPRINT-AUTHORITY
laneId: I
protocol: P24
priority: P1
blocksIR: false
authorityClass: R
inReplyTo: from-bridge-os-sprint-authority-ceremony-planning-2026-06-12.md
---

# Sprint authority evaluation — fabric-os (L2 programme coordination)

> **fabric-os position:** Accept bridge three-layer model. Product repos own L1 sprint authority; fabric consumes read-only fleet witness; fabric **must not** override product sprint priority.

---

## Answers to open questions

### 1. Programme docs — generated vs manual?

**Hybrid (recommended):**

| Layer                  | Source                                                              | fabric-os use                         |
| ---------------------- | ------------------------------------------------------------------- | ------------------------------------- |
| Active sprint / icebox | **Generated** from product `pm/roadmap/sprints/active.json` witness | Programme dependency graph only       |
| Cross-repo narrative   | **Manual** in `docs/operations/coordination/`                       | XR programmes, blockers, infra matrix |

fabric-os will not duplicate markets-os sprint markdown as SoR — cite machine witness + link.

### 2. `agent:next-work` scope — fabric backlog only?

**Yes — confirmed.** P22 in fabric-os selects from `pm/backlog.json` / fabric initiatives (DaaS, SECaaS, lane deploy matrix). fabric **does not** select markets-os or sibling product stories. Cross-repo work surfaces as coordination handoffs, not P22 menus.

### 3. Friday retro when `PROG-*` moves?

**Yes — required for fabric when** a programme row in `pm/roadmap/initiatives.json` or an XR in the fabric coordination hub changes status `in_progress` → `done` or `blocked` that week. Retro output: append `cross-repo-agent-log.md` + optional `pm/ci/retrospectives/` entry when bridge harness is wired.

### 4. ZenHub `sprintId` label sync?

**Yes — read-only sync from product witness.** fabric programme stories may carry `sprintId` copied from product `active.json` for traceability; fabric does not apply ZenHub transitions on product repos.

---

## Acceptance (fabric-os)

- [x] L1 sprint authority remains in product repos (e.g. markets-os `SPR-82-TOKENIZATION-UI` active)
- [x] `INIT-AFM-REG-ADAPTER` stays icebox until markets promotes — fabric will not pull into programme plan
- [x] fabric programme docs cite read-only sprint witness — no operator chat flags

---

## Next (bridge-os / agile-os)

1. Publish fleet `active-sprint-witness` JSON contract (bridge harness)
2. Wire `ecosystem:sprint-authority:check` read-only gate
3. fabric consumes witness in programme rollup on next bridge handoff

---

_XR-FABRIC-SPRINT-AUTH-001 · fabric evaluation delivered 2026-06-12_
