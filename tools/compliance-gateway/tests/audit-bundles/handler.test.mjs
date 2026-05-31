import { describe, it, before } from 'node:test';
import assert from 'node:assert';

import { processBundle, tenantIdFromSignedDid } from '../../src/audit-bundles/handler.mjs';
import {
  canonicalizeUrl,
  computeEnvelopeHash,
  sha256Hex,
} from '../../src/audit-bundles/canonical.mjs';
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

describe('processBundle — budget gate', () => {
  it('returns 429 when the signed DID exceeds the request budget', async () => {
    const bundle = { bundleId: 'b-1', events: [event('e1', 'h1', null)] };
    const args = await buildSignedRequest({ bundle });
    let checkedSubject;
    args.checkBudget = (subject) => {
      checkedSubject = subject;
      return {
        ok: false,
        status: 429,
        reason: 'qps',
        retryAfterSeconds: 1,
        limits: { qps: 1, dailyUsd: 5 },
        spentUsd: 0,
      };
    };
    const result = await processBundle(args);
    assert.strictEqual(checkedSubject, DID);
    assert.strictEqual(result.status, 429);
    assert.strictEqual(result.body.error, 'Rate limit exceeded for this device');
    assert.deepStrictEqual(result.body.acceptedIds, []);
  });

  it('uses the signed DID tenant for budget scope instead of spoofable request headers', async () => {
    const bundle = { bundleId: 'b-budget-tenant', events: [event('e1', 'h1', null)] };
    const args = await buildSignedRequest({ bundle });
    args.headers['x-gtcx-tenant-id'] = 'ke';
    let checked;
    args.checkBudget = (subject, tenantId) => {
      checked = { subject, tenantId };
      return { ok: true };
    };

    const result = await processBundle(args);

    assert.strictEqual(result.status, 200);
    assert.deepStrictEqual(checked, { subject: DID, tenantId: 'zw' });
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
  it('awaits async nonce gates before accepting the bundle', async () => {
    const bundle = { bundleId: 'b-async', events: [event('e1', 'h1', null)] };
    const args = await buildSignedRequest({ bundle });
    args.nonceGate = {
      checkAndSet: async () => ({ accepted: true, alreadySeen: false }),
    };

    const result = await processBundle(args);

    assert.strictEqual(result.status, 200);
  });

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
    const args = await buildSignedRequest({
      bundle: { bundleId: 'b-1', events: [event('e1', 'h1', null)] },
    });
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
    const args = await buildSignedRequest({
      bundle: { bundleId: 'b-1', events: [event('e1', 'h1', null)] },
    });
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

describe('processBundle — audit-of-the-ingest', () => {
  it('signs an audit-bundle.received event on 200 with tenant bound to the signed DID', async () => {
    const bundle = {
      bundleId: 'b-aoi-1',
      events: [event('e1', 'h1', null), event('e2', 'h2', 'h1')],
    };
    const args = await buildSignedRequest({ bundle });
    args.headers['x-gtcx-tenant-id'] = 'ke';
    const signed = [];
    args.signAuditEvent = (evt) => signed.push(evt);
    const result = await processBundle(args);
    assert.strictEqual(result.status, 200);
    assert.strictEqual(signed.length, 1);
    assert.strictEqual(signed[0].action, 'audit-bundle.received');
    assert.strictEqual(signed[0].actor, DID);
    assert.strictEqual(signed[0].tenantId, 'zw');
    assert.strictEqual(signed[0].payload.bundleId, 'b-aoi-1');
    assert.strictEqual(signed[0].payload.tenantId, 'zw');
    assert.strictEqual(signed[0].payload.eventsReceived, 2);
    assert.strictEqual(signed[0].payload.eventsAccepted, 2);
    assert.strictEqual(signed[0].payload.eventsRejected, 0);
    assert.strictEqual(signed[0].payload.chainBreakIndex, null);
  });

  it('records eventsAccepted/eventsRejected on partial accept', async () => {
    const bundle = {
      bundleId: 'b-aoi-2',
      events: [event('e1', 'h1', null), event('e2', 'h2', 'WRONG'), event('e3', 'h3', 'h2')],
    };
    const args = await buildSignedRequest({ bundle });
    const signed = [];
    args.signAuditEvent = (evt) => signed.push(evt);
    const result = await processBundle(args);
    assert.strictEqual(result.status, 200);
    assert.strictEqual(signed[0].payload.eventsAccepted, 1);
    assert.strictEqual(signed[0].payload.eventsRejected, 2);
    assert.strictEqual(signed[0].payload.chainBreakIndex, 1);
  });

  it('does NOT sign on envelope verification failure (400)', async () => {
    const bundle = { bundleId: 'b-aoi-3', events: [event('e1', 'h1', null)] };
    const args = await buildSignedRequest({ bundle });
    args.expectedAudience = 'https://wrong.example';
    const signed = [];
    args.signAuditEvent = (evt) => signed.push(evt);
    const result = await processBundle(args);
    assert.strictEqual(result.status, 400);
    assert.strictEqual(signed.length, 0);
  });

  it('does NOT sign on nonce replay (409)', async () => {
    const bundle = { bundleId: 'b-aoi-4', events: [event('e1', 'h1', null)] };
    const args = await buildSignedRequest({ bundle });
    const sharedGate = args.nonceGate;
    const signed = [];
    args.signAuditEvent = (evt) => signed.push(evt);
    await processBundle(args);

    const args2 = await buildSignedRequest({ bundle, nonce: args.headers['x-gtcx-nonce'] });
    args2.nonceGate = sharedGate;
    args2.signAuditEvent = (evt) => signed.push(evt);
    const result = await processBundle(args2);
    assert.strictEqual(result.status, 409);
    assert.strictEqual(signed.length, 1, 'only the first call should have signed');
  });

  it('does NOT throw if signAuditEvent itself throws', async () => {
    const bundle = { bundleId: 'b-aoi-5', events: [event('e1', 'h1', null)] };
    const args = await buildSignedRequest({ bundle });
    args.signAuditEvent = () => {
      throw new Error('sink unavailable');
    };
    const result = await processBundle(args);
    assert.strictEqual(result.status, 200, 'response is unaffected by audit-signing failure');
    assert.deepStrictEqual(result.body.acceptedIds, ['e1']);
  });

  it('tolerates absent signAuditEvent without error', async () => {
    const bundle = { bundleId: 'b-aoi-6', events: [event('e1', 'h1', null)] };
    const args = await buildSignedRequest({ bundle });
    delete args.signAuditEvent;
    const result = await processBundle(args);
    assert.strictEqual(result.status, 200);
  });
});

describe('tenantIdFromSignedDid', () => {
  it('extracts the tenant segment from TradePass DIDs', () => {
    assert.strictEqual(tenantIdFromSignedDid('did:gtcx:tp_zw_001'), 'zw');
    assert.strictEqual(tenantIdFromSignedDid('did:gtcx:tp_ghana-ops_001'), 'ghana-ops');
  });

  it('falls back to default for unknown DID shapes', () => {
    assert.strictEqual(tenantIdFromSignedDid('did:gtcx:device:abc'), 'default');
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
    assert.strictEqual(
      result.status,
      200,
      'nonce should still be available after envelope failure'
    );
  });
});
