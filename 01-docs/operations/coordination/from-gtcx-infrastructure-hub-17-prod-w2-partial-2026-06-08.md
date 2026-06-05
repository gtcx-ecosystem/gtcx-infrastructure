---
title: 'Witness — Hub #17 prod W2 deploy (partial — DNS pending)'
status: partial
date: 2026-06-08
updated: 2026-06-08
owner: gtcx-infrastructure
hub_blocker: 17
er1: ER-1-10
authority_class: A
---

# Witness — Hub #17 prod W2 deploy (partial)

**Status:** K8s stack **live** on `gtcx-production`; intake **201** via port-forward. Public origin `compliance.gtcx.trade` still **525** — Cloudflare CNAME must point to prod ALB.

## Completed

| Step                       | Evidence                                                                   |
| -------------------------- | -------------------------------------------------------------------------- |
| Terraform `module.secrets` | 11 SM shells + IRSA `gtcx-production-compliance-os-secrets-role`           |
| SM populate                | `gtcx/compliance-os/production/w2` — 7 keys + GHCR token                   |
| ESO                        | `compliance-os-w2-secrets` + `compliance-os-ghcr-pull` Ready               |
| web-app                    | 2/2 Running — `ghcr.io/gtcx-ecosystem/compliance-web:staging-b3d19e0`      |
| ALB controller             | Helm `aws-load-balancer-controller` in `kube-system`                       |
| Ingress                    | `k8s-gtcxproductionapi-527ebd7716-1025454332.af-south-1.elb.amazonaws.com` |
| Intake smoke (PF)          | **201** — `reviewId: licence_case_ag_invest_kasai`                         |

## Operator notes

- **EKS API:** Temporarily enabled `endpointPublicAccess=true` for operator IP `154.70.214.191/32` (re-applied after revert).
- **Rate limit:** Prod image lacks `ioredis`; slim overlay uses `COMPLIANCE_OS_STAGING_INPROC_RATE_LIMIT=1` + `COMPLIANCE_OS_LICENCE_DILIGENCE_MEMORY_ONLY=1` until prod image rebuild.
- **Terminal key:** Generated fresh in SM — align `COMPLIANCE_OS_TERMINAL_API_KEY` with terminal-os prod before PATCH proof.

## DNS (blocking public retest)

Cloudflare proxies `compliance.gtcx.trade` (525). Point origin to:

```text
k8s-gtcxproductionapi-527ebd7716-1025454332.af-south-1.elb.amazonaws.com
```

Mode: **DNS only** (grey cloud) or Full SSL with valid ACM on ALB (`8929e5a0`, `9f7149a3`).

## Next

1. Cloudflare CNAME update (or Route53 if delegating).
2. `curl https://compliance.gtcx.trade/...` intake → **201**.
3. exploration-os `w2:prod:retest` → `w2-hub-17-retest-latest.json`.
4. compliance-os `w2:terminal-patch-proof`.
5. baseline-os locker #17 close.
