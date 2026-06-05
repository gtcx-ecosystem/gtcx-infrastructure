---
title: 'Outbound — ENABLE_COST_ROUTER unblocks INT-S8-01'
status: ready
date: 2026-06-04
owner: gtcx-infrastructure
from: gtcx-infrastructure
to: gtcx-intelligence
work_id: INT-R2-03 / INT-S8-01 / ER-2
priority: P1
---

# Outbound: Cost router enabled on intelligence-staging

**What changed:** `ENABLE_COST_ROUTER=1` added to `intelligence-orchestrator` Deployment env in staging.

**Commit:** `dac128d`  
**Manifest:** `04-ship/kubernetes/overlays/staging/intelligence/deployment.yaml`

---

## What intelligence should verify

1. **Deploy** the updated manifest to staging:
   ```bash
   kubectl apply -k 04-ship/kubernetes/overlays/staging/intelligence/
   ```
2. **Confirm** the env var is injected:
   ```bash
   kubectl exec -n intelligence deploy/intelligence-orchestrator -- env | grep ENABLE_COST_ROUTER
   # Expected: ENABLE_COST_ROUTER=1
   ```
3. **Run** `pnpm agent:next-work` or equivalent P22 check — should no longer block on INT-S8-01.
4. **Capture** cost-router staging evidence (if available):
   ```bash
   node 03-platform/tools/evidence/capture-cost-router-staging-evidence.mjs --preflight
   ```

---

## Context

- Compliance-gateway already runs with `BASELINE_COST_ROUTER=1` (production precedent).
- Intelligence SDK `dist/` reads `ENABLE_COST_ROUTER` via `parseFlag(process.env.ENABLE_COST_ROUTER, false)`.
- When `ENABLE_COST_ROUTER=1`, the SDK will attempt to load `baselineos/cost-router` and use `routeInferenceRequest()` for canonical routing.
- If `baseline-os` dist is not built in the intelligence image, the SDK falls back to legacy routing (safe degrade).

---

## Cross-references

- Intelligence evidence tool: `gtcx-intelligence/03-platform/tools/evidence/capture-cost-router-staging-evidence.mjs`
- Sprint roadmap: `gtcx-infrastructure/01-docs/05-audit/agile/sprints/sprint-2026-06-phase3-roadmap.md` § ER-2
- Ecosystem cost router spec: `baseline-os/01-docs/specs/runtime/cost-router.md`
