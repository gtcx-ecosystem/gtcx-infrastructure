---
title: 'Witness — ER-2-02 ENABLE_COST_ROUTER rollout on intelligence-staging'
status: verified
date: 2026-06-05
owner: gtcx-infrastructure
work_id: INT-R2-03 / ER-2-02
---

# Witness: ER-2-02 rollout complete

## Rollout steps

```bash
$ cd /Users/amanianai/Sites/gtcx-ecosystem/gtcx-infrastructure
$ kubectl apply -k 04-ship/kubernetes/overlays/staging/intelligence/
namespace/intelligence unchanged
service/intelligence-orchestrator unchanged
deployment.apps/intelligence-orchestrator configured
ingress.networking.k8s.io/intelligence-staging unchanged

$ kubectl rollout status deployment/intelligence-orchestrator -n intelligence --timeout=120s
deployment "intelligence-orchestrator" successfully rolled out

$ kubectl exec -n intelligence deploy/intelligence-orchestrator -- env | grep ENABLE_COST_ROUTER
ENABLE_COST_ROUTER=1
```

## Health probe evidence

```bash
$ curl -sS https://intelligence-staging.gtcx.trade/health | jq '.features.enableCostRouter'
true
```

Full `/health` response:

```json
{
  "service": "intelligence-sdk",
  "version": "0.1.0",
  "uptime": 862,
  "status": "healthy",
  "dependencies": {
    "inference_backend": { "status": "up", "latency_ms": 0 },
    "event_store": { "status": "up", "events": 0 }
  },
  "scheduler": {
    "running": true,
    "jobs": {
      "anomaly": { "enabled": true, "lastRun": "2026-06-03T19:24:45.384Z", "runCount": 2 },
      "trend": { "enabled": true, "runCount": 0 },
      "summary": { "enabled": false, "runCount": 0 }
    }
  },
  "features": {
    "enableWorldModel": false,
    "enableDriftAutoRollback": true,
    "enableTradePassSubmission": false,
    "enableCostRouter": true,
    "degradationTimeoutMs": 5000,
    "degradationErrorThreshold": 0.5,
    "degradationLatencyThresholdMs": 2000
  },
  "ussd": { "activeSessions": 0 }
}
```

## Closure checklist

- [x] Manifest committed (`dac128d`)
- [x] `kubectl apply` executed
- [x] Deployment rolled out successfully
- [x] Pod env `ENABLE_COST_ROUTER=1` verified
- [x] `/health` probe returns `features.enableCostRouter: true`
- [ ] Intelligence credentialed inference smoke — **next: gtcx-intelligence**
- [ ] baseline cost-stats --json — **next: baseline-os operator**
- [ ] Full evidence capture — **next: gtcx-intelligence**

## Next owner

**gtcx-intelligence** — INT-S8-01 is unblocked. Run credentialed inference smoke and evidence capture.
