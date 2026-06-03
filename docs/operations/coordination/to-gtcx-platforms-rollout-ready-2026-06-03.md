---
title: 'Outbound — gtcx-platforms staging rollout ready (XR-301/302)'
status: current
date: 2026-06-03
from: gtcx-infrastructure
to: gtcx-platforms
owner: gtcx-infrastructure
xr-id: XR-301, XR-302
---

# Outbound: gtcx-platforms staging rollout ready

**Work IDs:** XR-301 (sovereign), XR-302 (AGX)  
**Priority:** P1  
**Sprint:** S-XR-2 (2026-06-08 → 06-14)  
**From:** gtcx-infrastructure  
**To:** gtcx-platforms

---

## Status

Infra is **ready** to receive image push and execute rollout. No blockers on infrastructure side.

## What platforms should do

1. Push `gtcx-sovereign:staging` image to ECR
2. Push `gtcx-agx:staging` image to ECR
3. Notify infra via append to [`gtcx-protocols/.../cross-repo-agent-log.md`](../../../../gtcx-protocols/docs/operations/coordination/cross-repo-agent-log.md) or ping in this repo's bridge

## What infra will do after push notification

1. Update staging kustomization with new image digests
2. Apply rollout to `gtcx-staging` namespace
3. Verify endpoints:
   - `sovereign-staging.gtcx.trade/health` → not placeholder
   - `api.staging.gtcx.trade/api/health` → 200
4. Post evidence in log

## Rollout checklist

| Step                     | Owner               | Check                                    |
| ------------------------ | ------------------- | ---------------------------------------- |
| ECR image push           | gtcx-platforms      | Digest posted                            |
| Kustomize overlay update | gtcx-infrastructure | Image ref matches                        |
| Rollout apply            | gtcx-infrastructure | `kubectl apply -k overlays/staging`      |
| Smoke sovereign          | gtcx-platforms      | `pnpm smoke:signed-edge-tenant:evidence` |
| Smoke AGX `/api/*`       | gtcx-platforms      | `/api/health` 200                        |

## Notes

- Sovereign external `/health` currently returns 526 (edge) — this is expected before real image deploy
- AGX shared package Docker fix must be in the pushed image (`gtcx-platforms/.../from-gtcx-infrastructure-agx-2026-06-02.md`)
- Infra will not roll out until explicit image digest is provided (no `:latest`)

## References

- gtcx-platforms bridge: `gtcx-platforms/docs/operations/coordination/cross-repo-agent-bridge.md`
- gtcx-platforms staging live: `gtcx-platforms/docs/operations/coordination/staging-live-2026-06-02.md`
- P4-07 runbook: `gtcx-platforms/docs/operations/coordination/p4-07-unblock-runbook.md`
