import assert from 'node:assert';
import { describe, it } from 'node:test';

import { AuditBundleRequestSchema, AgentOutputEventSchema } from '../../03-platform/src/audit-bundles/schemas.mjs';

function makeEvent(overrides = {}) {
  return {
    id: 'evt-1',
    timestamp: '2026-05-24T12:00:00Z',
    workflowId: 'wf-1',
    iterationNumber: 0,
    agentId: 'capture.spoof@v1',
    promptVersionId: 'capture.spoof@v1@2026-05-19',
    inputHash: 'h:in-1',
    outputHash: 'h:out-1',
    qualityScore: 87,
    tokensUsed: 0,
    costUsd: 0,
    durationMs: 0,
    outcome: 'continue',
    schemaValid: null,
    previousHash: null,
    eventHash: 'h:evt-1',
    synced: false,
    ...overrides,
  };
}

describe('AuditBundleRequestSchema', () => {
  it('accepts a minimal bundle', () => {
    const parsed = AuditBundleRequestSchema.parse({
      bundleId: 'bundle-1',
      events: [makeEvent()],
    });
    assert.strictEqual(parsed.bundleId, 'bundle-1');
    assert.strictEqual(parsed.events.length, 1);
  });

  it('rejects empty events array', () => {
    assert.throws(() => AuditBundleRequestSchema.parse({ bundleId: 'b', events: [] }));
  });

  it('rejects > 1000 events', () => {
    const events = Array.from({ length: 1001 }, (_, i) => makeEvent({ id: `e${i}`, eventHash: `h${i}` }));
    assert.throws(() => AuditBundleRequestSchema.parse({ bundleId: 'b', events }));
  });

  it('rejects bundleId > 128 chars', () => {
    assert.throws(() => AuditBundleRequestSchema.parse({
      bundleId: 'a'.repeat(129),
      events: [makeEvent()],
    }));
  });

  it('rejects missing bundleId', () => {
    assert.throws(() => AuditBundleRequestSchema.parse({ events: [makeEvent()] }));
  });
});

describe('AgentOutputEventSchema', () => {
  it('accepts the four outcome enum values', () => {
    for (const outcome of ['continue', 'complete', 'escalate', 'failure']) {
      AgentOutputEventSchema.parse(makeEvent({ outcome }));
    }
  });

  it('rejects unknown outcome', () => {
    assert.throws(() => AgentOutputEventSchema.parse(makeEvent({ outcome: 'approved' })));
  });

  it('accepts null qualityScore + null previousHash + null schemaValid', () => {
    const parsed = AgentOutputEventSchema.parse(makeEvent({
      qualityScore: null,
      previousHash: null,
      schemaValid: null,
    }));
    assert.strictEqual(parsed.qualityScore, null);
  });

  it('rejects negative iterationNumber', () => {
    assert.throws(() => AgentOutputEventSchema.parse(makeEvent({ iterationNumber: -1 })));
  });

  it('rejects negative costUsd', () => {
    assert.throws(() => AgentOutputEventSchema.parse(makeEvent({ costUsd: -0.01 })));
  });

  it('accepts optional metadata record', () => {
    const parsed = AgentOutputEventSchema.parse(makeEvent({ metadata: { actorDid: 'did:gtcx:tp_zw_001' } }));
    assert.strictEqual(parsed.metadata.actorDid, 'did:gtcx:tp_zw_001');
  });
});
