# Task: Investigate a CI Gate Failure

Role: Quality & Evidence Lead (primary) / any role (initial triage)

---

## Approach

Do not retry the same failing approach more than twice. If the first attempt does not resolve the failure, change strategy.

---

## Step 1: Identify the failing gate

```bash
# Check current test state
pnpm test

# Check lint
pnpm lint

# Check types
pnpm typecheck

# Check build
pnpm build
```

Note the exact error message, the file, and the line number. Do not proceed until you have a precise failure location.

---

## Step 2: Classify the failure

| Failure Type          | Likely Cause                                          | First Action                                                   |
| --------------------- | ----------------------------------------------------- | -------------------------------------------------------------- |
| TypeScript error      | Type mismatch, missing type, wrong import             | Read the file at the line number                               |
| Test failure          | Behavior changed, test is wrong, mock is stale        | Read the failing test and the source it tests                  |
| Lint error            | Rule violation, import order, unused variable         | Read the lint output exactly — the fix is usually explicit     |
| Build error           | Circular dependency, missing export, workspace config | Check `turbo.json` and `package.json` for the affected package |
| Security test failure | Stub guard in wrong env, signature check failing      | Read `_sop/2-docs/3-engineering/testing.md §6`                 |

---

## Step 3: Read before fixing

Before changing anything:

1. Read the failing file at the indicated location
2. Read the test that is failing (if applicable)
3. Understand what the code is supposed to do, not just what it is doing

---

## Step 4: Fix

Apply the minimal fix that resolves the failure.

**Do:**

- Fix the root cause
- Add a test that would have caught this, if one didn't exist

**Do not:**

- Suppress lint rules with comments unless there is no alternative and you document why
- Skip failing tests with `.skip()` — fix them or delete them
- Work around type errors with `any` — narrow the type or define it properly
- Retry the same approach more than twice

---

## Step 5: Verify the fix

```bash
# Run full gate sequence before declaring done
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

All four must pass before the investigation is complete.

---

## Step 6: Escalate if needed

Stop and escalate to the human if:

- The failure is in a security-sensitive area (`packages/crypto/`, signature verification, replay cache, audit chain)
- The fix requires changing a CI gate definition (`.github/workflows/`)
- The failure reveals a protocol correctness issue (not just a test or type issue)
- You have tried two different approaches and neither resolved it

State clearly:

- What the failure is
- What you have tried
- Why you are stuck
- What you think the options are

---

## Common Failure Patterns in This Repo

| Pattern                                           | Resolution                                                     |
| ------------------------------------------------- | -------------------------------------------------------------- |
| `StubNotAllowedError` in test                     | `GTCX_STUB_STORE=true` not set in test environment             |
| Signature verification failing in test            | Mock payload not canonicalized correctly                       |
| TypeScript `strict: true` error on optional chain | Use `?.` or explicitly check for `undefined`                   |
| Schema validation failure in test                 | Input missing a required field defined in Zod schema           |
| Build fails on path alias                         | `@/*` not configured in package's `tsconfig.json`              |
| Replay cache test flake                           | Test not resetting cache state between runs — use `beforeEach` |

---

## Reference

- `_sop/2-docs/3-engineering/testing.md`
- `_sop/2-docs/3-engineering/code-standards.md`
