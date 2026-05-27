# AGENTS.md — GTCX Infrastructure

> **Applies to:** ALL AI agents operating on this codebase
> **Date:** 2026-05-25
> **Version:** 1.0

---

## 1. What This Is

GTCX Infrastructure is part of the GTCX ecosystem. This repository follows BaselineOS standards for agent interaction, code quality, and cross-repo alignment.

## 2. Stack & Commands

- Use conventional commits: `type(scope): subject`
- No emojis in commit messages unless explicitly requested
- Read docs before exploring

## 3. Agent Protocols

- **Read first:** Check existing docs and specs before making changes
- **Minimal changes:** Make the smallest change that achieves the goal
- **Test before commit:** Run relevant tests before considering work complete
- **Quality gates:** Run lint, typecheck, and tests before committing

## 4. Cross-Repo Alignment

This repo participates in the GTCX ecosystem alignment checks.
Run `pnpm ecosystem:alignment:check` (or equivalent) to verify standards.

## Coordination Contract

This repo participates in the GTCX ecosystem coordination system managed by `baseline-os`.

| Field | Value |
|-------|-------|
| Repo ID | `gtcx-infrastructure` |
| Tier | Tier 2 (Platform) |
| Human Lead | TBD — update this |
| Agent Roles | Builder, Reviewer |
| QA Gates | `typecheck`, `test`, `arch-check`, `spec-drift` |

### Reporting Work

Report work items to the coordination hub:

```bash
cd /path/to/baseline-os
pnpm ecosystem:repo:report-work --repo=gtcx-infrastructure --item="Description" --status=in-progress
```

Valid statuses: `pending`, `in-progress`, `blocked`, `completed`, `deferred`.

### Querying Blockers

Check `baseline-os/workstream/coordination/coordination-report-latest.md` for cross-repo blockers.

### Trust Requirements

- Builders: trust ≥ 70 (Permissioned)
- Reviewers: trust ≥ 80 (Authorized)
- Public API changes require human approval

---

*Coordination contract added: 2026-05-26*
\n## Credential Access\n\nThe credential vault is managed by **gtcx-agentic** (consumes `@baselineos/vault` from baseline-os).\n\nAgents access credentials via the MCP tool:\n\n```\nTool: baseline_vault\n  action: "list"     → show available credentials and trust requirements\n  action: "get"      → retrieve a value (requires: name, agentId)\n  action: "status"   → vault health check\n```\n\nThe vault is centrally located at `~/.baseline/vault` (SQLite, AES-256 encrypted).\nTrust-score gated. All access is audited.\n\nStandard env vars: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `DATABASE_URL`, `REDIS_URL`, `BASELINE_MASTER_KEY`.\n\nNever commit secrets. Never ask users for credentials in chat.\nRead Protocol 19 (`gtcx-docs/docs/governance/protocols/19-agent-credential-access/protocol.md`) for the full standard.