# Task: Add a New Package

Role: SDK & Integration Engineer — human approval required before adding to workspace

---

## When to Add a Package

Add a new workspace package when:

- A capability is genuinely shared across multiple protocols or SDKs
- The capability is not already provided by an existing package
- The new package has a clear, single responsibility

Do not add a package for:

- One-off utilities that are only used in one protocol
- Wrapping an external library that is already small and well-typed
- Splitting an existing package "for cleanliness" without a specific cross-consumer need

---

## Pre-Flight

Before creating anything:

- [ ] You have explicit human approval to add a new package
- [ ] You have confirmed the package does not duplicate an existing one
- [ ] You have confirmed the package name follows `@gtcx/<name>` naming
- [ ] You have identified which existing packages or protocols will consume it

---

## Steps

### 1. Create the package directory

```bash
mkdir -p packages/<name>/src
```

### 2. Initialize package.json

Follow the pattern of an existing package (e.g., `packages/validators/`):

```json
{
  "name": "@gtcx/<name>",
  "version": "0.1.0",
  "description": "<one sentence>",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src"
  },
  "dependencies": {},
  "devDependencies": {}
}
```

### 3. Configure TypeScript

```json
// tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

### 4. Create the entry point

```typescript
// src/index.ts
// Public API — only export what consumers need
```

### 5. Add to workspace

Update `pnpm-workspace.yaml` to include the new package. This requires human approval — confirm before editing.

### 6. Register in Turborepo

Turborepo picks up packages automatically from `pnpm-workspace.yaml`. Confirm the package appears in `turbo.json` pipeline if it has special build requirements.

### 7. Add tests

Every new package ships with tests. Minimum coverage thresholds apply from day one (statements 80%, branches 75%, functions 80%, lines 80%).

### 8. Document

- Add a `README.md` to the package directory explaining what it does and how to import it
- Update `_sop/2-docs/5-reference/glossary.md` if the package introduces new concepts
- If the package is user-facing (SDK-level), update `_sop/2-docs/3-engineering/sdk-guide.md`

---

## Verification

Before declaring done:

```bash
pnpm install          # Workspace resolves without errors
pnpm build --filter @gtcx/<name>   # Package builds
pnpm test --filter @gtcx/<name>    # Tests pass
pnpm typecheck --filter @gtcx/<name>  # No type errors
pnpm lint --filter @gtcx/<name>    # Lint clean
```

Also verify the package is importable from a consuming package:

```typescript
import { something } from '@gtcx/<name>';
```

---

## Reference

- `_sop/2-docs/3-engineering/code-standards.md`
- `_sop/2-docs/3-engineering/dev-setup.md`
