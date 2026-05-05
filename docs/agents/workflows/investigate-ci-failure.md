# Task Playbook: Investigate a CI Failure

**Owner:** DevOps engineer (triage) + relevant role (fix)
**Safety tier:** Autonomous (investigation) / role-dependent (fix)

---

## When to Run This

Run when a CI gate fails on a PR or on `main`. Do not retry the same failing command repeatedly. Investigate, identify root cause, and fix at the source.

---

## Triage Order

Work through failures in this order — resolve each before moving to the next:

1. `pnpm typecheck` — type errors in Node.js automation scripts
2. `pnpm lint` — lint errors in scripts or IaC files
3. `pnpm format:check` — formatting failures
4. `pnpm build` — build failures in automation tooling
5. `docker compose build` — Docker image failures (if container changes are in the PR)
6. Terraform validation — if Terraform modules changed: `terraform validate`

Never skip a gate to get to the next one. Never use `--no-verify`.

---

## Investigation Protocol

### Step 1 — Read the full error output

Do not act on the first line of an error. Read the complete output. Errors frequently have a root cause earlier in the output than the final failure message.

---

### Step 2 — Identify the failure category

| Category                       | Indicator                               | Owner                             |
| ------------------------------ | --------------------------------------- | --------------------------------- |
| Type error in script           | `tsc` error in Node.js tool             | DevOps engineer                   |
| Lint error                     | ESLint failure                          | DevOps engineer                   |
| Build failure                  | Compilation error in automation tooling | DevOps engineer                   |
| Docker build failure           | Image build error or missing dependency | DevOps engineer                   |
| Terraform validation error     | `terraform validate` output             | DevOps engineer                   |
| Secrets or credentials exposed | Secret scanner alert in CI output       | DevOps engineer + security review |
| Migration conflict             | Migration integrity check failure       | DevOps engineer + database review |

---

### Step 3 — Read the affected file before modifying it

Read the failing script, manifest, or Terraform module and its context before writing any fix.

---

### Step 4 — Identify root cause, do not fix symptoms

| Symptom                    | Root cause to investigate                                                          |
| -------------------------- | ---------------------------------------------------------------------------------- |
| Type error in CI script    | Was a shared type changed? Does the script reference a stale API?                  |
| Docker build failure       | Was a base image updated? Was a dependency removed from a layer?                   |
| Terraform validation error | Was a provider version updated? Was a required variable removed?                   |
| Secret scanner alert       | Was a credential accidentally committed? Check git history before pushing any fix. |
| Migration conflict         | Was a migration applied out of order? Was a migration file edited after being run? |

---

### Step 5 — Fix at the source

Acceptable fixes:

- Correct the script or automation tool to match the spec
- Update the Terraform provider version correctly
- Fix the Docker image or layer dependency
- Remove accidentally committed secrets (and rotate them — committing is a security event)

Unacceptable fixes:

- `--no-verify`
- Disabling a CI check
- Hardcoding secrets or environment values to bypass a failing check
- Editing a migration that has already run in any environment

---

### Step 6 — Verify the fix

Run the specific failing gate first, then run the full sequence:

```bash
pnpm lint && pnpm format:check && pnpm typecheck && pnpm build
```

If Docker changes were involved:

```bash
docker compose build
```

If Terraform was involved:

```bash
terraform init && terraform validate && terraform plan
```

---

## Escalation Criteria

Escalate to human review if:

- A secret or credential was exposed in the CI output or git history — this is a security incident
- A migration conflict requires editing a migration that has already run
- Root cause is unclear after 2 investigation cycles
- The CI failure is in a gate that has never failed before (potential regression in the gate itself)
- Any change touches the `gtcx_audit` database

When escalating: state the gate that failed, the full error output, the root cause hypothesis, and why human judgment is needed.

---

## Post-Fix

- All gates pass
- Root cause documented in the PR description
- If secrets were exposed: security incident reported and credentials rotated before the fix is merged

---

## Reference

- [`docs/agents/workflows/safety-rules.md`](../safety-rules.md) — what requires escalation
- [`docs/operations/runbooks/quality-runbook.md`](../../../2-docs/4-devops/2-runbooks/quality-runbook.md) — full gate sequence
