---
title: 'Layout v3 migration complete — gtcx-infrastructure'
status: current
date: 2026-06-06
owner: gtcx-infrastructure
role: platform-engineer
tier: critical
review_cycle: quarterly
---

# Layout v3 migration complete — gtcx-infrastructure

**Score:** 100/100 GREEN (`migrationComplete: true`)  
**Commit:** `d2ad032` (series: `efa0e08`, `a4bad2f`, `78a9b82`, `d2ad032`)  
**Scored at:** 2026-06-06T13:41:10Z (re-verified 2026-06-06)

## Evidence

| Artifact               | Path                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| Migration score (SoR)  | `gtcx-agentic/05-audit/evidence/migration-health-gtcx-infrastructure-latest.json`            |
| L2/L3 tiers            | **L2 100/100** · **L3 100/100** @ `pnpm layout:strings:check` + `pnpm agent:bootstrap:check` |
| Layout v3 spec pointer | `01-docs/04-ops/workspace/ecosystem-repo-layout-v3.md`                                       |
| Root allowlist         | `01-docs/operations/repo/root-allowlist.json` (v3.2.0)                                       |
| Ops manifest           | `config/ops.manifest.json`                                                                   |

## Phase 1 gates (exit codes)

| Command                                           | Exit |
| ------------------------------------------------- | ---- |
| `pnpm check:workspace-root-cleanliness:strict`    | 0    |
| `pnpm config:stubs:check`                         | 0    |
| `pnpm layout:migrate:v6:check`                    | 0    |
| `pnpm ops:check`                                  | 0    |
| `pnpm pm:sync`                                    | 0    |
| `ecosystem:check-repo-document-manifest --strict` | 0    |
| `ecosystem:check:governance-spine --strict`       | 0    |

## Phase 4 gates (exit codes)

| Command          | Exit |
| ---------------- | ---- |
| `pnpm lint`      | 0    |
| `pnpm typecheck` | 0    |
| `pnpm test`      | 0    |
| `pnpm ops:check` | 0    |

## Score dimensions (100/100)

| ID           | Score | Notes                     |
| ------------ | ----- | ------------------------- |
| S Structure  | 15/15 | Seven hubs `00`–`06`      |
| P Paths      | 20/20 | Layout drift clean        |
| L Links/docs | 15/15 | Lint + agent docs         |
| O Ops        | 10/10 | ops:check, stubs, pm:sync |
| B Build      | 15/15 | typecheck + build         |
| T Tests      | 25/25 | test script green         |

## Changes (surgical)

- Relocated root `CONTRIBUTING.md` / `SECURITY.md` → `01-docs/operations/repo/` (Protocol 31)
- Moved `eslint.config.mjs` SoR → `config/toolchain/` with root `eslint.config.js` re-export
- Moved `mise.toml` → `.mise.toml`, `renovate.json` → `.github/renovate.json`
- Added `03-platform/scripts/layout-drift-check.mjs` + `layout:migrate:v6:check` / `ops:check` scripts
- Fixed SOC2 inventory links to tier-B governance paths
- Added `CODE_OF_CONDUCT.md` to docs-standard uppercase allowlist (P33 tier B)
- Added `typescript` devDep to `@gtcx/docs-site` (typecheck gate)

## Prerequisite (gtcx-agentic registry)

`gtcx-infrastructure` entry added to `gtcx-agentic/config/ecosystem-governance-spine.json` (MIT, `security@gtcx.trade`) — required for `ecosystem:rollout-governance-spine` and `--strict` spine check. Not committed in this repo.

## Deferred (non-migration)

- `03-platform/tools/03-platform/scripts/` path references in narrative docs (comments only; layout drift scan clean)
- Witness-mode backlog (`backlogClear`) — human gates EXT-INF-002 et al. unchanged

## Review note (2026-06-06)

- Stray `baseline-os/` directory can reappear at root from session/tooling runtime copies — gitignored and relocated to `00-archive/`; does not affect scorecard (not scanned by migration score).
- **Push status:** `main` ahead of `origin/main` by 4 migration commits — not pushed in this session.
