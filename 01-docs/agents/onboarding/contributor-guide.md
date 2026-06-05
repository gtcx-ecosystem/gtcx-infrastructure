---
title: 'Contributor Guide — gtcx-infrastructure'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'informational'
tags: ['security', 'compliance', 'infrastructure', 'testing', 'api']
review_cycle: 'monthly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

> [!WARNING]
> **DEPRECATED — see [orientation.md](./orientation.md).**
> This document overlaps with the canonical onboarding path and is kept
> only so existing inbound links don't 404. New agents should start at
> orientation.md. Content here may drift; trust orientation.md when in doubt.

# Contributor Guide — gtcx-infrastructure

---

## Getting Started

Complete the [Developer Setup](developer-setup.md) before contributing. Ensure all verification checks pass.

---

## Branching Strategy

**Base branch:** `main`

**Branch naming convention:**

| Prefix      | Use Case                           | Example                                |
| ----------- | ---------------------------------- | -------------------------------------- |
| `feature/`  | New infrastructure component       | `feature/k8s-horizontal-pod-autoscale` |
| `fix/`      | Bug fixes or misconfiguration      | `fix/terraform-state-lock-timeout`     |
| `chore/`    | Maintenance, dependency updates    | `chore/upgrade-helm-charts`            |
| `01-docs/`  | Documentation and runbook changes  | `01-docs/update-db-failover-runbook`   |
| `refactor/` | Restructuring (no behavior change) | `refactor/extract-db-migration-util`   |

```bash
# Create a new branch
git checkout main
git pull origin main
git checkout -b feature/{short-description}
```

---

## Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/).

**Format:** `type(scope): description`

| Type       | When to Use                                |
| ---------- | ------------------------------------------ |
| `feat`     | New infrastructure component or capability |
| `fix`      | Bug fix or misconfiguration correction     |
| `docs`     | Documentation and runbook updates          |
| `refactor` | Restructuring (no behavior change)         |
| `chore`    | Build tooling, dependency updates          |
| `ci`       | CI/CD pipeline changes                     |
| `security` | Security hardening or patching             |

**Examples:**

```
feat(k8s): add horizontal pod autoscaler for api-gateway
fix(terraform): correct vpc cidr block overlap in staging
docs(runbooks): update db-failover runbook for gtcx_audit
chore(deps): upgrade terraform providers to latest patch
security(postgres): rotate audit db credentials
```

**Breaking changes:** Add `!` after the type or include `BREAKING CHANGE:` in the footer.

```
feat(postgres)!: split gtcx_audit to dedicated cluster — requires migration
```

---

## Pull Request Process

1. **Create your branch** following the naming convention above
2. **Make your changes** with clear, atomic commits
3. **Push and open a PR** against `main`
4. **Fill out the PR template** completely — include change impact and blast radius
5. **Request review** from at least 1 reviewer
6. **Address review feedback** with new commits (do not force-push during review)
7. **Merge** once approved and all CI checks pass

**PR expectations:**

- Title follows conventional commit format
- Description explains what changed, why, and blast radius
- Linked to relevant issue(s) where applicable
- IaC changes include plan output or dry-run results
- No unrelated changes bundled in

**CI checks that must pass:**

- [ ] Lint
- [ ] Format check
- [ ] Type check
- [ ] Build

---

## Code Style

**Linter:** ESLint (Node.js automation scripts) — configuration in per-package `eslint.config.js`

**Formatter:** Prettier — run via `pnpm format`

```bash
# Check linting
pnpm lint

# Format code
pnpm format

# Check formatting without writing
pnpm format:check
```

**Configure auto-formatting on save** in your editor to avoid style-only commits.

---

## Infrastructure Change Requirements

This is an IaC repo — traditional unit test coverage thresholds do not apply. Instead:

- **Terraform changes** must include `terraform plan` output in the PR description
- **Kubernetes manifests** must be validated before applying (`kubectl apply --dry-run=server`)
- **Docker Compose changes** must be tested locally against the full stack
- **Database migrations** are irreversible — review twice, apply once
- **Never apply to production** without an approval ticket (`--approval-ticket=GTCX-XXX`)

The two PostgreSQL databases must never be merged or cross-written:

| Database           | Port | Purpose               |
| ------------------ | ---- | --------------------- |
| `gtcx_development` | 5432 | Operational data      |
| `gtcx_audit`       | 5433 | Append-only audit log |

---

## Review Checklist

Reviewers should evaluate PRs against the following:

- [ ] Change is scoped correctly — no unintended blast radius
- [ ] Secrets handled via environment variables or secret manager — never hardcoded
- [ ] Destructive operations (drop DB, delete cluster resources) have explicit user sign-off
- [ ] IaC changes include `terraform plan` or equivalent dry-run output
- [ ] Migrations validated in a non-production environment first
- [ ] Rollback procedure is documented or obvious
- [ ] `gtcx_audit` and `gtcx_development` remain separate — no cross-writes
- [ ] No leftover debugging code or hardcoded development values

---

## Release Process

gtcx-infrastructure does not publish packages. Infrastructure changes go live via CI/CD pipelines:

1. Changes merged to `main`
2. CI validates all gates (lint, format, typecheck, build)
3. Staging deploys automatically; production requires explicit approval ticket
4. Post-deploy verification confirms service health

---

## Getting Help

| Channel            | Use For                                    |
| ------------------ | ------------------------------------------ |
| GitHub Issues      | Bug reports, feature requests, questions   |
| GitHub PR comments | Code review feedback, design discussions   |
| CLAUDE.md          | Repo-specific rules, approval requirements |

If you are unsure about an approach, open a draft PR early and ask for guidance.
