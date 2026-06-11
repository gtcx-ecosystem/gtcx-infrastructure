# Legacy repo id audit — gtcx-markets / gtcxMarkets / gtcx-infrastructure

**Date:** 2026-06-12  
**Status:** resolved (live-tooling paths)  
**Auditor:** fabric-os agent session  
**Canonical ids:** `markets-os`, `fabric-os`  
**Alias SoR:** `bridge-os/pm/spec/ecosystem-repo-aliases.v1.json`

## Executive summary

GitHub renames are **complete** and redirects work. Local folders match (`markets-os/`, `fabric-os/`). Stale fleet metadata, deployment specs, monitoring URLs, and operational docs have been swept for paths that affect live tooling. Historical evidence and npm package scopes remain intentionally unchanged.

| Layer                                       | Status after sweep                                |
| ------------------------------------------- | ------------------------------------------------- |
| GitHub slugs                                | `markets-os`, `fabric-os` (redirects from legacy) |
| `package.json` repository URLs              | Correct in both repos                             |
| `bridge-os` ZenHub / fleet registries       | **Fixed** this session                            |
| Prometheus alert runbook URLs (`fabric-os`) | **Fixed** (50 URLs)                               |
| `markets-os` contracts + gate docs          | **Fixed** key paths                               |
| Alias registry `legacyIds`                  | **Intentional** — do not remove                   |

## Tier A — Intentional (keep)

| Location                                                                                                 | Why                                         |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `bridge-os/pm/spec/ecosystem-repo-aliases.v1.json` `legacyIds`                                           | Resolution for old hub JSON and scripts     |
| `markets-os/docs/reference/adr/ADR-0006-*.md`                                                            | Rename witness                              |
| `fabric-os/docs/reference/adr/ADR-0007-*.md`                                                             | Rename witness                              |
| `~/Sites/gtcx-ecosystem/README.md`                                                                       | Documents legacy id policy                  |
| `bridge-os/config/ecosystem-product-dir-rename.v1.json`                                                  | Cutover map `gtcxMarkets` → `markets-os`    |
| `bridge-os/config/archived-polyrepos.json`                                                               | Archive witness with `legacyLiveRepo`       |
| `bridge-os/config/gtcx-ecosystem-merge.manifest.json`                                                    | P34 merge history (immutable)               |
| Dated audit evidence filenames (`*-gtcx-markets-*`, `*-gtcx-infrastructure-*`)                           | Historical witness — do not rename          |
| Dated coordination tickets (`from-gtcx-infrastructure-*` renamed to `from-fabric-os-*` where applicable) | Historical handoffs                         |
| `@gtx-markets/*` npm scope in `markets-os`                                                               | **Product package namespace** — not repo id |

## Tier B — Fixed this session

### bridge-os `config/`

- `zenhub-ecosystem-registry.json` — `markets-os`, `fabric-os` active; legacy in `excluded` with redirect reason
- `ecosystem-rag-consumer-registry.json` — canonical keys + witness paths
- `fleet-deploy-readiness-registry.json`, `fleet-build-skip-registry.json`
- `ecosystem-pm-engine-rollout-registry.json`
- `ecosystem-governance-spine.json`
- `ecosystem-world-class-v4-registry.json`, `ecosystem-world-class-v5-registry.json`
- `ecosystem-layout-v3-registry.json`

### bridge-os scripts

- `zenhub-plan-populate.mjs` — `gtcx-ecosystem/markets-os`
- `rollout-rag-config-consumer.mjs` — pilot default `markets-os`
- `enterprise-pilot-populate.mjs` — key `markets-os`

### fabric-os

- `deploy/monitoring/alerts/*.yml` — runbook URLs → `fabric-os`
- `docs/operations/*.md` (top-level) — `owner:` and GitHub URLs

### markets-os

- `platform/contracts/ecosystem/authority-contracts.json`
- `platform/scripts/validate-ecosystem-contracts.mjs`
- `docs/operations/human-gate-navigation.md`
- `docs/architecture/ecosystem-integration.md`
- `pm/ux/stakeholders/stakeholder-map.md`
- `docs/operations/coordination/to-fabric-os-s39-01-authority-routes-2026-06-10.md`

## Tier C — Deferred (non-blocking)

| Area                                                                  | Approx. remaining | Notes                                                                                  |
| --------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------- |
| `fabric-os/docs/operations/coordination/*`                            | ~40+ files        | Dated ticket frontmatter (`from: gtcx-infrastructure`) — historical                    |
| `fabric-os` docker-compose paths `../gtcx-infrastructure/`            | 6 lines           | Cross-repo docker build context — needs path lift to `../fabric-os/` or gtcx-os shadow |
| `baseline-os` hub JSON                                                | ~800 lines        | Separate sweep; many archived polyrepo keys                                            |
| `gtcx-os` monorepo shadow imports                                     | ~3700 lines       | P34 archive domain keys — cutover tracked separately                                   |
| `bridge-os/pm/spec/deployment-*.json` (uncommitted WIP)               | partial           | `to-gtcx-infrastructure` patterns in handoff specs                                     |
| Cutover scripts under `bridge-os/platform/scripts/ecosystem/cutover/` | ~10 refs          | Accept legacy ids via `resolve-repo-id.mjs`; update usage docs                         |

## Verification commands

```bash
# Operational config (should be 0 except alias registry + product-dir-rename + archived)
grep -r 'gtcx-markets\|gtcx-infrastructure' bridge-os/config \
  --include='*.json' | grep -v legacyIds | grep -v product-dir-rename | grep -v archived-polyrepos | grep -v merge.manifest

# fabric-os monitoring (should be 0)
grep -r 'gtcx-infrastructure' fabric-os/deploy/monitoring --include='*.yml'

# markets-os contracts (should be 0 for gtcx-infrastructure)
grep 'gtcx-infrastructure' markets-os/platform/contracts markets-os/platform/scripts/validate-ecosystem-contracts.mjs
```

## Does NOT cover

- Renaming `@gtx-markets/*` npm packages (separate product decision)
- Rewriting all historical audit markdown dated 2026-06-10 and earlier
- `baseline-os` / `gtcx-os` full fleet string sweep (next story)
