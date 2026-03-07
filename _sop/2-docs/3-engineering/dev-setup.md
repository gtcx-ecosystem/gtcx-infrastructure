# Dev Setup

Repository setup, toolchain, local development, and environment variables for the GTCX Protocol monorepo.

---

## Prerequisites

| Tool    | Version    | Install                                                  |
| ------- | ---------- | -------------------------------------------------------- |
| Node.js | ≥ 20.x LTS | [nodejs.org](https://nodejs.org) or `nvm install 20`     |
| pnpm    | ≥ 9.x      | `npm install -g pnpm`                                    |
| Python  | ≥ 3.11     | [python.org](https://python.org) or `pyenv install 3.11` |
| Docker  | ≥ 25.x     | [docs.docker.com](https://docs.docker.com/get-docker/)   |
| Git     | ≥ 2.40     | System package manager                                   |

---

## Clone and Install

```bash
# 1. Clone the repository
git clone <repo-url>
cd <repo-name>

# 2. Install all workspace dependencies
pnpm install

# 3. Copy environment variables
cp .env.example .env

# 4. Install Python dependencies (for Python SDK and Ruff)
pip install -e "packages/python-sdk[dev]"
```

---

## Environment Variables

All secrets come from a secure source. Never commit `.env`.

| Variable                 | Description              | Source                                |
| ------------------------ | ------------------------ | ------------------------------------- |
| `NODE_ENV`               | Runtime environment      | Set to `development` locally          |
| `GTCX_NETWORK_ID`        | Network identifier       | `gtcx:testnet` for local development  |
| `GTCX_API_KEY`           | API key for testnet      | Team lead or internal vault           |
| `GTCX_STUB_STORE`        | Enables in-memory stores | Set to `true` for local dev/test only |
| `GTCX_STUB_RATE_LIMITER` | Disables rate limiting   | Set to `true` for local dev/test only |
| `GTCX_STUB_REPLAY_CACHE` | In-memory replay cache   | Set to `true` for local dev/test only |
| `LOG_LEVEL`              | Log verbosity            | `debug` locally, `info` in CI         |

> `GTCX_STUB_*` variables must never be set in production environments. `enforceStubGuard()` will throw if in-memory stubs are detected in a non-stub-allowed environment. See [ADR-002](../1-architecture/decisions/002-in-memory-stub-guards.md).

---

## Build

```bash
# Build all packages and protocols (via Turborepo)
pnpm build

# Build a specific package
pnpm build --filter @gtcx/protocol-tradepass

# Type-check without building
pnpm typecheck

# Watch mode (rebuilds on file change)
pnpm dev
```

---

## Running Tests

```bash
# All tests
pnpm test

# Watch mode
pnpm test --watch

# Coverage report
pnpm test --coverage

# Specific protocol
pnpm test --filter @gtcx/protocol-vaultmark

# Single test file
pnpm test protocols/tradepass/src/credentials.test.ts

# Integration tests
pnpm test:integration

# Python tests
cd packages/python-sdk && pytest
```

---

## Linting and Formatting

```bash
# TypeScript/JS: ESLint
pnpm lint

# TypeScript/JS: Prettier format check
pnpm format:check

# TypeScript/JS: Prettier auto-format
pnpm format

# Python: Ruff lint
ruff check .

# Python: Ruff format
ruff format .
```

All linting and formatting checks run in CI on every PR. Fix issues locally before pushing.

---

## Package Structure

```
gtcx-protocols/
├── packages/
│   ├── crypto/           # @gtcx/crypto — Ed25519, AES-256-GCM, SHA-256
│   ├── schemas/          # @gtcx/schemas — Zod schemas for all protocols
│   ├── validators/       # @gtcx/validators — shared validation utilities
│   ├── types/            # @gtcx/types — shared TypeScript types
│   └── domain/           # @gtcx/domain — shared domain logic
│
├── protocols/
│   ├── tradepass/        # @gtcx/protocol-tradepass
│   ├── geotag/           # @gtcx/protocol-geotag
│   ├── gci/              # @gtcx/protocol-gci
│   ├── vaultmark/        # @gtcx/protocol-vaultmark
│   ├── pvp/              # @gtcx/protocol-pvp
│   └── panx/             # @gtcx/protocol-panx
│
├── sdk/
│   ├── typescript/       # @gtcx/sdk — TypeScript SDK
│   └── python/           # gtcx-sdk — Python SDK
│
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

---

## Path Aliases

TypeScript path aliases are configured in `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Import from `@/` instead of relative paths within a package:

```typescript
import { issueCredential } from '@/credentials'; // Good
import { issueCredential } from '../../credentials'; // Avoid
```

---

## IDE Setup

**Recommended:** VS Code or Cursor

**Extensions:**

| Extension             | Purpose                       |
| --------------------- | ----------------------------- |
| ESLint                | Inline lint errors            |
| Prettier              | Auto-format on save           |
| TypeScript (built-in) | Type checking                 |
| Vitest                | Test runner integration       |
| Ruff                  | Python linting and formatting |

**VS Code settings (`.vscode/settings.json`):**

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[python]": {
    "editor.defaultFormatter": "charliermarsh.ruff"
  },
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```

---

## Setup Verification Checklist

- [ ] `pnpm install` completes without errors
- [ ] `.env` file created with all required variables
- [ ] `pnpm build` succeeds across all packages
- [ ] `pnpm typecheck` passes with zero errors
- [ ] `pnpm test` passes — all tests green
- [ ] `pnpm lint` passes with zero errors
- [ ] Protocol SDK can reach testnet: `GTCX_API_KEY=... pnpm test:integration`

---

## Common Issues

| Problem                                   | Cause                                      | Solution                                        |
| ----------------------------------------- | ------------------------------------------ | ----------------------------------------------- |
| `enforceStubGuard()` throws in tests      | `GTCX_STUB_STORE` not set                  | Add `GTCX_STUB_STORE=true` to your `.env`       |
| TypeScript path alias not resolving       | Missing `paths` in package `tsconfig.json` | Extend from `../../tsconfig.base.json`          |
| `pnpm install` fails with workspace error | Node.js version mismatch                   | Run `nvm use 20` and retry                      |
| Python tests fail with import error       | Python SDK not installed in editable mode  | Run `pip install -e "packages/python-sdk[dev]"` |
| Turborepo cache stale                     | Cached build artifacts outdated            | Run `pnpm build --force` to bypass cache        |

---

## Reference

- [code-standards.md](code-standards.md)
- [testing.md](testing.md)
- [git-workflow.md](git-workflow.md)
