# Task Playbook: Cut a Release

**Owner:** {quality-role} (gates + evidence) + {architect-role} (version decision)
**Safety tier:** Requires human approval before publishing

---

## When to Run This

Run when the team has decided to cut a release. A release publishes updated packages to the registry and affects downstream consumers.

Gate execution is autonomous. Publishing requires explicit human confirmation — do not proceed past the escalation step without it.

---

## Pre-Flight

Confirm with the human reviewer:

- Target version bump type: `patch`, `minor`, or `major`
- Packages or components included in this release
- Whether any API changes are included (triggers mandatory API review)

Then read:

- `_sop/2-docs/4-devops/7-release-mgmt/release-checklist.md` — authoritative gate list
- `_sop/3-agile/2-scrum-board/6-testing/uat/uat-evidence-log.md` — confirm UAT evidence exists for any new features

---

## Gate Sequence

Execute in order. Do not proceed past a failing gate.

### Gate 1 — Architecture

```bash
{architecture-check-command}
```

Zero violations required.

---

### Gate 2 — Code quality

```bash
{lint-command}
{typecheck-command}
```

Zero warnings, zero errors.

---

### Gate 3 — Tests

```bash
{test-command}
```

All tests pass. Coverage must meet the threshold defined in quality standards.

---

### Gate 4 — Build

```bash
{build-command}
```

All packages build cleanly.

---

### Gate 5 — API surface

```bash
{api-check-command}
```

Review the diff against the current baseline.

| Diff type       | Required action                                          |
| --------------- | -------------------------------------------------------- |
| Breaking change | Major version bump — escalate to human before proceeding |
| Additive change | Minor version bump minimum                               |
| No change       | Patch version is acceptable                              |

Do not update the API baseline yet — that happens after human review.

---

### Gate 6 — Performance

```bash
{perf-check-command}
```

All benchmarks within budget. If any budget is exceeded: block release and escalate. Do not raise the budget to unblock the release.

---

### Gate 7 — Security

```bash
{security-check-command}
```

All security controls passing. Failures must be escalated to the security role immediately.

---

### Gate 8 — Governance

```bash
{governance-check-command}
```

Branch protection, CODEOWNERS, and evidence artifacts all valid.

---

## Evidence Artifacts

After all gates pass, commit evidence to `quality/`:

- API surface report
- Release evidence summary — gate results
- Any benchmark results that changed

---

## Escalate for Human Approval

Surface to the human reviewer:

1. Gate results summary (all pass / any failures)
2. API diff summary — breaking, additive, or no change
3. Version bump recommendation with rationale
4. List of packages or components included
5. Any UAT gaps (features without evidence in the UAT evidence log)

Do not proceed to version bump or publish without confirmation.

---

## After Human Approval

### Step 1 — Update API baseline (if API changed)

```bash
{api-update-baseline-command}
```

Commit the updated baseline.

### Step 2 — Version bump

Use the version bump type confirmed by the human reviewer.

### Step 3 — Tag and publish

Follow the publish procedure in `_sop/2-docs/4-devops/3-ci-cd-pipelines/ci-cd.md`.

### Step 4 — Update UAT evidence log

If this release closes sprint UAT gates, update `_sop/3-agile/2-scrum-board/6-testing/uat/uat-evidence-log.md`.

---

## Post-Flight

- [ ] All gates passed and documented
- [ ] Evidence committed to `quality/`
- [ ] API baseline updated (if applicable)
- [ ] Release checklist completed and committed
- [ ] UAT evidence log updated for completed sprints

---

## Hard Rules

- Never publish without all gates passing
- Never update the API baseline without human approval
- Never force-push a release tag
- Never mark a checklist item complete without running the actual gate
- Never push to `main` without explicit instruction

---

## Reference

- [`_sop/2-docs/4-devops/7-release-mgmt/release-checklist.md`](../../../2-docs/4-devops/7-release-mgmt/release-checklist.md) — release checklist
- [`_sop/2-docs/4-devops/3-ci-cd-pipelines/ci-cd.md`](../../../2-docs/4-devops/3-ci-cd-pipelines/ci-cd.md) — publish procedure
- [`_sop/1-agents/4-workflows/safety-rules.md`](../safety-rules.md) — approval requirements
