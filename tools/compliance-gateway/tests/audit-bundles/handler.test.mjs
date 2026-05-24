import { describe, it, before } from 'node:test';
import assert from 'node:assert';

import { processBundle } from '../../src/audit-bundles/handler.mjs';
import { canonicalizeUrl, computeEnvelopeHash, sha256Hex } from '../../src/audit-bundles/canonical.mjs';
import { createMockResolver } from '../../src/audit-bundles/did-resolver.mjs';
import { generateEd25519KeyPair, signEd25519 } from '../../src/audit-bundles/ed25519.mjs';
import { NonceGate } from '../../src/audit-bundles/nonce-gate.mjs';

const AUDIENCE = 'https://geotag.staging.gtcx.trade';
const URL = 'https://geotag.staging.gtcx.trade/audit/bundles';
const DID = 'did:gtcx:tp_zw_001';
const KEY_ID = 'k-1';

let keyPair;
let now;

before(async () => {
  keyPair = await generateEd25519KeyPair();
  now = Date.parse('2026-05-24T12:00:00Z');
});

function event(id, eventHash, previousHash) {
  return {
    id,
    timestamp: '2026-05-24T11:59:00Z',
    workflowId: 'wf-1',
    iterationNumber: 0,
    agentId: 'capture.spoof@v1',
    promptVersionId: 'capture.spoof@v1@2026-05-19',
    inputHash: 'h:in',
    outputHash: 'h:out',
    qualityScore: 80,
    tokensUsed: 0,
    costUsd: 0,
    durationMs: 0,
    outcome: 'continue',
    schemaValid: null,
    previousHash,
    eventHash,
    synced: false,
  };
}

async function buildSignedRequest({ bundle, nonce = 'n-001', timestampMs = now } = {}) {
  const body = JSON.stringify(bundle);
  const timestamp = new Date(timestampMs).toISOString();
  const bodyHash = sha256Hex(body);
  const { path, query } = canonicalizeUrl(URL);
  const envelopeHash = computeEnvelopeHash({
    method: 'POST',
    path,
    query,
    bodyHash,
    timestamp,
    nonce,
    did: DID,
    keyId: KEY_ID,
    audience: AUDIENCE,
  });
  const signature = await signEd25519(envelopeHash, keyPair.privateKeyJwk);
  return {
    method: 'POST',
    url: URL,
    body,
    headers: {
      'x-gtcx-did': DID,
      'x-gtcx-key-id': KEY_ID,
      'x-gtcx-timestamp': timestamp,
      'x-gtcx-nonce': nonce,
      'x-gtcx-audience': AUDIENCE,
      'x-gtcx-body-sha256': bodyHash,
      'x-gtcx-signature': signature,
    },
    expectedAudience: AUDIENCE,
    resolver: createMockResolver({ [DID]: { [KEY_ID]: keyPair.publicKeyJwk } }),
    nonceGate: new NonceGate(),
    nowMs: now,
  };
}

describe('processBundle — happy path', () => {
  it('returns 200 with acceptedIds for a valid bundle', async () => {
    const bundle = { bundleId: 'b-1', events: [event('e1', 'h1', null), event('e2', 'h2', 'h1')] };
    const args = await buildSignedRequest({ bundle });
    const result = await processBundle(args);
    assert.strictEqual(result.status, 200);
    assert.deepStrictEqual(result.body.acceptedIds, ['e1', 'e2']);
  });

  it('partial accept on within-bundle chain break', async () => {
    const bundle = {
      bundleId: 'b-1',
      events: [
        event('e1', 'h1', null),
        event('e2', 'h2', 'h1'),
        event('e3', 'h3', 'WRONG'),
        event('e4', 'h4', 'h3'),
      ],
    };
    const args = await buildSignedRequest({ bundle });
    const result = await processBundle(args);
    assert.strictEqual(result.status, 200);
    assert.deepStrictEqual(result.body.acceptedIds, ['e1', 'e2']);
  });
});

describe('processBundle — 400 envelope failures', () => {
  it('returns 400 envelope-audience-mismatch on wrong audience', async () => {
    const bundle = { bundleId: 'b-1', events: [event('e1', 'h1', null)] };
    const args = await buildSignedRequest({ bundle });
    args.expectedAudience = 'https://wrong.example';
    const result = await processBundle(args);
    assert.strictEqual(result.status, 400);
    assert.strictEqual(result.body.error, 'envelope-audience-mismatch');
    assert.deepStrictEqual(result.body.acceptedIds, []);
  });

  it('returns 400 envelope-header-missing when a required header is absent', async () => {
    const bundle = { bundleId: 'b-1', events: [event('e1', 'h1', null)] };
    const args = await buildSignedRequest({ bundle });
    delete args.headers['x-gtcx-signature'];
    const result = await processBundle(args);
    assert.strictEqual(result.status, 400);
    assert.strictEqual(result.body.error, 'envelope-header-missing');
  });

  it('returns 400 envelope-timestamp-stale when timestamp older than maxAge', async () => {
    const bundle = { bundleId: 'b-1', events: [event('e1', 'h1', null)] };
    const args = await buildSignedRequest({ bundle, timestampMs: now - 10 * 60 * 1000 });
    const result = await processBundle(args);
    assert.strictEqual(result.status, 400);
    assert.strictEqual(result.body.error, 'envelope-timestamp-stale');
  });
});

describe('processBundle — 409 nonce replay', () => {
  it('returns 409 nonce-replayed on second send of same nonce', async () => {
    const bundle = { bundleId: 'b-1', events: [event('e1', 'h1', null)] };
    const args = await buildSignedRequest({ bundle });
    const sharedGate = args.nonceGate;
    const first = await processBundle(args);
    assert.strictEqual(first.status, 200);

    const args2 = await buildSignedRequest({ bundle, nonce: 'n-001' });
    args2.nonceGate = sharedGate;
    const second = await processBundle(args2);
    assert.strictEqual(second.status, 409);
    assert.strictEqual(second.body.error, 'nonce-replayed');
    assert.deepStrictEqual(second.body.acceptedIds, []);
  });
});

describe('processBundle — 400 bundle-malformed', () => {
  it('returns 400 when body is not parseable JSON', async () => {
    const args = await buildSignedRequest({ bundle: { bundleId: 'b-1', events: [event('e1', 'h1', null)] } });
    // Rewrite body to invalid JSON but keep the body-hash header in sync
    const newBody = 'not-json{';
    args.body = newBody;
    args.headers['x-gtcx-body-sha256'] = sha256Hex(newBody);
    // Re-sign over the new body
    const { path, query } = canonicalizeUrl(URL);
    const envelopeHash = computeEnvelopeHash({
      method: 'POST',
      path,
      query,
      bodyHash: args.headers['x-gtcx-body-sha256'],
      timestamp: args.headers['x-gtcx-timestamp'],
      nonce: args.headers['x-gtcx-nonce'],
      did: DID,
      keyId: KEY_ID,
      audience: AUDIENCE,
    });
    args.headers['x-gtcx-signature'] = await signEd25519(envelopeHash, keyPair.privateKeyJwk);

    const result = await processBundle(args);
    assert.strictEqual(result.status, 400);
    assert.strictEqual(result.body.error, 'bundle-malformed');
  });

  it('returns 400 when bundle violates Zod (missing bundleId)', async () => {
    const args = await buildSignedRequest({ bundle: { bundleId: 'b-1', events: [event('e1', 'h1', null)] } });
    const newBody = JSON.stringify({ events: [event('e1', 'h1', null)] });
    args.body = newBody;
    args.headers['x-gtcx-body-sha256'] = sha256Hex(newBody);
    const { path, query } = canonicalizeUrl(URL);
    const envelopeHash = computeEnvelopeHash({
      method: 'POST',
      path,
      query,
      bodyHash: args.headers['x-gtcx-body-sha256'],
      timestamp: args.headers['x-gtcx-timestamp'],
      nonce: args.headers['x-gtcx-nonce'],
      did: DID,
      keyId: KEY_ID,
      audience: AUDIENCE,
    });
    args.headers['x-gtcx-signature'] = await signEd25519(envelopeHash, keyPair.privateKeyJwk);

    const result = await processBundle(args);
    assert.strictEqual(result.status, 400);
    assert.strictEqual(result.body.error, 'bundle-malformed');
  });
});

describe('processBundle — ordering invariant', () => {
  it('nonce is NOT consumed when envelope verification fails (wrong audience)', async () => {
    const bundle = { bundleId: 'b-1', events: [event('e1', 'h1', null)] };
    const args = await buildSignedRequest({ bundle });
    const gate = args.nonceGate;
    args.expectedAudience = 'https://wrong.example';
    await processBundle(args);

    // Now retry with correct audience and the same nonce; should NOT be a replay
    const args2 = await buildSignedRequest({ bundle, nonce: args.headers['x-gtcx-nonce'] });
    args2.nonceGate = gate;
    const result = await processBundle(args2);
    assert.strictEqual(result.status, 200, 'nonce should still be available after envelope failure');
  });
});
