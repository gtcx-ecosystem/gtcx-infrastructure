---
title: 'Production Store Integration'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['security', 'crypto', 'compliance', 'architecture', 'infrastructure']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Production Store Integration

How to replace in-memory stubs with production-grade persistence. Covers Redis (rate limiting, replay cache) and Postgres (audit log). Also documents the fail-open/fail-closed policy matrix.

Prerequisite: understand the stub guard system before this runbook. See [ADR-010](../../architecture/decisions/ADR-010-in-memory-stub-guards.md).

---

## 1. What Gets Replaced

| Component                    | In-Memory Stub       | Production Dependency                |
| ---------------------------- | -------------------- | ------------------------------------ |
| Auth middleware rate limiter | `BoundedRateLimiter` | Redis rate-limit store               |
| Auth PEP audit log           | `InMemoryAuditLog`   | Postgres-backed `PersistentAuditLog` |
| PANX message replay cache    | `BoundedReplayCache` | Redis replay cache                   |
| PvP / VaultMark replay cache | `BoundedReplayCache` | Redis `IAsyncReplayCache`            |

All four injection points must be replaced before removing `GTCX_STUB_*` environment variables.

---

## 2. Postgres Audit Store

### Schema Setup

```sql
CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE IF NOT EXISTS audit.entries (
  id            text PRIMARY KEY,
  sequence      bigint NOT NULL UNIQUE,
  timestamp     bigint NOT NULL,
  source        text NOT NULL,
  actor         text NOT NULL,
  action        text NOT NULL,
  resource      text NOT NULL,
  outcome       text NOT NULL,
  previous_hash text NOT NULL,
  hash          text NOT NULL,
  signature     text,
  metadata      jsonb
);

CREATE INDEX IF NOT EXISTS idx_audit_entries_timestamp ON audit.entries (timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_entries_actor     ON audit.entries (actor);
```

### Wiring

```typescript
import { Pool } from 'pg';
import { createPostgresAuditStore, createPersistentAuditLog } from '@gtcx/audit';

const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });

const auditStore = createPostgresAuditStore({
  pool: pgPool,
  schemaName: 'audit',
  tableName: 'entries',
});

export const auditLog = createPersistentAuditLog({ store: auditStore });
```

Pass `auditLog` to `createAuthMiddleware(...)` and `createPolicyEnforcementPoint(...)`.

---

## 3. Redis Rate Limiter

### node-redis

```typescript
import { createClient } from 'redis';
import {
  adaptNodeRedisForRateLimit,
  createPluggableRateLimiter,
  createRedisRateLimitStore,
} from '@gtcx/protocols-domain';

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

const rateStore = createRedisRateLimitStore({
  client: adaptNodeRedisForRateLimit(redis),
  keyPrefix: 'gtcx:auth:ratelimit:',
});

export const authRateLimiter = createPluggableRateLimiter({
  config: { maxRequests: 100, windowMs: 60_000 },
  store: rateStore,
  options: { allowNonAtomicFallback: false },
});
```

### ioredis

```typescript
import Redis from 'ioredis';
import {
  adaptIoRedisForRateLimit,
  createPluggableRateLimiter,
  createRedisRateLimitStore,
} from '@gtcx/protocols-domain';

const redis = new Redis(process.env.REDIS_URL!);

const rateStore = createRedisRateLimitStore({
  client: adaptIoRedisForRateLimit(redis),
  keyPrefix: 'gtcx:auth:ratelimit:',
});

export const authRateLimiter = createPluggableRateLimiter({
  config: { maxRequests: 100, windowMs: 60_000 },
  store: rateStore,
  options: { allowNonAtomicFallback: false },
});
```

---

## 4. Redis Replay Cache

Used by PANX, PvP, and VaultMark to prevent message replay within a time window.

```typescript
import { createClient } from 'redis';
import { adaptNodeRedisForReplay, createRedisReplayCache } from '@gtcx/protocols-domain';

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

export const replayCache = createRedisReplayCache({
  client: adaptNodeRedisForReplay(redis),
  keyPrefix: 'gtcx:replay:',
  windowMs: 5 * 60_000, // 5-minute replay window
});
```

Pass `replayCache` via `options.replayCache` on PvP and VaultMark handlers. For PANX, pass to the envelope/replay path directly.

---

## 5. Auth Middleware Assembly

```typescript
import { createAuthMiddleware } from '@gtcx/auth';

export const authMiddleware = createAuthMiddleware({
  tokenValidator,
  apiKeyManager,
  lockoutManager,
  rateLimiter: authRateLimiter,
  auditLog,
  logger,
});
```

---

## 6. Failure Policy Matrix

| Failure Scenario                                             | Policy                         | Rationale                                        |
| ------------------------------------------------------------ | ------------------------------ | ------------------------------------------------ |
| Redis unavailable — rate-limit check on privileged API       | **Fail-closed** — deny request | Prevent brute force on privileged paths          |
| Redis unavailable — rate-limit check on low-risk public read | **Fail-open** — allow request  | Preserve availability for non-sensitive paths    |
| Postgres unavailable — audit append on mutation endpoint     | **Fail-closed** — deny request | Preserve integrity for state-changing operations |
| Postgres unavailable — audit append on read endpoint         | **Fail-open** — allow request  | Read-only; no state change risk                  |
| Replay cache unavailable — settlement / custody / transfer   | **Fail-closed** — deny request | Replay resistance is core security, not optional |

**Implementation note:**

- `createPluggableRateLimiter(...)` may throw on backend errors. Callers must enforce policy at the API boundary via `try/catch` with explicit deny or allow behavior.
- `safeAuditAppend(...)` in middleware logs and continues by default. Use endpoint-level policy wrappers where strict durability is required.

---

## 7. Replay Cache — Multi-Instance Deployments

For single-instance deployments, `BoundedReplayCache` (in-memory, 100K entries, 5-minute window) is acceptable.

For multi-instance or horizontally scaled deployments, `BoundedReplayCache` is not safe — each instance has its own cache and cannot see replays routed to other instances. Use `createRedisReplayCache(...)` in all multi-instance environments.

---

## 8. Observability

Replay checks emit metrics when a collector is provided:

```
gtcx_pvp_replay_check_total{result=accepted|rejected}
gtcx_vaultmark_replay_check_total{result=accepted|rejected}
```

Wire a Prometheus `IMetricsCollector` implementation to collect these counters.

---

## 9. Verification Checklist

After replacing all stubs:

- [ ] Unset `GTCX_STUB_STORE`, `GTCX_STUB_RATE_LIMITER`, `GTCX_STUB_REPLAY_CACHE`
- [ ] `NODE_ENV=production` confirms `enforceStubGuard()` will throw on any remaining stubs
- [ ] Smoke test: auth middleware authenticates a valid request and writes an audit entry to Postgres
- [ ] Smoke test: replay cache rejects a duplicate request within the 5-minute window
- [ ] Smoke test: rate limiter denies a burst exceeding `maxRequests`
- [ ] Confirm `pnpm test:integration` passes in the production environment configuration

---

## Reference

- [ADR-010: In-Memory Stub Guards](../../architecture/decisions/ADR-010-in-memory-stub-guards.md)
- [disaster-recovery.md](disaster-recovery.md)
