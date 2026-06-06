/**
 * @fileoverview Memory Nonce Store Tests — Branch Coverage
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import { MemoryNonceStore } from '../src/store/memory-nonce-store.mjs';

describe('MemoryNonceStore', () => {
  it('stores and checks a nonce', async () => {
    const store = new MemoryNonceStore();
    assert.strictEqual(await store.checkAndSet('nonce-1', 60000), true);
    assert.strictEqual(await store.has('nonce-1'), true);
  });

  it('rejects duplicate nonce', async () => {
    const store = new MemoryNonceStore();
    await store.checkAndSet('nonce-1', 60000);
    assert.strictEqual(await store.checkAndSet('nonce-1', 60000), false);
  });

  it('deletes a nonce', async () => {
    const store = new MemoryNonceStore();
    await store.checkAndSet('nonce-1', 60000);
    await store.delete('nonce-1');
    assert.strictEqual(await store.has('nonce-1'), false);
  });

  it('evicts expired entries via has()', async () => {
    const store = new MemoryNonceStore();
    await store.checkAndSet('nonce-1', 10);
    assert.strictEqual(await store.has('nonce-1'), true);
    await new Promise((r) => setTimeout(r, 20));
    assert.strictEqual(await store.has('nonce-1'), false);
  });

  it('evicts expired entries via size getter', async () => {
    const store = new MemoryNonceStore();
    await store.checkAndSet('nonce-1', 10);
    assert.strictEqual(store.size, 1);
    await new Promise((r) => setTimeout(r, 20));
    assert.strictEqual(store.size, 0);
  });

  it('health returns true', async () => {
    const store = new MemoryNonceStore();
    assert.strictEqual(await store.health(), true);
  });

  it('enforces maxSize by dropping oldest', async () => {
    const store = new MemoryNonceStore({ maxSize: 5 });
    for (let i = 0; i < 7; i++) {
      await store.checkAndSet(`nonce-${i}`, 60_000);
    }
    assert.ok(store.size <= 5);
  });
});
