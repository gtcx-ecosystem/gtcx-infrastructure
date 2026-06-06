---
title: 'Agent PR witness checklist (SIGNAL INF-003)'
status: current
date: 2026-06-05
owner: gtcx-infrastructure
---

# Agent PR witness checklist

Required on PRs that touch agent workflows, coordination, or compliance-gateway AI paths (Protocol 27).

## Before opening PR

- [ ] `pnpm agent:next-work` — copy `traceId` into coordination log if filing handoff
- [ ] `pnpm test` or targeted package tests for changed paths
- [ ] `node 03-platform/tools/scripts/validate-all.mjs` or documented subset (list gates run)

## PR body (paste)

```markdown
## Agent Context Attestation

- [x] P22 story ID: <S\*-\*\*>
- [x] trace_id: <from agent:next-work>
- [x] Gates: <commands + exit codes>

## Evidence

- <paths under 01-docs/05-audit/ or 01-docs/04-ops/coordination/>
```

## Coordination touched?

If yes, append row to `01-docs/04-ops/coordination/cross-repo-agent-log.md` with `trace_id`, `agent_id`, `failure_class`, `recovery`.
