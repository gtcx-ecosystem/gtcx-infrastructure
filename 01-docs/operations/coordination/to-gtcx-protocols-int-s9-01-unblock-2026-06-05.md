---
title: 'Infra handoff — INT-S9-01 unblock'
status: in_progress
date: 2026-06-05
owner: gtcx-infrastructure
work_id: INT-S9-01
---

# Infra Handoff: INT-S9-01 Unblock

## What infra has done

### 1. Routing verified — no ingress changes needed

`api.staging.gtcx.trade/v1/evidence/submit` already routes to `gtcx-protocols-staging:8300` via the catch-all `/` path in the ALB ingress:

```yaml
# 04-ship/kubernetes/overlays/staging/ingress.yaml
- host: api.staging.gtcx.trade
  http:
    paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: gtcx-protocols-staging
            port:
              number: 8300
```

### 2. Vault credential wiring added

- `GTCX_API_KEY` — already live (from `gtcx-protocols-api-key-staging` secret)
- `TRADEPASS_AUTH_TOKEN` — **added** to protocols staging Deployment as optional secretKeyRef:

```yaml
- name: TRADEPASS_AUTH_TOKEN
  valueFrom:
    secretKeyRef:
      name: gtcx-secrets-staging-cdkk972mcc
      key: TRADEPASS_AUTH_TOKEN
      optional: true
```

The `optional: true` means the pod starts even if the key is missing. Once the secret is populated, rolling-restart the protocols pod to pick it up.

## What protocols needs to do

### 1. Implement / verify POST /v1/evidence/submit

The endpoint must:

- Accept POST requests at `/v1/evidence/submit`
- Return 200 for valid submissions
- Enforce auth gate (Bearer token or TRADEPASS_AUTH_TOKEN validation)

### 2. Populate the secret

Add `TRADEPASS_AUTH_TOKEN` to AWS Secrets Manager `gtcx-secrets-staging-cdkk972mcc` (or create a separate secret and update the Deployment patch).

### 3. Verification command

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $GTCX_API_KEY" \
  -d '{"evidence":"test"}' \
  https://api.staging.gtcx.trade/v1/evidence/submit
# Expected: 200
```

## Cross-references

- Intelligence tracker: `gtcx-intelligence/01-docs/08-gtm/inbound-tickets/tracker-wire2-spec17.md`
- Protocols witness: `gtcx-protocols/01-docs/04-ops/coordination/from-gtcx-intelligence-wave2-blockers-2026-06-05.md`
- Infra ingress: `04-ship/kubernetes/overlays/staging/ingress.yaml`
- Infra protocols env: `04-ship/kubernetes/overlays/staging/patches/protocols-staging-env.yaml`
