/**
 * Redis-backed nonce store for cross-service replay protection.
 *
 * Semantics:
 *   - Key:   nonce:{tenant-id}:{nonce-value}
 *   - TTL:   300s (5-min replay window, matches NONCE_TTL_MS)
 *   - Value: JSON { ts: ISOString, hash: request-hash } for forensic dup detection
 *
 * Fallback: if REDIS_URL is unset or connection fails, logs WARN and
 * falls back to in-memory NonceGate (same interface, no external dep).
 */

import { NonceGate, NONCE_TTL_MS } from '../audit-bundles/nonce-gate.mjs';

const REDIS_TTL_S = Math.ceil(NONCE_TTL_MS / 1000);

/** @type {import('ioredis').Redis | null} */
let redis = null;
let cachedRedisUrl = null;

/**
 * Lazy-connect to Redis. Returns null if REDIS_URL is unset or connection
 * throws, logging a WARN so operators know the nonce store is in-memory.
 */
async function getRedis({ redisUrl = process.env.REDIS_URL, RedisCtor } = {}) {
  if (redis && cachedRedisUrl === redisUrl) return redis;
  if (!redisUrl) return null;

  try {
    const Redis = RedisCtor ?? (await import('ioredis')).Redis;
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      /* c8 ignore next 3 — only exercised during live connection retries */
      retryStrategy(times) {
        return times > 3 ? null : Math.min(times * 100, 1000);
      },
    });
    await client.connect();
    redis = client;
    cachedRedisUrl = redisUrl;
    return redis;
  } catch (err) {
    console.warn(
      JSON.stringify({
        level: 'warn',
        type: 'nonce-store.redis.unavailable',
        message: 'REDIS_URL set but connection failed; falling back to in-memory NonceGate',
        redisUrl,
        error: err.message,
      })
    );
    return null;
  }
}

/**
 * Create a nonce store backed by Redis when available, otherwise in-memory.
 *
 * @param {object} [opts]
 * @param {string} [opts.tenantId]  - tenant segment for key namespacing
 * @param {string} [opts.redisUrl]  - Redis URL override, mostly for tests
 * @param {new (...args: unknown[]) => import('ioredis').Redis} [opts.RedisCtor] - Redis constructor override
 * @param {import('ioredis').Redis} [opts.redisClient] - connected Redis client override
 * @returns {Promise<{ checkAndSet: (nonce: string, requestHash?: string) => Promise<{ accepted: boolean, alreadySeen: boolean }> }>}
 */
export async function createNonceStore(opts = {}) {
  const client =
    opts.redisClient ?? (await getRedis({ redisUrl: opts.redisUrl, RedisCtor: opts.RedisCtor }));
  const tenantId = opts.tenantId ?? 'default';

  if (!client) {
    console.warn(
      JSON.stringify({
        level: 'warn',
        type: 'nonce-store.memory.fallback',
        message: 'Using in-memory NonceGate (process-scoped, not shared across pods)',
        tenantId,
      })
    );
    const gate = new NonceGate();
    return {
      checkAndSet: async (nonce) => gate.checkAndSet(nonce),
    };
  }

  return {
    /**
     * @param {string} nonce
     * @param {string} [requestHash]
     */
    checkAndSet: async (nonce, requestHash = '') => {
      const key = `nonce:${tenantId}:${nonce}`;
      const value = JSON.stringify({
        ts: new Date().toISOString(),
        hash: requestHash,
      });

      try {
        // SET key value NX EX ttl - only sets if key does not exist
        const result = await client.set(key, value, 'NX', 'EX', REDIS_TTL_S);

        if (result === 'OK') {
          return { accepted: true, alreadySeen: false };
        }

        // Key already exists - replay
        return { accepted: false, alreadySeen: true };
      } catch (err) {
        console.warn(
          JSON.stringify({
            level: 'warn',
            type: 'nonce-store.redis.command_failed',
            message: 'Redis nonce check failed; rejecting nonce to fail closed',
            tenantId,
            error: err.message,
          })
        );
        return { accepted: false, alreadySeen: true };
      }
    },
  };
}

export function __resetNonceStoreForTests() {
  redis = null;
  cachedRedisUrl = null;
}
