---
title: 'Outbound — INIT-EXECUTIVE-GAP seal reconcile (closure bar)'
status: open
date: 2026-06-12
owner: fabric-os
from: fabric-os
to: bridge-os
ticket: XR-BRIDGE-EXEC-GAP-001
protocol: P24
priority: P0
blocksIR: false
initiative: INIT-EXECUTIVE-GAP-PROGRAM
---

# Outbound: INIT-EXECUTIVE-GAP-PROGRAM seal reconcile

## Problem

`pnpm session:open-items` exits **1** because `closureBar.sessionComplete !== true` while `pm/_tasks` lists **INIT-EXECUTIVE-GAP-PROGRAM** as `status: done`.

Per `pm/spec/session-closure-bar.json`: **never mark INIT-\* done without `pm/ci/session-closure-bar-latest.json` `ok: true`.**

Latest witness (`bridge-os/pm/ci/session-closure-bar-latest.json`):

| Dimension                  | Status                             |
| -------------------------- | ---------------------------------- |
| cutover-operational        | pass                               |
| zenhub-sor                 | pass                               |
| program-office-ops         | **fail**                           |
| git-settlement             | **fail** (dirty/ahead)             |
| initiative-closure-witness | **fail** — done without ok witness |

## Required bridge-os actions (Class R)

1. **Revert or re-seal** — set `INIT-EXECUTIVE-GAP-PROGRAM` to `in_progress` in `pm/_tasks` until closure bar is green, **or** fix all red dimensions then re-run seal.
2. **ops:check** — resolve failing sub-gates (`ecosystem:new-work:check`, `ecosystem:documentation-archival:check:fleet` if still red).
3. **Git settlement** — micro-commit + push bridge dirty paths; target `ahead=0`.
4. **Re-run closure bar** — `node platform/scripts/ecosystem/check-session-closure-bar.mjs --write --json` until `ok: true`.
5. **Then** set initiative `status: done` with `closureBarWitness: pm/ci/session-closure-bar-latest.json` where witness `ok: true`.

## fabric-os position

Phases A–E evidence in `pm/intake/triage/INIT-EXECUTIVE-GAP-PROGRAM-notes.json` is **substantive** — the gap is **registry/seal mismatch**, not missing work. fabric-os does not own `pm/_tasks` seal authority.

## Acceptance

- `session:open-items` exit 0 from bridge-os program office
- `initiative-closure-witness` pass
- `INIT-EXECUTIVE-GAP-PROGRAM` done only when `session-closure-bar-latest.json` `ok: true`
