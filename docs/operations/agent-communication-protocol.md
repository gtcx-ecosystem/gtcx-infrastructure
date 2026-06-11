---
title: Agent communication protocol (P45)
status: current
date: 2026-06-12
owner: baseline-os
document_id: OPS-AGENT-COMMUNICATION
tier: critical
tags: [agents, protocol-45, communication, p26]
review_cycle: on-change
---

# Agent communication protocol (P45)

> **Normative:** complements [Protocol 26](https://github.com/gtcx-ecosystem/canon-os/blob/main/docs/governance/protocols/45-agent-communication/protocol.md) (Proceed Brief) and [Protocol 27](https://github.com/gtcx-ecosystem/canon-os/blob/main/docs/governance/protocols/27-agent-execution-obligation/protocol.md) (execution).  
> **Spec:** `pm/spec/agent-communication-protocol.v1.json`

## Rule

Agents **must** label outbound operator communication with a **message type** and use that type’s **fixed sections**. Free-form summaries alone are a protocol violation.

## Message types

| Type                          | When                         | Heading                        |
| ----------------------------- | ---------------------------- | ------------------------------ |
| **Proceed Brief**             | Session start / story switch | `## Proceed Brief`             |
| **Status Update**             | End of substantive turn      | `## Status Update`             |
| **Task list**                 | Multi-step plans, cutovers   | `## Tasks`                     |
| **Permission Unblock Report** | Blocked after D1–D6          | `## Permission Unblock Report` |
| **Coordination handoff**      | P24 cross-repo               | `## Coordination handoff`      |

## Turn flow (default)

```text
PROCEED_BRIEF → execute (P27) → STATUS_UPDATE (terminal)
```

## Status Update (required sections)

1. **### Execution mode** — mode id + scope + completion rates
2. **### Done** — evidence (command → exit code)
3. **### Next work item** — Type · ID · Owner · Because (not “Next priority”)
4. **### Approval needed** — Class A/S only; omit if empty

Template: [agent-status-update-template.md](./agent-status-update-template.md)

## Task list (required table)

Use when **more than one** ordered step must be visible to the operator:

| #   | Task | Owner     | Command / action | Done when                   |
| --- | ---- | --------- | ---------------- | --------------------------- |
| T1  | …    | Agent (R) | `pnpm …`         | exit 0; witness path exists |

Add a **Status** subsection: `- [x] T1` / `- [ ] T2` when tracking cutovers.

## Forbidden (all types)

- Story or repo menus · “your call” · “want me to”
- Operator command dumps without in-session attempt (P27)
- Status Update followed by more prose or questions

## Enforcement

```bash
pnpm agent:communication:check
pnpm agent:communication:check --write
```

Fleet: `pnpm ecosystem:agent:communication:check` (bridge-os hub).
