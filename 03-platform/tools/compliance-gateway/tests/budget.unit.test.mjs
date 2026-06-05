/**
 * @fileoverview Unit tests for per-principal QPS + daily budget limiter.
 */

import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { _setStoreForTests } from '../03-platform/src/budget-store.mjs';
import { checkBudget, recordSpend, getSpend, resetBudget } from '../03-platform/src/budget.mjs';

describe('checkBudget — QPS', () => {
  beforeEach(async () => {
    process.env.GTCX_QPS_LIMIT = '3';
    process.env.GTCX_QPS_WINDOW_MS = '1000';
    process.env.GTCX_DAILY_BUDGET_USD = '100';
    await resetBudget();
  });
  afterEach(async () => {
    delete process.env.GTCX_QPS_LIMIT;
    delete process.env.GTCX_QPS_WINDOW_MS;
    delete process.env.GTCX_DAILY_BUDGET_USD;
    delete process.env.GTCX_PRINCIPAL_BUDGETS_JSON;
    await resetBudget();
  });

  it('allows requests under the per-window QPS limit', async () => {
    // QPS_LIMIT is read at module load. The test verifies the contract
    // with whatever limit the module observed; default 10.
    const a = await checkBudget('alice');
    const b = await checkBudget('alice');
    assert.strictEqual(a.ok, true);
    assert.strictEqual(b.ok, true);
  });

  it('returns 429 with reason=qps after the limit is exceeded', async () => {
    const subject = 'flood-test';
    // Fire well over the default 10 QPS limit.
    const results = [];
    for (let i = 0; i < 12; i += 1) {
      results.push(await checkBudget(subject));
    }
    const rejected = results.find((r) => !r.ok);
    assert.ok(rejected, 'expected at least one 429');
    assert.strictEqual(rejected.status, 429);
    assert.strictEqual(rejected.reason, 'qps');
    assert.ok(rejected.retryAfterSeconds > 0);
  });

  it('isolates principals: alice over the limit does not affect bob', async () => {
    for (let i = 0; i < 12; i += 1) await checkBudget('alice-isolated');
    const bob = await checkBudget('bob-isolated');
    assert.strictEqual(bob.ok, true);
  });
});

describe('checkBudget — daily budget', () => {
  beforeEach(async () => {
    await resetBudget();
  });
  afterEach(async () => {
    await resetBudget();
  });

  it('allows requests under the budget', async () => {
    await recordSpend('carol', 0.01);
    const r = await checkBudget('carol');
    assert.strictEqual(r.ok, true);
  });

  it('rejects with reason=budget when spend ≥ daily ceiling', async () => {
    const subject = 'spendy';
    // Default is $5 — push past it.
    await recordSpend(subject, 999);
    const r = await checkBudget(subject);
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.status, 429);
    assert.strictEqual(r.reason, 'budget');
    assert.ok(r.retryAfterSeconds > 0);
  });

  it('getSpend reports current spend + limits', async () => {
    await recordSpend('dora', 0.5);
    const s = await getSpend('dora');
    assert.strictEqual(typeof s.day, 'string');
    assert.ok(s.spentUsd >= 0.5);
    assert.ok(s.limits.qps > 0);
    assert.ok(s.limits.dailyUsd > 0);
    assert.strictEqual(s.backend, 'memory');
  });
});

describe('per-principal overrides', () => {
  afterEach(async () => {
    delete process.env.GTCX_PRINCIPAL_BUDGETS_JSON;
    await resetBudget();
  });

  it('applies an override from GTCX_PRINCIPAL_BUDGETS_JSON', async () => {
    process.env.GTCX_PRINCIPAL_BUDGETS_JSON = JSON.stringify({
      whale: { qps: 100, dailyUsd: 500 },
    });
    await resetBudget();
    const r = await checkBudget('whale');
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.limits.qps, 100);
    assert.strictEqual(r.limits.dailyUsd, 500);
  });

  it('ignores malformed JSON in the override env var', async () => {
    process.env.GTCX_PRINCIPAL_BUDGETS_JSON = '{not-json';
    await resetBudget();
    const r = await checkBudget('safe');
    assert.strictEqual(r.ok, true);
  });
});

describe('budget API — store wiring', () => {
  afterEach(async () => {
    await resetBudget();
  });

  it('delegates checkBudget, recordSpend, and getSpend to the active BudgetStore', async () => {
    const calls = [];
    _setStoreForTests({
      backend: 'memory',
      async recordQpsHit(subject, windowMs) {
        calls.push(['recordQpsHit', subject, windowMs]);
        return 1;
      },
      async readDailySpend(subject, day) {
        calls.push(['readDailySpend', subject, day]);
        return subject === 'zw:alice' ? 0.25 : 0;
      },
      async addDailySpend(subject, day, usd) {
        calls.push(['addDailySpend', subject, day, usd]);
      },
      async reset() {},
      async close() {},
      info() {
        return { backend: 'memory' };
      },
    });

    const check = await checkBudget('alice', 'zw');
    assert.strictEqual(check.ok, true);
    await recordSpend('alice', 0.5, 'zw');
    const spend = await getSpend('alice', 'zw');

    assert.strictEqual(spend.spentUsd, 0.25);
    assert.deepStrictEqual(
      calls.map((call) => call[0]),
      ['recordQpsHit', 'readDailySpend', 'addDailySpend', 'readDailySpend']
    );
    assert.ok(calls.every((call) => call[1] === 'zw:alice'));
  });
});
