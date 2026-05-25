import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { mkdirSync, writeFileSync, rmSync, utimesSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { NdjsonQueryStore } from '../../src/audit-query/ndjson-store.mjs';

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

function writeNdjson(fp, events) {
  writeFileSync(fp, events.map((e) => JSON.stringify(e)).join('\n') + '\n');
}

let scratchRoot;

before(() => {
  scratchRoot = join(tmpdir(), `gtcx-ndjson-test-${Date.now()}-${process.pid}`);
  mkdirSync(scratchRoot, { recursive: true });
  mkdirSync(join(scratchRoot, 'zw'));
  mkdirSync(join(scratchRoot, 'gh'));
  writeNdjson(join(scratchRoot, 'zw', 'batch-001.ndjson'), [
    event({ id: 'zw1', timestamp: '2026-05-20T00:00:00Z', outcome: 'continue' }),
    event({ id: 'zw2', timestamp: '2026-05-21T00:00:00Z', outcome: 'escalate' }),
  ]);
  writeNdjson(join(scratchRoot, 'zw', 'batch-002.ndjson'), [
    event({ id: 'zw3', timestamp: '2026-05-22T00:00:00Z', outcome: 'complete' }),
  ]);
  writeNdjson(join(scratchRoot, 'gh', 'batch-001.ndjson'), [
    event({ id: 'gh1', timestamp: '2026-05-20T00:00:00Z' }),
  ]);
});

after(() => {
  if (scratchRoot) rmSync(scratchRoot, { recursive: true, force: true });
});

describe('NdjsonQueryStore — construction', () => {
  it('requires rootDir', () => {
    assert.throws(() => new NdjsonQueryStore({}), TypeError);
  });

  it('throws strict on missing rootDir', () => {
    assert.throws(
      () => new NdjsonQueryStore({ rootDir: '/nope/does/not/exist' }),
      /rootDir does not exist/,
    );
  });

  it('lazy mode tolerates missing rootDir', () => {
    const store = new NdjsonQueryStore({
      rootDir: '/nope/does/not/exist',
      fileExistenceMode: 'lazy',
    });
    assert.ok(store);
  });
});

describe('NdjsonQueryStore — reads', () => {
  it('reads all events across multiple files for a tenant', async () => {
    const store = new NdjsonQueryStore({ rootDir: scratchRoot });
    const r = await store.query({ tenantId: 'zw' });
    assert.strictEqual(r.events.length, 3);
    assert.deepStrictEqual(
      r.events.map((e) => e.id).sort(),
      ['zw1', 'zw2', 'zw3'],
    );
  });

  it('returns empty for an unknown tenant', async () => {
    const store = new NdjsonQueryStore({ rootDir: scratchRoot });
    const r = await store.query({ tenantId: 'na' });
    assert.deepStrictEqual(r.events, []);
    assert.strictEqual(r.hasMore, false);
  });

  it('requires tenantId on query', async () => {
    const store = new NdjsonQueryStore({ rootDir: scratchRoot });
    await assert.rejects(store.query({}), TypeError);
  });
});

describe('NdjsonQueryStore — filters + limits', () => {
  it('applies outcome filter', async () => {
    const store = new NdjsonQueryStore({ rootDir: scratchRoot });
    const r = await store.query({ tenantId: 'zw', outcome: 'escalate' });
    assert.strictEqual(r.events.length, 1);
    assert.strictEqual(r.events[0].id, 'zw2');
  });

  it('hasMore=true when results exceed limit', async () => {
    const store = new NdjsonQueryStore({ rootDir: scratchRoot });
    const r = await store.query({ tenantId: 'zw', limit: 2 });
    assert.strictEqual(r.events.length, 2);
    assert.strictEqual(r.hasMore, true);
  });

  it('hasMore=false when at-or-under limit', async () => {
    const store = new NdjsonQueryStore({ rootDir: scratchRoot });
    const r = await store.query({ tenantId: 'zw', limit: 3 });
    assert.strictEqual(r.events.length, 3);
    assert.strictEqual(r.hasMore, false);
  });
});

describe('NdjsonQueryStore — tenant isolation', () => {
  it('never leaks zw events into a gh query', async () => {
    const store = new NdjsonQueryStore({ rootDir: scratchRoot });
    const r = await store.query({ tenantId: 'gh' });
    assert.strictEqual(r.events.length, 1);
    assert.strictEqual(r.events[0].id, 'gh1');
    assert.ok(!r.events.some((e) => e.id.startsWith('zw')));
  });
});

describe('NdjsonQueryStore — malformed lines', () => {
  let store;
  let parseErrors;
  let tenantDir;

  before(() => {
    tenantDir = join(scratchRoot, 'parse-err');
    mkdirSync(tenantDir);
    writeFileSync(
      join(tenantDir, 'mixed.ndjson'),
      [
        JSON.stringify(event({ id: 'good1' })),
        'not-json-at-all',
        JSON.stringify(event({ id: 'good2' })),
        '{partial: "json',
        '',
        JSON.stringify(event({ id: 'good3' })),
      ].join('\n') + '\n',
    );
    parseErrors = [];
    store = new NdjsonQueryStore({
      rootDir: scratchRoot,
      onParseError: (line, fp, lineNo) => parseErrors.push({ line, fp, lineNo }),
    });
  });

  it('skips malformed lines and returns valid events', async () => {
    const r = await store.query({ tenantId: 'parse-err' });
    assert.strictEqual(r.events.length, 3);
    assert.deepStrictEqual(
      r.events.map((e) => e.id).sort(),
      ['good1', 'good2', 'good3'],
    );
  });

  it('reports each malformed line via onParseError', async () => {
    // Already queried above; parse-errors recorded
    assert.strictEqual(parseErrors.length, 2);
    assert.strictEqual(parseErrors[0].line, 'not-json-at-all');
    assert.strictEqual(parseErrors[0].lineNo, 2);
    assert.strictEqual(parseErrors[1].line, '{partial: "json');
    assert.strictEqual(parseErrors[1].lineNo, 4);
  });
});

describe('NdjsonQueryStore — caching', () => {
  it('re-parses when file mtime changes', async () => {
    const tenantDir = join(scratchRoot, 'cache-test');
    mkdirSync(tenantDir);
    const fp = join(tenantDir, 'batch.ndjson');
    writeNdjson(fp, [event({ id: 'v1' })]);
    const store = new NdjsonQueryStore({ rootDir: scratchRoot });
    let r = await store.query({ tenantId: 'cache-test' });
    assert.strictEqual(r.events[0].id, 'v1');
    // Overwrite + bump mtime explicitly so the cache invalidates
    writeNdjson(fp, [event({ id: 'v2' })]);
    const future = new Date(Date.now() + 2000);
    utimesSync(fp, future, future);
    r = await store.query({ tenantId: 'cache-test' });
    assert.strictEqual(r.events[0].id, 'v2');
  });

  it('invalidate() forces re-parse on next read', async () => {
    const tenantDir = join(scratchRoot, 'invalidate-test');
    mkdirSync(tenantDir);
    const fp = join(tenantDir, 'batch.ndjson');
    writeNdjson(fp, [event({ id: 'orig' })]);
    const store = new NdjsonQueryStore({ rootDir: scratchRoot });
    await store.query({ tenantId: 'invalidate-test' });
    // Overwrite without bumping mtime; cache would still hit
    writeNdjson(fp, [event({ id: 'updated' })]);
    // Restore the mtime so the cache definitely doesn't auto-invalidate
    const past = new Date(Date.now() - 60_000);
    utimesSync(fp, past, past);
    store.invalidate();
    const r = await store.query({ tenantId: 'invalidate-test' });
    assert.strictEqual(r.events[0].id, 'updated');
  });
});
