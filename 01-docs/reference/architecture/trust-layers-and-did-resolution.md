---
title: 'Trust Layers and Authority DID Resolution (cross-repo)'
status: 'current'
date: '2026-06-01'
owner: 'platform-lead'
tier: 'critical'
tags: ['architecture', 'csp', 'inf-49', 'staging']
review_cycle: 'on-change'
---

# Trust Layers and Authority DID Resolution

> **Canonical specification lives in gtcx-protocols.** This page is the infra cross-reference for staging deploy, DNS, and EKS.

## Canonical doc

**[gtcx-protocols: trust-layers-and-did-resolution.md](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/01-docs/reference/architecture/trust-layers-and-did-resolution.md)**

Read that document for:

- Three layers: **authorities** (trust anchors), **rules** (CSP config), **operators** (per-company TradePass DIDs)
- Why `GET /v1/dids/auth/{iso}/{slug}` exists and how it differs from onboarding a refinery/trader
- End-to-end verification flow, key status, and ticket mapping (**#49**, **#60**, **#61**, **#86**)

## Infra responsibilities (this repo)

| Concern                        | Location                                                                                                  |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Staging DNS + ALB + ingress    | `04-ship/kubernetes/overlays/staging/ingress.yaml`, `04-ship/terraform/environments/staging/`             |
| Runbook                        | [`01-docs/04-ops/runbooks/inf-49-staging-dns.md`](../../operations/runbooks/inf-49-staging-dns.md)        |
| Staging protocols env + probes | `04-ship/kubernetes/overlays/staging/patches/protocols-staging-env.yaml`, `protocols-probes-staging.yaml` |
| Image tag                      | `04-ship/kubernetes/overlays/staging/kustomization.yaml` → `gtcx-protocols:v0.4.5+`                       |
| HSM ceremony                   | **#86** (not INF-49)                                                                                      |

## Staging smoke (2026-06-01)

```bash
curl -sS -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  "https://api.staging.gtcx.trade/health" | jq .status

curl -sS -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  "https://api.staging.gtcx.trade/v1/dids/auth/gh/bog" | jq .id
```

Plain `curl` without `-A` may receive **403** from WAF Bot Control; that is not a protocols failure.
