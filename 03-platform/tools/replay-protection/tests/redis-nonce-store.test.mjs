/**
 * @fileoverview Redis Nonce Store Tests
 *
 * Tests the RedisNonceStore with a mock Redis client.
 * No external Redis server required.
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import { RedisNonceStore } from '../03-platform/src/store/redis-nonce-store.mjs';

/** Creates a mock Redis client that stores data in memory. */
function createMockRedisClient() {
  const store = new Map();

  return {
    set: async (key, value, options) => {
      const exists = store.has(key);
      if (options?.NX && exists) {
        return null;
      }
      store.set(key, value);
      return 'OK';
    },
    exists: async (key) => {
      return store.has(key) ? 1 : 0;
    },
    del: async (key) => {
      store.delete(key);
    },
    _store: store,
  };
}

describe('RedisNonceStore', () => {
  it('requires a Redis client', () => {
    assert.throws(() => new RedisNonceStore({}), /RedisNonceStore requires opts.client/);
  });

  it('checkAndSet returns true on first insert', async () => {
    const client = createMockRedisClient();
    const store = new RedisNonceStore({ client, keyPrefix: 'test' });

    const result = await store.checkAndSet('nonce-1', 60000);
    assert.strictEqual(result, true);
  });

  it('checkAndSet returns false on duplicate nonce', async () => {
    const client = createMockRedisClient();
    const store = new RedisNonceStore({ client, keyPrefix: 'test' });

    await store.checkAndSet('nonce-1', 60000);
    const result = await store.checkAndSet('nonce-1', 60000);
    assert.strictEqual(result, false);
  });

  it('has returns true for existing nonce', async () => {
    const client = createMockRedisClient();
    const store = new RedisNonceStore({ client, keyPrefix: 'test' });

    await store.checkAndSet('nonce-1', 60000);
    const result = await store.has('nonce-1');
    assert.strictEqual(result, true);
  });

  it('has returns false for missing nonce', async () => {
    const client = createMockRedisClient();
    const store = new RedisNonceStore({ client, keyPrefix: 'test' });

    const result = await store.has('nonce-missing');
    assert.strictEqual(result, false);
  });

  it('delete removes a nonce', async () => {
    const client = createMockRedisClient();
    const store = new RedisNonceStore({ client, keyPrefix: 'test' });

    await store.checkAndSet('nonce-1', 60000);
    await store.delete('nonce-1');
    const result = await store.has('nonce-1');
    assert.strictEqual(result, false);
  });

  it('uses default key prefix', async () => {
    const client = createMockRedisClient();
    const store = new RedisNonceStore({ client });

    await store.checkAndSet('nonce-1', 60000);
    assert.strictEqual(client._store.has('replay:nonce:nonce-1'), true);
  });

  it('uses custom key prefix', async () => {
    const client = createMockRedisClient();
    const store = new RedisNonceStore({ client, keyPrefix: 'custom' });

    await store.checkAndSet('nonce-1', 60000);
    assert.strictEqual(client._store.has('custom:nonce-1'), true);
  });

  it('health returns true when client responds to ping', async () => {
    const client = createMockRedisClient();
    client.ping = async () => 'PONG';
    const store = new RedisNonceStore({ client });

    const result = await store.health();
    assert.strictEqual(result, true);
  });

  it('health returns false when client ping throws', async () => {
    const client = createMockRedisClient();
    client.ping = async () => {
      throw new Error('connection refused');
    };
    const store = new RedisNonceStore({ client });

    const result = await store.health();
    assert.strictEqual(result, false);
  });
});
