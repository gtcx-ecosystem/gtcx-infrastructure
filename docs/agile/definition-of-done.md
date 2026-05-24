---
title: 'Definition of Done — gtcx-infrastructure'
status: 'current'
date: '2026-05-10'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['security', 'architecture', 'infrastructure', 'testing', 'backend']
review_cycle: 'on-change'
---

# Definition of Done — gtcx-infrastructure

Quality criteria that must be satisfied before any work item in `gtcx-infrastructure` is considered complete.

---

## User Story DoD

### Development

- [ ] Change implemented per acceptance criteria
- [ ] Code/config committed using conventional commit format
- [ ] Change reviewed by at least one peer; all comments addressed
- [ ] No hardcoded secrets, credentials, or environment-specific values committed

### CI Gates

- [ ] `pnpm lint` — zero errors
- [ ] `pnpm typecheck` — zero type errors (for TypeScript tooling)
- [ ] `terraform fmt -check -recursive` — all Terraform formatted
- [ ] `terraform validate` — all Terraform modules validate cleanly
- [ ] `kubectl --dry-run=server` — all K8s manifests validate (where applicable)

### Documentation

- [ ] Affected runbook in `docs/operations/runbooks/` updated if operational procedure changed
- [ ] ADR written if an infrastructure architectural decision was made (status: `Proposed`)
- [ ] Terraform module README updated if inputs/outputs changed

---

## Sprint DoD

- [ ] All committed stories meet User Story DoD
- [ ] Sprint goal achieved (or partially achieved with documented rationale)
- [ ] UAT evidence logged in `docs/agile/qa-test-plan.md`
- [ ] Sprint retrospective completed and action items assigned

---

## Release DoD

- [ ] All pre-release gates pass (see `docs/devops/release/release-checklist.md`)
- [ ] UAT evidence log updated
- [ ] CODEOWNERS approval obtained
- [ ] Release notes updated
- [ ] Rollback procedure verified and documented for any destructive change

---

## Quality Gates

| Gate                                        | Threshold      |
| ------------------------------------------- | -------------- |
| Lint errors                                 | 0              |
| Type errors                                 | 0              |
| Terraform validation failures               | 0              |
| Critical security vulnerabilities in images | 0              |
| Committed secrets                           | 0 (hard block) |

---

## Exceptions

When DoD cannot be met:

1. Document the specific criterion that cannot be met and why
2. Assess the risk of proceeding without it
3. Escalate to team lead and human reviewer for explicit acceptance
4. Create a follow-up story for completion and add it to backlog immediately
5. Update DoD if the criterion proves consistently unachievable (systemic issue)

---

## Reference

- [`docs/devops/release/release-checklist.md`](../operations/release/release-checklist.md) — release gate checklist
- [`docs/operations/runbooks/quality-runbook.md`](../operations/runbooks/quality-runbook.md) — full gate sequence
- `docs/agile/qa-test-plan.md` (`./6-testing/uat/uat-evidence-log.md`) — UAT evidence log
