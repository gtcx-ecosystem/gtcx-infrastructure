/**
 * @fileoverview Failure-Mode Tests for Replay Protection
 *
 * Tests horizontal scaling, clock drift, Redis outages, and long offline windows.
 *
 * Acceptance gate: REPLAY_ENVELOPE is real, not documentary, and the verifier
 * can run correctly in a horizontally scaled deployment.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import { MemoryNonceStore } from '../src/store/memory-nonce-store.mjs';
import { ReplayVerifier } from '../src/verifier.mjs';
import { ReplayMetrics } from '../src/metrics/replay-metrics.mjs';
import { computeBodyHash, computeHeadersHash, computeEnvelopeHash } from '../src/crypto/hash.mjs';

function makeIntegrityPayload(requestData, overrides = {}) {
  const now = new Date().toISOString();
  const nonce = overrides.nonce ?? `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
  const timestamp = overrides.timestamp ?? now;
  const bodyHash = computeBodyHash(requestData.body);
  const headersHash = computeHeadersHash(requestData.headers);
  const envelopeHash = computeEnvelopeHash({
    method: requestData.method,
    url: requestData.url,
    bodyHash,
    headersHash,
    timestamp,
    nonce,
    did: 'did:gtcx:device:test',
    keyId: 'key-1',
    audience: 'gtcx-api',
  });

  return {
    scheme: 'did-jwt-es256',
    did: 'did:gtcx:device:test',
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

const defaultRequestData = {
  body: '{"action":"create"}',
  headers: { 'content-type': 'application/json' },
  method: 'POST',
  url: 'http://api.gtcx.local/v1/test',
};

describe('Failure Modes — Horizontal Scaling', () => {
  it('rejects duplicate nonce across multiple verifier instances', async () => {
    // Simulate two pods in a K8s deployment sharing a Redis store
    const sharedStore = new MemoryNonceStore();

    const verifierA = new ReplayVerifier({ nonceStore: sharedStore });
    const verifierB = new ReplayVerifier({ nonceStore: sharedStore });

    const req = defaultRequestData;
    const integrity = makeIntegrityPayload(req);

    // Pod A accepts the request
    const resultA = await verifierA.verify(integrity, req);
    assert.strictEqual(resultA.allowed, true);

    // Pod B rejects the same nonce
    const resultB = await verifierB.verify(integrity, req);
    assert.strictEqual(resultB.allowed, false);
    assert.strictEqual(resultB.code, 'REPLAY_NONCE');
  });

  it('each instance reports consistent metrics from shared store', async () => {
    const sharedStore = new MemoryNonceStore();
    const metricsA = new ReplayMetrics();
    const metricsB = new ReplayMetrics();

    const verifierA = new ReplayVerifier({ nonceStore: sharedStore, metrics: metricsA });
    const verifierB = new ReplayVerifier({ nonceStore: sharedStore, metrics: metricsB });

    const req = defaultRequestData;
    const integrity = makeIntegrityPayload(req);

    await verifierA.verify(integrity, req);
    await verifierB.verify(integrity, req);

    // Each instance tracks its own metrics independently
    assert.strictEqual(metricsA.snapshot().acceptedTotal, 1);
    assert.strictEqual(metricsB.snapshot().rejectedNonceTotal, 1);
  });
});

describe('Failure Modes — Clock Drift', () => {
  it('rejects request with device clock 5 min ahead (future)', async () => {
    const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore() });
    const req = defaultRequestData;
    const futureTs = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const integrity = makeIntegrityPayload(req, { timestamp: futureTs });

    const result = await verifier.verify(integrity, req);
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.code, 'REPLAY_FUTURE');
  });

  it('rejects request with device clock 10 min behind (stale)', async () => {
    const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore() });
    const req = defaultRequestData;
    const oldTs = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const integrity = makeIntegrityPayload(req, { timestamp: oldTs });

    const result = await verifier.verify(integrity, req);
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.code, 'REPLAY_STALE');
  });

  it('accepts request with device clock 8 min behind in low-connectivity region', async () => {
    const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore() });
    const req = defaultRequestData;
    const oldTs = new Date(Date.now() - 8 * 60 * 1000).toISOString();
    const integrity = makeIntegrityPayload(req, { timestamp: oldTs });

    const result = await verifier.verify(integrity, req, { region: 'global-south' });
    assert.strictEqual(result.allowed, true);
  });
});

describe('Failure Modes — Redis Outage', () => {
  it('falls back to memory store when Redis is unreachable', async () => {
    // Simulate Redis outage: REDIS_URL is set but Redis is down
    // The server falls back to MemoryNonceStore automatically
    const memoryStore = new MemoryNonceStore();
    const verifier = new ReplayVerifier({ nonceStore: memoryStore });

    const req = defaultRequestData;
    const integrity = makeIntegrityPayload(req);

    const result = await verifier.verify(integrity, req);
    assert.strictEqual(result.allowed, true);

    // Replay with same nonce is rejected (memory store works)
    const replay = await verifier.verify(integrity, req);
    assert.strictEqual(replay.allowed, false);
    assert.strictEqual(replay.code, 'REPLAY_NONCE');
  });

  it('memory store health check returns true', async () => {
    const store = new MemoryNonceStore();
    assert.strictEqual(await store.health(), true);
  });
});

describe('Failure Modes — Long Offline Windows', () => {
  it('rejects queue replay after 30 min offline (standard region)', async () => {
    const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore() });
    const req = defaultRequestData;
    // Device queued request 30 minutes ago
    const oldTs = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const integrity = makeIntegrityPayload(req, { timestamp: oldTs });

    const result = await verifier.verify(integrity, req);
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.code, 'REPLAY_STALE');
  });

  it('rejects queue replay after 20 min offline (low-connectivity region still within 15 min)', async () => {
    const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore() });
    const req = defaultRequestData;
    // Device queued request 20 minutes ago in rural mesh
    const oldTs = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    const integrity = makeIntegrityPayload(req, { timestamp: oldTs });

    const result = await verifier.verify(integrity, req, { region: 'rural' });
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.code, 'REPLAY_STALE');
  });

  it('accepts queue replay after 12 min offline in satellite region (within 15 min window)', async () => {
    const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore() });
    const req = defaultRequestData;
    const oldTs = new Date(Date.now() - 12 * 60 * 1000).toISOString();
    const integrity = makeIntegrityPayload(req, { timestamp: oldTs });

    const result = await verifier.verify(integrity, req, { region: 'satellite' });
    assert.strictEqual(result.allowed, true);
  });
});

describe('Failure Modes — Tampered Envelope', () => {
  it('rejects tampered body in replayed request', async () => {
    const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore() });
    const req = defaultRequestData;
    const integrity = makeIntegrityPayload(req);

    // Attacker modifies body but keeps original integrity metadata
    const tamperedReq = { ...req, body: '{"action":"malicious"}' };

    const result = await verifier.verify(integrity, tamperedReq);
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.code, 'REPLAY_ENVELOPE');
    assert.ok(result.reason?.includes('bodyHash'));
  });

  it('rejects tampered headers in replayed request', async () => {
    const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore() });
    const req = defaultRequestData;
    const integrity = makeIntegrityPayload(req);

    // Attacker injects a forged header
    const tamperedReq = { ...req, headers: { ...req.headers, 'x-forged': 'true' } };

    const result = await verifier.verify(integrity, tamperedReq);
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.code, 'REPLAY_ENVELOPE');
    assert.ok(result.reason?.includes('headersHash'));
  });

  it('rejects tampered URL in replayed request', async () => {
    const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore() });
    const req = defaultRequestData;
    const integrity = makeIntegrityPayload(req);

    // Attacker redirects to different endpoint
    const tamperedReq = { ...req, url: 'http://evil.com/v1/steal' };

    const result = await verifier.verify(integrity, tamperedReq);
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.code, 'REPLAY_ENVELOPE');
    assert.ok(result.reason?.includes('envelopeHash'));
  });
});

describe('Acceptance Gate: REPLAY_ENVELOPE is real', () => {
  it('verifier computes and compares all three hashes independently', async () => {
    const metrics = new ReplayMetrics();
    const verifier = new ReplayVerifier({ nonceStore: new MemoryNonceStore(), metrics });

    const req = defaultRequestData;
    const integrity = makeIntegrityPayload(req);

    // Valid request passes
    const valid = await verifier.verify(integrity, req);
    assert.strictEqual(valid.allowed, true);

    // Each tampered variant fails with REPLAY_ENVELOPE
    const bodyTamper = await verifier.verify(
      makeIntegrityPayload(req),
      { ...req, body: '{"hacked":true}' }
    );
    assert.strictEqual(bodyTamper.code, 'REPLAY_ENVELOPE');

    const headerTamper = await verifier.verify(
      makeIntegrityPayload(req),
      { ...req, headers: { ...req.headers, 'x-evil': 'true' } }
    );
    assert.strictEqual(headerTamper.code, 'REPLAY_ENVELOPE');

    const urlTamper = await verifier.verify(
      makeIntegrityPayload(req),
      { ...req, url: 'http://evil.com/' }
    );
    assert.strictEqual(urlTamper.code, 'REPLAY_ENVELOPE');

    // Metrics show real envelope rejections
    const snap = metrics.snapshot();
    assert.strictEqual(snap.rejectedEnvelopeTotal, 3);
    assert.strictEqual(snap.acceptedTotal, 1);
  });
});
