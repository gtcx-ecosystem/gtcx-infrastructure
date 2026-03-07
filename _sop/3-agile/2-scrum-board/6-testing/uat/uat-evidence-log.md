# UAT Evidence Log — {repo-name}

Tracks user acceptance testing (UAT) evidence for features and sprints. Updated at sprint close and before release.

---

## How to Use This Log

1. Add an entry for each feature or sprint that requires UAT evidence
2. Attach or reference the evidence artifact (test output, screenshot, QA sign-off)
3. Update status when UAT passes
4. This file is checked during release — missing UAT evidence blocks release

---

## Log Format

```markdown
### [YYYY-MM-DD] Sprint N — Feature or Story Name

**Type:** Sprint UAT / Feature UAT / Regression check
**Tested by:** [Role]
**Status:** Pass / Fail / Pending
**Evidence:** [path to artifact or description of evidence]
**Notes:** [any deviations or conditions]
```

---

## Active Log

<!-- Add UAT evidence entries below as sprints close -->

---

## Reference

- [`_sop/3-agile/2-scrum-board/5-sprints/definition-of-done.md`](../5-sprints/definition-of-done.md) — sprint and release DoD
- [`_sop/1-agents/4-workflows/tasks/cut-release.md`](../../../../1-agents/4-workflows/tasks/cut-release.md) — release workflow that requires this log
