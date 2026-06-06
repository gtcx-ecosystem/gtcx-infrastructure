/**
 * @fileoverview Session Store Tests
 */

import assert from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'node:test';

import { MemorySessionStore } from '../src/session.mjs';

describe('MemorySessionStore', () => {
  let store;

  beforeEach(() => {
    store = new MemorySessionStore({ ttlSeconds: 1 });
  });

  afterEach(async () => {
    for (const [sid] of store.sessions) {
      await store.deleteSession(sid);
    }
  });

  it('stores and retrieves a session', async () => {
    await store.setSession('s1', { phone: '+263771234567', menu: 'root' });
    const s = await store.getSession('s1');
    assert.strictEqual(s.phone, '+263771234567');
  });

  it('returns null for missing session', async () => {
    const s = await store.getSession('missing');
    assert.strictEqual(s, null);
  });

  it('deletes a session', async () => {
    await store.setSession('s1', { phone: '123' });
    await store.deleteSession('s1');
    const s = await store.getSession('s1');
    assert.strictEqual(s, null);
  });

  it('auto-expires after TTL', async () => {
    await store.setSession('s1', { phone: '123' });
    assert.ok(await store.getSession('s1'));
    await new Promise((r) => setTimeout(r, 1100));
    const s = await store.getSession('s1');
    assert.strictEqual(s, null);
  });

  it('refreshes TTL on access', async () => {
    await store.setSession('s1', { phone: '123' });
    await new Promise((r) => setTimeout(r, 600));
    await store.getSession('s1'); // refresh
    await new Promise((r) => setTimeout(r, 600));
    const s = await store.getSession('s1');
    assert.ok(s);
  });

  it('tracks size', async () => {
    assert.strictEqual(store.size, 0);
    await store.setSession('s1', { phone: '123' });
    assert.strictEqual(store.size, 1);
    await store.setSession('s2', { phone: '456' });
    assert.strictEqual(store.size, 2);
    await store.deleteSession('s1');
    assert.strictEqual(store.size, 1);
  });
});
