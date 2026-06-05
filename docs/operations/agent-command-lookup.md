---
title: 'Agent command lookup (gtcx-infrastructure)'
status: current
date: 2026-06-07
owner: gtcx-infrastructure
document_id: OPS-AGENT-LOOKUP-001
---

# Agent command lookup

**Mnemonic:** `session` → `next` → `gates` → `hub`

| Remember  | Run from `gtcx-infrastructure`       |
| --------- | ------------------------------------ |
| **start** | `pnpm session` or `baseline session` |
| **next**  | `pnpm next`                          |
| **gates** | `pnpm gates`                         |
| **hub**   | `pnpm hub`                           |

**Full index:** [`baseline-os/docs/cli/agent-cheatsheet.md`](../../../baseline-os/docs/cli/agent-cheatsheet.md)

Legacy (avoid teaching): `pnpm agent:next-work`, `pnpm agent:reconcile-auto-dev`, `pnpm --dir ../gtcx-agentic agent:human-gates:check`.
