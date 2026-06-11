---
title: Agent Proceed Brief — template (Protocol 26 + P45)
status: current
date: 2026-06-12
owner: baseline-os
document_id: OPS-AGENT-PROCEED-BRIEF
tier: standard
tags: [agents, protocol-26, protocol-45, communication]
review_cycle: on-change
---

# Proceed Brief — template

**Message type:** `PROCEED_BRIEF` · **When:** session start, story switch, after `pnpm agent:next-work`

```markdown
## Proceed Brief

**Next:** <single imperative action>
**Because:** <P22 selection.reason or witness>
**Blocked until:** <none | artifact path>
**Override:** stop | correct: | story ID

**Active persona:** <institutional-id> (MCP: <mcp-id>)
**Frame:** development | regulatory-audit | trading-floor | field-operations
**Authority class (P28):** R | A | S
```

Then **implement** — no menus, no approval to proceed on Class R.

Spec: `pm/spec/agent-communication-protocol.json` · Parent: Protocol 26.
