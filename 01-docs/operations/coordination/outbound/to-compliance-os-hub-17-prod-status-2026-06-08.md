---
title: 'Outbound — Hub #17 prod status (compliance-os witness)'
status: current
date: 2026-06-08
owner: gtcx-infrastructure
to: compliance-os
from: gtcx-infrastructure
priority: P0
hub_blocker: 17
authority_class: R
---

# Outbound — Hub #17 prod status for compliance-os

**compliance-os P22:** `backlogClear` — no further product stories until infra DNS lands. **Do not** re-open XR-502/503/504.

## Infra complete (Class A)

| Item                                          | Status                                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| Prod W2 SM `gtcx/compliance-os/production/w2` | 7 keys sealed                                                              |
| ESO → `compliance-os-w2-secrets`              | Ready                                                                      |
| `web-app` on `gtcx-production`                | 2/2 Running                                                                |
| ALB ingress                                   | `k8s-gtcxproductionapi-527ebd7716-1025454332.af-south-1.elb.amazonaws.com` |
| Intake smoke (cluster)                        | **201** — port-forward witness                                             |

## Blocking public close

| Item                            | Owner                     | Action                                                                                                      |
| ------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `compliance.gtcx.trade` **525** | **operator / Cloudflare** | CNAME → ALB — [`compliance-os-prod-cloudflare-dns.md`](../../runbooks/compliance-os-prod-cloudflare-dns.md) |
| Terminal key alignment          | infra + terminal-os       | Set `COMPLIANCE_OS_TERMINAL_API_KEY` in prod SM to match terminal-os prod receiver                          |

## compliance-os actions (Class R — after DNS 201)

```bash
export COMPLIANCE_OS_URL=https://compliance.gtcx.trade
export COMPLIANCE_OS_TERMINAL_OS_URL="https://terminal.gtcx.trade"  # confirm prod URL
export COMPLIANCE_OS_TERMINAL_API_KEY="<from infra SM / terminal-os prod>"
pnpm w2:terminal-patch-proof
# → 01-docs/05-audit/w2-hub-17-cos-patch-latest.json
```

Finalize hub locker draft → baseline-os when exploration retest also green.

## Witness

[`from-gtcx-infrastructure-hub-17-prod-w2-partial-2026-06-08.md`](../from-gtcx-infrastructure-hub-17-prod-w2-partial-2026-06-08.md)
