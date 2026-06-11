---
title: 'Agent Status Update — template (Protocol 26 §3b + P45)'
status: current
date: 2026-06-12
owner: baseline-os
role: protocol-architect
document_id: OPS-AGENT-STATUS-UPDATE
tier: standard
tags: ['agents', 'protocol-26', 'protocol-45', 'communication']
review_cycle: on-change
---

# Agent Status Update — template

**Message type:** `STATUS_UPDATE` · **When:** end of substantive turn, handoff, sprint boundary.

Complements **Proceed Brief** (`agent-proceed-brief-template.md`) at session start.

| When                                              | Use                               |
| ------------------------------------------------- | --------------------------------- |
| Session start, new story, blocker cleared         | **Proceed Brief**                 |
| After executing work, mid-session report, handoff | **Status Update** (this template) |

Spec: `pm/spec/agent-communication-protocol.json` (P45)

---

## Template

```markdown
## Status Update

### Execution mode

- **Mode:** <auto-dev mode id> · **Scope:** <program / sprint / roadmap>
- **Progress:** <from `pnpm agent:next-work --json` → execution + progress>

### Done

- <what shipped or verified> — `<command>` exit <code> · commit `<sha>` · probe: <fact>

### Next work item

- **Type:** Story | Epic | Task | Sprint | Milestone
- **ID:** `<story-id>`
- **Owner:** <repo | role>
- **Because:** <P22 selection.reason / witness>

### Approval needed

- <Class A/S only — parallel human gates; omit section if empty>
```

---

## Section rules

### Execution mode

- From `pnpm agent:next-work --json` → `execution` and `progress` (or `pnpm ecosystem:progress:report --markdown` on hub).
- One headline line the operator can scan: mode + % complete.

### Done

- Past tense, evidence-linked (exit codes, SHAs, probe results).
- No vague claims without command or witness path.

### Next work item

- **Exactly one** agile artifact — Type + ID + Owner. Legacy header **Next priority** is forbidden (P45).
- Agent **executes** Class R next steps in-session when possible.

### Approval needed

- Protocol 28 class **A** or **S** only — **`blocksIR: false`** gates are parallel, not repo frozen.
- Omit the heading when empty. Message **ends** here — no follow-up questions.

---

## Task list (multi-step work)

When more than one ordered step must be visible, add before or after Status Update:

```markdown
## Tasks

| #   | Task | Owner     | Command / action | Done when              |
| --- | ---- | --------- | ---------------- | ---------------------- |
| T1  | …    | Agent (R) | `pnpm …`         | exit 0; witness exists |
```

---

## Anti-patterns

| Wrong                                 | Right                                           |
| ------------------------------------- | ----------------------------------------------- |
| `### Next priority` as closing header | `### Next work item` after `### Execution mode` |
| End with "want me to …"               | Execute Class R; close at Approval needed       |
| Status Update then more prose         | Terminal message type (P45)                     |
| Three equal options                   | One Next work item from P22                     |

---

_Normative: [Protocol 45](https://github.com/gtcx-ecosystem/canon-os/blob/main/docs/governance/protocols/45-agent-communication/protocol.md) · [Protocol 26 §3b](https://github.com/gtcx-ecosystem/canon-os/blob/main/docs/governance/protocols/26-agent-proceed-confirmation/protocol.md)_
