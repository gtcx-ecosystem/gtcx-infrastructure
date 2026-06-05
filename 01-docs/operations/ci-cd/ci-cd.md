---
title: 'CI/CD Pipeline — gtcx-infrastructure'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['security', 'compliance', 'infrastructure', 'testing', 'frontend']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# CI/CD Pipeline — gtcx-infrastructure

CI/CD expectations and workflow. Every change to this repo runs through these gates before it reaches `main`.

---

## CI — Every PR

All checks must pass on every pull request:

| Gate               | Command                           | Blocks   |
| ------------------ | --------------------------------- | -------- |
| Lint               | `pnpm lint`                       | PR merge |
| Type check         | `pnpm typecheck`                  | PR merge |
| Terraform format   | `terraform fmt -check -recursive` | PR merge |
| Terraform validate | `terraform validate`              | PR merge |

Full gate sequence: `01-docs/04-ops/runbooks/quality-runbook.md`

---

## Deployment Workflow

Infrastructure changes follow a plan-review-apply sequence. No automated apply without human review:

| Stage            | Process                                | Approval                         |
| ---------------- | -------------------------------------- | -------------------------------- |
| Terraform plan   | `terraform plan` output reviewed in PR | Human must review diff           |
| Staging apply    | `terraform apply` to staging           | Human approval required          |
| Production apply | `terraform apply` to production        | Separate explicit human approval |
| K8s apply        | `kubectl apply`                        | Human must review manifest diff  |

---

## Release Workflow

Before a release tag is cut:

| Gate                 | Action on Failure                                         |
| -------------------- | --------------------------------------------------------- |
| Container image scan | Escalate critical CVEs to security role — do not release  |
| Dependency audit     | `pnpm audit` — address criticals before release           |
| UAT evidence         | Update `01-docs/05-audit/agile/qa-test-plan.md`           |
| Release checklist    | Complete `01-docs/04-ops/release/ga-release-checklist.md` |

---

## Scheduled Workflows

| Workflow              | Schedule | Description                                      |
| --------------------- | -------- | ------------------------------------------------ |
| Dependency audit      | Weekly   | Audit all dependencies for known vulnerabilities |
| Container image scan  | Weekly   | Scan all base images for new CVEs                |
| Terraform drift check | Daily    | Detect configuration drift from live state       |

---

## Reference

- [`01-docs/04-ops/runbooks/quality-runbook.md`](../../operations/runbooks/quality-runbook.md) — triage order when gates fail
- [`01-docs/04-ops/release/ga-release-checklist.md`](../../operations/release/ga-release-checklist.md) — release checklist
- [`01-docs/01-agents/workflows/tasks/cut-release.md`](../../agents/workflows/cut-release.md) — release task playbook
