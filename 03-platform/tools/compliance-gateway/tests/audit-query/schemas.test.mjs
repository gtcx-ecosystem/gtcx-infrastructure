import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  QueryAuditRequestSchema,
  QueryAuditResponseSchema,
} from '../../03-platform/src/audit-query/schemas.mjs';

describe('QueryAuditRequestSchema', () => {
  it('accepts an empty body (all filters optional)', () => {
    const parsed = QueryAuditRequestSchema.parse({});
    assert.deepStrictEqual(parsed, {});
  });

  it('accepts all filter fields populated', () => {
    const parsed = QueryAuditRequestSchema.parse({
      agentId: 'capture.spoof@v1',
      actorDid: 'did:gtcx:tp_zw_001',
      outcome: 'escalate',
      from: '2026-05-01T00:00:00Z',
      to: '2026-05-24T23:59:59Z',
      limit: 100,
    });
    assert.strictEqual(parsed.agentId, 'capture.spoof@v1');
    assert.strictEqual(parsed.outcome, 'escalate');
    assert.strictEqual(parsed.limit, 100);
  });

  it('rejects unknown outcome', () => {
    assert.throws(() => QueryAuditRequestSchema.parse({ outcome: 'approved' }));
  });

  it('rejects limit <= 0', () => {
    assert.throws(() => QueryAuditRequestSchema.parse({ limit: 0 }));
  });

  it('rejects limit > 1000', () => {
    assert.throws(() => QueryAuditRequestSchema.parse({ limit: 1001 }));
  });

  it('rejects non-ISO from/to', () => {
    assert.throws(() => QueryAuditRequestSchema.parse({ from: 'last Tuesday' }));
  });
});

describe('QueryAuditResponseSchema', () => {
  it('accepts a well-formed empty response', () => {
    const parsed = QueryAuditResponseSchema.parse({
      events: [],
      totalMatched: 0,
      truncated: false,
    });
    assert.strictEqual(parsed.events.length, 0);
    assert.strictEqual(parsed.truncated, false);
  });

  it('rejects negative totalMatched', () => {
    assert.throws(() =>
      QueryAuditResponseSchema.parse({ events: [], totalMatched: -1, truncated: false }),
    );
  });

  it('requires truncated boolean', () => {
    assert.throws(() =>
      QueryAuditResponseSchema.parse({ events: [], totalMatched: 0 }),
    );
  });
});
