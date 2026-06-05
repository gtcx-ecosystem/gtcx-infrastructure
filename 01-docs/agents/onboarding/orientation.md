---
title: 'Codebase Orientation — gtcx-infrastructure'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'informational'
tags: ['security', 'architecture', 'infrastructure', 'frontend', 'backend']
review_cycle: 'monthly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Codebase Orientation — gtcx-infrastructure

Session-start protocol for any agent or contributor entering this repo.

---

## What This Repo Is

`gtcx-infrastructure` is the deployment and operations backbone for the GTCX ecosystem. It owns all infrastructure-as-code, container definitions, orchestration manifests, security tooling, and database migrations that underpin every GTCX service. Changes here affect every running environment.

---

## Read Before Touching Code

In this order — no exceptions:

1. `01-docs/architecture/system-overview.md` — environment topology and service boundaries
2. [Trust layers & authority DIDs](../../reference/architecture/trust-layers-and-did-resolution.md) — INF-49 / protocols #60 (canonical spec in gtcx-protocols)
3. `01-docs/architecture/decisions/` — ADRs (understand why infra is configured the way it is)
4. `01-docs/04-ops/runbooks/quality-runbook.md` — gate sequence and failure triage
5. `01-docs/01-agents/workflows/safety-rules.md` — before making any change

---

## Repo Structure

```
04-ship/
  docker/        — Dockerfiles and Docker Compose definitions
  kubernetes/    — K8s manifests and Helm charts
  terraform/     — Terraform modules and workspace configs
  migrations/    — Database migration scripts
  security/      — Security scanning configs and policies
  edge-proxy/    — Edge proxy and routing configs
  03-platform/scripts/       — Operational shell scripts

03-platform/tools/           — Validation and CI tooling
```

---

## Dependency Rules

- Infrastructure changes must not be applied without peer review
- Terraform plan output must be reviewed before any `apply`
- Kubernetes manifests must pass `kubectl --dry-run=server` before merge
- Secrets must never be committed — all secrets come from the vault
- Circular dependencies between Terraform modules are disallowed

---

## Security-Sensitive Areas

These areas require explicit human review before any change ships:

| Component             | Area                                                    |
| --------------------- | ------------------------------------------------------- |
| `04-ship/terraform/`  | State management, IAM, secrets configuration            |
| `04-ship/kubernetes/` | RBAC, network policies, secret manifests                |
| `04-ship/security/`   | Security scanning policies, firewall rules, TLS configs |
| `04-ship/docker/`     | Base image selection, image hardening, non-root users   |
| `04-ship/migrations/` | Destructive schema changes — irreversible               |

---

## Pre-Commit Gate

Run this sequence before every commit:

```bash
pnpm lint
pnpm typecheck
```

For Terraform changes:

```bash
terraform fmt -check -recursive 04-ship/terraform/
terraform validate
```

See `01-docs/04-ops/runbooks/quality-runbook.md` for the full gate sequence and triage order when a gate fails.

---

## Where Things Live

| Need                   | Location                                  |
| ---------------------- | ----------------------------------------- |
| Environment topology   | `01-docs/architecture/system-overview.md` |
| Architecture decisions | `01-docs/architecture/decisions/`         |
| Security framework     | `01-docs/09-security/`                    |
| Operations runbooks    | `01-docs/04-ops/runbooks/`                |
| CI/CD pipeline         | `01-docs/devops/ci-cd/`                   |
| Sprint and roadmap     | `01-docs/05-audit/agile/`                 |

---

## Reference

- [`safety-rules.md`](../workflows/agent-safety-rules.md) — what requires human approval
- [`context-recovery.md`](./context-recovery.md) — how to recover agent context across sessions
- [`01-docs/04-ops/runbooks/quality-runbook.md`](../../operations/runbooks/quality-runbook.md) — full pre-commit gate sequence
