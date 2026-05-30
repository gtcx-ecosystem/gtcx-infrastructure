---
title: 'Onboarding'
status: 'current'
date: '2026-05-30'
owner: 'protocol-architect'
role: 'protocol-architect'
tier: 'critical'
tags: ['docs', 'agents', 'onboarding']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 95
autonomy_level: 'sovereign'
---

# Onboarding

## Start here — single canonical entry point

**[orientation.md](./orientation.md)** is THE onboarding document. The root
`CLAUDE.md` and `AGENTS.md` both reference it as the first read. Every
new agent or contributor starts there.

After orientation, the next stops are role- and workflow-specific:

- **Doing work?** `../workflows/agent-safety-rules.md` (what requires
  human approval) + `../workflows/agent-checklist.md`.
- **Adopting a role?** `../roles/` (devops-sre, platform, infra-security,
  etc.).
- **Recovering from a context loss?** `context-recovery.md`.

## Specialized references (read on demand)

These exist for specific scenarios, not the default cold-start path:

- [orientation.md](./orientation.md) — **canonical entry point**
- [agentic-integration.md](./agentic-integration.md) — how agents from sibling repos plug in
- [context-recovery.md](./context-recovery.md) — recover working state after a session break
- [project-adaptation-guide.md](./project-adaptation-guide.md) — fork-this-pattern playbook for sibling repos
- [service-overview.md](./service-overview.md) — high-level service map

## Deprecated — being merged into orientation.md

These files predate the canonical-orientation consolidation. They
overlap with [orientation.md](./orientation.md) and the workflow docs
above. Do NOT use them as the cold-start path; they remain only so
existing inbound links don't 404. To be merged into orientation.md
and removed in a follow-up:

- ~~`agent-guide.md`~~ — overlaps with orientation.md
- ~~`contributor-guide.md`~~ — overlaps with `../workflows/agent-checklist.md`
- ~~`developer-quickstart.md`~~ — overlaps with the README quick-start
- ~~`developer-setup.md`~~ — overlaps with the README + mise.toml
- ~~`quick-reference.md`~~ — overlaps with the root README + AGENTS.md
