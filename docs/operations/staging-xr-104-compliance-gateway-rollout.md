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

ECR tag **`79ee914`** (commit `764fb83` bearer fix, **linux/amd64**). Do not use `audit-tradepass-auth` (immutable tag, wrong arch on EKS). Build: `docker buildx build --platform linux/amd64 ... --push`.

## 2. Fix audit signing secret

```bash
cd gtcx-infrastructure
node scripts/staging/generate-compliance-gateway-audit-signing-key.mjs
# Follow printed kubectl commands (secret compliance-gateway-audit-key-staging in gtcx-staging)
```

**Do not** store PEM or JSON JWK in `AUDIT_SIGNING_KEY_B64` — only PKCS#8 DER base64 (~44–88 chars for Ed25519).

## 3. Apply staging kustomize (image + env patch)

`infra/kubernetes/overlays/staging/kustomization.yaml` sets:

- `compliance-gateway` image → `audit-tradepass-auth`
- `patches/compliance-gateway-audit-staging.yaml` → `GTCX_API_KEY` from `gtcx-protocols-api-key-staging`

```bash
kubectl apply -k infra/kubernetes/overlays/staging/
kubectl rollout status deployment/compliance-gateway-staging -n gtcx-staging
```

## 4. Verify

```bash
# In-cluster resolver (from a debug pod or gateway logs): TradePass GET with Bearer → 200
cd gtcx-mobile
pnpm staging:sync-env-from-sm
pnpm staging:pilot-smoke -- --e2e
```

Expected: `signed-bundles 200`, no `envelope-did-resolve-http-401`.

## Related

- Mobile outbound: `gtcx-mobile/docs/operations/coordination/to-gtcx-infrastructure-compliance-gateway-tradepass-auth-2026-06-03.md`
- Protocols workplan: **XR-104**
