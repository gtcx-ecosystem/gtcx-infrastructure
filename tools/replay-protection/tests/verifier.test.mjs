/**
 * @fileoverview Replay Verifier Tests
 *
 * Uses Node.js built-in test runner (no external test framework required).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import { MemoryNonceStore } from '../src/store/memory-nonce-store.mjs';
import { ReplayVerifier } from '../src/verifier.mjs';
import { ReplayMetrics } from '../src/metrics/replay-metrics.mjs';
import { AuditCapture, consoleSink } from '../src/audit/audit-capture.mjs';
import { computeBodyHash, computeHeadersHash, computeEnvelopeHash } from '../src/crypto/hash.mjs';

/** @returns {import('../src/types.mjs').QueueIntegrity} */
function makeIntegrity(overrides = {}, requestData = null) {
  const now = new Date().toISOString();
  const body = requestData?.body ?? '{"test":true}';
  const headers = requestData?.headers ?? { 'content-type': 'application/json' };
  const method = requestData?.method ?? 'POST';
  const url = requestData?.url ?? 'http://localhost/v1/test';
  const nonce = overrides.nonce ?? `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
  const timestamp = overrides.timestamp ?? now;

  const bodyHash = computeBodyHash(body);
  const headersHash = computeHeadersHash(headers);
  const envelopeHash = computeEnvelopeHash({
    method,
    url,
    bodyHash,
    headersHash,
    timestamp,
    nonce,
    did: 'did:gtcx:device:abc123',
    keyId: 'key-1',
    audience: 'gtcx-api',
  });

  return {
    scheme: 'did-jwt-es256',
    did: 'did:gtcx:device:abc123',
    keyId: 'key-1',
    audience: 'gtcx-api',
    bodyHash,
    headersHash,
    timestamp,
    nonce,
    signature: 'c2lnbmF0dXJlLXRlc3Q=',
    envelopeHash,
    ...overrides,
  };
}

function makeRequestData(overrides = {}) {
  return {
    body: '{"test":true}',
    headers: { 'content-type': 'application/json' },
    method: 'POST',
    url: 'http://localhost/v1/test',
    ...overrides,
  };
}

describe('ReplayVerifier', () => {
  describe('nonce uniqueness', () => {
    it('accepts a fresh nonce', async () => {
      const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore(), skipHashVerification: true });
      const req = makeRequestData();
      const result = await verifier.verify(makeIntegrity({}, req), req);
      assert.strictEqual(result.allowed, true);
      assert.strictEqual(result.code, 'REPLAY_OK');
    });

    it('rejects a duplicate nonce', async () => {
      const store = new MemoryNonceStore();
      const verifier = new ReplayVerifier({ nonceStore: store, skipHashVerification: true });
      const req = makeRequestData();
      const integrity = makeIntegrity({}, req);

      const first = await verifier.verify(integrity, req);
      assert.strictEqual(first.allowed, true);

      const second = await verifier.verify(integrity, req);
      assert.strictEqual(second.allowed, false);
      assert.strictEqual(second.code, 'REPLAY_NONCE');
    });

    it('increments rejected_nonce_total metric on duplicate', async () => {
      const metrics = new ReplayMetrics();
      const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore(), metrics, skipHashVerification: true });
      const req = makeRequestData();
      const integrity = makeIntegrity({}, req);
      await verifier.verify(integrity, req);
      await verifier.verify(integrity, req);

      const snap = metrics.snapshot();
      assert.strictEqual(snap.rejectedNonceTotal, 1);
      assert.strictEqual(snap.acceptedTotal, 1);
    });
  });

  describe('timestamp window', () => {
    it('rejects stale timestamps', async () => {
      const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore(), skipHashVerification: true });
      const req = makeRequestData();
      const oldTs = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const integrity = makeIntegrity({ timestamp: oldTs }, req);
      const result = await verifier.verify(integrity, req);
      assert.strictEqual(result.allowed, false);
      assert.strictEqual(result.code, 'REPLAY_STALE');
    });

    it('rejects future timestamps', async () => {
      const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore(), skipHashVerification: true });
      const req = makeRequestData();
      const futureTs = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const integrity = makeIntegrity({ timestamp: futureTs }, req);
      const result = await verifier.verify(integrity, req);
      assert.strictEqual(result.allowed, false);
      assert.strictEqual(result.code, 'REPLAY_FUTURE');
    });

    it('accepts timestamps inside the window', async () => {
      const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore(), skipHashVerification: true });
      const req = makeRequestData();
      const ts = new Date(Date.now() - 30 * 1000).toISOString();
      const integrity = makeIntegrity({ timestamp: ts }, req);
      const result = await verifier.verify(integrity, req);
      assert.strictEqual(result.allowed, true);
    });

    it('increments rejected_stale_total metric', async () => {
      const metrics = new ReplayMetrics();
      const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore(), metrics, skipHashVerification: true });
      const req = makeRequestData();
      const oldTs = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const integrity = makeIntegrity({ timestamp: oldTs }, req);
      await verifier.verify(integrity, req);
      assert.strictEqual(metrics.snapshot().rejectedStaleTotal, 1);
    });
  });

  describe('clock-skew policy (low-connectivity regions)', () => {
    it('extends window for global-south region', async () => {
      const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore(), skipHashVerification: true });
      const req = makeRequestData();
      const oldTs = new Date(Date.now() - 8 * 60 * 1000).toISOString();
      const integrity = makeIntegrity({ timestamp: oldTs }, req);
      const result = await verifier.verify(integrity, req, { region: 'global-south' });
      assert.strictEqual(result.allowed, true);
    });

    it('still rejects beyond extended window', async () => {
      const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore(), skipHashVerification: true });
      const req = makeRequestData();
      const oldTs = new Date(Date.now() - 20 * 60 * 1000).toISOString();
      const integrity = makeIntegrity({ timestamp: oldTs }, req);
      const result = await verifier.verify(integrity, req, { region: 'global-south' });
      assert.strictEqual(result.allowed, false);
      assert.strictEqual(result.code, 'REPLAY_STALE');
    });
  });

  describe('hash verification', () => {
    it('accepts when all hashes match', async () => {
      const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore() });
      const req = makeRequestData();
      const integrity = makeIntegrity({}, req);
      const result = await verifier.verify(integrity, req);
      assert.strictEqual(result.allowed, true);
      assert.strictEqual(result.code, 'REPLAY_OK');
    });

    it('rejects bodyHash mismatch', async () => {
      const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore() });
      const req = makeRequestData();
      const integrity = makeIntegrity({ bodyHash: 'a'.repeat(64) }, req);
      const result = await verifier.verify(integrity, req);
      assert.strictEqual(result.allowed, false);
      assert.strictEqual(result.code, 'REPLAY_ENVELOPE');
      assert.ok(result.reason?.includes('bodyHash'));
    });

    it('rejects headersHash mismatch', async () => {
      const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore() });
      const req = makeRequestData();
      const integrity = makeIntegrity({ headersHash: 'b'.repeat(64) }, req);
      const result = await verifier.verify(integrity, req);
      assert.strictEqual(result.allowed, false);
      assert.strictEqual(result.code, 'REPLAY_ENVELOPE');
      assert.ok(result.reason?.includes('headersHash'));
    });

    it('rejects envelopeHash mismatch', async () => {
      const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore() });
      const req = makeRequestData();
      const integrity = makeIntegrity({ envelopeHash: 'c'.repeat(64) }, req);
      const result = await verifier.verify(integrity, req);
      assert.strictEqual(result.allowed, false);
      assert.strictEqual(result.code, 'REPLAY_ENVELOPE');
      assert.ok(result.reason?.includes('envelopeHash'));
    });

    it('increments rejected_envelope_total metric on hash mismatch', async () => {
      const metrics = new ReplayMetrics();
      const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore(), metrics });
      const req = makeRequestData();
      const integrity = makeIntegrity({ bodyHash: 'a'.repeat(64) }, req);
      await verifier.verify(integrity, req);
      assert.strictEqual(metrics.snapshot().rejectedEnvelopeTotal, 1);
    });

    it('does not revoke nonce on envelope failure — fail-safe semantics', async () => {
      const store = new MemoryNonceStore();
      const verifier = new ReplayVerifier({ nonceStore: store });
      const req = makeRequestData();
      const integrity = makeIntegrity({ bodyHash: 'a'.repeat(64) }, req);

      // First attempt fails with bad bodyHash
      const first = await verifier.verify(integrity, req);
      assert.strictEqual(first.allowed, false);
      assert.strictEqual(first.code, 'REPLAY_ENVELOPE');

      // Retry with corrected bodyHash but SAME nonce is still rejected
      const correctedIntegrity = makeIntegrity({ nonce: integrity.nonce }, req);
      const second = await verifier.verify(correctedIntegrity, req);
      assert.strictEqual(second.allowed, false);
      assert.strictEqual(second.code, 'REPLAY_NONCE');

      // Retry with a FRESH nonce and corrected bodyHash succeeds
      const freshIntegrity = makeIntegrity({}, req);
      const third = await verifier.verify(freshIntegrity, req);
      assert.strictEqual(third.allowed, true);
    });
  });

  describe('signature verification', () => {
    it('rejects bad signatures when verifySignature is configured', async () => {
      const verifier = new ReplayVerifier({
        nonceStore: new MemoryNonceStore(),
        skipHashVerification: true,
        verifySignature: async () => false,
      });
      const req = makeRequestData();
      const result = await verifier.verify(makeIntegrity({}, req), req);
      assert.strictEqual(result.allowed, false);
      assert.strictEqual(result.code, 'REPLAY_SIGNATURE');
    });

    it('accepts good signatures when verifySignature is configured', async () => {
      const verifier = new ReplayVerifier({
        nonceStore: new MemoryNonceStore(),
        skipHashVerification: true,
        verifySignature: async () => true,
      });
      const req = makeRequestData();
      const result = await verifier.verify(makeIntegrity({}, req), req);
      assert.strictEqual(result.allowed, true);
    });
  });

  describe('audit capture', () => {
    it('emits audit event for accepted request', async () => {
      const events = [];
      const audit = new AuditCapture({
        sinks: [(evt) => events.push(evt)],
      });
      const verifier = new ReplayVerifier({
        nonceStore: new MemoryNonceStore(),
        auditCapture: audit,
        skipHashVerification: true,
      });
      const req = makeRequestData();
      const result = await verifier.verify(makeIntegrity({}, req), req, { region: 'us-east', requestId: 'req-1' });
      assert.strictEqual(result.allowed, true);
      assert.strictEqual(events.length, 1);
      assert.strictEqual(events[0].eventType, 'replay.accepted');
      assert.strictEqual(events[0].region, 'us-east');
      assert.strictEqual(events[0].requestId, 'req-1');
      assert.ok(events[0].eventId);
      assert.ok(events[0].timestampMs > 0);
    });

    it('emits audit event for rejected request', async () => {
      const events = [];
      const audit = new AuditCapture({ sinks: [(evt) => events.push(evt)] });
      const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore(), auditCapture: audit, skipHashVerification: true });
      const req = makeRequestData();
      const oldTs = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const integrity = makeIntegrity({ timestamp: oldTs }, req);
      const result = await verifier.verify(integrity, req, { deviceId: 'dev-1' });
      assert.strictEqual(result.allowed, false);
      assert.strictEqual(events.length, 1);
      assert.strictEqual(events[0].eventType, 'replay.rejected');
      assert.strictEqual(events[0].deviceId, 'dev-1');
      assert.ok(events[0].clockSkewMs > 0);
    });
  });

  describe('metrics snapshot', () => {
    it('returns all counters', async () => {
      const metrics = new ReplayMetrics();
      const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore(), metrics, skipHashVerification: true });
      const req = makeRequestData();
      await verifier.verify(makeIntegrity({}, req), req);
      await verifier.verify(makeIntegrity({ timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString() }, req), req);
      await verifier.verify(makeIntegrity({ timestamp: new Date(Date.now() + 10 * 60 * 1000).toISOString() }, req), req);

      const snap = verifier.metricsSnapshot();
      assert.strictEqual(snap.acceptedTotal, 1);
      assert.strictEqual(snap.rejectedStaleTotal, 1);
      assert.strictEqual(snap.rejectedFutureTotal, 1);
    });

    it('exports prometheus format', async () => {
      const metrics = new ReplayMetrics();
      const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore(), metrics, skipHashVerification: true });
      const req = makeRequestData();
      await verifier.verify(makeIntegrity({}, req), req);
      const prom = verifier.metricsPrometheus();
      assert.ok(prom.includes('replay_protection_total{code="REPLAY_OK"} 1'));
      assert.ok(prom.includes('# TYPE replay_protection_total counter'));
    });
  });

  describe('malformed input', () => {
    it('rejects malformed timestamp', async () => {
      const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore(), skipHashVerification: true });
      const req = makeRequestData();
      const result = await verifier.verify(makeIntegrity({ timestamp: 'not-a-date' }, req), req);
      assert.strictEqual(result.allowed, false);
      assert.strictEqual(result.code, 'REPLAY_STALE');
    });
  });
});

describe('MemoryNonceStore', () => {
  it('evicts expired entries', async () => {
    const store = new MemoryNonceStore();
    await store.checkAndSet('nonce-1', 10);
    assert.strictEqual(await store.has('nonce-1'), true);

    await new Promise((r) => setTimeout(r, 20));
    assert.strictEqual(await store.has('nonce-1'), false);
  });

  it('enforces maxSize by dropping oldest', async () => {
    const store = new MemoryNonceStore({ maxSize: 5 });
    for (let i = 0; i < 7; i++) {
      await store.checkAndSet(`nonce-${i}`, 60_000);
    }
    assert.ok(store.size <= 5);
  });
});
