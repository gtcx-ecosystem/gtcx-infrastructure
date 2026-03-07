# Safety Rules — gtcx-infrastructure

What agents and team members can do autonomously vs. what requires explicit human authorization.

Governed by `1-agentic`. These rules apply to all AI-assisted work in this repo.

---

## Autonomous — No Approval Required

- Read any file in the repo
- Run lint, typecheck, and test: `pnpm lint`, `pnpm typecheck`, `pnpm test`
- Write or update documentation in `_sop/`
- Update `docker-compose.dev.yml` or `docker-compose.infra.yml` for local dev services (no production impact)
- Write new runbooks or update existing ones
- Propose ADRs — status must remain `Proposed`; human approval required before `Accepted`
- Commit completed work using conventional commit format — commit after each meaningful, self-contained unit of work

---

## Requires Human Approval Before Proceeding

| Action                                                                           | Reason                                              |
| -------------------------------------------------------------------------------- | --------------------------------------------------- |
| Any `terraform apply`                                                            | Changes live cloud infrastructure                   |
| Any `kubectl apply` to staging or production                                     | Affects live services                               |
| Running `./infra/scripts/deploy.sh staging` or `production`                      | Triggers live deployment                            |
| Running `./infra/scripts/migrate.sh` against staging or production               | Irreversible schema changes                         |
| Any change to `infra/kubernetes/overlays/production/`                            | Affects live production workloads                   |
| Any change to `infra/terraform/modules/`                                         | Changes shared IaC modules used across environments |
| Any change to `infra/security/policies/`                                         | Changes security posture                            |
| Any change to `infra/kubernetes/overlays/production/network-policies.yaml`       | Changes network security                            |
| Any change to `infra/kubernetes/overlays/production/pod-security-policy.yaml`    | Changes pod security constraints                    |
| Any change to `.github/workflows/`                                               | Changes CI/CD pipeline for all repos                |
| Any change to secret management, rotation, or `secretGenerator` in kustomization | Sensitive — affects all service access              |
| Marking an ADR `Accepted`                                                        | Human decision                                      |
| Any destructive git operation                                                    | Irreversible                                        |

---

## Never — Hard Rules

- Never run `./infra/scripts/deploy.sh production` without `--approval-ticket=GTCX-XXX` (the script enforces this, but do not attempt to bypass)
- Never use `--no-verify` or skip git hooks
- Never push to `main` without explicit instruction
- Never force push
- Never commit `.env` files, secrets, credentials, or private keys
- Never hardcode database passwords, API keys, or tokens — always use environment variables or secret manager references
- Never apply infrastructure changes to the `gtcx-production` namespace without explicit instruction
- Never drop or truncate the audit database (`gtcx-audit`) — it is append-only by design
- Never modify a migration that has already run in any environment

---

## Escalation Triggers

Escalate to human review immediately when:

- A security scan (`infra/security/scripts/security-status.js`) reports new critical vulnerabilities
- A deployment fails mid-canary and automatic rollback did not trigger
- A migration fails against staging or production
- A Terraform plan shows destruction of production resources
- Any change requires modifying network policies, pod security, or IAM/RBAC

---

## Reference

- [`orientation.md`](orientation.md) — repo map and session-start reading order
- [`_sop/2-docs/4-operations/runbooks/deploy.md`](../2-docs/4-operations/runbooks/deploy.md) — deploy process
- [`_sop/2-docs/4-operations/runbooks/migrate.md`](../2-docs/4-operations/runbooks/migrate.md) — migration discipline
