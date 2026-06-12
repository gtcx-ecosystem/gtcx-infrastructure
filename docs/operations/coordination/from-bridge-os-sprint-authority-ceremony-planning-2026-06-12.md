---
title: 'Planning handoff — Sprint authority, ceremonies, and fabric read contract'
status: open
date: 2026-06-12
owner: fabric-os
from: bridge-os
to: fabric-os
ticket: XR-FABRIC-SPRINT-AUTH-001
initiative: INIT-SPRINT-AUTHORITY
protocol: P24
priority: P1
blocksIR: false
authorityClass: R
supersedes: operator chat flags for active sprint vs icebox
---

# Planning handoff: Sprint authority & ceremony enforcement

> **Intent:** Share bridge-os thinking, planning, and draft spec for fabric-os to **own programme-side execution**.  
> **Not in scope for this ticket:** bridge-os or markets-os implementation — fabric-os evaluates, amends, and drives the cross-repo contract.

## Why this exists

An operator had to manually `--flag` fabric-os:

> _"Sprint 82 (tokenization UI) stays active; INIT-AFM-REG-ADAPTER / AFM-REG-001 is icebox until promoted into an active sprint."_

That state is **already documented** in markets-os:

| Artifact                                        | Current truth                                                   |
| ----------------------------------------------- | --------------------------------------------------------------- |
| `markets-os/pm/roadmap/sprints/active.json`     | `SPR-82-TOKENIZATION-UI`                                        |
| `markets-os/docs/strategy/execution-roadmap.md` | Sprint 82 **in_progress**; AFM-REG section **Icebox / backlog** |
| `markets-os/pm/roadmap/initiatives.json`        | `INIT-AFM-REG-ADAPTER`                                          |

The failure is **governance plumbing**, not product judgment:

1. **Sprint authority** lives in the product repo; **programme coordination** in fabric-os had no trusted read contract.
2. **Ceremony automation** exists at bridge-os hub level but does not yet **broadcast** product sprint state to coordination repos.
3. **P22** in product repos is not fully bound to canonical sprint SoR (markdown vs `active.json` drift risk).

**World-class bar:** Product teams lead prioritization. Operators intervene on **Class S/A** gates only — not sprint menus.

---

## Five-pillar framing (design constraints)

From `bridge-os/pm/spec/five-pillar-evaluation.json` — use as acceptance lens, not optional flavor.

| Pillar                   | Requirement for this initiative                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| **Compliance**           | One normative spec + witnesses; ceremonies on schedule; retro → backlog chain                               |
| **Technical excellence** | Single sprint state machine; deterministic P22; tests for icebox exclusion                                  |
| **Craft**                | One SoR, read-only coordination — no duplicate flags in chat or coordination markdown                       |
| **World-class**          | Product teams own backlog; fabric orchestrates **programmes** without re-prioritizing product sprints       |
| **Trust & safety**       | Icebox promotion is explicit (regulatory scope); fleet broadcast is ESL-3 (`CT-FLEET-01`) — read-only first |

---

## Architecture — three layers (do not conflate)

```text
┌──────────────────────────────────────────────────────────────┐
│ L1 — SPRINT AUTHORITY (product repo, e.g. markets-os)        │
│ Owner: product team persona (Class R)                          │
│ SoR: pm/roadmap/sprints/active.json + sealed execution-roadmap │
│ Decides: active sprint, icebox, promotion                      │
└────────────────────────────┬─────────────────────────────────┘
                             │ read-only witness
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ L2 — PROGRAMME COORDINATION (fabric-os)                       │
│ Owner: programme orchestration persona                         │
│ Consumes: fleet active-sprint witness                          │
│ Decides: dependency graph, cross-repo milestones, assurance    │
│ MUST NOT: override product sprint priority                     │
└────────────────────────────┬─────────────────────────────────┘
                             │ schedule + fleet witnesses
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ L3 — FLEET RHYTHM (bridge-os)                                │
│ Owner: protocol-engineer / PM engine                           │
│ Mon planning · Wed review · Fri retro                        │
│ Witness: pm/ci/sprint-ceremony-cadence-latest.json             │
└──────────────────────────────────────────────────────────────┘
```

**fabric-os role:** Strengthen **L2** — consume L1 faithfully; never become a second prioritization engine.

---

## gtcx-agile lineage (centralized agile home)

`gtcx-agile` was the ecosystem's **centralized agile hub** (sprint planning, standup, UAT, cross-repo workplan). It is **archived**; **bridge-os** is the legal fleet successor via `pm/agile-successor.json` — not a second prioritization engine.

| Tier                   | Home          | Role                                                                    |
| ---------------------- | ------------- | ----------------------------------------------------------------------- |
| **L3 Fleet agile hub** | bridge-os     | ZenHub, ceremonies, derived fleet orientation (successor to gtcx-agile) |
| **L1 Product agile**   | product repos | `active.json`, P22, icebox promotion                                    |
| **L2 Programme**       | fabric-os     | XR programmes — read-only L1                                            |

**Normative contract (draft):** `bridge-os/pm/spec/sprint-authority.json` · Ops: `bridge-os/docs/operations/sprint-authority.md`

---

## What already exists (bridge-os SoR — link, do not fork)

| Resource                               | Path                                                          |
| -------------------------------------- | ------------------------------------------------------------- |
| Sprint authority (draft)               | `bridge-os/pm/spec/sprint-authority.json`                     |
| Agile successor (gtcx-agile)           | `bridge-os/pm/agile-successor.json`                           |
| Ceremony cadence spec                  | `bridge-os/pm/spec/sprint-ceremony-cadence.json`              |
| Ops doc                                | `bridge-os/docs/operations/sprint-ceremony-cadence.md`        |
| CI scheduler                           | `bridge-os/.github/workflows/sprint-ceremony-cadence.yml`     |
| Retro / CI gate                        | `bridge-os/pm/spec/ci-retrospectives-sprint-gate.json`        |
| New work defer                         | `bridge-os/pm/spec/new-work-protocol.json`                    |
| ZenHub hierarchy (Icebox pipeline)     | `bridge-os/pm/spec/pm-zenhub-standard.json`                   |
| P22 work selection                     | Protocol 22 + per-repo `agent:next-work`                      |
| Agent communication (terminal updates) | P45 / `baseline-os/pm/spec/agent-communication-protocol.json` |

**Principle already in ceremony spec:**

> _"Roadmaps and prioritization are led by world-class product teams (P22 + repo personas), not sovereign operator menus."_

---

## Draft spec outline — `sprint-authority.json` (for fabric + bridge to co-own)

**Proposed owner:** bridge-os (normative harness) · **fabric-os** (programme consumption contract) · **product repos** (L1 SoR)

```json
{
  "principle": "Sprint authority is product-repo SoR; coordination repos read derived witnesses only.",
  "authorityModel": {
    "prioritization": "Class R — product team via P22 + persona",
    "iceboxPromotion": "Class R — sprint planning ceremony only",
    "programmeOrchestration": "Class R — fabric-os reads fleet witness; no write to product active.json",
    "operatorOverride": "Class S — stop | story ID session override only"
  },
  "canonicalSoR": {
    "activeSprint": "pm/roadmap/sprints/active.json",
    "humanRoadmap": "docs/strategy/execution-roadmap.md",
    "precedence": "active.json wins over markdown headers"
  },
  "iceboxRules": {
    "excludedFromP22": [
      "status: backlog",
      "status: icebox",
      "initiative not in active sprint tasks"
    ],
    "promotionRequires": [
      "planning ceremony witness",
      "active.json update",
      "execution-roadmap sync"
    ]
  },
  "fleetWitness": {
    "derived": true,
    "path": "bridge-os/pm/ci/fleet-active-sprints-latest.json",
    "producer": "pnpm ecosystem:sprint:orientation:write",
    "consumers": ["fabric-os", "bridge-os hub", "coordination bridge append-only"]
  },
  "fabricReadContract": {
    "onPlanning": "read fleet witness; update programme docs from witness — not operator chat",
    "onProgrammeDoc": "cite sprintId + witness timestamp; link product repo active.json",
    "forbidden": [
      "restating sprint priority from memory",
      "treating icebox as in-flight without promotion record"
    ]
  },
  "ceremonies": {
    "planning": { "weekday": "monday", "hubCommand": "pnpm ecosystem:ceremony:planning" },
    "review": { "weekday": "wednesday", "hubCommand": "pnpm ecosystem:ceremony:review" },
    "retrospective": { "weekday": "friday", "hubCommand": "pnpm ecosystem:ceremony:retrospective" }
  },
  "enforcement": {
    "witnessFreshness": "ecosystem:ceremony:check",
    "sprintSeal": "settlement:gate:sprint-seal requires retro witness",
    "esl": "CT-FLEET-01 before automated cross-repo sprint mutations"
  }
}
```

**Canon protocol (future):** `canon-os/docs/governance/protocols/46-sprint-authority/protocol.md` — complements P22, P24, P45.

---

## Reference case — markets-os (fabric programme context)

Use this to validate the contract:

| Field               | Value                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| Active sprint       | `SPR-82-TOKENIZATION-UI` (S82-01, S82-03 pending; S82-02 external → ledger-ui)                 |
| Icebox              | `INIT-AFM-REG-ADAPTER` · first backlog `AFM-REG-001`                                           |
| Programme docs      | `PROG-CAPITAL-FORMATION-001` / tokenization workstream under broader Capital Formation OS      |
| fabric coordination | `xr-mkt-fabric-001-tokenization-execution-plan-2026-06-11.md`, capital formation scope handoff |

**Expected fabric-os behavior after contract:**

1. Programme plans **assume** Sprint 82 is the markets-os execution focus unless fleet witness shows a sealed sprint + new active id.
2. AFM-REG work appears in programme docs as **icebox / not in active sprint** — dependency links only, not parallel implementation pressure.
3. Coordination bridge entries cite `fleet-active-sprints-latest.json` (or product `active.json` URL) — **no operator restatement**.

---

## Phased plan — fabric-os owned slices

### Phase 0 — Evaluate & amend (this ticket)

| #    | Task                                                                                | Owner                | Done when                                       |
| ---- | ----------------------------------------------------------------------------------- | -------------------- | ----------------------------------------------- |
| F0-1 | Review draft spec; flag conflicts with `PROG-CAPITAL-FORMATION-001` / XR programmes | fabric-os            | Written amend list in this doc or reply inbound |
| F0-2 | Map programme docs that **duplicate** sprint state (should become witness links)    | fabric-os            | Inventory table                                 |
| F0-3 | Confirm ESL posture: read-only fleet witness first (no auto-promote)                | fabric-os + security | Recorded in programme assurance                 |

### Phase 1 — Programme read contract (fabric-os implementation)

| #    | Task                                                                                  | Owner     | Done when                                                             |
| ---- | ------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------- |
| F1-1 | Add `fabricReadContract` section to fabric programme runbook                          | fabric-os | `docs/operations/coordination/README.md` or programme runbook updated |
| F1-2 | Planning checklist: load fleet/product sprint witness before updating execution plans | fabric-os | Checklist in ceremony or standup doc                                  |
| F1-3 | Scrub XR-MKT / capital formation docs: link SoR, remove stale sprint assertions       | fabric-os | Docs cite `markets-os/.../active.json`                                |

### Phase 2 — Fleet witness dependency (bridge-os builds; fabric consumes)

| #    | Task                                                     | Owner     | Done when                                  |
| ---- | -------------------------------------------------------- | --------- | ------------------------------------------ |
| F2-1 | `ecosystem:sprint:orientation:write` produces fleet JSON | bridge-os | Witness path exists                        |
| F2-2 | fabric-os CI or ops check reads witness in planning      | fabric-os | Fail or warn if witness missing/stale      |
| F2-3 | Append-only bridge update on planning day                | fabric-os | `cross-repo-agent-bridge.md` cites witness |

### Phase 3 — Product repo correctness (markets-os; fabric validates)

| #    | Task                                           | Owner                          | Done when                                      |
| ---- | ---------------------------------------------- | ------------------------------ | ---------------------------------------------- |
| F3-1 | P22 reads `active.json`; icebox hard exclusion | markets-os                     | `agent:next-work` tier `active-sprint` for S82 |
| F3-2 | Sprint seal blocked without retro              | markets-os + bridge settlement | Gate witness                                   |

---

## fabric-os — explicit responsibilities

**Do:**

- Orchestrate **programme** dependencies (XR-MKT-FABRIC, capital formation, assurance parallel tracks).
- **Read** product sprint SoR before updating execution plans or coordination narratives.
- Run assurance / infra work **parallel** to product sprint (`blocksIR: false`) without redirecting product P22.
- Publish programme status that **references** active sprint witness.

**Do not:**

- Re-prioritize markets-os stories (e.g. pull AFM-REG into flight without markets planning ceremony).
- Require operator `--flag` to correct sprint vs icebox when product SoR is current.
- Fork ceremony specs into fabric-os — link bridge-os SoR.

---

## Acceptance criteria (initiative done)

1. Zero operator chat flags needed for sprint/icebox state across one full Mon→Fri ceremony cycle.
2. fabric programme docs cite machine sprint witness for markets-os (and other active programmes).
3. `INIT-AFM-REG-ADAPTER` remains icebox in all fabric coordination until markets promotes it.
4. `SPR-82-TOKENIZATION-UI` reflected as active in fabric programme plans without manual correction.
5. Trust: no automated icebox promotion; fleet witness is read-only at ESL-3 introduction.

---

## Open questions for fabric-os

1. Which programme docs should be **generated** from fleet witness vs manually curated narrative?
2. Should fabric-os `agent:next-work` scope stay **fabric backlog only** (recommended) — confirm no markets story selection?
3. Per-repo Friday retro: require for fabric when `PROG-*` had material movement that week?
4. ZenHub apply: should fabric-os stories carry `sprintId` label synced from product witness?

---

## Suggested fabric-os next command

```bash
# After reading this handoff — evaluate only; no fleet mutation required
pnpm agent:next-work --json
pnpm ops:check   # when evaluating bridge witness paths
```

Reply via durable inbound: `fabric-os/docs/operations/coordination/from-fabric-os-sprint-authority-eval-YYYY-MM-DD.md`

---

## v2 design (first principles — bridge-os, planning only)

Full architecture, five-pillar acceptance, icebox promotion model, and phased delivery:

**`bridge-os/docs/strategy/sprint-agile-operating-system-design-2026-06-11.md`**

| v2 concept                         | fabric-os implication                                                                                    |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------- |
| L1 sprint authority (product repo) | **Read-only** — never write `markets-os/.../active.json`                                                 |
| L2 programme coordination          | **Your layer** — consume derived fleet witness; orchestrate XR programmes                                |
| Promotion gate                     | AFM-REG enters flight only when markets records planning promotion — fabric does not pull it             |
| Maturity L1→L3                     | v1 ceremony cron exists (L1); do not treat green hub witness as programme truth until fleet witness (L3) |
| Success criterion #3               | Programme docs cite witness — **zero operator `--flag`** in one Mon→Fri cycle                            |

**Normative target (not yet shipped):** `pm/spec/sprint-agile-operating-system.v2.json` · draft outline in `sprint-authority.json` below.

---

## Links

- v2 design (first principles): `bridge-os/docs/strategy/sprint-agile-operating-system-design-2026-06-11.md`
- markets-os active sprint: `markets-os/pm/roadmap/sprints/active.json`
- markets-os icebox: `markets-os/docs/strategy/execution-roadmap.md` § Icebox — INIT-AFM-REG-ADAPTER
- Tokenization programme: `fabric-os/docs/operations/coordination/xr-mkt-fabric-001-tokenization-execution-plan-2026-06-11.md`
- Capital formation handoff: `fabric-os/docs/operations/coordination/from-markets-os-capital-formation-os-scope-2026-06-11.md`
- bridge ceremony spec: `bridge-os/pm/spec/sprint-ceremony-cadence.json`

---

_Authority: Class R planning handoff · blocksIR: false · implementation split by phase above_
