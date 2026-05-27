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
\n## Credential Access\n\nThe credential vault is centrally located at `~/.baseline/vault` (SQLite, AES-256 encrypted).\n\nQuery the vault from any repo using the ecosystem baseline wrapper:\n\n```bash\n# List available credentials\n../bin/baseline vault list\n\n# Get a credential value\n../bin/baseline vault get ANTHROPIC_API_KEY\n\n# Check vault health\n../bin/baseline vault status\n```\n\nStandard env vars: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `DATABASE_URL`, `REDIS_URL`, `BASELINE_MASTER_KEY`.\n\nNever commit secrets. Never ask users for credentials in chat.\nRead Protocol 19 for the full standard.