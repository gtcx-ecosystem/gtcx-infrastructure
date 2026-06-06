---
title: 'Agent command lookup (gtcx-infrastructure)'
status: current
date: 2026-06-07
owner: 'gtcx-infrastructure'
role: protocol-architect
document_id: OPS-AGENT-LOOKUP-001
tier: standard
tags: ['agents', 'commands', 'cheatsheet']
review_cycle: on-change
---

# Agent command lookup

**Mnemonic:** `session` → `next` → `gates` → `hub` → `push`

| Remember  | Run from `gtcx-infrastructure`                                                        |
| --------- | ------------------------------------------------------------------------------------- |
| **start** | `pnpm session` or `baseline session`                                                  |
| **next**  | `pnpm next`                                                                           |
| **gates** | `pnpm gates`                                                                          |
| **hub**   | `pnpm hub`                                                                            |
| **push**  | `pnpm --dir ../gtcx-agentic ecosystem:git-push --repo gtcx-infrastructure` (IDE-safe) |

**Ecosystem push all ahead repos:** `pnpm --dir ../gtcx-agentic ecosystem:push-all`

**Full index:** [`baseline-os/01-docs/cli/agent-cheatsheet.md`](../../../baseline-os/01-docs/cli/agent-cheatsheet.md)

**Normative git (gtcx-core):** [`agent-git-workflow.md`](../../../gtcx-core/01-docs/operations/agent-git-workflow.md)

Legacy (avoid teaching): `pnpm agent:next-work`, `pnpm agent:reconcile-auto-dev`.
