---
title: 'INF-49 — Staging DNS evidence (partial)'
status: current
date: '2026-06-01'
owner: platform-lead
tier: critical
tags: ['audit', 'inf-49', 'dns', 'staging', 'evidence']
review_cycle: on-change
infra_issue: 'https://github.com/gtcx-ecosystem/gtcx-infrastructure/issues/49'
---

# INF-49 — Staging DNS evidence (2026-06-01)

**Issue:** gtcx-infrastructure#49  
**Runbook:** [`docs/operations/runbooks/inf-49-staging-dns.md`](../operations/runbooks/inf-49-staging-dns.md)  
**State:** **Partial** — DNS aliases live; `/health` returns **403** (not yet closable).

## DNS resolution

```text
$ dig +short api.staging.gtcx.trade
13.247.253.181
15.240.108.164
13.245.187.160

$ dig +short geotag.staging.gtcx.trade
(same ALB pool — verified 2026-06-01)
```

## HTTPS probe

```text
$ curl -sS -o /dev/null -w "%{http_code}\n" https://api.staging.gtcx.trade/health
403

$ curl -sS -D - -o /dev/null https://api.staging.gtcx.trade/health
HTTP/2 403
server: awselb/2.0
```

**Interpretation:** Route53 → ALB path is working. **403** from `awselb/2.0` with Ingress backend `gtcx-protocols-staging:8300` (`infra/kubernetes/overlays/staging/ingress.yaml`) — likely **no healthy targets** (protocols pod not deployed) and/or **WAF** default block. Next: `kubectl --context staging -n gtcx-staging get pods,svc,ingress` + target group health.

## IaC landed

- PR #66 merged — `infra/terraform/modules/route53/`, staging `main.tf` wiring
- Ingress annotations: `api.staging.gtcx.trade`, `geotag.staging.gtcx.trade`

## Closure criteria (remaining)

- [ ] `curl https://api.staging.gtcx.trade/health` → **200** with `{"status":"ok","version":"<sha>"}`
- [ ] SPKI fingerprint posted on #49 for mobile `CERT_PINS.md`
- [ ] Staging deploy: `gtcx-protocols-staging` image ≥ `d54241c1`, `GTCX_CSP_ROOT` + CSP volume mounted
- [ ] `GET /v1/dids/auth/gh/bog` → 200, `jq .id` = `"did:gtcx:auth:gh:bog"` (handler on `main` since `d54241c1`; protocols verifies after infra ping)

## Cross-repo

- Unblocks: gtcx-protocols#60 (after handler + 200 health)
- Inbound ticket: [`docs/gtm/inbound-tickets/from-gtcx-protocols-2026-06-01.md`](../gtm/inbound-tickets/from-gtcx-protocols-2026-06-01.md)
