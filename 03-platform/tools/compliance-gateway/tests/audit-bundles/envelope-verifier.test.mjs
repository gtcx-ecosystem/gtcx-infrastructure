import assert from 'node:assert';
import { describe, it, before } from 'node:test';

import { canonicalizeUrl, computeEnvelopeHash, sha256Hex } from '../../src/audit-bundles/canonical.mjs';
import { createMockResolver } from '../../src/audit-bundles/did-resolver.mjs';
import { generateEd25519KeyPair, signEd25519 } from '../../src/audit-bundles/ed25519.mjs';
import {
  verifyEnvelope,
  EnvelopeVerificationError,
  REQUIRED_HEADERS,
  MAX_TIMESTAMP_AGE_MS,
} from '../../src/audit-bundles/envelope-verifier.mjs';

const AUDIENCE = 'https://geotag.staging.gtcx.trade';
const URL = 'https://geotag.staging.gtcx.trade/audit/bundles';
const DID = 'did:gtcx:tp_zw_001';
const KEY_ID = 'k-1';
const BODY = JSON.stringify({ bundleId: 'b1', events: [] });

/** @type {{ publicKeyJwk: object, privateKeyJwk: object }} */
let keyPair;
let signedHeaders;
let now;

before(async () => {
  keyPair = await generateEd25519KeyPair();
  now = Date.parse('2026-05-24T12:00:00Z');
  const timestamp = new Date(now).toISOString();
  const nonce = 'n-test-001';
  const bodyHash = sha256Hex(BODY);
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
  signedHeaders = {
    'x-gtcx-did': DID,
    'x-gtcx-key-id': KEY_ID,
    'x-gtcx-timestamp': timestamp,
    'x-gtcx-nonce': nonce,
    'x-gtcx-audience': AUDIENCE,
    'x-gtcx-body-sha256': bodyHash,
    'x-gtcx-signature': signature,
  };
});

function args(overrides = {}) {
  const { headers: headerOverrides, ...rest } = overrides;
  return {
    method: 'POST',
    url: URL,
    body: BODY,
    expectedAudience: AUDIENCE,
    resolver: createMockResolver({ [DID]: { [KEY_ID]: keyPair.publicKeyJwk } }),
    nowMs: now,
    ...rest,
    headers: { ...signedHeaders, ...(headerOverrides ?? {}) },
  };
}

describe('verifyEnvelope — happy path', () => {
  it('accepts a properly-signed envelope', async () => {
    const result = await verifyEnvelope(args());
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.did, DID);
    assert.strictEqual(result.keyId, KEY_ID);
  });
});

describe('verifyEnvelope — header presence', () => {
  for (const header of REQUIRED_HEADERS) {
    it(`rejects when ${header} is missing`, async () => {
      const headers = { ...signedHeaders };
      delete headers[header];
      await assert.rejects(
        verifyEnvelope(args({ headers: { ...signedHeaders, [header]: undefined } })),
        (e) => e instanceof EnvelopeVerificationError && e.reason === 'header-missing',
      );
    });
  }
});

describe('verifyEnvelope — audience check', () => {
  it('rejects on audience mismatch', async () => {
    await assert.rejects(
      verifyEnvelope(args({ expectedAudience: 'https://wrong.example' })),
      (e) => e.reason === 'audience-mismatch',
    );
  });
});

describe('verifyEnvelope — body integrity', () => {
  it('rejects when body hash header disagrees with body', async () => {
    await assert.rejects(
      verifyEnvelope(args({ body: BODY + 'tamper' })),
      (e) => e.reason === 'body-hash-mismatch',
    );
  });
});

describe('verifyEnvelope — timestamp freshness', () => {
  it('rejects unparseable timestamp', async () => {
    await assert.rejects(
      verifyEnvelope(args({ headers: { 'x-gtcx-timestamp': 'not-a-date' } })),
      (e) => e.reason === 'timestamp-unparseable',
    );
  });

  it('rejects timestamp older than maxAge', async () => {
    await assert.rejects(
      verifyEnvelope(args({ nowMs: now + MAX_TIMESTAMP_AGE_MS + 1 })),
      (e) => e.reason === 'timestamp-stale',
    );
  });

  it('rejects timestamp too far in the future', async () => {
    await assert.rejects(
      verifyEnvelope(args({ nowMs: now - MAX_TIMESTAMP_AGE_MS - 1 })),
      (e) => e.reason === 'timestamp-future',
    );
  });

  it('accepts a timestamp at the boundary', async () => {
    const result = await verifyEnvelope(args({ nowMs: now + MAX_TIMESTAMP_AGE_MS }));
    assert.strictEqual(result.valid, true);
  });
});

describe('verifyEnvelope — DID resolution', () => {
  it('rejects with did-resolve-* when DID not found', async () => {
    await assert.rejects(
      verifyEnvelope(args({ resolver: createMockResolver({}) })),
      (e) => e.reason && e.reason.startsWith('did-resolve-'),
    );
  });

  it('rejects with did-resolve-* when keyId not found', async () => {
    const resolver = createMockResolver({ [DID]: { 'other-key': keyPair.publicKeyJwk } });
    await assert.rejects(
      verifyEnvelope(args({ resolver })),
      (e) => e.reason && e.reason.startsWith('did-resolve-'),
    );
  });
});

describe('verifyEnvelope — signature', () => {
  it('rejects when signature is for a different DID/key', async () => {
    const otherPair = await generateEd25519KeyPair();
    await assert.rejects(
      verifyEnvelope(args({
        resolver: createMockResolver({ [DID]: { [KEY_ID]: otherPair.publicKeyJwk } }),
      })),
      (e) => e.reason === 'signature-invalid',
    );
  });

  it('rejects when signature is malformed (not base64url)', async () => {
    await assert.rejects(
      verifyEnvelope(args({ headers: { 'x-gtcx-signature': 'not-base64url-bytes' } })),
      (e) => e.reason === 'signature-invalid' || e.reason === 'signature-malformed',
    );
  });
});
