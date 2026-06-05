import assert from 'node:assert';
import { describe, it } from 'node:test';

import { InMemoryQueryStore, applyFilter } from '../../03-platform/src/audit-query/store.mjs';

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

describe('applyFilter', () => {
  const events = [
    event({ id: 'e1', timestamp: '2026-05-20T12:00:00Z', agentId: 'capture.spoof@v1', outcome: 'continue', metadata: { actorDid: 'did:gtcx:tp_zw_001' } }),
    event({ id: 'e2', timestamp: '2026-05-21T12:00:00Z', agentId: 'capture.geo-coherence@v1', outcome: 'escalate', metadata: { actorDid: 'did:gtcx:tp_zw_001' } }),
    event({ id: 'e3', timestamp: '2026-05-22T12:00:00Z', agentId: 'capture.spoof@v1', outcome: 'complete', metadata: { actorDid: 'did:gtcx:tp_gh_004' } }),
  ];

  it('returns all when no filter', () => {
    assert.strictEqual(applyFilter(events, {}).length, 3);
  });

  it('filters by agentId', () => {
    const r = applyFilter(events, { agentId: 'capture.spoof@v1' });
    assert.strictEqual(r.length, 2);
    assert.ok(r.every((e) => e.agentId === 'capture.spoof@v1'));
  });

  it('filters by actorDid (via metadata)', () => {
    const r = applyFilter(events, { actorDid: 'did:gtcx:tp_gh_004' });
    assert.strictEqual(r.length, 1);
    assert.strictEqual(r[0].id, 'e3');
  });

  it('filters by outcome', () => {
    const r = applyFilter(events, { outcome: 'escalate' });
    assert.strictEqual(r.length, 1);
    assert.strictEqual(r[0].id, 'e2');
  });

  it('filters by from (inclusive)', () => {
    const r = applyFilter(events, { from: '2026-05-21T00:00:00Z' });
    assert.strictEqual(r.length, 2);
  });

  it('filters by to (inclusive)', () => {
    const r = applyFilter(events, { to: '2026-05-21T23:59:59Z' });
    assert.strictEqual(r.length, 2);
  });

  it('combines multiple filters with AND', () => {
    const r = applyFilter(events, { agentId: 'capture.spoof@v1', outcome: 'complete' });
    assert.strictEqual(r.length, 1);
    assert.strictEqual(r[0].id, 'e3');
  });

  it('sorts result newest-first', () => {
    const r = applyFilter(events, {});
    assert.deepStrictEqual(
      r.map((e) => e.id),
      ['e3', 'e2', 'e1'],
    );
  });
});

describe('InMemoryQueryStore', () => {
  it('isolates events by tenant', async () => {
    const store = new InMemoryQueryStore();
    store.seed('zw', [event({ id: 'z1' }), event({ id: 'z2' })]);
    store.seed('gh', [event({ id: 'g1' })]);

    const zw = await store.query({ tenantId: 'zw' });
    const gh = await store.query({ tenantId: 'gh' });
    assert.strictEqual(zw.events.length, 2);
    assert.strictEqual(gh.events.length, 1);
    assert.strictEqual(zw.events.find((e) => e.id === 'g1'), undefined);
  });

  it('requires a tenantId on every query', async () => {
    const store = new InMemoryQueryStore();
    await assert.rejects(store.query({}), TypeError);
    await assert.rejects(store.query({ tenantId: '' }), TypeError);
  });

  it('returns hasMore=true when more results exist than limit', async () => {
    const store = new InMemoryQueryStore();
    const events = Array.from({ length: 5 }, (_, i) => event({ id: `e${i}`, timestamp: `2026-05-${20 + i}T00:00:00Z` }));
    store.seed('zw', events);
    const r = await store.query({ tenantId: 'zw', limit: 3 });
    assert.strictEqual(r.events.length, 3, 'returns limit items');
    assert.strictEqual(r.hasMore, true, 'flags more available');
  });

  it('returns hasMore=false when fewer results exist than limit', async () => {
    const store = new InMemoryQueryStore();
    store.seed('zw', [event({ id: 'e1' }), event({ id: 'e2' })]);
    const r = await store.query({ tenantId: 'zw', limit: 10 });
    assert.strictEqual(r.events.length, 2);
    assert.strictEqual(r.hasMore, false);
  });

  it('returns hasMore=false when exactly at limit', async () => {
    const store = new InMemoryQueryStore();
    store.seed('zw', [event({ id: 'e1' }), event({ id: 'e2' }), event({ id: 'e3' })]);
    const r = await store.query({ tenantId: 'zw', limit: 3 });
    assert.strictEqual(r.events.length, 3);
    assert.strictEqual(r.hasMore, false, 'limit met exactly does not imply more');
  });

  it('defaults limit to 100', async () => {
    const store = new InMemoryQueryStore();
    const events = Array.from({ length: 50 }, (_, i) => event({ id: `e${i}` }));
    store.seed('zw', events);
    const r = await store.query({ tenantId: 'zw' });
    assert.strictEqual(r.events.length, 50);
    assert.strictEqual(r.hasMore, false);
  });

  it('sizeOf returns tenant event count', () => {
    const store = new InMemoryQueryStore();
    store.seed('zw', [event({}), event({})]);
    assert.strictEqual(store.sizeOf('zw'), 2);
    assert.strictEqual(store.sizeOf('unknown'), 0);
  });
});
