/**
 * @fileoverview Redis Session Store Tests
 *
 * Tests RedisSessionStore with a mock ioredis client.
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import { RedisSessionStore } from '../03-platform/src/session.mjs';

function createMockRedis() {
  const data = new Map();
  return {
    hgetall: async (key) => {
      const val = data.get(key);
      return val ? Object.fromEntries(Object.entries(val)) : {};
    },
    del: async (key) => {
      data.delete(key);
      return 1;
    },
    pipeline: () => ({
      del: (key) => {
        data.delete(key);
        return { del: true };
      },
      hset: (key, field, value) => {
        if (!data.has(key)) data.set(key, {});
        data.get(key)[field] = value;
        return { hset: true };
      },
      expire: () => ({ expire: true }),
      exec: async () => [[null, 1], [null, 1], [null, 1]],
    }),
  };
}

describe('RedisSessionStore', () => {
  it('stores and retrieves a session', async () => {
    const store = new RedisSessionStore({ redisUrl: 'redis://mock' });
    store.client = createMockRedis();

    await store.setSession('s1', { phone: '+263771234567', menu: 'root' });
    const s = await store.getSession('s1');
    assert.strictEqual(s.phone, '+263771234567');
    assert.strictEqual(s.menu, 'root');
  });

  it('returns null for missing session', async () => {
    const store = new RedisSessionStore({ redisUrl: 'redis://mock' });
    store.client = createMockRedis();
    const s = await store.getSession('missing');
    assert.strictEqual(s, null);
  });

  it('deletes a session', async () => {
    const store = new RedisSessionStore({ redisUrl: 'redis://mock' });
    store.client = createMockRedis();
    await store.setSession('s1', { phone: '123' });
    await store.deleteSession('s1');
    const s = await store.getSession('s1');
    assert.strictEqual(s, null);
  });

  it('overwrites existing session', async () => {
    const store = new RedisSessionStore({ redisUrl: 'redis://mock' });
    store.client = createMockRedis();
    await store.setSession('s1', { phone: 'old' });
    await store.setSession('s1', { phone: 'new' });
    const s = await store.getSession('s1');
    assert.strictEqual(s.phone, 'new');
  });

  it('requires redisUrl', () => {
    assert.throws(() => new RedisSessionStore(), /REDIS_URL is required/);
  });

  it('connect lazily initializes client', async () => {
    const store = new RedisSessionStore({ redisUrl: 'redis://mock' });
    assert.strictEqual(store.client, null);
    store.client = createMockRedis();
    const s = await store.getSession('any');
    assert.strictEqual(s, null);
  });

  it('connect is idempotent when client is already set', async () => {
    const store = new RedisSessionStore({ redisUrl: 'redis://mock' });
    const mock = createMockRedis();
    store.client = mock;
    await store.connect();
    await store.connect();
    assert.strictEqual(store.client, mock);
  });
});

describe('createSessionStore', () => {
  it('returns MemorySessionStore when REDIS_URL absent', async () => {
    const { createSessionStore } = await import('../03-platform/src/session.mjs');
    const store = createSessionStore();
    assert.ok(store.constructor.name === 'MemorySessionStore');
  });

  it('returns RedisSessionStore when REDIS_URL present', async () => {
    const { config } = await import('../03-platform/src/config.mjs');
    const prev = config.redisUrl;
    config.redisUrl = 'redis://localhost:6379';
    const { createSessionStore } = await import('../03-platform/src/session.mjs');
    const store = createSessionStore();
    assert.ok(store.constructor.name === 'RedisSessionStore');
    config.redisUrl = prev;
  });
});
