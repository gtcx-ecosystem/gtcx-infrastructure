# Outbound Handoff: XR-202 → gtcx-intelligence

**Date:** 2026-06-03T09:12Z  
**From:** gtcx-infrastructure (infra agent)  
**To:** gtcx-intelligence (intelligence agent)  
**Work ID:** XR-202  
**Unblocked by:** XR-201 (done)  
**Priority:** P0 / Track A

---

## Trigger

XR-201 (intelligence-staging auth gate) is **DONE**. Full SDK `gtcx-intelligence-sdk:12be5342` is deployed and enforcing auth on non-exempt paths.

XR-202 is now **READY** — was blocked on XR-201.

## What You Should Do

1. **Run the production-readiness smoke suite:**

   ```bash
   cd /path/to/gtcx-intelligence
   node scripts/run-production-readiness-with-vault.mjs \
     --target staging \
     --image 348389439381.dkr.ecr.af-south-1.amazonaws.com/gtcx-intelligence-sdk:12be5342151a30ebedd6b7221cd547a008f9e7a1
   ```

2. **Commit the evidence:**
   - Write `deployment-smoke-*.json` (or equivalent artifact)
   - Commit to gtcx-intelligence repo with ref `xr-202-smoke-<timestamp>`

3. **Report back:**
   - Append result to `gtcx-intelligence/docs/operations/coordination/outbound-handoff-xr-202-result.md`
   - Update `cross-repo-agent-bridge.md` in this repo (or your bridge) with XR-202 status

## Environment You Are Targeting

| Field        | Value                                                                                                          |
| ------------ | -------------------------------------------------------------------------------------------------------------- |
| Cluster      | EKS `gtcx-staging`                                                                                             |
| Namespace    | `intelligence`                                                                                                 |
| Ingress      | `https://intelligence-staging.gtcx.trade`                                                                      |
| Image        | `348389439381.dkr.ecr.af-south-1.amazonaws.com/gtcx-intelligence-sdk:12be5342151a30ebedd6b7221cd547a008f9e7a1` |
| Replicas     | 2                                                                                                              |
| Auth         | Enforced on all non-exempt paths                                                                               |
| Exempt paths | `/health`, `/live`, `/ready`, `/metrics`                                                                       |
| API keys     | Stored in `intelligence-secrets` (ESO-synced) — key name `AUTH_API_KEYS`                                       |

## Known Issues / Caveats

- `/health` returns 200 without auth — **by design** (ALB/K8s probes). Do not flag this as a failure.
- The FIPS crash from earlier was fixed by `NODE_ENV: staging` in the deployment manifest.
- If you see 401s on protected paths, ensure you are passing a valid key from `intelligence-secrets`.

## If Blocked

- Ping infra via `cross-repo-agent-bridge.md` "Latest updates"
- Or report to baseline-os: `pnpm ecosystem:repo:report-work --repo=gtcx-intelligence --item="XR-202 blocked: <reason>" --status=blocked`

---

## Agent Context Attestation

- [x] Phase 1: Baseline loaded
- [x] Phase 2: Repo context established
- [x] Phase 3: Current state discovered (XR-201 done, XR-202 ready)
- [x] Phase 4: Persona selected (platform-architect / regulatory-audit)
- [x] Phase 5: Context attested
