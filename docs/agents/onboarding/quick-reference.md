---
title: 'Quick Reference — gtcx-infrastructure'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'compliance', 'architecture', 'infrastructure', 'frontend']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

> [!WARNING]
> **DEPRECATED — see [orientation.md](./orientation.md).**
> This document overlaps with the canonical onboarding path and is kept
> only so existing inbound links don't 404. New agents should start at
> orientation.md. Content here may drift; trust orientation.md when in doubt.

# Quick Reference — gtcx-infrastructure

---

## What This Repo Is

DevOps tooling, deployment automation, and security framework for the GTCX ecosystem. Docker, Kubernetes, Terraform, edge proxy, security policy, migrations, and compliance tooling. Standalone — consumed by all other repos, depends on none.

---

## Key Documents

| What              | Where                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| Codebase map      | [`orientation.md`](orientation.md)                                                                           |
| Safety rules      | [`../4-workflows/safety-rules.md`](../workflows/agent-safety-rules.md)                                       |
| Architecture      | [`../../2-docs/1-architecture/system-overview.md`](../../architecture/system-overview.md)                    |
| Trust model       | [`../../2-docs/1-architecture/trust-model.md`](../../architecture/trust-model.md)                            |
| Quality runbook   | [`../../2-docs/4-devops/2-runbooks/quality-runbook.md`](../../operations/runbooks/quality-runbook.md)        |
| Release checklist | [`../../2-docs/4-devops/7-release-mgmt/release-checklist.md`](../../operations/release/release-checklist.md) |
| Deploy runbook    | [`../../2-docs/4-operations/runbooks/deploy.md`](../../operations/runbooks/deploy.md)                        |

---

## Repo Structure

```
gtcx-infrastructure/
├── infra/
│   ├── docker/        # Container definitions and compose files
│   ├── kubernetes/    # K8s manifests and Helm charts
│   ├── terraform/     # Infrastructure-as-code (IaC)
│   ├── edge-proxy/    # Field connectivity proxy
│   ├── migrations/    # Data migration scripts
│   ├── security/      # Security policies and controls
│   └── scripts/       # Operational scripts
├── tools/             # Project templates and dev scripts
└── docs/              # Docs, agent team, safety rules, runbooks
```

---

## Common Commands

```bash
pnpm install                        # Install dependencies
pnpm build                          # Build tooling packages
pnpm test                           # Run tests
pnpm lint                           # Lint TypeScript tooling
terraform fmt -check -recursive     # Check Terraform formatting
terraform validate                  # Validate Terraform configs
trivy image <image>                 # Container vulnerability scan
```

---

## Session Start

1. Read [`orientation.md`](orientation.md) — codebase map and deployment model
2. Read [`../4-workflows/safety-rules.md`](../workflows/agent-safety-rules.md) — what needs human approval
3. Read the role file for your current work
4. After a break: [`context-recovery.md`](context-recovery.md)

---

## Security-Sensitive — Always Requires Human Approval

- Any Terraform change that touches production state
- Changes to RBAC, network policies, or security group rules
- Secrets management and rotation procedures
- Destructive operations: scale-down, delete, drain, cordon
- Firewall rule changes and zero-trust policy updates
