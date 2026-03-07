# Task Playbook: Investigate a CI Failure

**Owner:** {quality-role} (triage) + relevant role (fix)
**Safety tier:** Autonomous (investigation) / role-dependent (fix)

---

## When to Run This

Run when a CI gate fails on a PR or on `main`. Do not retry the same failing command repeatedly. Investigate, identify root cause, and fix at the source.

---

## Triage Order

Work through failures in this order — resolve each before moving to the next:

1. `{architecture-check-command}` — boundary violations block everything
2. `{typecheck-command}` — type errors indicate structural problems
3. `{lint-command}` — surface issues before running tests
4. `{test-command}` — test failures after clean type and lint
5. `{build-command}` — build failures after tests pass
6. `{api-check-command}` — API drift after build
7. `{perf-check-command}` — budget failures after build
8. `{security-check-command}` — security gate
9. `{governance-check-command}` — governance gate

Never skip a gate to get to the next one. Never use `--no-verify`.

---

## Investigation Protocol

### Step 1 — Read the full error output

Do not act on the first line of an error. Read the complete output. Errors frequently have a root cause earlier in the output than the final failure message.

---

### Step 2 — Identify the failure category

| Category                        | Indicator                            | Owner                              |
| ------------------------------- | ------------------------------------ | ---------------------------------- |
| Architecture boundary violation | `{architecture-check-command}` error | {architect-role}                   |
| Phantom dependency              | Import not in package manifest       | {architect-role}                   |
| Type error                      | Type error code                      | Role owning the affected component |
| Test failure                    | `FAIL` in test output                | Role owning the affected component |
| Build error                     | Compilation or bundling failure      | Role owning the affected component |
| API drift                       | `{api-check-command}` diff output    | {quality-role}                     |
| Performance budget exceeded     | `{perf-check-command}` failure       | {infra-role}                       |
| Security gate failure           | `{security-check-command}` output    | {security-role}                    |

---

### Step 3 — Read the affected file before modifying it

Read the failing test, the failing module, and the spec for the affected component before writing any fix.

---

### Step 4 — Identify root cause, do not fix symptoms

| Symptom                         | Root cause to investigate                                                                       |
| ------------------------------- | ----------------------------------------------------------------------------------------------- |
| Test failure after merge        | Was a shared type changed? Does the test reflect the contract or an implementation detail?      |
| Architecture boundary violation | Was a new import added without updating the boundary config? Is the import direction correct?   |
| Performance budget exceeded     | Was a new operation added in the hot path? Was the benchmark run on an under-resourced machine? |
| API drift                       | Was a public export changed, added, or removed intentionally? Does it need a version bump?      |
| Phantom dependency              | Was a new package used without declaring it in the manifest?                                    |

---

### Step 5 — Fix at the source

Acceptable fixes:

- Correct the code to match the spec
- Update the test to reflect a valid spec change (not to make it pass artificially)
- Declare the missing dependency
- Restore the architectural boundary

Unacceptable fixes:

- `--no-verify`
- Disabling a gate
- Widening a boundary beyond what the spec allows
- Skipping a test

---

### Step 6 — Verify the fix

Run the specific failing gate first, then run the full sequence:

```bash
{architecture-check-command} && {lint-command} && {typecheck-command} && {test-command} && {build-command}
```

---

## Escalation Criteria

Escalate to human review if:

- The fix requires changing a security-sensitive component
- The fix requires updating the API baseline
- The fix requires modifying performance budgets
- Root cause is unclear after 2 investigation cycles
- The CI failure is in a gate that has never failed before (potential regression in the gate itself)

When escalating: state the gate that failed, the full error output, the root cause hypothesis, and why human judgment is needed.

---

## Post-Fix

- All gates pass
- Root cause documented in the PR description
- If the fix changes a spec: spec is updated
- If the fix reveals a spec gap: gap is added to `_sop/2-docs/3-engineering/5-compliance/spec-to-code-traceability.md`

---

## Reference

- [`_sop/1-agents/4-workflows/safety-rules.md`](../safety-rules.md) — what requires escalation
- [`_sop/2-docs/4-devops/2-runbooks/quality-runbook.md`](../../../2-docs/4-devops/2-runbooks/quality-runbook.md) — full gate sequence
- [`_sop/2-docs/3-engineering/5-compliance/spec-to-code-traceability.md`](../../../2-docs/3-engineering/5-compliance/spec-to-code-traceability.md) — traceability matrix
