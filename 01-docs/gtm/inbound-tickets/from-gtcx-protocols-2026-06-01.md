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

Cross-repo paper trail for the coordination request on **gtcx-protocols#60** (DIDs resolvable) and **#61** (production issuers). Symmetric to [`gtcx-protocols/01-docs/08-gtm/inbound-tickets/from-gtcx-mobile-2026-05-24.md`](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/01-docs/08-gtm/inbound-tickets/from-gtcx-mobile-2026-05-24.md).

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

## Infra status (2026-06-03)

### #49 — Staging DNS + TLS

**CLOSED 2026-06-03.** Both `/api/health` endpoints return 200. DID resolution live.

| Item                                            | Status                                                                                                                                                   |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IaC (Route53 module, staging ingress hostnames) | **Merged** — PR #66                                                                                                                                      |
| Runbook                                         | [`01-docs/04-ops/runbooks/inf-49-staging-dns.md`](../../operations/runbooks/inf-49-staging-dns.md)                                                       |
| DNS `api.staging.gtcx.trade`                    | **Resolves** to ALB (af-south-1)                                                                                                                         |
| `curl https://api.staging.gtcx.trade/health`    | **200** with browser UA (WAF blocks default curl)                                                                                                        |
| `GET /v1/dids/auth/gh/bog`                      | **200** → `did:gtcx:auth:gh:bog` (`gtcx-protocols:v0.4.5`)                                                                                               |
| Architecture doc                                | [trust-layers (protocols)](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/01-docs/reference/architecture/trust-layers-and-did-resolution.md) |
| Evidence                                        | [`01-docs/05-audit/inf-49-staging-dns-evidence-2026-06-01.md`](../../audit/inf-49-staging-dns-evidence-2026-06-01.md)                                    |

**ETA to close #49:** 3–5 business days (target group / ingress path to compliance-gateway or protocols staging service returning 200 on `/health`).

### #86 — Authority HSM ceremony (INF-86)

| Item                           | Status                                                                                  |
| ------------------------------ | --------------------------------------------------------------------------------------- |
| KMS signing Terraform module   | Present — `04-ship/terraform/modules/kms-sovereign-signing/`                            |
| Ceremony runbook               | [`01-docs/09-security/key-ceremony-runbook.md`](../../security/key-ceremony-runbook.md) |
| H-02 pilot ceremony (`gh-bog`) | **DONE** 2026-06-03 — SPKI exported, evidence committed                                 |
| SPKI handoff to protocols #61  | **DONE** — comment posted with `spki_sha256`                                            |
| XR-403 (`bog.json` production) | **Blocked** — waiting gtcx-protocols to consume SPKI → JWK → PR                         |

**ETA:** XR-403 unblocks when protocols executes checklist.

### Protocols-owned (not infra)

- HTTP handler: `GET /v1/dids/auth/<iso>/<slug>` → `country-support-03-platform/packages/*/authorities/*.json` — **live**
- CSP artifacts + `key_status: "placeholder"` — waiting XR-403 to flip to `production`

## Outbound responses posted

| When       | Where                  | Link                       |
| ---------- | ---------------------- | -------------------------- |
| 2026-06-01 | gtcx-protocols#60      | (see GitHub issue comment) |
| 2026-06-01 | gtcx-protocols#61      | (see GitHub issue comment) |
| 2026-06-01 | gtcx-infrastructure#49 | status comment             |

## Inbound ack from protocols (2026-06-01)

**Subject:** Re: #60 / INF-49 — ack; protocols owns DID handler next  
**Logged on protocols side:** `gtcx-protocols/01-docs/08-gtm/inbound-tickets/from-gtcx-infrastructure-2026-06-01.md`

### They acknowledged

- Base URL `https://api.staging.gtcx.trade` (staging)
- Contract: `GET /v1/dids/auth/{iso}/{slug}` → `country-support-03-platform/packages/<iso>/v1.0.0/authorities/<slug>.json`
- Placeholder `key_status` until #61 / infra **#86**
- HSM tracker **#86**, not infra #50–#54

### Protocols handler shipped (2026-06-01)

**Commits on gtcx-protocols `main`:** `d54241c1` (feat), `402f3b58` (docs) — 19 commits ahead of `origin/main` at handoff.

| Item   | Detail                                                                      |
| ------ | --------------------------------------------------------------------------- |
| Route  | `GET /v1/dids/auth/{iso}/{slug}` — public, `application/ld+json`, ETag      |
| Source | `country-support-03-platform/packages/<iso>/v1.0.0/authorities/<slug>.json` |
| Config | `GTCX_CSP_ROOT` (default: monorepo `country-support-03-platform/packages/`) |
| Tests  | `authority-dids.test.ts`, `http-integration.test.ts`, e2e Step 1 HTTP fetch |

**Staging verify (protocols, after infra ping):**

```bash
curl -sS https://api.staging.gtcx.trade/v1/dids/auth/gh/bog | jq .id
# expect: "did:gtcx:auth:gh:bog"
```

**Deploy requirement (staging):** protocols image must mount CSP artifacts + set `GTCX_CSP_ROOT` (e.g. `/app/country-support-packages`). Infra: ensure `gtcx-protocols-staging` rollout uses image ≥ `d54241c1` and CSP volume/env (not yet in kustomize overlay — operator follow-up).

**#60 closure:** protocols will not close until `/health` 200 **and** successful staging curl above.

### Protocols next (their side)

1. ~~Implement handler~~ **done** on `main`
2. Staging smoke curl after infra `/health` 200 + CSP-mounted deploy
3. Will not close **#60** until sample authority DID resolves on staging (placeholders OK)
4. Will not close **#61** / MA-2026-05-31-003 until ceremony evidence + key-rotation commit

### ETA alignment (agreed)

| Milestone                  | ETA                                                                     |
| -------------------------- | ----------------------------------------------------------------------- |
| Staging DID (placeholders) | ~1 week after infra **#49** close + handler on `main`                   |
| Production HSM keys        | Infra 4–8 weeks post-approval; no country sequencing from protocols yet |

**Their ask:** Ping when `/health` is 200; they run verification curls and update #60.

**Protocols paper trail:** `gtcx-protocols/01-docs/08-gtm/inbound-tickets/from-gtcx-infrastructure-2026-06-01.md` @ `2e156bc3` (2026-06-01).

**Protocols #60 comment posted:** alignment ack — protocols owns handler; will not close #60 before `/health` 200 + sample DID curl.

## Infra next (our side)

1. ✅ ~~Roll out gtcx-protocols-staging with CSP volume~~ — done
2. ✅ ~~Fix ALB target health~~ — done (CF 526 fixed, WAF rule applied)
3. ✅ ~~Ping gtcx-protocols#60~~ — done (`/health` 200, DID resolves)
4. ✅ ~~Post SPKI on #61~~ — done 2026-06-03
5. **Monitor** XR-403 for protocols PR; then align platforms (XR-405)

## References

- [`country-support-03-platform/packages/_03-platform/tools/AUTHORITIES-README.md`](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/country-support-03-platform/packages/_03-platform/tools/AUTHORITIES-README.md)
- Audit finding: **MA-2026-05-31-003** (protocols — flip `key_status` after infra evidence)
- Mobile CERT pins: `gtcx-mobile/apps/mobile/gtcx/CERT_PINS.md` (SPKI after #49 TLS stable)
