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

Full gate sequence: `docs/operations/runbooks/quality-runbook.md`

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

| Gate                 | Action on Failure                                        |
| -------------------- | -------------------------------------------------------- |
| Container image scan | Escalate critical CVEs to security role — do not release |
| Dependency audit     | `pnpm audit` — address criticals before release          |
| UAT evidence         | Update `docs/agile/qa-test-plan.md`                      |
| Release checklist    | Complete `docs/devops/release/release-checklist.md`      |

---

## Scheduled Workflows

| Workflow              | Schedule | Description                                      |
| --------------------- | -------- | ------------------------------------------------ |
| Dependency audit      | Weekly   | Audit all dependencies for known vulnerabilities |
| Container image scan  | Weekly   | Scan all base images for new CVEs                |
| Terraform drift check | Daily    | Detect configuration drift from live state       |

---

## Reference

- [`docs/operations/runbooks/quality-runbook.md`](../2-runbooks/quality-runbook.md) — triage order when gates fail
- [`docs/devops/release/release-checklist.md`](../7-release-mgmt/release-checklist.md) — release checklist
- [`docs/agents/workflows/tasks/cut-release.md`](../../../1-agents/4-workflows/tasks/cut-release.md) — release task playbook
