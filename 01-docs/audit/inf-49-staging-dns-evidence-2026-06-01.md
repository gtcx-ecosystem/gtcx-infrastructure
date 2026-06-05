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
**Runbook:** [`01-docs/04-ops/runbooks/inf-49-staging-dns.md`](../operations/runbooks/inf-49-staging-dns.md)  
**State:** **Staging verify complete (2026-06-01)** — DNS + TLS + authority DID resolution. Production keys remain **#61** / **#86**.

**Architecture:** [trust-layers-and-did-resolution.md](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/01-docs/reference/architecture/trust-layers-and-did-resolution.md)

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

**Interpretation:** Route53 → ALB path is working. **403** from `awselb/2.0` with Ingress backend `gtcx-protocols-staging:8300` (`04-ship/kubernetes/overlays/staging/ingress.yaml`) — likely **no healthy targets** (protocols pod not deployed) and/or **WAF** default block. Next: `kubectl --context staging -n gtcx-staging get pods,svc,ingress` + target group health.

## IaC landed

- PR #66 merged — `04-ship/terraform/modules/route53/`, staging `main.tf` wiring
- Ingress annotations: `api.staging.gtcx.trade`, `geotag.staging.gtcx.trade`

## Closure criteria

- [x] `curl` with browser UA → `/health` **200**, `GET /v1/dids/auth/gh/bog` → `did:gtcx:auth:gh:bog`
- [x] GitHub **#49** / protocols **#60** closed with verify comment (2026-06-01)
- [ ] Production HSM keys (**#86**, protocols **#61**) — out of INF-49 scope
- [x] SPKI fingerprint on #49: `gVKObBhQjbrl6ricI6NZg7SDAPB/1BJrLn4UHPCKgOo=` (`api.staging.gtcx.trade`)
- [x] Staging deploy: `gtcx-protocols-staging` image `v0.4.5`, TCP probes in Git (`protocols-probes-staging.yaml`)
- [x] Spot-check authorities: `gh/bog`, `gh/pmmc`, `gh/cocobod`, `zw/zimra`, `na/bon` → 200

## Verify commands (WAF requires browser UA)

```bash
curl -sS -A "Mozilla/5.0" -o /dev/null -w "%{http_code}\n" https://api.staging.gtcx.trade/health
curl -sS -A "Mozilla/5.0" https://api.staging.gtcx.trade/v1/dids/auth/gh/bog | jq -r .id
```

## Cross-repo

- Unblocks: gtcx-protocols#60 (after handler + 200 health)
- Inbound ticket: [`01-docs/08-gtm/inbound-tickets/from-gtcx-protocols-2026-06-01.md`](../gtm/inbound-tickets/from-gtcx-protocols-2026-06-01.md)
