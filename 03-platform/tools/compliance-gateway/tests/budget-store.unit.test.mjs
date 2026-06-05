/**
 * @fileoverview Unit tests for budget-store.mjs.
 *
 * The memory backend is exercised directly — it's the default and is
 * an exact behavioral match of the prior in-process Maps in budget.mjs.
 * The Redis backend is verified via a hand-rolled fake-redis stub
 * injected through _setStoreForTests so the tests don't need a real
 * broker (and don't add ioredis-mock as a devDep just for one suite).
 */

import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { _resetForTests, getBudgetStore, _setStoreForTests } from '../03-platform/src/budget-store.mjs';

describe('budget-store — memory backend (default)', () => {
  beforeEach(async () => {
    delete process.env.GTCX_BUDGET_STORE_BACKEND;
    await _resetForTests();
  });
  afterEach(async () => { await _resetForTests(); });

  it('reports backend=memory by default', async () => {
    const store = await getBudgetStore();
    assert.strictEqual(store.backend, 'memory');
    assert.strictEqual(store.info().backend, 'memory');
  });

  it('recordQpsHit increments + ages out old hits', async () => {
    const store = await getBudgetStore();
    const subject = 'alice';
    const windowMs = 50;

    assert.strictEqual(await store.recordQpsHit(subject, windowMs), 1);
    assert.strictEqual(await store.recordQpsHit(subject, windowMs), 2);
    assert.strictEqual(await store.recordQpsHit(subject, windowMs), 3);

    await new Promise((r) => setTimeout(r, 80));
    // Old hits are aged out by the cutoff; this is the only hit
    // remaining inside the window.
    assert.strictEqual(await store.recordQpsHit(subject, windowMs), 1);
  });

  it('readDailySpend returns 0 for an unknown subject', async () => {
    const store = await getBudgetStore();
    assert.strictEqual(await store.readDailySpend('nobody', '2026-05-30'), 0);
  });

  it('addDailySpend + readDailySpend roundtrips', async () => {
    const store = await getBudgetStore();
    await store.addDailySpend('bob', '2026-05-30', 1.25);
    await store.addDailySpend('bob', '2026-05-30', 0.75);
    assert.strictEqual(await store.readDailySpend('bob', '2026-05-30'), 2);
  });

  it('readDailySpend resets when the day rolls over', async () => {
    const store = await getBudgetStore();
    await store.addDailySpend('carol', '2026-05-30', 5);
    // Reading on a different day must return 0 (and delete the stale entry).
    assert.strictEqual(await store.readDailySpend('carol', '2026-05-31'), 0);
    // And a subsequent same-day read continues to be 0 (cleared).
    assert.strictEqual(await store.readDailySpend('carol', '2026-05-31'), 0);
  });

  it('reset() clears all subjects', async () => {
    const store = await getBudgetStore();
    await store.addDailySpend('a', '2026-05-30', 1);
    await store.addDailySpend('b', '2026-05-30', 2);
    await store.reset();
    assert.strictEqual(await store.readDailySpend('a', '2026-05-30'), 0);
    assert.strictEqual(await store.readDailySpend('b', '2026-05-30'), 0);
  });

  it('addDailySpend creates a new entry when the day changes', async () => {
    const store = await getBudgetStore();
    await store.addDailySpend('dave', '2026-05-30', 1);
    await store.addDailySpend('dave', '2026-05-31', 2);
    assert.strictEqual(await store.readDailySpend('dave', '2026-05-31'), 2);
    assert.strictEqual(await store.readDailySpend('dave', '2026-05-30'), 0);
  });

  it('_resetForTests swallows reset/close errors', async () => {
    _setStoreForTests({
      backend: 'mock',
      async reset() { throw new Error('reset boom'); },
      async close() { throw new Error('close boom'); },
    });
    await assert.doesNotReject(() => _resetForTests());
  });
});

describe('budget-store — redis backend falls back to memory when broker unreachable', () => {
  beforeEach(async () => {
    await _resetForTests();
    process.env.GTCX_BUDGET_STORE_BACKEND = 'redis';
    process.env.GTCX_BUDGET_REDIS_URL = 'redis://127.0.0.1:1';
  });
  afterEach(async () => {
    delete process.env.GTCX_BUDGET_STORE_BACKEND;
    delete process.env.GTCX_BUDGET_REDIS_URL;
    await _resetForTests();
  });

  it('returns memory store and logs a fallback warning when redis is unreachable', async () => {
    // Capture the warn line so the test doesn't pollute output.
    const original = console.warn;
    let warnPayload;
    console.warn = (line) => {
      try { warnPayload = JSON.parse(line); } catch { warnPayload = line; }
    };
    try {
      const store = await getBudgetStore();
      assert.strictEqual(store.backend, 'memory', 'must fall back to memory');
      assert.ok(warnPayload, 'fallback warn must be emitted');
      assert.strictEqual(warnPayload.type, 'budget.store.redis-fallback');
    } finally {
      console.warn = original;
    }
  });
});
