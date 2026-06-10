---
title: Execution roadmap — DevOps-as-a-Service
status: current
date: 2026-06-10
last_reconciled: 2026-06-10T03:14:04.850Z
owner: gtcx-infrastructure
program: INIT-GTCX-INFRA-DAAS
generated: true
generated_by: platform/scripts/generate-execution-roadmap.mjs
sources:
  - pm/daas-roadmap.json
  - pm/friction-register.json
  - pm/daas-stories.json
  - audit/evidence/daas-friction-check-latest.json
  - audit/evidence/cross-repo-health/cross-repo-health-probe-latest.json
---

# gtcx-infrastructure execution roadmap

> **Generated file.** Edit `pm/daas-stories.json`, `pm/friction-register.json`, or
> `pm/daas-roadmap.json`, then run `pnpm generate:roadmap`.

**Primary program:** DevOps-as-a-Service (DaaS) — not product ECO sprints.

## Active Phase: DAAS-S1 — Friction register + fleet health witness

**Status:** `complete`

**Live probe:** AGX `api/health` → **200** (fleet witness 2026-06-10).

| Story      | Title                                              | Priority | Status | Owner                                   |
| ---------- | -------------------------------------------------- | -------- | ------ | --------------------------------------- |
| DAAS-S1-01 | DaaS friction register structural witness          | P0       | done   | gtcx-infrastructure                     |
| DAAS-S1-02 | Canonical scheduled fleet-health witness           | P0       | done   | gtcx-infrastructure                     |
| DAAS-S1-03 | Correct AGX staging image and health               | P0       | done   | gtcx-os/platforms → gtcx-infrastructure |
| DAAS-S1-04 | Deliver XR-MKT-011 authority routes and trace seal | P0       | done   | gtcx-infrastructure → gtcx-markets      |
| DAAS-S1-05 | Align validate-all gates to P35 paths              | P1       | done   | gtcx-infrastructure                     |

### DAAS-S1-01: DaaS friction register structural witness

**Files:** pm/friction-register.json, pm/daas-roadmap.json, audit/evidence/daas-friction-check-latest.json

**Acceptance**

```bash
pnpm daas:friction:check:write
```

**UAT / QA**

- [x] Structural DaaS gate passed
- [x] Evidence records open P0 friction IDs

**Blockers:** none

### DAAS-S1-02: Canonical scheduled fleet-health witness

**Files:** package.json, platform/tools/scripts/cross-repo-health-probe.mjs, .github/workflows/cross-repo-health.yml, audit/evidence/cross-repo-health/cross-repo-health-probe-latest.json

**Acceptance**

```bash
pnpm daas:fleet:health
pnpm ops:check
```

**UAT / QA**

- [x] Canonical pnpm daas:fleet:health command exists
- [x] Scheduled workflow uses P35 paths
- [x] Live witness writes canonical evidence

**Blockers:** none

### DAAS-S1-03: Correct AGX staging image and health

**Files:** deploy/kubernetes/overlays/staging/kustomization.yaml, deploy/kubernetes/overlays/staging/patches/agx-staging-env.yaml, platform/scripts/staging/sync-agx-staging-database-url.sh

**Acceptance**

```bash
pnpm daas:fleet:health
```

**UAT / QA**

- [x] gtcx-agx:staging-amd64 deployed with operational RDS DATABASE_URL (2026-06-10 — sync-agx-staging-database-url.sh + agx-staging-env patch)
- [x] GET https://api.staging.gtcx.trade/api/health returns 200 (probe 2026-06-10T02:53Z)

**Blockers:** none

### DAAS-S1-04: Deliver XR-MKT-011 authority routes and trace seal

**Files:** deploy/kubernetes/overlays/staging/ingress.yaml, deploy/kubernetes/overlays/staging/markets-authority-stub/, docs/operations/coordination/from-gtcx-infrastructure-s39-01-authority-routes-2026-06-10.md, docs/operations/coordination/xr-mkt-011-authority-url-matrix-2026-06-10.md

**Acceptance**

```bash
pnpm daas:fleet:health
pnpm --dir ../gtcx-markets authority:trace:capture
```

**UAT / QA**

- [x] Ingress paths for 7 authority URLs applied
- [x] Canonical URL matrix published
- [x] WAF AllowMarketsAuthorityEndpoints live
- [x] Markets authority trace capture 7/7 exit 0
- [x] Infra seal status delivered

**Blockers:** none

### DAAS-S1-05: Align validate-all gates to P35 paths

**Files:** pnpm-workspace.yaml, platform/tools/scripts/validate-all.mjs, platform/tools/control-plane/gtcx-ctl.mjs, .docs-exceptions.json

**Acceptance**

```bash
node platform/tools/scripts/validate-all.mjs
```

**UAT / QA**

- [x] Mesh injection, publish primitives, runtime evidence gates pass
- [x] validate-all 55/55 (2026-06-10 after P35 workspace + path alignment)

**Blockers:** none

## Future Phases

| Sprint  | Goal                                         | Status  | Owner               | Stories / Friction                              |
| ------- | -------------------------------------------- | ------- | ------------------- | ----------------------------------------------- |
| DAAS-S2 | Per-repo DaaS cards + ingress matrix publish | done    | gtcx-infrastructure | cards: terminal-os, compliance-os, gtcx-markets |
| DAAS-S3 | Cost witness + env schedule automation       | pending | gtcx-infrastructure | `F6`                                            |

## Issue Reconciliation

| Issue                        | Source                      | Roadmap Mapping               | Status          |
| ---------------------------- | --------------------------- | ----------------------------- | --------------- |
| `F-AGX-01`                   | `pm/friction-register.json` | DAAS-S1-03                    | done            |
| `XR-MKT-011`                 | `pm/friction-register.json` | DAAS-S1-04                    | done            |
| `F1`                         | `pm/friction-register.json` | DAAS-S2                       | done            |
| `F2`                         | `pm/friction-register.json` | DAAS-S2 / DAAS-S3             | in_progress     |
| `F6`                         | `pm/friction-register.json` | DAAS-S3                       | pending         |
| P41 hub protocol publication | `pm/_tasks`                 | deferred to `gtcx-docs` owner | blocked-sibling |

## Unblock Order

1. `gtcx-os/platforms`: publish corrected `gtcx-agx:staging` image.
2. `gtcx-infrastructure`: roll out digest, verify health `200`, confirm authority ingress.
3. `gtcx-markets`: run `authority:trace:capture` and return `7/7` evidence.
