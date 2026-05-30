---
title: 'ADR-019: Workspace Package Boundary Discipline'
status: 'accepted'
date: '2026-05-27'
owner: 'platform-engineering'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['architecture', 'monorepo', 'packages', 'hygiene']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# ADR-019: Workspace Package Boundary Discipline

## Status

Accepted

## Date

2026-05-22

## Context

The repo started Cycle 1 with 5 workspaces registered in `pnpm-workspace.yaml` but 18 directories under `tools/`. The 13 untracked directories included real source packages (`audit-signer`, `low-bandwidth`, `ussd-handler`, `eval-pipeline`, `anomaly-detector`, `control-plane`, etc.) plus single-file utilities (`kubectl-access`, `scripts`).

The 5-of-18 split caused three concrete problems:

1. **Deep imports.** `tools/compliance-gateway/src/audit.mjs` imported `'../../audit-signer/src/index.mjs'` instead of `'@gtcx/audit-signer'`. The dep edge was real; the workspace just didn't reflect it.
2. **Inconsistent test discovery.** `validate-all.mjs` enumerated 6 packages for coverage gating; the rest weren't checked even when they had test suites.
3. **Validator surprises.** `docs-standard-validator.mjs` walks `tools/*/docs/`. Packages without a `docs/` subdir crashed the validator depending on which packages were "in" the workspace.

## Decision

Every directory under `tools/` that contains a `package.json` is registered in `pnpm-workspace.yaml`. Single-file utilities (`scripts/`, `templates/`, `kubectl-access/`) are explicitly excluded. The rule is: **physical-layout-to-workspace parity for anything with a `package.json`**.

As of Cycle 2.5, the workspace lists 11 packages:

```yaml
packages:
  - 'infra/migrations'
  - 'tools/audit-signer'
  - 'tools/audit-flush'
  - 'tools/compliance-data'
  - 'tools/compliance-gateway'
  - 'tools/compliance-gateway-mcp'
  - 'tools/replay-protection'
  - 'tools/deployment-guard'
  - 'tools/low-bandwidth'
  - 'tools/ussd-handler'
  - 'tools/eval-pipeline'
```

Internal consumers reference each other by package name (`@gtcx/audit-signer`, `@gtcx/compliance-data`), never via relative paths. The `validate-all.mjs` coverage sweep iterates the same list.

## Alternatives Considered

| Option                                       | Pros                                                                           | Cons                                                      |
| -------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------- |
| Status quo (selective workspace)             | Less surface to maintain                                                       | Deep imports proliferate; validator drift                 |
| Workspace = everything under `tools/`        | Simpler rule                                                                   | Single-file utilities pull unnecessary lint/test overhead |
| Workspace = packages with tests              | Aligned with what we actually want to enforce                                  | Definition of "has tests" is fuzzy                        |
| **Workspace = anything with `package.json`** | Mechanical rule; matches physical layout; new packages auto-include themselves | None observed                                             |

## Consequences

**Positive:**

- Zero deep imports across `tools/` — every cross-package consumer uses `@gtcx/<name>`
- `pnpm install` resolves the full graph; `pnpm -F @gtcx/<name>` works for every package
- `validate-all.mjs` coverage list grows automatically when a new `tools/*/package.json` is added
- ADR rule is mechanical — a CI lint could enforce it (`pnpm-workspace.yaml` includes every `tools/*/package.json` parent dir)

**Negative:**

- `pnpm install` warns about peer-dependency mismatches across the wider workspace. Mitigated by `pnpm` overrides in root `package.json`.
- Anyone adding a new package must also update `pnpm-workspace.yaml`. Acceptable as a one-line discipline.

**Neutral:**

- Single-file utility scripts (those outside `tools/*/package.json` boundaries) continue to live in `tools/scripts/` and are not workspaces. The boundary is the `package.json` itself.

## References

- `pnpm-workspace.yaml`
- ADR-006 — Package Boundaries and Dependencies (broader monorepo organization)
- `tools/scripts/validate-all.mjs` — coverage list mirrors workspace list
- Cycle 1 R3 commit `420ad38` — first workspace boundary correction
- Cycle 1 S6 commit `b6d095a` — audit-flush addition
