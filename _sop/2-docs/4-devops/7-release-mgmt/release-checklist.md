# Release Checklist — {repo-name}

Complete this checklist for every release. All items must be checked before publishing. Gate execution is documented in the quality runbook.

---

## Pre-Release Gates

Run all gates in order. Check each only after the command passes:

- [ ] `{lint-command}`
- [ ] `{format-check-command}`
- [ ] `{typecheck-command}`
- [ ] `{test-command}`
- [ ] `{test-coverage-command}`
- [ ] `{build-command}`
- [ ] `{architecture-check-command}`
- [ ] `{governance-check-command}`
- [ ] `{security-check-command}`
- [ ] `{perf-update-history-command}` + `{perf-check-command}`
- [ ] `{api-check-command}` (review diff before proceeding)
- [ ] `{docs-command}` + `{docs-check-command}`

---

## API Surface Review

Review the API surface report against the current baseline:

| Diff type       | Required action                                          |
| --------------- | -------------------------------------------------------- |
| Breaking change | Major version bump — escalate to human before proceeding |
| Additive change | Minor version bump minimum                               |
| No change       | Patch version acceptable                                 |

Do not update the API baseline until human approval is confirmed.

---

## Release Artifacts

These must exist and be committed before release:

- [ ] API surface report
- [ ] Performance benchmark report
- [ ] `quality/release-<version>-evidence.md` — gate results summary

---

## Human Approval Signoff

- [ ] CODEOWNERS approval received
- [ ] Version bump type confirmed by human reviewer (patch / minor / major)
- [ ] API diff reviewed and version decision made
- [ ] UAT evidence log updated for any new features
- [ ] Release notes updated

---

## Post-Approval Steps

Execute only after human approval:

- [ ] API baseline updated (if API changed)
- [ ] Version bump applied
- [ ] Tag created
- [ ] Published per procedure in `_sop/2-docs/4-devops/3-ci-cd-pipelines/ci-cd.md`

---

## Hard Rules

- Never mark a checklist item complete without running the actual gate
- Never publish without all gates passing
- Never update the API baseline without human approval
- Never force-push a release tag

---

## Reference

- [`_sop/2-docs/4-devops/2-runbooks/quality-runbook.md`](../2-runbooks/quality-runbook.md) — full gate sequence and triage order
- [`_sop/1-agents/4-workflows/tasks/cut-release.md`](../../../1-agents/4-workflows/tasks/cut-release.md) — release task playbook
