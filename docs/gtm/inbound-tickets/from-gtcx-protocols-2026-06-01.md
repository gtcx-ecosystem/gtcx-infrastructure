---
title: 'Inbound — gtcx-protocols P0 unblock (INF-49 / HSM)'
status: current
date: '2026-06-01'
owner: platform-lead
tier: critical
tags: ['gtm', 'inbound', 'protocols', 'tradepass', 'inf-49', 'hsm']
review_cycle: on-change
---

# Inbound — gtcx-protocols P0 unblock (2026-06-01)

Cross-repo paper trail for the coordination request on **gtcx-protocols#60** (DIDs resolvable) and **#61** (production issuers). Symmetric to [`gtcx-protocols/docs/gtm/inbound-tickets/from-gtcx-mobile-2026-05-24.md`](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/docs/gtm/inbound-tickets/from-gtcx-mobile-2026-05-24.md).

## Request summary (from protocols)

| Need                                                          | Infra tracker  | Protocols tracker |
| ------------------------------------------------------------- | -------------- | ----------------- |
| Staging/production URL + TLS for authority DID JSON-LDs       | **#49**        | **#60**           |
| HSM provisioning + production key ceremony                    | **#86**        | **#61**           |
| Rotate `publicKeyMultibase` + `gtcx.key_status: "production"` | After ceremony | **#61**           |

**Clarification:** In this repo, GitHub **#50–#54** are **mobile audit-path** deploy stories (bundles, replay, query), **not** HSM. Do not use `#49–#54` as an HSM range when commenting cross-repo.

## Unblock chain

```
INF-49 (DNS/TLS + /health 200)
  → gtcx-protocols#60 (GET /v1/dids/auth/<iso>/<slug> handler)
    → INF-86 (HSM ceremony + KMS keys)
      → gtcx-protocols#61 (key_status: production)
        → gtcx-mobile (real issuer registration)
```

## Infra status (2026-06-01)

### #49 — Staging DNS + TLS

| Item                                            | Status                                                                                                          |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| IaC (Route53 module, staging ingress hostnames) | **Merged** — PR #66                                                                                             |
| Runbook                                         | [`docs/operations/runbooks/inf-49-staging-dns.md`](../../operations/runbooks/inf-49-staging-dns.md)             |
| DNS `api.staging.gtcx.trade`                    | **Resolves** to ALB (af-south-1)                                                                                |
| `curl https://api.staging.gtcx.trade/health`    | **403** (ALB reachable; backend/routing fix in progress)                                                        |
| Evidence                                        | [`docs/audit/inf-49-staging-dns-evidence-2026-06-01.md`](../../audit/inf-49-staging-dns-evidence-2026-06-01.md) |

**ETA to close #49:** 3–5 business days (target group / ingress path to compliance-gateway or protocols staging service returning 200 on `/health`).

### #86 — Authority HSM ceremony

| Item                                     | Status                                                                            |
| ---------------------------------------- | --------------------------------------------------------------------------------- |
| KMS signing Terraform module             | Present — `infra/terraform/modules/kms-signing/`                                  |
| Ceremony runbook                         | [`docs/security/key-ceremony-runbook.md`](../../security/key-ceremony-runbook.md) |
| Scheduled ceremony for 43 authority DIDs | **Not started** — needs dual custodians + `GTCX-KEY-CEREMONY` approval            |

**ETA:** 4–8 weeks after leadership sign-off (parallel to staging DID resolution with placeholders).

### Protocols-owned (not infra)

- HTTP handler: `GET /v1/dids/auth/<iso>/<slug>` → `country-support-packages/*/authorities/*.json`
- CSP artifacts + `key_status: "placeholder"` (already emitted per protocols Sprint 11)

## Outbound responses posted

| When       | Where                  | Link                       |
| ---------- | ---------------------- | -------------------------- |
| 2026-06-01 | gtcx-protocols#60      | (see GitHub issue comment) |
| 2026-06-01 | gtcx-protocols#61      | (see GitHub issue comment) |
| 2026-06-01 | gtcx-infrastructure#49 | status comment             |

## Inbound ack from protocols (2026-06-01)

**Subject:** Re: #60 / INF-49 — ack; protocols owns DID handler next  
**Logged on protocols side:** `gtcx-protocols/docs/gtm/inbound-tickets/from-gtcx-infrastructure-2026-06-01.md`

### They acknowledged

- Base URL `https://api.staging.gtcx.trade` (staging)
- Contract: `GET /v1/dids/auth/{iso}/{slug}` → `country-support-packages/<iso>/v1.0.0/authorities/<slug>.json`
- Placeholder `key_status` until #61 / infra **#86**
- HSM tracker **#86**, not infra #50–#54

### Protocols next (their side)

1. Implement `GET /v1/dids/auth/{iso}/{slug}` (static serve from CSP authority artifacts)
2. Route tests + staging smoke curl after `/health` is 200
3. Will not close **#60** until sample authority DID resolves on staging (placeholders OK)
4. Will not close **#61** / MA-2026-05-31-003 until ceremony evidence + key-rotation commit

### ETA alignment (agreed)

| Milestone                  | ETA                                                                     |
| -------------------------- | ----------------------------------------------------------------------- |
| Staging DID (placeholders) | ~1 week after infra **#49** close + handler on `main`                   |
| Production HSM keys        | Infra 4–8 weeks post-approval; no country sequencing from protocols yet |

**Their ask:** Ping when `/health` is 200; they run verification curls and update #60.

## Infra next (our side)

1. Fix ALB → `gtcx-protocols-staging:8300` so `/health` returns **200** (closes **#49**)
2. Post SPKI on #49 for mobile `CERT_PINS.md`
3. Comment on **gtcx-protocols#60** when step 1 is done

## References

- [`country-support-packages/_tools/AUTHORITIES-README.md`](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/country-support-packages/_tools/AUTHORITIES-README.md)
- Audit finding: **MA-2026-05-31-003** (protocols — flip `key_status` after infra evidence)
- Mobile CERT pins: `gtcx-mobile/apps/mobile/gtcx/CERT_PINS.md` (SPKI after #49 TLS stable)
