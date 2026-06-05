---
title: 'INF-50–52 — Staging audit API deploy'
status: current
date: '2026-06-02'
owner: platform-lead
tier: critical
tags: ['operations', 'audit', 'staging', 'inf-50', 'inf-51', 'inf-52']
review_cycle: on-change
---

# INF-50–52 — Staging audit API deploy

Deploys `POST /audit/bundles` and `POST /audit/query` on staging via **compliance-gateway**, not gtcx-protocols.

## Prerequisites

- INF-49 complete (`api.staging.gtcx.trade` healthy)
- Staging EKS context: `kubectl --context staging`
- ECR push access (`af-south-1`)

## 1. Build and push compliance-gateway image

From `gtcx-infrastructure`:

```bash
# EKS staging nodes are AMD64 — build for linux/amd64 (not arm64 Mac default).
docker buildx build --platform linux/amd64 \
  -f 03-platform/tools/compliance-gateway/Dockerfile \
  -t 348389439381.dkr.ecr.af-south-1.amazonaws.com/compliance-gateway:audit-$(git rev-parse --short HEAD)-amd64 \
  --push .
```

Update `04-ship/kubernetes/overlays/staging/kustomization.yaml` `images[].newTag` to match the tag you pushed.

## 2. Apply Kubernetes

```bash
kubectl --context staging apply -k 04-ship/kubernetes/overlays/staging/
kubectl --context staging -n gtcx-staging rollout status deployment/compliance-gateway-staging --timeout=300s
```

Ingress routes `/audit` → `compliance-gateway-staging:8500`; all other paths → protocols.

## 3. Verify

```bash
node 03-platform/scripts/staging-audit-probe.mjs
# POST .../audit/bundles → not 404 (typically 400 on empty body)

curl -sS -A "Mozilla/5.0" -o /dev/null -w "%{http_code}\n" \
  -X POST https://api.staging.gtcx.trade/audit/bundles \
  -H "Content-Type: application/json" -d '{}'
```

Mobile (after route is live):

```bash
export GTCX_STAGING_AUDIT_URL=https://api.staging.gtcx.trade
pnpm --filter @gtcx/app-gtcx test --runInBand \
  apps/mobile/gtcx/lib/__tests__/audit-staging.test.ts
```

## Resolver note

Staging sets `TRADEPASS_BASE_URL` to in-cluster protocols and `TRADEPASS_IDENTITY_PATH_PREFIX=/v1/tradepass`. Mobile expects `/identity/:did` on a dedicated TradePass service — full **200 + acceptedIds** may require protocols or TradePass to expose DID documents with `verificationMethod[].publicKeyJwk`. Until then, expect **400 envelope-\*** on unsigned test bundles (route deployed).

## Rollback

Revert `newTag` on compliance-gateway image and remove `/audit` paths from `ingress.yaml`; `kubectl apply -k` staging overlay.
