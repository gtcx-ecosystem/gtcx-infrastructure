---
title: 'Agent Proceed Confirmation — Protocol 26 Adoption'
status: established
protocol: gtcx-docs/docs/governance/protocols/26-agent-proceed-confirmation/
date: 2026-06-03
owner: gtcx-infrastructure
document_id: OPS-APC-001
---

# Agent Proceed Confirmation — Protocol 26 Adoption

This repo implements [Protocol 26 — Agent Proceed Confirmation](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/docs/governance/protocols/26-agent-proceed-confirmation/protocol.md).

## Principle

Agents state **what will happen next and why**, then proceed. Humans **confirm, correct, or stop** — they do not choose among agent-generated options.

## Proceed Brief (required before substantive work)

```markdown
## Proceed Brief

**Next:** <one recommended action>
**Because:** <evidence-linked rationale>
**Blocked until:** <none | specific inbound / artifact>
**Override:** Reply **stop**, **correct:**, or name a story ID.
```

## Blocker Report (when truly blocked)

```markdown
## Blocker Report

**Missing:** <what is missing>
**Where:** <path or repo>
**Who owns it:** <repo / team / agent>
**Impact:** <what cannot proceed until unblocked>
```

## Non-negotiables

1. **No story menus** — Protocol 22 already forbids "Which story should I take?"
2. **No option menus** — "Do you want A or B?" is forbidden.
3. **One recommendation** — state the single best next action with rationale.
4. **Proceed unless stopped** — do not wait for approval on every micro-step.

## Relationship to other protocols

| Protocol | Role                                              |
| -------- | ------------------------------------------------- |
| P22      | What to work on next                              |
| P24      | Cross-repo coordination — record blockers durably |
| P26      | How to communicate intent                         |
| P27      | Execute verifiable steps                          |
| P28      | Authority classification for the action           |

## Adoption artifacts

| Artifact            | Path                                                 |
| ------------------- | ---------------------------------------------------- |
| AGENTS.md Phase 5.6 | `AGENTS.md`                                          |
| Cursor rule         | `.cursor/rules/protocol-26-proceed-confirmation.mdc` |
| Adoption check      | `scripts/check-agent-proceed-confirmation.mjs`       |
| This manifest       | `docs/operations/agent-proceed-confirmation.md`      |
