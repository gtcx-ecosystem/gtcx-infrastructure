# Quality Gates Runbook — {repo-name}

Required quality gates and triage order. Run this sequence before every release and after any CI gate failure.

---

## Primary Gate Sequence

Run in order. Do not skip or reorder. Do not proceed past a failing gate.

```bash
{architecture-check-command}     # Dependency graph + boundary enforcement
{governance-check-command}       # Governance artifacts and CODEOWNERS validity
{lint-command}                   # Linting across all packages
{format-check-command}           # Format check
{typecheck-command}              # Strict type checking
{test-command}                   # Full test suite
{test-coverage-command}          # Critical path coverage thresholds
{build-command}                  # All packages and components
{api-check-command}              # API surface baseline comparison
{security-check-command}         # Security control validation
{perf-check-command}             # Performance budget enforcement
```

---

## Failure Triage Order

Resolve failures in this order — fix each before moving to the next:

1. `{architecture-check-command}` — boundary violations make all subsequent results unreliable
2. `{typecheck-command}` — type errors indicate structural problems
3. `{lint-command}` — surface errors before running tests
4. `{test-command}` / `{test-coverage-command}` — test failures after clean type and lint
5. `{build-command}` — build failures after tests pass
6. `{api-check-command}` — API drift after build
7. `{perf-check-command}` — performance regression after build
8. `{security-check-command}` — escalate to security role immediately
9. `{governance-check-command}` — update documentation or governance artifacts

---

## Evidence Artifacts

| Artifact             | Path                                 |
| -------------------- | ------------------------------------ |
| API surface report   | `quality/api-surface-report.json`    |
| API surface baseline | `quality/api-surface-baseline.json`  |
| Performance history  | `benchmarks/history.json`            |
| Performance report   | `benchmarks/performance-report.json` |
| Provenance manifest  | `artifacts/provenance-manifest.json` |

---

## Notes

- Update the API baseline only after human approval.
- Do not raise performance budgets to unblock a failing gate — investigate the regression.
- Security gate failures must be escalated to the designated security role before resolution.

---

## Reference

- [`_sop/2-docs/4-devops/7-release-mgmt/release-checklist.md`](../7-release-mgmt/release-checklist.md) — release gate checklist
- [`_sop/2-docs/5-specs/6-testing/quality-standards.md`](../../5-specs/6-testing/quality-standards.md) — test coverage standards
- [`_sop/1-agents/4-workflows/tasks/investigate-ci-failure.md`](../../../1-agents/4-workflows/tasks/investigate-ci-failure.md) — investigation protocol
