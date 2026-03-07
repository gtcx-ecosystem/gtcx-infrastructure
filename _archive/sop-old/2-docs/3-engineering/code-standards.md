# Code Standards

Coding standards enforced across all packages and protocols in the GTCX Protocol monorepo. These apply equally to human-written and AI-generated code.

---

## TypeScript / JavaScript

### Type Safety

- **`strict: true`** in all `tsconfig.json` files — no exceptions.
- **No `any`** — use `unknown` and narrow with type guards, or define proper types.
- **Explicit return types on exports** — all exported functions must declare their return type.
- **Zero `any` in production code** — Zod schemas at all system boundaries enforce this.

### Syntax

- **ESM imports only** — use `import`/`export`, not `require()`.
- **`const` by default** — use `let` only when reassignment is necessary. Never `var`.
- **Strict equality** — always `===`, never `==`.
- **Path aliases** — use `@/*` mapped to `src/*` for clean imports. Configure in both `tsconfig.json` and test config.

### Style

- **Early returns over nested ifs** — reduce indentation, improve readability.
- **Small functions** — target under 30 lines. Longer functions likely do too much.
- **Meaningful names** — variables and functions should reveal intent. No single-letter names except in trivial loop indices.
- **No magic numbers** — extract as named constants.
- **Handle errors explicitly** — no swallowed exceptions, no empty catch blocks. Log or propagate with context.
- **Comments explain why, not what** — code should be self-documenting for the "what."

---

## Python

- **Type hints required** — all function signatures must have type annotations.
- **Ruff** — used for both linting and formatting (replaces black, isort, flake8). Run `ruff check` and `ruff format`.
- **Pydantic models** at all API and validation boundaries.
- **Google-style docstrings** on all public functions and classes.

---

## File Organization

- **Barrel exports for packages** — `index.ts` re-exports the full public API. Internal modules are not part of the public API.
- **Co-locate tests with source** — `foo.ts` and `foo.test.ts` live in the same directory.
- **One primary export per module** — keep modules focused.
- **Group by feature, not by type** — at scale, prefer `user/UserCard.tsx` over `components/UserCard.tsx`.

---

## Protocol-Specific Standards

### Schema Validation

All external inputs must be validated with Zod at the protocol boundary:

```typescript
// At every API handler entry point
const parsed = MyInputSchema.safeParse(rawInput);
if (!parsed.success) {
  throw invalidArg('Invalid input', { errors: parsed.error.issues });
}
```

### Stub Guards

Every API handler in production code must call `enforceStubGuard()` before accessing any in-memory store. See [ADR-002](../1-architecture/decisions/002-in-memory-stub-guards.md).

```typescript
export async function handleTransfer(input: unknown): Promise<TransferResult> {
  enforceStubGuard('vaultmark.transfer'); // Required — first line
  const parsed = TransferInputSchema.parse(input);
  // ...
}
```

### Error Handling

Use the structured error taxonomy. See [ADR-001](../1-architecture/decisions/001-error-taxonomy.md).

```typescript
// For argument/validation errors
throw invalidArg('assetId must be a valid lot ID', { received: assetId });

// For protocol-level errors — use GtcxError with a specific code
throw new GtcxError('CUSTODY_TRANSFER_FAILED', { assetId, reason: 'Weight mismatch' });
```

### Audit Logging

All state changes that affect protocol state must emit an audit log entry. Audit entries are hash-chained — never mutate or delete them.

```typescript
await auditLog.append({
  source: 'vaultmark.custody',
  action: 'transfer.completed',
  actor: fromCustodian,
  targetId: assetId,
  data: { fromState, toState, signatures },
});
```

---

## AI-Generated Code Standards

AI-generated code is held to the same standard as human-written code:

1. **Must pass all linting and testing** — no exceptions for AI output.
2. **Review AI code like human code** — AI output is a starting point, not a finished product.
3. **Verify edge cases explicitly** — AI often misses boundary conditions and error paths.
4. **Document novel AI-introduced patterns** — if AI introduces a pattern not seen elsewhere in the codebase, document it before merging.

---

## Toolchain Reference

| Tool       | Purpose                     | Config File           |
| ---------- | --------------------------- | --------------------- |
| TypeScript | Type checking               | `tsconfig.json`       |
| ESLint     | Linting                     | `.eslintrc.js`        |
| Prettier   | Formatting                  | `.prettierrc`         |
| Vitest     | Testing                     | `vitest.config.ts`    |
| Ruff       | Python linting + formatting | `ruff.toml`           |
| Turborepo  | Build orchestration         | `turbo.json`          |
| pnpm       | Package management          | `pnpm-workspace.yaml` |

---

## Reference

- [git-workflow.md](git-workflow.md)
- [testing.md](testing.md)
