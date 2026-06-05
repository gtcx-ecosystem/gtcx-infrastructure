---
title: 'Cross-Repo Package Adoption Guide'
status: 'current'
date: '2026-05-27'
owner: 'crypto-security-engineer'
role: 'crypto-security-engineer'
tier: 'informational'
tags: ['security', 'crypto', 'compliance', 'infrastructure', 'api']
review_cycle: 'monthly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Cross-Repo Package Adoption Guide

**Date:** 2026-05-12
**Updated:** 2026-05-12
**Scope:** All TypeScript service repos in `gtcx-ecosystem/*`
**Target:** 80% of active TS repos consuming `@gtcx/*` shared packages by Q3 2026
**Owner:** Platform Engineering
**M3 Dependency:** Ecosystem Integration score blocked until ≥10 repos adopted

---

## Problem Statement

The ecosystem review found that **only 1 of 23 active repos** (`gtcx-protocols`) consumes `@gtcx/*` shared packages. The remaining repos independently re-implement:

- Cryptographic primitives (Ed25519, SHA-256, key derivation)
- DID resolution and validation
- Schema validation (JSON Schema / Zod)
- Protocol message types

**Impact:**

- Security fixes must be patched in N repos instead of 1
- API contract drift — no guaranteed interoperability
- Code duplication inflates audit scope

---

## Available Packages

| Package                   | Published At    | Purpose                            | Consumers        |
| ------------------------- | --------------- | ---------------------------------- | ---------------- |
| `@gtcx/protocols-crypto`  | GitHub Packages | Ed25519, hashing, key ops          | `gtcx-protocols` |
| `@gtcx/protocols-schemas` | GitHub Packages | JSON Schema / Zod validators       | `gtcx-protocols` |
| `@gtcx/protocols-domain`  | GitHub Packages | Domain models, enums, types        | `gtcx-protocols` |
| `@gtcx/crypto-native`     | GitHub Packages | Native crypto bindings (preserved) | —                |

**Repository:** `gtcx-ecosystem/gtcx-core` (monorepo containing above packages)

---

## Adoption Pattern

### Step 1: Configure npm Registry Access

Each service repo must authenticate to GitHub Packages to install `@gtcx/*` scoped packages.

**In `.npmrc` (repo root):**

```ini
@gtcx:registry=https://npm.pkg.github.com
car
```

**In GitHub Actions workflow (before `pnpm install`):**

```yaml
- name: Configure npm auth for @gtcx packages
  run: |
    echo "@gtcx:registry=https://npm.pkg.github.com" >> .npmrc
    echo "//npm.pkg.github.com/:_authToken=${{ secrets.GITHUB_TOKEN }}" >> .npmrc
```

---

### Step 2: Add Dependencies

```bash
# In the service repo
pnpm add @gtcx/protocols-crypto @gtcx/protocols-schemas @gtcx/protocols-domain
```

**In `package.json`:**

```json
{
  "dependencies": {
    "@gtcx/protocols-crypto": "^1.0.0",
    "@gtcx/protocols-schemas": "^1.0.0",
    "@gtcx/protocols-domain": "^1.0.0"
  }
}
```

---

### Step 3: Replace Local Implementations

**Before (independent implementation):**

```typescript
// 03-platform/src/crypto.ts — duplicated in 12 repos
import { createHash } from 'crypto';

export function verifySignature(message: string, sig: string, pubkey: string): boolean {
  // Custom Ed25519 verification — subtly different in each repo
  const hash = createHash('sha256').update(message).digest('hex');
  return hash === sig.slice(0, 64); // ❌ Not real Ed25519
}
```

**After (using shared package):**

```typescript
// 03-platform/src/crypto.ts — single source of truth
import { verifyEd25519Signature } from '@gtcx/protocols-crypto';

export function verifySignature(message: string, sig: string, pubkey: string): boolean {
  return verifyEd25519Signature(message, sig, pubkey); // ✅ Audited, tested, consistent
}
```

---

### Step 4: Add CI Gate (Prevent Regressions)

**In `.github/workflows/ci.yml` (or shared composite action):**

```yaml
- name: Check for crypto re-implementation
  run: |
    # Fail CI if repo re-implements crypto primitives
    if grep -r "createHash('sha256')" 03-platform/src/ || grep -r "ed25519" 03-platform/src/ --include="*.ts" | grep -v "@gtcx/protocols-crypto"; then
      echo "::error::Re-implementing crypto primitives. Use @gtcx/protocols-crypto instead."
      exit 1
    fi
```

**Recommended:** Use `eslint-plugin-import-x` with a restricted-imports rule:

```javascript
// eslint.config.mjs
{
  rules: {
    'no-restricted-imports': ['error', {
      paths: [
        { name: 'crypto', importNames: ['createHash', 'createSign'], message: 'Use @gtcx/protocols-crypto instead' },
      ],
    }],
  },
}
```

---

## Rollout Plan

### Phase 1 — Tier 1 Repos (This Sprint)

| Repo                | Owner    | Effort | Blocker |
| ------------------- | -------- | ------ | ------- |
| `gtcx-intelligence` | AI Team  | 2 days | None    |
| `baseline-os`       | Platform | 1 day  | None    |
| `ledger-ui`         | Frontend | 1 day  | None    |

### Phase 2 — Tier 2 Repos (Next Sprint)

| Repo             | Owner      | Effort | Blocker                   |
| ---------------- | ---------- | ------ | ------------------------- |
| `gtcx-mobile`    | Mobile     | 2 days | React Native compat check |
| `gtcx-hardware`  | IoT        | 3 days | Embedded JS bundle size   |
| `gtcx-platforms` | Platforms  | 2 days | None                      |
| `gtcx-agentic`   | Agentic    | 2 days | None                      |
| `terra-os`       | Terra      | 3 days | None                      |
| `compliance-os`  | Compliance | 2 days | None                      |

### Phase 3 — Tier 3 Repos (Following Sprint)

| Repo                | Owner        | Effort | Blocker                               |
| ------------------- | ------------ | ------ | ------------------------------------- |
| `terminal-os`       | Terminal     | 2 days | None                                  |
| `griot-ai`          | Griot        | 2 days | Needs LICENSE first                   |
| `gtcx-markets`      | Markets      | 2 days | None                                  |
| `gtcx-agile`        | Agile        | 1 day  | JS (not TS) — limited package support |
| `gtcx-complianceos` | ComplianceOS | 2 days | None                                  |

---

## Exceptions

These repos are **exempt** from package adoption (with rationale):

| Repo                  | Reason                                       |
| --------------------- | -------------------------------------------- |
| `gtcx-core`           | Owner of the packages — self-referential     |
| `gtcx-protocols`      | Already consuming                            |
| `gtcx-infrastructure` | HCL/infra repo — no TS runtime               |
| `sensei-ai`           | Python repo — needs PyPI equivalent (future) |
| `nyota-ai`            | Python repo — needs PyPI equivalent (future) |
| `gtcx-core12` ⛔      | Deprecated                                   |
| `gtcx-amis` ⛔        | Deprecated                                   |
| `gtcx-docs`           | Docs hub — no business logic                 |
| `veritas-ai`          | No CI — blocked until CI restored            |
| `exploration-os`      | No build system — blocked until structured   |

---

## Success Metrics

| Metric                      | Baseline  | Target      | Measurement                        |
| --------------------------- | --------- | ----------- | ---------------------------------- |
| Repos consuming `@gtcx/*`   | 1/23 (4%) | 15/23 (65%) | `package.json` dependency scan     |
| Crypto re-implementations   | ~12 repos | 0 repos     | Custom ESLint rule + CI gate       |
| Schema validation drift     | High      | Zero        | Contract test matrix pass rate     |
| Security patch blast radius | N repos   | 1 repo      | Time to patch CVE across ecosystem |

---

## Template PR

When opening adoption PRs in service repos, use this template:

```markdown
## Package Adoption: @gtcx/protocols-\*

### Changes

- [ ] Added `@gtcx/protocols-crypto` dependency
- [ ] Added `@gtcx/protocols-schemas` dependency
- [ ] Added `@gtcx/protocols-domain` dependency
- [ ] Replaced local crypto implementation with shared package
- [ ] Replaced local schema validators with shared package
- [ ] Added `.npmrc` for GitHub Packages auth
- [ ] Updated CI workflow with registry auth step
- [ ] Added ESLint rule to prevent re-implementation

### Verification

- [ ] `pnpm test` passes
- [ ] `pnpm build` passes
- [ ] `pnpm lint` passes
- [ ] No `createHash`, `ed25519`, or `jsonschema` found in `03-platform/src/` outside `@gtcx` imports

### References

- [Package Adoption Guide](https://github.com/gtcx-ecosystem/gtcx-infrastructure/blob/main/01-docs/engineering/package-adoption-guide.md)
- [gtcx-core packages](https://github.com/gtcx-ecosystem/gtcx-core)
```

---

## Maintenance

### Version Updates

Shared packages follow SemVer. Platform Engineering publishes updates:

```bash
# In gtcx-core repo
pnpm version patch  # or minor/major
pnpm publish
```

Service repos receive Dependabot alerts for `@gtcx/*` updates.

### Breaking Changes

Breaking changes require a **migration guide** in `gtcx-core/CHANGELOG.md` and a **#gtcx-platform** Slack announcement. Platform Engineering opens migration PRs in Tier 1 repos.

---

_Guide version: 1.0_  
_Next review: After Phase 1 completion (target: 2026-05-20)_
