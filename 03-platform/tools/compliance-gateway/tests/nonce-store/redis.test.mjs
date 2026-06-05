import assert from 'node:assert';
import { afterEach, describe, it } from 'node:test';

import { createNonceStore, __resetNonceStoreForTests } from '../../03-platform/src/nonce-store/redis.mjs';

const originalRedisUrl = process.env.REDIS_URL;

afterEach(() => {
  __resetNonceStoreForTests();
  if (originalRedisUrl === undefined) {
    delete process.env.REDIS_URL;
  } else {
    process.env.REDIS_URL = originalRedisUrl;
  }
});

describe('createNonceStore - memory fallback (no REDIS_URL)', () => {
  it('falls back to in-memory when REDIS_URL is unset', async () => {
    delete process.env.REDIS_URL;
    const store = await createNonceStore({ tenantId: 'zw' });

    const r1 = await store.checkAndSet('nonce-1');
    assert.strictEqual(r1.accepted, true);
    assert.strictEqual(r1.alreadySeen, false);

    const r2 = await store.checkAndSet('nonce-1');
    assert.strictEqual(r2.accepted, false);
    assert.strictEqual(r2.alreadySeen, true);
  });

  it('isolates nonces by tenantId', async () => {
    delete process.env.REDIS_URL;
    const storeZw = await createNonceStore({ tenantId: 'zw' });
    const storeGh = await createNonceStore({ tenantId: 'gh' });

    const r1 = await storeZw.checkAndSet('shared-nonce');
    assert.strictEqual(r1.accepted, true);

    const r2 = await storeGh.checkAndSet('shared-nonce');
    assert.strictEqual(r2.accepted, true);

    const r3 = await storeZw.checkAndSet('shared-nonce');
    assert.strictEqual(r3.accepted, false);
  });

  it('stores requestHash in memory when provided', async () => {
    delete process.env.REDIS_URL;
    const store = await createNonceStore({ tenantId: 'zw' });

    const r1 = await store.checkAndSet('nonce-hash', 'sha256:abc123');
    assert.strictEqual(r1.accepted, true);

    const r2 = await store.checkAndSet('nonce-hash', 'sha256:def456');
    assert.strictEqual(r2.accepted, false);
  });
});

describe('createNonceStore - Redis backend', () => {
  it('uses SET NX EX with tenant-scoped key and request hash', async () => {
    const calls = [];
    const redisClient = {
      set: async (...args) => {
        calls.push(args);
        return 'OK';
      },
    };

    const store = await createNonceStore({ tenantId: 'zw', redisClient });
    const result = await store.checkAndSet('nonce-1', 'sha256:abc123');

    assert.deepStrictEqual(result, { accepted: true, alreadySeen: false });
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0][0], 'nonce:zw:nonce-1');
    assert.strictEqual(calls[0][2], 'NX');
    assert.strictEqual(calls[0][3], 'EX');
    assert.strictEqual(calls[0][4], 300);

    const stored = JSON.parse(calls[0][1]);
    assert.match(stored.ts, /^\d{4}-\d{2}-\d{2}T/);
    assert.strictEqual(stored.hash, 'sha256:abc123');
  });

  it('uses the default tenant when tenantId is not supplied', async () => {
    let key;
    const redisClient = {
      set: async (...args) => {
        key = args[0];
        return 'OK';
      },
    };

    const store = await createNonceStore({ redisClient });
    await store.checkAndSet('nonce-default');

    assert.strictEqual(key, 'nonce:default:nonce-default');
  });

  it('returns replay when Redis SET NX does not create a key', async () => {
    const redisClient = {
      set: async () => null,
    };

    const store = await createNonceStore({ tenantId: 'zw', redisClient });
    const result = await store.checkAndSet('nonce-1');

    assert.deepStrictEqual(result, { accepted: false, alreadySeen: true });
  });

  it('fails closed when Redis command execution fails', async () => {
    const redisClient = {
      set: async () => {
        throw new Error('redis write failed');
      },
    };

    const store = await createNonceStore({ tenantId: 'zw', redisClient });
    const result = await store.checkAndSet('nonce-1');

    assert.deepStrictEqual(result, { accepted: false, alreadySeen: true });
  });

  it('falls back to memory when Redis connection fails', async () => {
    let connectCalled = false;
    class RedisCtor {
      constructor(url, options) {
        this.url = url;
        this.options = options;
      }

      async connect() {
        connectCalled = true;
        throw new Error('connect refused');
      }
    }

    const store = await createNonceStore({
      tenantId: 'zw',
      redisUrl: 'redis://127.0.0.1:6379',
      RedisCtor,
    });

    assert.strictEqual(connectCalled, true);
    assert.strictEqual((await store.checkAndSet('nonce-1')).accepted, true);
    assert.strictEqual((await store.checkAndSet('nonce-1')).accepted, false);
  });

  it('caches the connected Redis client for the same URL', async () => {
    let constructed = 0;
    class RedisCtor {
      constructor(_url, options) {
        constructed += 1;
        this.options = options;
      }

      async connect() {}

      async set() {
        return 'OK';
      }
    }

    const first = await createNonceStore({
      redisUrl: 'redis://cache.example:6379',
      RedisCtor,
    });
    const second = await createNonceStore({
      redisUrl: 'redis://cache.example:6379',
      RedisCtor,
    });

    assert.deepStrictEqual(await first.checkAndSet('nonce-1'), {
      accepted: true,
      alreadySeen: false,
    });
    assert.deepStrictEqual(await second.checkAndSet('nonce-2'), {
      accepted: true,
      alreadySeen: false,
    });
    assert.strictEqual(constructed, 1);
  });
});
