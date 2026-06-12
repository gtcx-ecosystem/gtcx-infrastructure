# Legacy repo id audit — gtcx-markets / gtcxMarkets / gtcx-infrastructure

**Date:** 2026-06-12  
**Status:** resolved (live-tooling paths)  
**Auditor:** fabric-os agent session  
**Canonical ids:** `markets-os`, `fabric-os`  
**Alias SoR:** `bridge-os/pm/spec/ecosystem-repo-aliases.json`

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
| `bridge-os/pm/spec/ecosystem-repo-aliases.json` `legacyIds`                                              | Resolution for old hub JSON and scripts     |
| `markets-os/docs/reference/adr/ADR-0006-*.md`                                                            | Rename witness                              |
| `fabric-os/docs/reference/adr/ADR-0007-*.md`                                                             | Rename witness                              |
| `~/Sites/gtcx-ecosystem/README.md`                                                                       | Documents legacy id policy                  |
| `bridge-os/config/ecosystem-product-dir-rename.json`                                                     | Cutover map `gtcxMarkets` → `markets-os`    |
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

## Resolution closeout (2026-06-12)

| Item                                         | SHA / state                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------- |
| Fleet registries (`markets-os`, `fabric-os`) | bridge-os `3bb7599`                                                       |
| P40 deployment specs                         | bridge-os (this closeout)                                                 |
| Monitoring URLs + ops owners                 | fabric-os `fef7e5c`                                                       |
| Docker-compose cross-repo paths              | fabric-os `9cc325b`                                                       |
| markets-os contracts + gates                 | markets-os `1569050`                                                      |
| `zenhub-config.json` slug keys               | secret-risk gated — `pnpm ecosystem:zenhub:discover`                      |
| Intentional-ref policy + sweep gate          | `legacy-repo-id-intentional-refs.json` + `pnpm ecosystem:legacy-id:check` |
| Coordination ticket frontmatter              | swept to `fabric-os`                                                      |
| baseline-os workstream folders               | `fabric-os/`, `markets-os/`                                               |

## Protected references (do not delete)

See `bridge-os/pm/spec/legacy-repo-id-intentional-refs.json` — alias `legacyIds`, rename ADRs, cutover maps, P34 merge manifest, dated audit evidence filenames, `@gtx-markets/*` npm scope.

## Out of scope (separate initiative)

| Area                                  | Notes                                            |
| ------------------------------------- | ------------------------------------------------ |
| `gtcx-os` P34 shadow/archive keys     | ~3700 refs — polyrepo cutover                    |
| baseline-os workstream cross-mentions | generated dependency tables citing old doc paths |
| Cutover scripts                       | legacy ids via `resolve-repo-id.mjs`             |

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
