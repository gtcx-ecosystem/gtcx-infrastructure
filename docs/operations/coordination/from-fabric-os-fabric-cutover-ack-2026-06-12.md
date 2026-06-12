---
title: Inbound ack — fabric-os cutover (INIT-FABRIC-OS-CUTOVER)
status: done
date: 2026-06-12
owner: fabric-os
from: fabric-os
to: bridge-os
initiative: INIT-FABRIC-OS-CUTOVER
protocol: P24
---

# Ack: gtcx-infrastructure → fabric-os cutover

## Summary

fabric-os accepts bridge-os outbound [`to-fabric-os-fabric-cutover-2026-06-12.md`](https://github.com/gtcx-ecosystem/bridge-os/blob/main/docs/operations/coordination/to-fabric-os-fabric-cutover-2026-06-12.md). Canonical identity is **fabric-os** (lane **I**); legacy id **gtcx-infrastructure** retained only in registry `legacyIds` / lane `legacyRepo`.

## Evidence

| Gate                              | Result                                        |
| --------------------------------- | --------------------------------------------- |
| `pnpm ops:check`                  | exit 0                                        |
| `pnpm fabric:lanes:check`         | exit 0 — lane I, 18 matrix rows               |
| `pnpm fabric:cutover:check:write` | witness below                                 |
| ZenHub registry                   | `localDir=fabric-os`, `github=fabric-os`      |
| Deploy registry                   | `laneId=I`, `legacyIds=[gtcx-infrastructure]` |

**Witness:** `audit/evidence/fabric-cutover-check-latest.json`

## Remaining debt

Historical audit evidence and dated docs may still cite `gtcx-infrastructure` — allowed per bridge `legacy-repo-id-intentional-refs` sweep allowlist. Agent-facing SoR updated via `.agent/` + `pnpm agent:sync`.

## bridge-os follow-up (Class R)

Sync any stale coordination docs referencing `github=gtcx-infrastructure` if found — zenhub registry already canonical.
