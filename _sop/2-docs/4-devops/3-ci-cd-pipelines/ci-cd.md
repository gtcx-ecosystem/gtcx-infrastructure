# CI/CD Pipeline — {repo-name}

CI/CD expectations and workflow. Every change to this repo runs through these gates before it reaches `main`.

---

## CI — Every PR

All checks must pass on every pull request:

| Gate                    | Command                        | Blocks   |
| ----------------------- | ------------------------------ | -------- |
| Architecture boundaries | `{architecture-check-command}` | PR merge |
| Lint                    | `{lint-command}`               | PR merge |
| Type check              | `{typecheck-command}`          | PR merge |
| Tests                   | `{test-command}`               | PR merge |
| Build                   | `{build-command}`              | PR merge |
| API surface             | `{api-check-command}`          | PR merge |

Full gate sequence: `_sop/2-docs/4-devops/2-runbooks/quality-runbook.md`

---

## Release Workflow

Before a release, run all gates in the quality runbook. Specific release-gate actions:

| Gate                | Command                    | Action on Failure                                                     |
| ------------------- | -------------------------- | --------------------------------------------------------------------- |
| API baseline        | `{api-check-command}`      | Review diff — major/minor/patch determination required                |
| Performance budgets | `{perf-check-command}`     | Investigate regression before releasing — do not raise budget         |
| Security gate       | `{security-check-command}` | Escalate to security role immediately                                 |
| UAT evidence        | Manual review              | Update `_sop/3-agile/2-scrum-board/6-testing/uat/uat-evidence-log.md` |
| Release checklist   | Manual review              | Complete `_sop/2-docs/4-devops/7-release-mgmt/release-checklist.md`   |

Update API baseline only after human approval.

---

## Publish

Follow this sequence after all gates pass and human approval is confirmed:

1. Update API baseline (if API changed, with human approval)
2. Version bump (patch / minor / major per human decision)
3. Tag: `git tag v<version>`
4. Push tag and publish packages

Never push to `main` without explicit instruction. Never force-push a release tag.

---

## Scheduled Workflows

| Workflow         | Schedule   | Description                                      |
| ---------------- | ---------- | ------------------------------------------------ |
| {workflow-1}     | {schedule} | {description}                                    |
| {workflow-2}     | {schedule} | {description}                                    |
| Dependency audit | Weekly     | Audit all dependencies for known vulnerabilities |

---

## Reference

- [`_sop/2-docs/4-devops/2-runbooks/quality-runbook.md`](../2-runbooks/quality-runbook.md) — triage order when gates fail
- [`_sop/2-docs/4-devops/7-release-mgmt/release-checklist.md`](../7-release-mgmt/release-checklist.md) — release checklist
- [`_sop/1-agents/4-workflows/tasks/cut-release.md`](../../../1-agents/4-workflows/tasks/cut-release.md) — release task playbook
