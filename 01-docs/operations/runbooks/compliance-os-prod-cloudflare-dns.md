---
title: 'Manual Cloudflare — compliance.gtcx.trade (Hub #17)'
status: current
date: 2026-06-08
owner: gtcx-infrastructure
hub_blocker: 17
---

# Cloudflare DNS — compliance.gtcx.trade

Prod K8s stack is live; **525** at origin means Cloudflare proxy cannot reach the ALB.

## ALB target (production)

```text
k8s-gtcxproductionapi-527ebd7716-1025454332.af-south-1.elb.amazonaws.com
```

## ACM certificate (required)

Ingress must use production wildcard cert (not staging certs):

```text
arn:aws:acm:af-south-1:348389439381:certificate/eefdabd1-a823-4aa8-b6fb-147584435020
```

Validation CNAME (grey cloud): `_aa2eb14c3b952c1f3a2246fc0ad673f3.gtcx.trade` → `_ef927b4cfc7988e2be3c3324e1e36106.jkddzztszm.acm-validations.aws.`

Confirm:

```bash
export KUBECONFIG=/path/to/kube-config-prod
kubectl get ingress compliance-os -n compliance-os-production \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}{"\n"}'
```

## Option A — API script

```bash
export CLOUDFLARE_API_TOKEN="<zone DNS Edit>"
export ALB_DNS="k8s-gtcxproductionapi-527ebd7716-1025454332.af-south-1.elb.amazonaws.com"
# DNS only (recommended first — avoids 525 during ACM handshake):
export CLOUDFLARE_PROXIED=false
bash 04-ship/03-platform/scripts/attach-compliance-os-prod-domain.sh
```

## Option B — Dashboard (manual)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **gtcx.trade** → **DNS**
2. Edit or create **CNAME**:
   - **Name:** `compliance`
   - **Target:** `k8s-gtcxproductionapi-527ebd7716-1025454332.af-south-1.elb.amazonaws.com`
   - **Proxy:** **DNS only** (grey cloud) until HTTPS on ALB verified
3. Remove redirect rules matching `compliance.gtcx.trade`

## Verify

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://compliance.gtcx.trade/
# Expect 200/301/307 — not 525

INTAKE_KEY="$(aws secretsmanager get-secret-value \
  --secret-id gtcx/compliance-os/production/w2 --region af-south-1 \
  --query SecretString --output text | jq -r .COMPLIANCE_OS_INTAKE_API_KEY)"
curl -sS -o /dev/null -w "%{http_code}\n" -X POST \
  "https://compliance.gtcx.trade/api/diligence/licence-intelligence" \
  -H "Authorization: Bearer ${INTAKE_KEY}" \
  -H "Content-Type: application/json" \
  --data-binary @../compliance-os/apps/web/fixtures/licence-intelligence/ag-invest-kasai-handoff.json
# Expect 201
```

## Downstream (compliance-os — Class R after DNS)

| Repo           | Action                         |
| -------------- | ------------------------------ |
| exploration-os | `npm run w2:prod:retest`       |
| compliance-os  | `pnpm w2:terminal-patch-proof` |
| baseline-os    | Close hub #17                  |
