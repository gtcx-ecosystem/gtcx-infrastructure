import { describe, it } from 'node:test';
import assert from 'node:assert';

import { processQuery } from '../../src/audit-query/handler.mjs';
import { InMemoryQueryStore } from '../../src/audit-query/store.mjs';

function event(overrides) {
  return {
    id: 'e1',
    timestamp: '2026-05-20T12:00:00Z',
    workflowId: 'wf-1',
    iterationNumber: 0,
    agentId: 'capture.spoof@v1',
    promptVersionId: 'v1',
    inputHash: 'h:in',
    outputHash: 'h:out',
    qualityScore: 80,
    tokensUsed: 0,
    costUsd: 0,
    durationMs: 0,
    outcome: 'continue',
    schemaValid: null,
    previousHash: null,
    eventHash: 'h:e1',
    synced: false,
    ...overrides,
  };
}

function freshStore(seed = {}) {
  const store = new InMemoryQueryStore();
  for (const [tenantId, events] of Object.entries(seed)) {
    store.seed(tenantId, events);
  }
  return store;
}

function defaults(overrides = {}) {
  return {
    method: 'POST',
    body: '{}',
    headers: {
      authorization: 'Bearer staging-token',
      'x-gtcx-tenant-id': 'zw',
    },
    store: freshStore({ zw: [event({ id: 'e1' })] }),
    ...overrides,
  };
}

describe('processQuery — happy path', () => {
  it('returns 200 with events on a valid request', async () => {
    const r = await processQuery(defaults());
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body.events.length, 1);
    assert.strictEqual(r.body.totalMatched, 1);
    assert.strictEqual(r.body.truncated, false);
  });

  it('returns empty result when no events match', async () => {
    const r = await processQuery({
      ...defaults(),
      body: JSON.stringify({ outcome: 'failure' }),
    });
    assert.strictEqual(r.status, 200);
    assert.deepStrictEqual(r.body.events, []);
    assert.strictEqual(r.body.totalMatched, 0);
    assert.strictEqual(r.body.truncated, false);
  });

  it('sets truncated=true when limit is exceeded', async () => {
    const events = Array.from({ length: 5 }, (_, i) =>
      event({ id: `e${i}`, timestamp: `2026-05-${20 + i}T00:00:00Z` }),
    );
    const r = await processQuery({
      ...defaults(),
      body: JSON.stringify({ limit: 3 }),
      store: freshStore({ zw: events }),
    });
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body.events.length, 3);
    assert.strictEqual(r.body.truncated, true);
    assert.strictEqual(r.body.totalMatched, 4, 'min(matched, limit+1) per Q9');
  });

  it('accepts an empty body (= all filters off)', async () => {
    const r = await processQuery({ ...defaults(), body: '' });
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body.events.length, 1);
  });
});

describe('processQuery — method gate', () => {
  it('returns 405 on non-POST', async () => {
    const r = await processQuery({ ...defaults(), method: 'GET' });
    assert.strictEqual(r.status, 405);
  });
});

describe('processQuery — bearer auth', () => {
  it('returns 401 when authorization header missing', async () => {
    const args = defaults();
    delete args.headers.authorization;
    const r = await processQuery(args);
    assert.strictEqual(r.status, 401);
  });

  it('returns 401 when header is not Bearer', async () => {
    const args = defaults();
    args.headers.authorization = 'Basic abc';
    const r = await processQuery(args);
    assert.strictEqual(r.status, 401);
  });

  it('returns 401 when Bearer token is empty', async () => {
    const args = defaults();
    args.headers.authorization = 'Bearer   ';
    const r = await processQuery(args);
    assert.strictEqual(r.status, 401);
  });

  it('honors a validator that rejects the token', async () => {
    const r = await processQuery({
      ...defaults(),
      validateToken: () => ({ ok: false, error: 'token-expired' }),
    });
    assert.strictEqual(r.status, 401);
    assert.strictEqual(r.body.error, 'token-expired');
  });

  it('uses token-bound tenantId when validator provides one and no header', async () => {
    const args = defaults();
    delete args.headers['x-gtcx-tenant-id'];
    args.validateToken = () => ({ ok: true, tenantId: 'zw' });
    const r = await processQuery(args);
    assert.strictEqual(r.status, 200);
  });
});

describe('processQuery — tenant validation', () => {
  it('returns 400 when X-GTCX-Tenant-Id missing + no token tenant', async () => {
    const args = defaults();
    delete args.headers['x-gtcx-tenant-id'];
    const r = await processQuery(args);
    assert.strictEqual(r.status, 400);
    assert.strictEqual(r.body.error, 'tenant-required');
  });

  it('returns 400 when tenant id is not ISO-2 lowercase', async () => {
    for (const bad of ['ZW', 'zwe', 'z', 'us1', 'AB']) {
      const args = defaults();
      args.headers['x-gtcx-tenant-id'] = bad;
      const r = await processQuery(args);
      assert.strictEqual(r.status, 400, `should reject ${bad}`);
      assert.strictEqual(r.body.error, 'tenant-malformed');
    }
  });
});

describe('processQuery — body validation', () => {
  it('returns 400 on invalid JSON', async () => {
    const r = await processQuery({ ...defaults(), body: '{not-json' });
    assert.strictEqual(r.status, 400);
    assert.strictEqual(r.body.error, 'invalid-json');
  });

  it('returns 400 on Zod validation failure', async () => {
    const r = await processQuery({
      ...defaults(),
      body: JSON.stringify({ outcome: 'invalid-outcome' }),
    });
    assert.strictEqual(r.status, 400);
    assert.strictEqual(r.body.error, 'query-malformed');
  });

  it('returns 400 on limit out of range', async () => {
    const r = await processQuery({
      ...defaults(),
      body: JSON.stringify({ limit: 9999 }),
    });
    assert.strictEqual(r.status, 400);
  });
});

describe('processQuery — tenant isolation', () => {
  it('only returns events for the request tenant', async () => {
    const store = freshStore({
      zw: [event({ id: 'zw1' }), event({ id: 'zw2' })],
      gh: [event({ id: 'gh1' })],
    });
    const r = await processQuery({ ...defaults(), store });
    assert.strictEqual(r.body.events.length, 2);
    assert.ok(r.body.events.every((e) => e.id.startsWith('zw')));
  });
});

describe('processQuery — store failure', () => {
  it('returns 500 when the store throws', async () => {
    const store = {
      query: async () => {
        throw new Error('redis-down');
      },
    };
    const r = await processQuery({ ...defaults(), store });
    assert.strictEqual(r.status, 500);
    assert.strictEqual(r.body.error, 'store-failed');
  });
});
