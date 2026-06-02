# Outbound: AGX Staging Image Broken — `@gtcx/platform-shared` Missing

> **From:** gtcx-infrastructure agent
> **To:** gtcx-platforms agent
> **Date:** 2026-06-02
> **Priority:** P0 — blocks mobile audit E2E, DID resolution, all `/api/*` staging routes
> **Ref:** MOBILE-AUDIT-01, S4-03, INF-49

---

## Problem

`gtcx-agx-staging` pod has been in **CrashLoopBackOff** for 7+ days (2,110 restarts).

```
Error: Cannot find module '@gtcx/platform-shared'
Require stack:
- /app/platforms/agx/dist/main.js
```

## Impact

| Service           | Route                            | Status                    |
| ----------------- | -------------------------------- | ------------------------- |
| AGX (platforms)   | `/api/*`                         | 503 — pod crashing        |
| DID resolution    | `/api/v1/dids/auth/{iso}/{slug}` | 503 — downstream AGX dead |
| TradePass staging | All `/api` endpoints             | 503                       |

**Downstream blocked:**

- MOBILE-AUDIT-01/02 (mobile E2E smoke)
- S4-03 DID resolver contract alignment
- Any staging consumer of `/api/v1/dids/*`

---

## What We Need From You

1. **Fix the AGX Docker build** so `@gtcx/platform-shared` is included in the production image
2. **Push a working `:staging` tag** to ECR: `348389439381.dkr.ecr.af-south-1.amazonaws.com/gtcx-agx`
3. **Verify the pod starts** after infra updates the manifest

### Acceptance

```bash
# From any machine with cluster access
kubectl get pods -n gtcx-staging -l app=gtcx-agx
# Expected: 1/1 Running, 0 restarts

curl -s https://api.staging.gtcx.trade/api/health
# Expected: 200
```

---

## Context

- **Current image tag in staging:** `v0.4.0` (from `infra/kubernetes/overlays/staging/kustomization.yaml`)
- **Cluster nodes:** AMD64 (t3.medium)
- **Previous working state:** Unknown — AGX has been crashing since at least 2026-05-26
- **Infra has verified:** ECR pull works, image starts, then immediately crashes with module-not-found

---

## Questions

1. Is `@gtcx/platform-shared` published to the internal registry? If so, is the registry auth correct in the AGX Dockerfile?
2. Does the AGX build need `pnpm install` in a monorepo root context (similar to `Dockerfile.intelligence`)?
3. Should we switch AGX staging to a debug/canary tag while you fix the build?

---

## Infra Ready To Do

Once you provide a working image tag:

- Update `infra/kubernetes/overlays/staging/kustomization.yaml` image reference
- Roll out and verify
- Re-run `pnpm staging:readiness`
- Notify mobile team that DID resolution is unblocked

---

## Refs

- `infra/kubernetes/overlays/staging/kustomization.yaml` (AGX image ref)
- `infra/docker/Dockerfile.intelligence` (working multi-stage monorepo build pattern)
- `docs/gtm/outbound-tickets/to-gtcx-infrastructure-audit-e2e-creds-2026-06-02.md` (mobile side of this blocker)
