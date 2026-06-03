---
title: 'Outbound — gtcx-intelligence Track B auth gate (XR-201)'
status: current
date: 2026-06-03
from: gtcx-infrastructure
to: gtcx-intelligence
xr-id: XR-201
---

# Outbound: gtcx-intelligence Track B auth gate

**Work ID:** XR-201  
**Priority:** P0  
**Sprint:** S-XR-1 (2026-06-03 → 06-07)  
**From:** gtcx-infrastructure  
**To:** gtcx-intelligence

---

## Problem

`intelligence-staging.gtcx.trade/health` returns **200** without credentials. This indicates the orchestrator placeholder is still deployed, not the full intelligence SDK with auth-gated routes.

INT-S3-08 acceptance requires **401/403** on unauthenticated `/health`.

## What infra will do

1. Apply `module.secrets` for intelligence-staging namespace
2. Deploy full SDK image (not orchestrator placeholder)
3. Wire auth on `/health` → 401/403
4. Verify EAP key route → 200
5. Set real `INTELLIGENCE_FAILURE_URL`
6. **Ping intelligence same day** via this handoff + log entry

## What intelligence should do after ping

1. Re-run `run-production-readiness-with-vault.mjs`
2. Commit `deployment-smoke-*.json` evidence
3. Mark INT-S3-08 done in execution roadmap
4. Optional: mirror smoke JSON to protocols (XR-203)

## Evidence to collect

| Check                       | Expected                   | Command                                                                                 |
| --------------------------- | -------------------------- | --------------------------------------------------------------------------------------- |
| `/health` no auth           | 401 or 403                 | `curl -s -o /dev/null -w "%{http_code}" https://intelligence-staging.gtcx.trade/health` |
| `/health` with valid Bearer | 200                        | `curl -H "Authorization: Bearer $TOKEN" ...`                                            |
| `/live` + `/ready`          | 401 no auth, 200 with auth | Same pattern                                                                            |
| EAP key route               | 200 with valid key         | `curl -H "X-EAP-Key: ..." ...`                                                          |

## Blockers

- ESO secret `gtcx/intelligence/staging/auth-keys` must be synced (gtcx-core CORE-001 is done)
- Terraform `module.secrets` must be applied
- Full SDK image must be available in ECR

## References

- gtcx-intelligence bridge: `gtcx-intelligence/docs/operations/coordination/cross-repo-bridge.md`
- gtcx-agentic log: `gtcx-agentic/docs/operations/coordination/agent-coordination-log.md`
- baseline-os blocker: `baseline-os/workstream/index/blockers.md` §9
