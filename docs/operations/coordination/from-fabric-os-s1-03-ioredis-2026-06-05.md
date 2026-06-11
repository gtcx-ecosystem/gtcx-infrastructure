---
title: 'Witness — S1-03 ioredis added to platforms shared deps'
status: done
date: 2026-06-05
owner: fabric-os
target: gtcx-platforms
work_id: S1-03
---

# Witness: S1-03 ioredis dependency

## What was done

`ioredis ^5.10.1` added to `gtcx-platforms/platforms/shared/package.json`.

**Commit:** `0292959` in `gtcx-platforms`

## Why this matters

`RedisNonceStoreService` (in `platforms/shared/03-platform/src/auth/redis-nonce-store.service.ts`) lazy-loads `ioredis` at runtime:

```typescript
const { Redis } = require('ioredis');
```

Without `ioredis` in the production Docker image:

- The `require('ioredis')` throws at runtime
- The service falls back to `InMemoryNonceStore`
- Nonce replay protection is **in-memory only** — does not survive pod restart

With `ioredis` installed:

- If `REDIS_URL` is set, `RedisNonceStore` connects to Redis
- Nonce replay protection is **durable across restarts**
- If Redis is unavailable, it still falls back to `InMemoryNonceStore` (safe degrade)

## Verification

```bash
cd /Users/amanianai/Sites/gtcx-ecosystem/gtcx-platforms
grep ioredis platforms/shared/package.json
# → "ioredis": "^5.10.1"

pnpm install --no-frozen-lockfile
# → lockfile updated
```

## Next steps

1. **Platforms CI** must rebuild and push the sovereign image to ECR
2. **Infra** must ensure `REDIS_URL` is injected into sovereign pods (already in `sovereign-staging-env.yaml`)
3. **Verify** on rollout: check logs for `Connected to Redis nonce store at redis://...`

## Cross-references

- RedisNonceStoreService: `gtcx-platforms/platforms/shared/03-platform/src/auth/redis-nonce-store.service.ts`
- Staging env: `fabric-os/04-deploy/kubernetes/overlays/staging/patches/sovereign-staging-env.yaml`
- Sprint roadmap: `fabric-os/01-docs/05-audit/agile/sprints/sprint-2026-06-phase3-roadmap.md`
