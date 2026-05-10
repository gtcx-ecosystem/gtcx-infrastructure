# Release Checklist — gtcx-infrastructure

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

Complete this checklist for every release. All items must be checked before deploying to production. Gate execution is documented in the quality runbook.

---

## Pre-Release Gates

Run all gates in order. Check each only after the command/check passes:

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `terraform fmt -check -recursive infra/terraform/`
- [ ] `terraform validate`
- [ ] `pnpm audit` (no critical vulnerabilities)
- [ ] Container image scan (no critical CVEs)
- [ ] `terraform plan` reviewed and approved for production

---

## Change Risk Assessment

Review all changes in this release:

| Change type                   | Required action                                 |
| ----------------------------- | ----------------------------------------------- |
| Destructive resource deletion | Verified rollback plan required before approval |
| IAM or RBAC modification      | Security role review required                   |
| Network policy change         | Security role review required                   |
| Database migration            | Rollback script verified; backup confirmed      |
| Base image update             | Image scan clean; no new critical CVEs          |

---

## Release Artifacts

These must exist before deployment:

- [ ] `terraform plan` output reviewed and signed off
- [ ] Rollback plan documented for any destructive changes
- [ ] Container scan report (if new images)

---

## Human Approval Signoff

- [ ] CODEOWNERS approval received
- [ ] Terraform plan diff reviewed and approved
- [ ] Security role sign-off for any IAM, RBAC, or network changes
- [ ] UAT evidence log updated
- [ ] Rollback procedure confirmed

---

## Post-Approval Deployment Steps

Execute only after human approval:

- [ ] Staging deployment verified
- [ ] Production `terraform apply` completed
- [ ] Post-deploy smoke checks passed
- [ ] Monitoring dashboards confirm healthy state

---

## Hard Rules

- Never mark a checklist item complete without running the actual gate
- Never deploy to production without human approval of the Terraform plan
- Never commit secrets or credentials
- Never skip the rollback plan for destructive changes
- Never apply without staging verification first

---

## Reference

- [`docs/4-devops/2-runbooks/quality-runbook.md`](../../operations/runbooks/quality-runbook.md) — full gate sequence and triage order
- [`docs/agents/workflows/tasks/cut-release.md`](../../agents/workflows/cut-release.md) — release task playbook
