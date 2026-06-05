---
title: 'terminal.gtcx.trade — Cloudflare DNS (Hub #17)'
status: current
date: 2026-06-05
owner: gtcx-infrastructure
---

# terminal.gtcx.trade — Cloudflare DNS (Hub #17)

Point `terminal.gtcx.trade` at the production shared ALB (`gtcx-production-api` ingress group).

## Prerequisites

- ACM cert `eefdabd1` covers `*.gtcx.trade` (same as compliance-os prod).
- ALB hostname from ingress:

```text
k8s-gtcxproductionapi-527ebd7716-1025454332.af-south-1.elb.amazonaws.com
```

## Script

```bash
export CLOUDFLARE_API_TOKEN="<zone-dns-edit>"
export ALB_DNS="k8s-gtcxproductionapi-527ebd7716-1025454332.af-south-1.elb.amazonaws.com"
export CLOUDFLARE_COMPLIANCE_HOST=terminal
./04-ship/03-platform/scripts/attach-compliance-os-prod-domain.sh
```

Use **DNS only** (proxied=false) so TLS terminates at the ALB.

## Verify

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://terminal.gtcx.trade/api/health
# expect 200
```
