---
title: 'Codebase Orientation — gtcx-infrastructure'
status: 'current'
date: '2026-05-10'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'informational'
tags: ['security', 'architecture', 'infrastructure', 'frontend', 'backend']
review_cycle: 'monthly'
---

# Codebase Orientation — gtcx-infrastructure

Session-start protocol for any agent or contributor entering this repo.

---

## What This Repo Is

`gtcx-infrastructure` is the deployment and operations backbone for the GTCX ecosystem. It owns all infrastructure-as-code, container definitions, orchestration manifests, security tooling, and database migrations that underpin every GTCX service. Changes here affect every running environment.

---

## Read Before Touching Code

In this order — no exceptions:

1. `docs/architecture/system-overview.md` — environment topology and service boundaries
2. `docs/architecture/decisions/` — ADRs (understand why infra is configured the way it is)
3. `docs/operations/runbooks/quality-runbook.md` — gate sequence and failure triage
4. `docs/agents/workflows/safety-rules.md` — before making any change

---

## Repo Structure

```
infra/
  docker/        — Dockerfiles and Docker Compose definitions
  kubernetes/    — K8s manifests and Helm charts
  terraform/     — Terraform modules and workspace configs
  migrations/    — Database migration scripts
  security/      — Security scanning configs and policies
  edge-proxy/    — Edge proxy and routing configs
  scripts/       — Operational shell scripts

tools/           — Validation and CI tooling
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

| Component           | Area                                                    |
| ------------------- | ------------------------------------------------------- |
| `infra/terraform/`  | State management, IAM, secrets configuration            |
| `infra/kubernetes/` | RBAC, network policies, secret manifests                |
| `infra/security/`   | Security scanning policies, firewall rules, TLS configs |
| `infra/docker/`     | Base image selection, image hardening, non-root users   |
| `infra/migrations/` | Destructive schema changes — irreversible               |

---

## Pre-Commit Gate

Run this sequence before every commit:

```bash
pnpm lint
pnpm typecheck
```

For Terraform changes:

```bash
terraform fmt -check -recursive infra/terraform/
terraform validate
```

See `docs/operations/runbooks/quality-runbook.md` for the full gate sequence and triage order when a gate fails.

---

## Where Things Live

| Need                   | Location                               |
| ---------------------- | -------------------------------------- |
| Environment topology   | `docs/architecture/system-overview.md` |
| Architecture decisions | `docs/architecture/decisions/`         |
| Security framework     | `docs/security/`                       |
| Operations runbooks    | `docs/operations/runbooks/`            |
| CI/CD pipeline         | `docs/devops/ci-cd/`                   |
| Sprint and roadmap     | `docs/agile/`                          |

---

## Reference

- [`safety-rules.md`](../workflows/agent-safety-rules.md) — what requires human approval
- [`context-recovery.md`](./context-recovery.md) — how to recover agent context across sessions
- [`docs/operations/runbooks/quality-runbook.md`](../../operations/runbooks/quality-runbook.md) — full pre-commit gate sequence
