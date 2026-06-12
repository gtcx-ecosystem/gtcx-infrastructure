---
title: 'Handoff — Trade ecosystem lanes → bridge-os registry sync'
status: done
date: 2026-06-12
owner: fabric-os
from: fabric-os
to: bridge-os
ticket: XR-BRIDGE-LANES-REGISTRY-001
initiative: INIT-BRIDGE-LANES-REGISTRY-SYNC
laneId: B
protocol: P24
priority: P1
blocksIR: false
authorityClass: R
---

# Handoff: Trade ecosystem lanes → bridge-os registry sync

> Update fleet machine registries to reflect **C / A / I / U / B** tier model. Remove implicit grouping of gtcx-os with fabric in execution engine planes.

---

## Files to update

| File                                          | Change                                                                                                      |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `pm/spec/gtcx-execution-engine.json`          | Add `tradeCore` plane (`gtcx-os`); clarify `fabric` = I only; `agentRuntime` → label as AI OS (A)           |
| `config/fleet-deploy-readiness-registry.json` | Add `laneId` per repo entry                                                                                 |
| `config/ecosystem-repo-aliases.json`          | Cross-link lane IDs                                                                                         |
| `pm/spec/trade-ecosystem-lanes.json`          | **Copy or symlink** from fabric-os (fleet SoR decision: bridge owns fleet registry — fabric authored draft) |

---

## Source (fabric-os draft)

- `../fabric-os/pm/spec/trade-ecosystem-lanes.json`
- `../fabric-os/docs/specs/ecosystem/trade-ecosystem-lanes-spec.md`

---

## New fleet check (proposed)

```bash
pnpm ecosystem:lanes:check
```

Validates:

- Every ecosystem repo has exactly one primary `laneId` (or `laneIds[]` for multi-lane domains like Pathways)
- gtcx-os laneId = `C`, not `I`
- T0 not co-listed with X

---

## Acceptance

- [x] `pnpm ecosystem:execution-engine:check` green
- [x] Fleet deploy registry shows lane IDs
- [x] Ack on fabric-os `cross-repo-agent-log.md`

---

_XR-BRIDGE-LANES-REGISTRY-001 · 2026-06-12_
