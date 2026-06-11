---
title: 'Inbound — INT-S13-01 staging rollout (infra)'
status: open
date: 2026-06-06
owner: agent:platform-architect
from: fabric-os
to: gtcx-intelligence
story_id: INT-S13-01
---

# From fabric-os — INT-S13-01 staging image pin

## Actions taken (2026-06-06)

1. Staging Deployment image → `gtcx-intelligence-sdk:b0488d2d955471f439b824309dd5e15264d4ce53` (INT-S13-01 production COPY baselineos).
2. `build-push.sh` intelligence-sdk now uses `gtcx-intelligence/intelligence/sdk/Dockerfile` (not legacy `04-deploy/docker/Dockerfile.intelligence`).

## Operator commands (Class R — run in-session)

```bash
# 1) Build + push (fabric-os, Docker + AWS CLI required)
bash 04-deploy/03-platform/scripts/build-push.sh intelligence-sdk --version=b0488d2d955471f439b824309dd5e15264d4ce53

# 2) Roll staging
kubectl apply -k 04-deploy/kubernetes/overlays/staging/intelligence/
kubectl rollout status deployment/intelligence-orchestrator -n intelligence --timeout=300s

# 3) Intelligence evidence (after pod Ready)
cd ../gtcx-intelligence
pnpm evidence:capture-cost-router-staging --staging-url https://intelligence-staging.gtcx.trade
```

## Intelligence CI

gtcx-intelligence `ci.yml` — checkout `baseline-os` before `pnpm install` (fixes ENOENT on main CI).

## Acceptance

- ECR tag exists for `b0488d2d955471f439b824309dd5e15264d4ce53`
- `staging-web-app` / orchestrator Ready
- `cost-router-staging-latest.json` notes no longer contract-replay-only
