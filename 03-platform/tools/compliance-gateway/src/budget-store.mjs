/**
 * @fileoverview Budget Store — pluggable backend for QPS + daily-spend state.
 *
 * The original budget.mjs held QPS windows and daily spend in module-scope
 * Maps. The docstring claimed Redis backing "when REDIS_URL is configured"
 * but no Redis path existed. Under HPA (1→8 pods), per-pod Map state
 * silently multiplied the documented per-principal QPS by replica count.
 *
 * This module provides two backends behind a common interface:
 *
 *   - `memory` (default): identical to the prior per-pod behavior.
 *     Production behavior is UNCHANGED unless operators explicitly opt
 *     into the redis backend.
 *
 *   - `redis`: shared QPS sorted-set + daily-spend hash. Multiple
 *     gateway pods see the same counters; per-principal limits are
 *     finally honored across the fleet. Falls back to memory if
 *     `ioredis` is not installed or the broker is unreachable.
 *
 * Enable via env (mirrors adaptive-policy-store.mjs's conventions):
 *
 *   GTCX_BUDGET_STORE_BACKEND=redis
 *   GTCX_BUDGET_REDIS_URL=redis://redis.gtcx.svc.cluster.local:6379
 *   GTCX_BUDGET_REDIS_PREFIX=gtcx:budget:production
 *
 * Schema:
 *   - QPS:   ZSET `<prefix>:qps:<subject>` with timestamps as scores
 *   - Spend: HASH `<prefix>:spend:<subject>` with fields {day, spentUsd}
 */

// Env is read lazily at getBudgetStore() time, not at module load —
// so tests + container restarts pick up updates without a process
// restart. Production sets these once via deployment env and they
// don't change at runtime.
function currentBackend() {
  return (process.env.GTCX_BUDGET_STORE_BACKEND || 'memory').toLowerCase();
}
function currentRedisUrl() {
  return (
    process.env.GTCX_BUDGET_REDIS_URL ||
    process.env.REDIS_URL ||
    'redis://redis.gtcx.svc.cluster.local:6379'
  );
}
function currentRedisPrefix() {
  return (
    process.env.GTCX_BUDGET_REDIS_PREFIX || `gtcx:budget:${process.env.NODE_ENV || 'development'}`
  );
}

let activeStore = null;
let redisFallbackLogged = false;

/**
 * @typedef {{
 *   backend: 'memory' | 'redis',
 *   recordQpsHit: (subject: string, windowMs: number) => Promise<number>,
 *   readDailySpend: (subject: string, day: string) => Promise<number>,
 *   addDailySpend: (subject: string, day: string, usd: number) => Promise<void>,
 *   reset: () => Promise<void>,
 *   close: () => Promise<void>,
 *   info: () => object,
 * }} BudgetStore
 */

// ---------------------------------------------------------------------------
// Memory backend — exact behavioral match of the prior in-process Maps.
// ---------------------------------------------------------------------------

function buildMemoryStore() {
  /** @type {Map<string, number[]>} */
  const qpsWindows = new Map();
  /** @type {Map<string, { day: string, spentUsd: number }>} */
  const dailySpend = new Map();

  return {
    backend: 'memory',
    async recordQpsHit(subject, windowMs) {
      const now = Date.now();
      const cutoff = now - windowMs;
      const arr = (qpsWindows.get(subject) || []).filter((t) => t >= cutoff);
      arr.push(now);
      qpsWindows.set(subject, arr);
      return arr.length;
    },
    async readDailySpend(subject, day) {
      const current = dailySpend.get(subject);
      if (!current) return 0;
      if (current.day !== day) {
        dailySpend.delete(subject);
        return 0;
      }
      return current.spentUsd;
    },
    async addDailySpend(subject, day, usd) {
      const current = dailySpend.get(subject);
      if (current && current.day === day) {
        current.spentUsd += usd;
      } else {
        dailySpend.set(subject, { day, spentUsd: usd });
      }
    },
    async reset() {
      qpsWindows.clear();
      dailySpend.clear();
    },
    async close() {},
    info() {
      return { backend: 'memory' };
    },
  };
}

// ---------------------------------------------------------------------------
// Redis backend — shared across all gateway pods.
// ---------------------------------------------------------------------------
/* c8 ignore start — requires live Redis broker; memory backend + fallback path are fully tested */
async function buildRedisStore() {
  let RedisCtor;
  try {
    RedisCtor = (await import('ioredis')).default;
  } catch {
    return null;
  }
  const url = currentRedisUrl();
  const prefix = currentRedisPrefix();
  const client = new RedisCtor(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
  client.on?.('error', () => {});
  try {
    await client.connect();
  } catch {
    try {
      client.disconnect();
    } catch {
      /* shutdown */
    }
    return null;
  }

  const qpsKey = (s) => `${prefix}:qps:${s}`;
  const spendKey = (s) => `${prefix}:spend:${s}`;

  return {
    backend: 'redis',
    async recordQpsHit(subject, windowMs) {
      const now = Date.now();
      const cutoff = now - windowMs;
      const key = qpsKey(subject);
      // Add this hit, trim the window, count what remains. Pipeline
      // so all three commands hit the wire at once.
      const pipeline = client.multi();
      pipeline.zadd(key, now, `${now}:${Math.random().toString(36).slice(2, 8)}`);
      pipeline.zremrangebyscore(key, '-inf', cutoff);
      pipeline.zcard(key);
      pipeline.pexpire(key, windowMs * 2);
      const results = await pipeline.exec();
      const count = Number(results?.[2]?.[1] ?? 0);
      return count;
    },
    async readDailySpend(subject, day) {
      const stored = await client.hgetall(spendKey(subject));
      if (!stored || stored.day !== day) {
        if (stored?.day) {
          // Wrong day — delete the stale hash so the spend ticker
          // doesn't accumulate across days.
          await client.del(spendKey(subject));
        }
        return 0;
      }
      return Number(stored.spentUsd ?? 0);
    },
    async addDailySpend(subject, day, usd) {
      const key = spendKey(subject);
      const existing = await client.hget(key, 'day');
      if (existing && existing !== day) {
        await client.del(key);
      }
      await client.hset(key, 'day', day);
      await client.hincrbyfloat(key, 'spentUsd', usd);
      // Expire after 48h so dead-tenant keys don't accumulate.
      await client.expire(key, 48 * 60 * 60);
    },
    async reset() {
      const stream = client.scanStream({ match: `${prefix}:*`, count: 100 });
      const toDelete = [];
      for await (const keys of stream) toDelete.push(...keys);
      if (toDelete.length > 0) await client.del(...toDelete);
    },
    async close() {
      try {
        await client.quit();
      } catch {
        /* already closed */
      }
    },
    info() {
      return { backend: 'redis', url, prefix };
    },
  };
}
/* c8 ignore stop */

// ---------------------------------------------------------------------------
// Factory + lazy init
// ---------------------------------------------------------------------------

/**
 * Get (and lazily construct) the active store. Honors GTCX_BUDGET_STORE_BACKEND.
 *
 * @returns {Promise<BudgetStore>}
 */
export async function getBudgetStore() {
  if (activeStore) return activeStore;
  if (currentBackend() === 'redis') {
    const redis = await buildRedisStore();
    if (redis) {
      activeStore = redis;
      return activeStore;
    }
    if (!redisFallbackLogged) {
      console.warn(
        JSON.stringify({
          level: 'warn',
          type: 'budget.store.redis-fallback',
          message:
            'GTCX_BUDGET_STORE_BACKEND=redis was requested but ioredis is not loadable or the broker is unreachable. Falling back to memory (per-pod) — per-principal limits will NOT be honored across HPA replicas.',
          url: currentRedisUrl(),
        })
      );
      redisFallbackLogged = true;
    }
  }
  activeStore = buildMemoryStore();
  return activeStore;
}

/**
 * Test-only — reset the singleton + clear store contents.
 */
export async function _resetForTests() {
  if (activeStore) {
    try {
      await activeStore.reset();
    } catch {
      /* swallow */
    }
    try {
      await activeStore.close();
    } catch {
      /* swallow */
    }
  }
  activeStore = null;
  redisFallbackLogged = false;
}

/**
 * Test-only — inject a custom store for unit tests.
 *
 * @param {BudgetStore} store
 */
export function _setStoreForTests(store) {
  activeStore = store;
}
