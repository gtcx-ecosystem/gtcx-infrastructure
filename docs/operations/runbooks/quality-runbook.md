---
title: 'Quality Gates Runbook — gtcx-infrastructure'
status: 'current'
date: '2026-05-10'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['security', 'compliance', 'infrastructure', 'frontend', 'backend']
review_cycle: 'on-change'
---

# Quality Gates Runbook — gtcx-infrastructure

Required quality gates and triage order. Run this sequence before every release and after any CI gate failure.

---

## Primary Gate Sequence

Run in order. Do not skip or reorder. Do not proceed past a failing gate.

```bash
pnpm lint                                     # Lint scripts and Node tooling
pnpm typecheck                                # Type-check TypeScript tooling
terraform fmt -check -recursive infra/terraform/   # Terraform formatting
terraform validate                            # Terraform module validation
pnpm audit                                    # Dependency vulnerability audit
```

For container changes:

```bash
trivy image <image-name>                      # Container image vulnerability scan
```

---

## Failure Triage Order

Resolve failures in this order — fix each before moving to the next:

1. `pnpm typecheck` — type errors indicate structural problems in tooling
2. `pnpm lint` — surface errors before proceeding
3. `terraform fmt` — formatting issues; auto-fix with `terraform fmt -recursive`
4. `terraform validate` — structural Terraform errors
5. `trivy` — container vulnerabilities; escalate criticals to security role immediately
6. `pnpm audit` — dependency vulnerabilities

---

## Evidence Artifacts

| Artifact              | Path                          |
| --------------------- | ----------------------------- |
| Terraform plan output | Reviewed in PR, not committed |
| Container scan report | `security/reports/`           |

---

## Notes

- Terraform plan must be reviewed by a human before any `apply` — never apply without review.
- Do not raise security thresholds to unblock a failing gate — investigate the vulnerability.
- Critical container vulnerabilities must be escalated to the security role before resolution.
- Destructive changes (schema drops, resource deletions) require a verified rollback plan documented before approval.

---

## Reference

- [`docs/devops/release/release-checklist.md`](../../operations/release/release-checklist.md) — release gate checklist
- [`docs/agents/workflows/tasks/investigate-ci-failure.md`](../../agents/workflows/investigate-ci-failure.md) — investigation protocol
- [`docs/agents/workflows/safety-rules.md`](../../agents/workflows/agent-safety-rules.md) — what requires human approval
