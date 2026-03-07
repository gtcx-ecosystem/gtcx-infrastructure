# Guide: AI-Assisted Development

How to use AI effectively for code generation in the GTCX Protocol layer.

---

## Philosophy

AI is a force multiplier, not a replacement for engineering judgment.

- **AI generates, humans decide.** The AI proposes code; you accept, modify, or reject it. You are the architect. The AI is the typist.
- **Every line of AI code gets the same scrutiny as human code.** There is no "the AI wrote it" exemption from code review, testing, or security standards.
- **AI accelerates the boring parts** so you can spend more time on what matters: protocol correctness, cryptographic safety, and edge cases.

---

## When to Use AI

### Good Uses

| Task                              | Why It Works                                     |
| --------------------------------- | ------------------------------------------------ |
| Scaffolding new protocol handlers | Repetitive structure, well-defined patterns      |
| Writing tests                     | Pattern-heavy, benefits from coverage breadth    |
| Generating boilerplate            | Module wiring, schema definitions, CRUD adapters |
| Refactoring                       | Mechanical transformations across many files     |
| Documentation                     | Summarizing code intent, generating API docs     |
| Data transformations              | Mapping, parsing, serialization logic            |

### Use with Extra Caution

| Task                     | Why to Be Careful                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Cryptographic operations | AI produces "looks right" crypto code with subtle failures. Verify against NIST test vectors.                  |
| Auth middleware assembly | Incorrect ordering creates auth bypasses. AI does not understand the security model.                           |
| Stub guard wiring        | AI omits `enforceStubGuard()` calls or wires them incorrectly. Always check manually.                          |
| Protocol spec compliance | AI does not know the canonical spec. Cross-check every field against `protocols/<protocol>/SPEC.md`.           |
| Audit log hash chaining  | Chain integrity requires exact field ordering. AI gets this wrong without the exact implementation as context. |

---

## Prompt Patterns

### Context-First

Provide file paths, existing patterns, and constraints **before** asking for code.

```
Here is the existing VaultMark custody handler pattern:
- File: protocols/vaultmark/src/custody.ts
- Uses @gtcx/crypto for Ed25519 signing via CryptoProvider interface
- All state-changing operations append to the audit log

Generate a similar handler for a new "seal-reissue" operation following the same pattern.
```

### Incremental

Build up in small pieces. Do not ask for an entire protocol implementation at once.

1. Generate the type definitions and schema
2. Review and adjust
3. Generate the core handler function
4. Review and adjust
5. Generate tests
6. Review and adjust

### Constraint-Explicit

State your constraints up front. Do not assume the AI knows this stack.

```
Requirements:
- Use Vitest, not Jest
- TypeScript strict mode
- All crypto operations via CryptoProvider interface (never call node:crypto directly)
- enforceStubGuard() must be called at the top of any function that uses in-memory stubs
- Import @gtcx/* packages, not relative paths outside the package
```

---

## Review Process for AI Code

Every piece of AI-generated code must pass these steps before merge.

### Step 1: Compile, lint, typecheck

```bash
pnpm turbo build --filter=@gtcx/protocol-<name>
pnpm turbo lint --filter=@gtcx/protocol-<name>
pnpm turbo typecheck --filter=@gtcx/protocol-<name>
```

If it does not compile cleanly, fix or regenerate before continuing.

### Step 2: Verify imports and API signatures

AI models frequently invent package names and method signatures. Before committing:

```bash
# Confirm no resolution failures
pnpm install

# Verify @gtcx/* exports actually exist
grep -r "export.*<functionName>" packages/
```

Cross-check method signatures against the actual source files in `packages/` — not documentation, not memory.

### Step 3: Security review

Look specifically for:

- Crypto operations bypassing the `CryptoProvider` interface
- Missing signature verification before use
- Missing `enforceStubGuard()` on stub-backed paths
- Audit log entries missing from state-changing operations
- Replay cache not wired on operations that require idempotency

### Step 4: Edge cases

AI-generated code tends to handle the sunny-day scenario and ignore:

- Null/undefined inputs
- Empty arrays and zero-length byte arrays
- Key format mismatches (PEM vs DER, base64 vs base64url)
- Signature verification returning `false` vs throwing
- Offline queue overflow

### Step 5: Tests are meaningful

Watch for tests that:

- Mock the `CryptoProvider` in ways that make cryptographic tests meaningless
- Only cover the happy path
- Assert the exact implementation rather than the behavior

---

## Common Hallucination Patterns

| Pattern                                  | Example                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------ |
| Invented `@gtcx/*` exports               | `@gtcx/crypto.generateKeypair()` — check actual `packages/crypto/index.ts`     |
| Wrong `CryptoProvider` method signatures | AI often swaps argument order: correct is `sign(payload, privateKey, keyId?)`  |
| Missing hash-chain fields                | AI forgets `previousHash` in audit log entries — chain breaks silently         |
| Stub guard omission                      | AI wraps stub usage in try/catch instead of calling `enforceStubGuard()` first |

---

## Session Workflow

1. **Load context** — Read `CLAUDE.md` and `_sop/1-agents/orientation.md`. Identify the relevant protocol spec.
2. **Define objective** — State clearly what you are building. Write it down.
3. **Generate code** — Use the prompt patterns above. Work incrementally.
4. **Review** — Apply the review steps above to every generated block.
5. **Test** — Run tests locally. Add missing test cases for error paths and cryptographic edge cases.
6. **Commit** — Follow the git workflow in [git-workflow.md](../git-workflow.md).
7. **Session recap** — If leaving work incomplete, create a handoff doc in `_sop/4-sessions/`.

---

## Anti-Patterns

| Anti-Pattern                                          | Why It Is Dangerous                                                |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| Accepting large generated blocks without reading them | You are now maintaining code you do not understand                 |
| Skipping tests because "the AI wrote it correctly"    | AI code has the same bug rate as human code, sometimes higher      |
| Letting AI make protocol design decisions             | Protocol correctness requires the spec, which the AI does not have |
| Not verifying that `@gtcx/*` exports actually exist   | Phantom exports break silently at runtime, not at import           |
| Skipping the stub guard check                         | Production will throw — but only after the code ships              |

---

## Reference

- [code-review.md](code-review.md)
- [testing.md](../testing.md)
- [code-standards.md](../code-standards.md)
- [\_sop/1-agents/context-recovery.md](../../../1-agents/context-recovery.md)
