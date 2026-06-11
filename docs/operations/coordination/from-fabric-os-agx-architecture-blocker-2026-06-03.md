---
title: 'From fabric-os — AGX staging ARM64-only blocker'
status: closed
date: 2026-06-03
owner: fabric-os
to: gtcx-platforms
priority: P0
blocking: XR-302 / P4-07
---

# From fabric-os — AGX staging ARM64-only blocker

## Finding

**RESOLVED 2026-06-03.** Platforms rebuilt AGX with `linux/amd64`. Pods running.

Historical:

`gtcx-agx:staging` (pushed 2026-06-03T09:00Z) was **ARM64-only**. EKS staging runs **t3 instances (AMD64)**.

| Image          | Tag     | Platforms | Works on EKS? |
| -------------- | ------- | --------- | ------------- |
| gtcx-sovereign | staging | amd64     | ✅ Yes        |
| gtcx-agx       | staging | amd64     | ✅ Yes        |

## Symptoms (historical)

- Pod `gtcx-agx-staging-*` → `ErrImagePull` / `ImagePullBackOff`
- Error: `no match for platform in manifest: not found`

## What platforms should do

Rebuild AGX with `--platform linux/amd64` (same as sovereign build):

```bash
cd gtcx-platforms
docker buildx build --platform linux/amd64 \
  --build-arg PLATFORM=agx \
  -t 348389439381.dkr.ecr.af-south-1.amazonaws.com/gtcx-agx:staging \
  -f Dockerfile \
  --push .
```

## Infra action after push

```bash
kubectl rollout restart deployment/gtcx-agx-staging -n gtcx-staging
kubectl rollout status deployment/gtcx-agx-staging -n gtcx-staging
```

## Verification

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://api.staging.gtcx.trade/api/health
# Expected: 200
```

## Ref

- Platforms outbound: `gtcx-platforms/01-docs/operations/coordination/to-fabric-os-ecr-rollout-2026-06-03.md`
- Infra bridge: `fabric-os/01-docs/04-ops/coordination/cross-repo-agent-bridge.md`
