---
title: 'Assurance coordination — raise blockers (gtcx-infrastructure)'
status: current
date: 2026-06-08
owner: gtcx-infrastructure
tags: ['coordination', 'protocol-24']
---

# Raise assurance blockers to hub (Protocol 24)

When **Class S** work blocks **claims** or program lead needs a **single queue**, raise to **gtcx-agentic** — not chat-only.

## Outbound (this repo)

Create:

```text
01-docs/04-ops/coordination/outbound/to-gtcx-agentic-<topic>-YYYY-MM-DD.md
```

Include:

| Section           | Content                                                |
| ----------------- | ------------------------------------------------------ |
| Engineering state | `backlogClear`, validate-all, lane scores              |
| Blocker table     | ID, Class, `blocksIR`, owner, due date                 |
| Evidence pointers | Paths in this repo                                     |
| Hub asks          | Register row, manifest gate, `agent:human-gates:check` |

## Inbound ack (gtcx-agentic)

Hub files:

```text
gtcx-agentic/01-docs/04-ops/coordination/from-<this-repo>-<topic>-YYYY-MM-DD.md
```

Updates:

- `human-external-blocker-register-2026-06.md`
- `human-gates.manifest.json` (when new gate ID)
- `pnpm agent:human-gates:check`

## Log

Append one row: [gtcx-protocols cross-repo-agent-log](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/01-docs/04-ops/coordination/cross-repo-agent-log.md).

## Examples

| Repo                | Outbound                                        |
| ------------------- | ----------------------------------------------- |
| gtcx-intelligence   | `to-gtcx-agentic-blockers-pass21-2026-06-06.md` |
| gtcx-infrastructure | `to-gtcx-agentic-blockers-raise-2026-06-08.md`  |

<!-- gtcx-assurance-workspace-v1 -->
