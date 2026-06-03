---
title: 'From gtcx-infrastructure — AGX staging ARM64-only blocker'
status: open
date: 2026-06-03
owner: gtcx-infrastructure
to: gtcx-platforms
priority: P0
blocking: XR-302 / P4-07
---

# From gtcx-infrastructure — AGX staging ARM64-only blocker

## Finding

`gtcx-agx:staging` (pushed 2026-06-03T09:00Z) is **ARM64-only**. EKS staging runs **t3 instances (AMD64)**.

| Image          | Tag     | Platforms      | Works on EKS?                                |
| -------------- | ------- | -------------- | -------------------------------------------- |
| gtcx-sovereign | staging | amd64, unknown | ✅ Yes                                       |
| gtcx-agx       | staging | arm64, unknown | ❌ No                                        |
| gtcx-agx       | v0.4.0  | arm64, unknown | ❌ No (also missing `@gtcx/platform-shared`) |

## Symptoms

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

- Platforms outbound: `gtcx-platforms/docs/operations/coordination/to-gtcx-infrastructure-ecr-rollout-2026-06-03.md`
- Infra bridge: `gtcx-infrastructure/docs/operations/coordination/cross-repo-agent-bridge.md`
