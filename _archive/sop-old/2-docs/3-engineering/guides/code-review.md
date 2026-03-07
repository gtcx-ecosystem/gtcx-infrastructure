# Guide: Code Review

## Purpose

Code review exists to:

- **Catch bugs** before they reach users.
- **Enforce standards** so the codebase stays consistent.
- **Share knowledge** across the team — everyone learns from every PR.
- **Improve security** — this repo implements cryptographic protocols where a subtle review miss is a security failure.

Every pull request gets reviewed. No exceptions.

## Before Reviewing

Do not start reading code until you understand what the PR is trying to do.

1. **Read the PR description.** If there is no description, request one before reviewing.
2. **Check the linked spec.** Open the referenced protocol spec (`protocols/<protocol>/SPEC.md`) or issue. Understand expected behavior.
3. **Read the tests first.** Tests tell you what the author believes the code should do.
4. **Look at the file list.** Get a sense of scope before diving into diffs.

## Review Checklist

Work through each category for every PR.

### Correctness

- Does the code do what the PR description claims?
- Are edge cases handled: empty inputs, null/undefined, concurrent access, boundary values?
- For protocol code: does it match the canonical spec (`protocols/<protocol>/SPEC.md`)?
- For cryptographic code: are all signatures verified before use? Are key bytes validated?

### Standards

- Does it follow the conventions in [code-standards.md](../code-standards.md)?
- Is the linter clean? No `eslint` warnings, no `ruff` errors, no suppression without justification.
- Are types correct and specific? No `any` in TypeScript, type hints present in Python.

### Security

Security review is mandatory. This repo implements cryptographic protocols.

- Signature verification present before use — not just a presence check?
- Input validated at every external boundary?
- `enforceStubGuard()` called before any stub-backed production path?
- No raw key material logged or exposed in error messages?
- Rate limiting and replay protection wired correctly?
- Auth middleware assembled in the correct order?

**Request a second reviewer** for any change to `packages/crypto/`, `packages/auth/`, `packages/audit/`, or signature verification paths in protocol handlers.

### Performance

- No N+1 patterns — no database or store calls inside loops?
- Are batch operations bounded? Can they be called with arbitrarily large inputs?
- For hot paths (signature verification, oracle processing, audit log): are benchmark results provided?

### Tests

- Do tests exist for new and changed functionality?
- Are cryptographic tests using known test vectors — not just round-trips?
- Are error paths and rejection cases covered, not just the happy path?
- Is each test independent — no test relies on state from another?

### AI-Generated Code

AI-generated code requires additional scrutiny because it fails differently than human-written code.

- **Verify all imports** — AI frequently invents package names. Confirm resolution with `pnpm install`.
- **Check API signatures** — AI merges features from different library versions. Spot-check against actual source files in `packages/`.
- **Watch for confident-but-wrong patterns** — especially in auth logic and stub guard wiring.
- **Ensure test assertions are meaningful** — AI tests often assert the implementation, not the behavior.

See [ai-assisted-development.md](ai-assisted-development.md) for the full AI review process.

## Giving Feedback

- **Be constructive.** Critique the code, not the person.
- **Explain why, not just what.** "This could allow a replay attack because the nonce is not checked" is better than "Fix this."
- **Suggest alternatives.** If you see a problem, propose a direction.
- **Use the `nit:` prefix** for style nitpicks that do not block approval.
- **Distinguish blocking vs. non-blocking** — be explicit about what must change before approval.

## Turnaround

- **Review within 24 hours** of being requested. Stale PRs slow everyone down.
- **Respond to review comments within 24 hours.** If you cannot address feedback immediately, acknowledge it.

## When to Approve

Approve the PR when:

- All blocking comments have been addressed.
- CI passes: lint, typecheck, test, build.
- You would be comfortable maintaining this code.
- The code does what the PR description says it does.

## When to Request Changes

Request changes when:

- There is a **security issue** — injection, auth bypass, missing stub guard, exposed key material.
- **Functionality is broken** — the code does not do what it claims.
- **Tests are missing** for critical paths — signature verification, protocol state transitions, auth flows.
- **Spec is violated** — the implementation diverges from `protocols/<protocol>/SPEC.md`.

## Reference

- [code-standards.md](../code-standards.md)
- [testing.md](../testing.md)
- [ai-assisted-development.md](ai-assisted-development.md)
- [\_sop/2-docs/1-architecture/decisions/](../../1-architecture/decisions/)
