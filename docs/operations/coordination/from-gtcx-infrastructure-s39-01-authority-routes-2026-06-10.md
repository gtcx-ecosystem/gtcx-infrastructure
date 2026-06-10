---
title: 'Seal — S39-01 authority routes (XR-MKT-011)'
status: delivered
date: 2026-06-10
from: gtcx-infrastructure
to: gtcx-markets
ticket: XR-MKT-011
protocol: P24 + P40
priority: P0
blocksIR: false
---

# Infra seal (delivered): S39-01 authority trace capture unblocked

## Summary

Markets authority trace capture is **7/7** on staging. Root cause was **WAF 403** on non-allowlisted authority paths plus **no AGX handler** for `/orders` et al. Fix: dedicated `markets-authority-stub` deployment + WAF allow rule + ingress repoint.

## Actions executed

| Step               | Command                                                                                             | Result                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Stub deploy        | `kubectl kustomize deploy/kubernetes/overlays/staging/markets-authority-stub \| kubectl apply -f -` | exit **0** — deployment **1/1** Ready                                                   |
| Secret sync        | `bash platform/scripts/staging/sync-markets-authority-stub-secret.sh`                               | exit **0** — `markets-authority-stub-secrets` from `gtx-markets/staging/internal-token` |
| Ingress            | `kubectl apply -f deploy/kubernetes/overlays/staging/ingress.yaml`                                  | exit **0** — 7 paths → `markets-authority-stub-staging:8510`                            |
| WAF allow          | `aws wafv2 update-web-acl` — `AllowMarketsAuthorityEndpoints` priority **2**                        | exit **0** — `/orders`, `/escrow-*`, `/settle-*`, `/cc-*`                               |
| Public probe       | `POST https://api.staging.gtcx.trade/orders` + Bearer                                               | **200** decision JSON                                                                   |
| Markets capture    | `pnpm staging:env:materialize && pnpm authority:trace:capture` (gtcx-markets)                       | exit **0** — **7/7**                                                                    |
| AGX DATABASE_URL   | `bash platform/scripts/staging/sync-agx-staging-database-url.sh`                                    | exit **0** — RDS `gtcx_admin` from master secret                                        |
| AGX health         | `curl https://api.staging.gtcx.trade/api/health`                                                    | **200** — `database: up`, `audit-trail: up`                                             |
| Markets re-capture | `pnpm authority:trace:capture` @ 2026-06-10T02:52:46Z                                               | exit **0** — **7/7** (post-AGX green)                                                   |

## Architecture (pilot)

| Component                | Role                                                                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `markets-authority-stub` | Staging pilot stub — validates `GTX_MARKETS_AUTHORITY_API_KEY`, returns structurally valid decision JSON per operation |
| Ingress                  | 7 authority paths → stub **before** protocols catch-all                                                                |
| WAF                      | `AllowMarketsAuthorityEndpoints` — non-browser fetch + Bearer POST (same pattern as `/audit`)                          |
| Secret                   | `GTX_MARKETS_AUTHORITY_API_KEY` from AWS SM `gtx-markets/staging/internal-token`                                       |

**Note:** AGX does not implement root-level `/orders` routes (Nest global prefix `/api`). Production authority will replace stub with real AGX/compliance decision services.

## Acceptance

| Gate                           | Status                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| `authority:trace:capture`      | **7/7** — manifest `authority-trace-evidence/2026-06-10T02-52-46.023Z/manifest.json` |
| `GET /api/health`              | **200** — AGX `staging-amd64` + `gtcx-agx-database-staging`                          |
| Public `/orders` POST + Bearer | **200**                                                                              |
| WAF                            | No HTML **403** on authority paths                                                   |

## Deferred (non-blocking for S39-01)

| Item                         | Owner                  | Status                                                                                |
| ---------------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `GET /api/health` → **200**  | gtcx-platforms + infra | **done** — `staging-amd64` + RDS URL sync                                             |
| Terraform WAF codification   | gtcx-infrastructure    | Module updated; `terraform apply` blocked by missing `rotation.zip` in secrets module |
| Production authority backend | gtcx-platforms         | Replace stub with real decision engine                                                |

## Witness

- Matrix: `docs/operations/coordination/xr-mkt-011-authority-url-matrix-2026-06-10.md`
- Markets inbound: `gtcx-markets/docs/operations/coordination/to-gtcx-infrastructure-s39-01-authority-routes-2026-06-10.md`
- Capture manifest: `gtcx-markets/authority-trace-evidence/2026-06-10T02-39-46.130Z/manifest.json`
