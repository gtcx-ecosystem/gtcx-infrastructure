# Definition of Done — {repo-name}

Quality criteria that must be satisfied before any work item in `{repo-name}` is considered complete.

---

## User Story DoD

### Development

- [ ] Feature implemented per acceptance criteria
- [ ] Code committed using conventional commit format
- [ ] Code reviewed by at least one peer; all comments addressed
- [ ] No TODO comments or debug code left in

### CI Gates

- [ ] `{architecture-check-command}` — zero violations
- [ ] `{lint-command}` — zero errors
- [ ] `{typecheck-command}` — zero type errors
- [ ] `{test-command}` — all tests pass
- [ ] `{build-command}` — all packages build cleanly
- [ ] `{api-check-command}` — API surface reviewed (no unintentional changes)

### Documentation

- [ ] Affected component spec in `_sop/2-docs/5-specs/` updated if behavior changed
- [ ] ADR written if an architectural decision was made (status: `Proposed`)
- [ ] UAT scenario documented if applicable

---

## Sprint DoD

- [ ] All committed stories meet User Story DoD
- [ ] Sprint goal achieved (or partially achieved with documented rationale)
- [ ] Quality gates green: `{architecture-check-command}`, `{api-check-command}`, `{perf-check-command}`
- [ ] UAT evidence logged in `_sop/3-agile/2-scrum-board/6-testing/uat/uat-evidence-log.md`
- [ ] Sprint retrospective completed and action items assigned

---

## Release DoD

- [ ] All pre-release gates pass (see `_sop/2-docs/4-devops/7-release-mgmt/release-checklist.md`)
- [ ] UAT evidence log updated
- [ ] CODEOWNERS approval obtained
- [ ] Release notes updated
- [ ] API surface baseline updated if API changed (human approval required)

---

## Quality Gates

| Gate                              | Threshold    |
| --------------------------------- | ------------ |
| Architecture violations           | 0            |
| Lint errors                       | 0            |
| Type errors                       | 0            |
| Critical security vulnerabilities | 0            |
| API surface unintentional breaks  | 0            |
| Performance regression vs. budget | 0% allowed   |
| Test coverage — critical paths    | {n}% minimum |

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

- [`_sop/2-docs/4-devops/7-release-mgmt/release-checklist.md`](../../../../2-docs/4-devops/7-release-mgmt/release-checklist.md) — release gate checklist
- [`_sop/2-docs/4-devops/2-runbooks/quality-runbook.md`](../../../../2-docs/4-devops/2-runbooks/quality-runbook.md) — full gate sequence
- [`_sop/3-agile/2-scrum-board/6-testing/uat/uat-evidence-log.md`](../6-testing/uat/uat-evidence-log.md) — UAT evidence log
