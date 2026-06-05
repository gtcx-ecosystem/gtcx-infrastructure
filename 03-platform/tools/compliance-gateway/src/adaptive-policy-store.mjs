/**
 * @fileoverview Adaptive Policy Store — pluggable backend for shared state.
 *
 * The single-pod adaptive policy in 03-platform/src/adaptive-policy.mjs holds state
 * in module-scope variables: per-pod, per-process. At pilot scale that's
 * fine. Beyond ~5 pods, divergent degradation modes become observable
 * (one pod in `reduced`, another in `auto`), which is acceptable for a
 * brief window but undesirable as the gateway scales.
 *
 * This module provides two backends behind a common interface:
 *
 *   - `memory` (default): identical to the existing per-pod behavior.
 *     Reads/writes are local; counters reset on pod restart.
 *
 *   - `redis`: shared state in a single Redis hash. Multiple gateway
 *     pods see the same counters; transitions are race-safe via
 *     WATCH/MULTI/EXEC. Falls back to memory if `ioredis` is not
 *     installed or the broker is unreachable.
 *
 * Enable via env:
 *
 *   GTCX_ADAPTIVE_STORE_BACKEND=redis
 *   GTCX_ADAPTIVE_REDIS_URL=redis://redis.gtcx.svc.cluster.local:6379
 *   GTCX_ADAPTIVE_REDIS_KEY=gtcx:adaptive:production
 *
 * Default backend is `memory`. To switch, set the env vars above and
 * restart the deployment. No code change required.
 *
 * Schema (Redis hash at GTCX_ADAPTIVE_REDIS_KEY):
 *
 *   mode                      — 'auto' | 'normal' | 'reduced' | 'minimal' | 'offline'
 *   consecLatencyBreaches     — integer
 *   consecErrorBreaches       — integer
 *   consecRecoveryWindows     — integer
 *   lastTransitionAt          — ISO timestamp
 *   lastTransitionReason      — human-readable
 */

const BACKEND = (process.env.GTCX_ADAPTIVE_STORE_BACKEND || 'memory').toLowerCase();
const REDIS_URL = process.env.GTCX_ADAPTIVE_REDIS_URL || 'redis://redis.gtcx.svc.cluster.local:6379';
const REDIS_KEY = process.env.GTCX_ADAPTIVE_REDIS_KEY || `gtcx:adaptive:${process.env.NODE_ENV || 'development'}`;

let activeStore = null;
let redisFallbackLogged = false;

/**
 * @typedef {{
 *   mode: string,
 *   consecutiveLatencyBreaches: number,
 *   consecutiveErrorBreaches: number,
 *   consecutiveRecoveryWindows: number,
 *   lastTransitionAt: string,
 *   lastTransitionReason: string,
 * }} StoreState
 */

/**
 * @typedef {{
 *   backend: 'memory' | 'redis',
 *   read: () => Promise<StoreState>,
 *   write: (state: StoreState, expectedMode?: string) => Promise<boolean>,
 *   close: () => Promise<void>,
 *   info: () => object,
 * }} AdaptiveStore
 */

const DEFAULT_STATE = Object.freeze({
  mode: 'auto',
  consecutiveLatencyBreaches: 0,
  consecutiveErrorBreaches: 0,
  consecutiveRecoveryWindows: 0,
  lastTransitionAt: '',
  lastTransitionReason: '',
});

// ---------------------------------------------------------------------------
// Memory backend
// ---------------------------------------------------------------------------

function buildMemoryStore() {
  let state = { ...DEFAULT_STATE };
  return {
    backend: 'memory',
    async read() {
      return { ...state };
    },
    async write(next) {
      state = { ...state, ...next };
      return true;
    },
    async close() {},
    info() {
      return { backend: 'memory' };
    },
  };
}

// ---------------------------------------------------------------------------
// Redis backend (soft-loaded)
// ---------------------------------------------------------------------------
/* c8 ignore start — requires live Redis broker; memory backend is fully tested */
async function buildRedisStore() {
  let ioredisMod;
  try {
    ioredisMod = await import('ioredis');
  } catch {
    if (!redisFallbackLogged) {
      console.error(JSON.stringify({
        level: 'warn',
        type: 'adaptive-store.redis.module-missing',
        message: 'ioredis not installed; adaptive store falling back to memory backend',
      }));
      redisFallbackLogged = true;
    }
    return buildMemoryStore();
  }
  const Redis = ioredisMod.default ?? ioredisMod.Redis;
  let client;
  try {
    client = new Redis(REDIS_URL, {
      lazyConnect: false,
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    });
    // Synchronous .on emitters are non-blocking; we don't await.
    let connected = false;
    client.on('ready', () => { connected = true; });
    client.on('error', (err) => {
      if (!redisFallbackLogged) {
        console.error(JSON.stringify({
          level: 'warn',
          type: 'adaptive-store.redis.error',
          error: err.message,
          url: REDIS_URL,
        }));
        redisFallbackLogged = true;
      }
    });

    // Quick health probe — if redis is unreachable, fall back to memory now
    // rather than per-tick. The retryStrategy keeps a single client alive
    // for transient blips, but a totally absent broker should not block
    // the gateway's adaptive subsystem from running.
    await new Promise((r) => setTimeout(r, 100));
    if (!connected) {
      // Give it one more chance.
      try {
        await client.ping();
        connected = true;
      } catch { /* fall through */ }
    }
    if (!connected) {
      try { client.disconnect(); } catch { /* shutdown drain — safe to ignore */ }
      if (!redisFallbackLogged) {
        console.error(JSON.stringify({
          level: 'warn',
          type: 'adaptive-store.redis.unreachable',
          url: REDIS_URL,
          message: 'falling back to memory backend',
        }));
        redisFallbackLogged = true;
      }
      return buildMemoryStore();
    }
  } catch (err) {
    console.error(JSON.stringify({
      level: 'warn',
      type: 'adaptive-store.redis.construct-failed',
      error: err.message,
      url: REDIS_URL,
    }));
    return buildMemoryStore();
  }

  function deserialize(hash) {
    if (!hash || Object.keys(hash).length === 0) return { ...DEFAULT_STATE };
    return {
      mode: hash.mode || 'auto',
      consecutiveLatencyBreaches: Number(hash.consecLatencyBreaches) || 0,
      consecutiveErrorBreaches: Number(hash.consecErrorBreaches) || 0,
      consecutiveRecoveryWindows: Number(hash.consecRecoveryWindows) || 0,
      lastTransitionAt: hash.lastTransitionAt || '',
      lastTransitionReason: hash.lastTransitionReason || '',
    };
  }

  function serialize(state) {
    return {
      mode: state.mode,
      consecLatencyBreaches: String(state.consecutiveLatencyBreaches),
      consecErrorBreaches: String(state.consecutiveErrorBreaches),
      consecRecoveryWindows: String(state.consecutiveRecoveryWindows),
      lastTransitionAt: state.lastTransitionAt || '',
      lastTransitionReason: state.lastTransitionReason || '',
    };
  }

  return {
    backend: 'redis',
    async read() {
      try {
        const hash = await client.hgetall(REDIS_KEY);
        return deserialize(hash);
      } catch (err) {
        console.error(JSON.stringify({
          level: 'warn',
          type: 'adaptive-store.redis.read-failed',
          error: err.message,
        }));
        return { ...DEFAULT_STATE };
      }
    },
    async write(state, expectedMode) {
      try {
        // Optimistic-concurrency transition: WATCH the key, check the
        // expected mode hasn't drifted, MULTI/EXEC the write. If another
        // pod transitioned first, EXEC returns null and the caller's
        // tick is a no-op (its next tick will re-read fresh state).
        if (expectedMode !== undefined) {
          await client.watch(REDIS_KEY);
          const current = deserialize(await client.hgetall(REDIS_KEY));
          if (current.mode !== expectedMode) {
            await client.unwatch();
            return false;
          }
          const tx = client.multi();
          tx.hmset(REDIS_KEY, serialize(state));
          const result = await tx.exec();
          return result !== null;
        }
        await client.hmset(REDIS_KEY, serialize(state));
        return true;
      } catch (err) {
        console.error(JSON.stringify({
          level: 'warn',
          type: 'adaptive-store.redis.write-failed',
          error: err.message,
        }));
        return false;
      }
    },
    async close() {
      try { await client.quit(); } catch { /* shutdown drain — safe to ignore */ }
    },
    info() {
      return { backend: 'redis', url: REDIS_URL, key: REDIS_KEY };
    },
  };
}
/* c8 ignore stop */

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Return the active adaptive store. Lazily constructed; reset between
 * tests via `_resetForTests()`.
 *
 * @returns {Promise<AdaptiveStore>}
 */
export async function getStore() {
  if (activeStore) return activeStore;
  activeStore = BACKEND === 'redis' ? await buildRedisStore() : buildMemoryStore();
  return activeStore;
}

/**
 * @returns {{ backend: string }}
 */
export function getStoreInfo() {
  if (!activeStore) return { backend: BACKEND, initialized: false };
  return { ...activeStore.info(), initialized: true };
}

/** Test-only reset. */
export async function _resetForTests() {
  if (activeStore) {
    try { await activeStore.close(); } catch { /* test cleanup — safe to ignore */ }
  }
  activeStore = null;
  redisFallbackLogged = false;
}
