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

describe('processQuery — audit-of-the-query', () => {
  it('signs audit-query.served on 200 with filter + counts', async () => {
    const signed = [];
    const r = await processQuery({
      ...defaults(),
      body: JSON.stringify({ outcome: 'continue', limit: 50 }),
      signAuditEvent: (evt) => signed.push(evt),
    });
    assert.strictEqual(r.status, 200);
    assert.strictEqual(signed.length, 1);
    assert.strictEqual(signed[0].action, 'audit-query.served');
    assert.strictEqual(signed[0].target, '/audit/query#tenant=zw');
    assert.strictEqual(signed[0].payload.tenantId, 'zw');
    assert.strictEqual(signed[0].payload.filter.outcome, 'continue');
    assert.strictEqual(signed[0].payload.filter.limit, 50);
    assert.strictEqual(signed[0].payload.eventsReturned, 1);
    assert.strictEqual(signed[0].payload.truncated, false);
  });

  it('uses tokenSubject as actor when validator provides one', async () => {
    const signed = [];
    const r = await processQuery({
      ...defaults(),
      validateToken: () => ({ ok: true, subject: 'gtcx-platforms-agx' }),
      signAuditEvent: (evt) => signed.push(evt),
    });
    assert.strictEqual(r.status, 200);
    assert.strictEqual(signed[0].actor, 'gtcx-platforms-agx');
  });

  it('falls back to bearer-anon when no token subject', async () => {
    const signed = [];
    const r = await processQuery({
      ...defaults(),
      signAuditEvent: (evt) => signed.push(evt),
    });
    assert.strictEqual(r.status, 200);
    assert.strictEqual(signed[0].actor, 'bearer-anon');
  });

  it('does NOT sign on 4xx (auth fail, bad tenant, malformed body)', async () => {
    const signed = [];
    // auth fail
    const args1 = defaults();
    delete args1.headers.authorization;
    args1.signAuditEvent = (e) => signed.push(e);
    await processQuery(args1);
    // bad tenant
    const args2 = defaults();
    delete args2.headers['x-gtcx-tenant-id'];
    args2.signAuditEvent = (e) => signed.push(e);
    await processQuery(args2);
    // malformed body
    const args3 = defaults();
    args3.body = '{not-json';
    args3.signAuditEvent = (e) => signed.push(e);
    await processQuery(args3);
    assert.strictEqual(signed.length, 0, 'no signing on any 4xx path');
  });

  it('does NOT sign on 500 (store failure)', async () => {
    const signed = [];
    const store = { query: async () => { throw new Error('store-down'); } };
    const r = await processQuery({
      ...defaults(),
      store,
      signAuditEvent: (e) => signed.push(e),
    });
    assert.strictEqual(r.status, 500);
    assert.strictEqual(signed.length, 0);
  });

  it('does NOT throw if signAuditEvent itself throws', async () => {
    const r = await processQuery({
      ...defaults(),
      signAuditEvent: () => { throw new Error('sink unavailable'); },
    });
    assert.strictEqual(r.status, 200, 'response is unaffected by audit-signing failure');
    assert.strictEqual(r.body.events.length, 1);
  });

  it('tolerates absent signAuditEvent without error', async () => {
    const r = await processQuery(defaults());
    assert.strictEqual(r.status, 200);
  });
});

describe('processQuery — metrics emission', () => {
  function mkCounter() {
    const calls = [];
    return {
      calls,
      fn: (metric, labels, value) => calls.push({ metric, labels, value }),
    };
  }

  it('emits requests_total{status=200, tenantId} + events_served on success', async () => {
    const c = mkCounter();
    await processQuery({ ...defaults(), incrementCounter: c.fn });
    const req = c.calls.find((x) => x.metric === 'compliance_gateway_audit_query_requests_total');
    assert.ok(req, 'requests_total emitted');
    assert.deepStrictEqual(req.labels, { status: '200', tenantId: 'zw' });
    const events = c.calls.find((x) => x.metric === 'compliance_gateway_audit_query_events_served_total');
    assert.ok(events, 'events_served emitted');
    assert.strictEqual(events.value, 1);
  });

  it('emits truncated_total when hasMore', async () => {
    const c = mkCounter();
    const events = Array.from({ length: 5 }, (_, i) =>
      event({ id: `e${i}`, timestamp: `2026-05-${20 + i}T00:00:00Z` }),
    );
    await processQuery({
      ...defaults(),
      body: JSON.stringify({ limit: 3 }),
      store: freshStore({ zw: events }),
      incrementCounter: c.fn,
    });
    const trunc = c.calls.find((x) => x.metric === 'compliance_gateway_audit_query_truncated_total');
    assert.ok(trunc, 'truncated emitted');
    assert.deepStrictEqual(trunc.labels, { tenantId: 'zw' });
  });

  it('emits status=401 on missing bearer with tenantId=unknown', async () => {
    const c = mkCounter();
    const args = defaults();
    delete args.headers.authorization;
    args.incrementCounter = c.fn;
    await processQuery(args);
    const req = c.calls.find((x) => x.metric === 'compliance_gateway_audit_query_requests_total');
    assert.deepStrictEqual(req.labels, { status: '401', tenantId: 'unknown' });
  });

  it('emits status=400 on bad tenant with tenantId=unknown', async () => {
    const c = mkCounter();
    const args = defaults();
    delete args.headers['x-gtcx-tenant-id'];
    args.incrementCounter = c.fn;
    await processQuery(args);
    const req = c.calls.find((x) => x.metric === 'compliance_gateway_audit_query_requests_total');
    assert.deepStrictEqual(req.labels, { status: '400', tenantId: 'unknown' });
  });

  it('emits status=500 with real tenantId on store failure', async () => {
    const c = mkCounter();
    const store = { query: async () => { throw new Error('boom'); } };
    await processQuery({ ...defaults(), store, incrementCounter: c.fn });
    const req = c.calls.find((x) => x.metric === 'compliance_gateway_audit_query_requests_total');
    assert.deepStrictEqual(req.labels, { status: '500', tenantId: 'zw' });
  });

  it('tolerates absent incrementCounter (default no-op)', async () => {
    const r = await processQuery(defaults());
    assert.strictEqual(r.status, 200, 'no metrics counter is fine');
  });
});
