---
title: 'Repo Hygiene Protocol — gtcx-infrastructure'
status: 'current'
date: '2026-06-05'
owner: 'gtcx-infrastructure'
role: 'platform-architect'
tier: 'standard'
tags: ['operations', 'repo-hygiene', 'governance']
review_cycle: 'on-change'
related:
  - 01-docs/04-ops/repo/root-allowlist.json
canonical_protocol: gtcx-docs/03-platform/tools/audit/audit-framework/prompts/hygiene/repo-hygiene-protocol-prompt.md
---

# Repo Hygiene Protocol — gtcx-infrastructure

> **Workspace type:** Monorepo (pnpm + Turborepo, 15 workspace packages under `03-platform/tools/`).
> **Machine allowlist:** [`root-allowlist.json`](root-allowlist.json) — single source of truth for CI checks.
> **Canonical protocol:** `gtcx-docs/03-platform/tools/audit/audit-framework/prompts/hygiene/repo-hygiene-protocol-prompt.md` (this file is the repo-specific overlay).

## Purpose

Keep the repository root predictable for humans and agents. Only intentional files live at root; everything else belongs under `01-docs/`, `04-ship/`, `03-platform/scripts/`, `03-platform/tools/`, `workspace/`, or `agents/`.

## Tier A — Front door (required)

| File        | Purpose                               |
| ----------- | ------------------------------------- |
| `README.md` | Human onboarding                      |
| `AGENTS.md` | Agent onboarding (canonical for LLMs) |

## Tier B — Agent sync

| File             | Purpose                                                     |
| ---------------- | ----------------------------------------------------------- |
| `CLAUDE.md`      | Claude-specific extension of AGENTS.md (agent-sync managed) |
| `GEMINI.md`      | Gemini-specific extension (agent-sync managed)              |
| `CONVENTIONS.md` | Cross-agent conventions (agent-sync managed)                |

Modify sources in `.agent/` and run `pnpm agent:sync` — do not hand-edit generated mirrors.

## Tier C — Legal / GitHub

| File / Dir        | Purpose                                     |
| ----------------- | ------------------------------------------- |
| `LICENSE`         | MIT                                         |
| `SECURITY.md`     | Vulnerability disclosure policy             |
| `CONTRIBUTING.md` | Contribution guidelines                     |
| `CHANGELOG.md`    | Release history                             |
| `.github/`        | Workflows, CODEOWNERS, issue + PR templates |

## Tier D — Monorepo spine

| File                  | Purpose                    |
| --------------------- | -------------------------- |
| `package.json`        | Root workspace manifest    |
| `pnpm-workspace.yaml` | pnpm workspace definitions |
| `pnpm-lock.yaml`      | Lockfile (committed)       |
| `turbo.json`          | Turborepo task graph       |
| `tsconfig.json`       | Root TypeScript config     |
| `eslint.config.mjs`   | ESLint flat config         |
| `mise.toml`           | Dev environment manager    |
| `renovate.json`       | Dependency update policy   |

## Tier E — Quality / CI dotfiles

| File / Dir                        | Purpose                        |
| --------------------------------- | ------------------------------ |
| `.gitignore`                      | Source of truth for exclusions |
| `.editorconfig`                   | Cross-editor formatting        |
| `.prettierrc` + `.prettierignore` | Format configuration           |
| `.env.example`                    | Documented env-var template    |
| `.docs-exceptions.json`           | Docs-standard allowlist        |
| `.husky/`                         | Git hooks                      |

## Tier F — Agent / baseline dotdirs

| Dir          | Purpose                                                     |
| ------------ | ----------------------------------------------------------- |
| `.agent/`    | Agent-sync source partials                                  |
| `.baseline/` | BaselineOS institutional memory                             |
| `.cursor/`   | Cursor rules and commands                                   |
| `.kimi/`     | Kimi agent config                                           |
| `.zap/`      | OWASP ZAP scan config                                       |
| `.claude/`   | Claude Code local settings (gitignored settings.local.json) |

## Tier G — Structural directories

| Dir                    | Purpose                                                     |
| ---------------------- | ----------------------------------------------------------- |
| `01-docs/`             | All documentation, audits, runbooks, coordination           |
| `04-ship/`             | Terraform, Kubernetes, Docker, security                     |
| `03-platform/scripts/` | Repo automation, agent selection, production operators      |
| `03-platform/tools/`   | Workspace packages (compliance-gateway, audit-flush, etc.)  |
| `workspace/`           | PM v3 operational workspace (assurance, product-management) |
| `agents/`              | Per-provider agent terminal index stubs                     |

## Human-owned paths (§2.1)

| Path        | Rule                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------- |
| `_delete/`  | Maintainer removes manually. **Agents must not** delete, move, empty, or schedule in sprints/PRs. |
| `_archive/` | Gitignored local reference only — never tracked.                                                  |
| `_cannon/`  | Gitignored local reference only — never tracked.                                                  |

## Operator-local (gitignored, never at root in CI)

| Path                | Purpose                          |
| ------------------- | -------------------------------- |
| `.kube-config-prod` | Production kubeconfig (operator) |
| `.helm-cache/`      | Helm download cache              |
| `.helm-config/`     | Helm config                      |
| `supabase/`         | Local Supabase CLI scratch       |

## Enforcement

```bash
pnpm check:workspace-root-cleanliness:strict
```

Checker: `03-platform/scripts/ops/check-workspace-root-cleanliness.py` (adopted from `compliance-os` / `gtcx-core`).

Wired in `03-platform/tools/scripts/validate-all.mjs` and `.github/workflows/ci.yml`.

## Audit command

```text
/repo-hygiene
/execute-repo-hygiene
```

Registry: `gtcx-docs/03-platform/tools/audit/audit-framework/commands/execute-repo-hygiene.md`
