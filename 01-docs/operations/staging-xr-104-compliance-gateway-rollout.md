---
title: 'Staging — XR-104 compliance-gateway rollout'
status: current
date: 2026-06-03
owner: gtcx-infrastructure
xr_id: XR-104
---

# Staging — XR-104 compliance-gateway rollout

Unblocks **gtcx-mobile** `MOBILE-AUDIT-01` signed ingest (`envelope-did-resolve-http-401`).

## Root cause

1. **TradePass resolver** must send `Authorization: Bearer` to `gtcx-protocols-staging` (anonymous GET → 401). Fixed in `764fb83` (`did-resolver.mjs` + staging patch `GTCX_API_KEY`).
2. **Rollout blocked** when `AUDIT_SIGNING_KEY_B64` is invalid (PEM/JSON in secret → `audit.signer.keyLoadFailed` / header too long).

## 1. Image tag

ECR tag **`audit-tradepass-auth-amd64`** (commit `764fb83` bearer fix, **linux/amd64**).

## 2. Secrets (manual — not in git)

```bash
cd gtcx-infrastructure
node 03-platform/scripts/staging/generate-compliance-gateway-audit-signing-key.mjs
# Creates secret compliance-gateway-audit-key-staging

node 03-platform/scripts/staging/patch-compliance-gateway-auth-tokens.mjs
# Patches COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON from AWS SM AUDIT_TOKEN
```

## 3. Apply + post-apply env (protocols Bearer path)

```bash
kubectl apply -k 04-ship/kubernetes/overlays/staging/
kubectl set env deployment/compliance-gateway-staging -n gtcx-staging \
  TRADEPASS_BASE_URL=http://gtcx-protocols-staging.gtcx-staging.svc.cluster.local:8300 \
  NODE_ENV=staging
kubectl rollout status deployment/compliance-gateway-staging -n gtcx-staging
node 03-platform/scripts/staging/patch-compliance-gateway-auth-tokens.mjs
kubectl rollout restart deployment/compliance-gateway-staging -n gtcx-staging
```

**Live 2026-06-03:** protocols Bearer path verified — `pnpm staging:pilot-smoke -- --e2e` green.

## 4. Verify

```bash
# In-cluster resolver (from a debug pod or gateway logs): TradePass GET with Bearer → 200
cd gtcx-mobile
pnpm staging:sync-env-from-sm
pnpm staging:pilot-smoke -- --e2e
```

Expected: `signed-bundles 200`, no `envelope-did-resolve-http-401`.

## Related

- Mobile outbound: `gtcx-mobile/01-docs/04-ops/coordination/to-gtcx-infrastructure-compliance-gateway-tradepass-auth-2026-06-03.md`
- Protocols workplan: **XR-104**
