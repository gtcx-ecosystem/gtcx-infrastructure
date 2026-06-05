---
title: 'Cross-Repo Package Adoption Guide'
status: 'current'
date: '2026-05-27'
owner: 'ecosystem-lead'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['ecosystem', 'packages', 'monorepo', 'adoption', 'gtcx-core']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Cross-Repo Package Adoption Guide

**Objective:** Enable all GTCX ecosystem repos to consume shared packages from `gtcx-core` instead of duplicating logic.

---

## 1. Available Packages

The `gtcx-core` monorepo publishes individual packages under the `@gtcx/*` scope:

| Package              | Purpose                                            | Version (npm) |
| -------------------- | -------------------------------------------------- | ------------- |
| `@gtcx/types`        | Shared TypeScript interfaces                       | `2.0.0`       |
| `@gtcx/crypto`       | Cryptographic primitives (Ed25519, ES256, hashing) | `2.0.0`       |
| `@gtcx/domain`       | Commodity-agnostic domain services                 | `2.0.0`       |
| `@gtcx/security`     | Validation, auth, audit logging                    | `2.0.0`       |
| `@gtcx/verification` | Certificates, QR codes, proofs                     | `2.0.0`       |
| `@gtcx/schemas`      | Zod schemas for all entities                       | `2.0.0`       |
| `@gtcx/ai`           | AI integration helpers                             | `2.0.0`       |
| `@gtcx/api-client`   | HTTP client with retries and telemetry             | `2.0.0`       |
| `@gtcx/connectivity` | Offline-first sync primitives                      | `2.0.0`       |
| `@gtcx/resilience`   | Circuit breakers, bulkheads, timeouts              | `2.0.0`       |
| `@gtcx/telemetry`    | OpenTelemetry helpers                              | `2.0.0`       |
| `@gtcx/runtime`      | Batteries-included substrate                       | `2.0.0`       |

> **Note:** `@gtcx/core` is **not** a published package. It is the monorepo root name only. Consumers must install individual packages.

---

## 2. Adding Dependencies

```bash
# In the target repo root
pnpm add @gtcx/crypto @gtcx/types
pnpm add -D @gtcx/schemas
```

All packages are published to the public npm registry (`registry.npmjs.org`). No private registry configuration is required.

---

## 3. Migration Priority

| Repo                  | Priority | Recommended Packages                                  | Effort                                              |
| --------------------- | -------- | ----------------------------------------------------- | --------------------------------------------------- |
| `gtcx-infrastructure` | High     | `@gtcx/crypto`, `@gtcx/types`                         | Medium — replace inline crypto in replay-protection |
| `gtcx-protocols`      | High     | `@gtcx/crypto`, `@gtcx/schemas`, `@gtcx/verification` | Low — natural fit for protocol crypto               |
| `gtcx-platforms`      | High     | `@gtcx/types`, `@gtcx/api-client`, `@gtcx/security`   | Medium — platform backends use shared types         |
| `gtcx-intelligence`   | Medium   | `@gtcx/ai`, `@gtcx/telemetry`                         | Low — AI helpers already aligned                    |
| `gtcx-mobile`         | Medium   | `@gtcx/connectivity`, `@gtcx/resilience`              | Medium — mobile SDK offline-first                   |
| `gtcx-markets`        | Low      | `@gtcx/types`, `@gtcx/domain`                         | Low — types-only adoption                           |

---

## 4. Demonstration: `gtcx-infrastructure`

The `03-platform/tools/replay-protection` package now depends on `@gtcx/crypto`:

```json
{
  "dependencies": {
    "@gtcx/crypto": "^2.0.0",
    "pg": "^8.15.0"
  }
}
```

This replaces the inline Ed25519 and ES256 verification with the shared `@gtcx/crypto` primitives, ensuring cryptographic consistency across the ecosystem.

---

## 5. Verification

```bash
# Check adoption in a repo
grep -r '"@gtcx/' package.json pnpm-workspace.yaml 03-platform/packages/*/package.json | wc -l

# Check across all sibling repos
for repo in gtcx-protocols gtcx-platforms gtcx-intelligence gtcx-mobile gtcx-markets; do
  echo "=== $repo ==="
  grep -c '"@gtcx/' "../$repo/package.json" 2>/dev/null || echo "0"
done
```

---

## 6. Risks & Mitigations

| Risk                               | Mitigation                                          |
| ---------------------------------- | --------------------------------------------------- |
| Version drift between repos        | Pin to semver minor (`^2.0.0`); update via Renovate |
| Breaking changes in `@gtcx/crypto` | Run `pnpm test` in consuming repo before merge      |
| Bundle size increase in mobile     | Tree-shake ESM imports; use subpath exports         |
| CI cache invalidation              | Add `@gtcx/*` to pnpm workspace catalog             |
