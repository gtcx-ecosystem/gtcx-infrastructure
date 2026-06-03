---
title: 'Outbound — gtcx-intelligence Track B auth gate (XR-201)'
status: current
date: 2026-06-03
from: gtcx-infrastructure
to: gtcx-intelligence
owner: gtcx-infrastructure
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

---

## What infra has done (2026-06-03)

1. ✅ Verified `module.secrets` Terraform applied — ESO, SecretStore, ExternalSecret, ServiceAccount all live
2. ✅ Ingress routes to `intelligence-orchestrator:8200`
3. ✅ AWS SM `gtcx/intelligence/staging/auth-keys` exists (EAP sync ready)

---

## Critical finding: missing deployment manifest

**The `intelligence-orchestrator` Deployment + Service are NOT in the infrastructure repo.**

The orchestrator placeholder currently running was deployed via an unknown mechanism. Infrastructure cannot replace it with the full SDK without:

1. **Full SDK image URI + digest** (from gtcx-intelligence ECR build)
2. **Deployment manifest** (either provided by intelligence repo or spec'd for infra to create)
3. **Confirmation that auth middleware is enabled** in the full SDK image

See detailed runbook: [`xr-201-intelligence-auth-gate-runbook.md`](xr-201-intelligence-auth-gate-runbook.md)

---

## What gtcx-intelligence must provide to unblock XR-201

| Item                           | Why needed                                     | Format                                                                                  |
| ------------------------------ | ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| Full SDK image URI             | Infra needs exact image to deploy              | `348389439381.dkr.ecr.af-south-1.amazonaws.com/gtcx-intelligence:<tag>@sha256:<digest>` |
| Deployment manifest (optional) | If intelligence manages its own k8s manifests  | YAML or Helm chart path                                                                 |
| Resource requests/limits       | For infra-created manifest                     | CPU/memory strings                                                                      |
| Required env vars              | Beyond what's in `intelligence-secrets` secret | List of env var names                                                                   |
| Auth middleware config         | Confirm `/health` requires Bearer in full SDK  | Boolean or config snippet                                                               |

---

## What infra will do once image is provided

1. Create `intelligence-orchestrator` Deployment + Service manifest
2. Mount `intelligence-secrets` via `envFrom`
3. Set `serviceAccountName: intelligence-sa`
4. Apply to staging cluster
5. Verify auth gate (see evidence commands below)
6. **Ping intelligence same day** via log entry

---

## What intelligence should do after ping

1. Re-run `run-production-readiness-with-vault.mjs`
2. Commit `deployment-smoke-*.json` evidence
3. Mark INT-S3-08 done in execution roadmap
4. Optional: mirror smoke JSON to protocols (XR-203)

---

## Evidence to collect (post-deploy)

| Check                       | Expected                   | Command                                                                                 |
| --------------------------- | -------------------------- | --------------------------------------------------------------------------------------- |
| `/health` no auth           | 401 or 403                 | `curl -s -o /dev/null -w "%{http_code}" https://intelligence-staging.gtcx.trade/health` |
| `/health` with valid Bearer | 200                        | `curl -H "Authorization: Bearer $TOKEN" ...`                                            |
| `/live` + `/ready`          | 401 no auth, 200 with auth | Same pattern                                                                            |
| EAP key route               | 200 with valid key         | `curl -H "X-EAP-Key: ..." ...`                                                          |

---

## References

- Detailed runbook: [`xr-201-intelligence-auth-gate-runbook.md`](xr-201-intelligence-auth-gate-runbook.md)
- gtcx-intelligence bridge: `gtcx-intelligence/docs/operations/coordination/cross-repo-bridge.md`
- gtcx-agentic log: `gtcx-agentic/docs/operations/coordination/agent-coordination-log.md`
- baseline-os blocker: `baseline-os/workstream/index/blockers.md` §9
