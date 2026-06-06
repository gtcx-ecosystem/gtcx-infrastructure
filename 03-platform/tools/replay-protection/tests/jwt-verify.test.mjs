/**
 * @fileoverview JWT Verification Tests — Branch Coverage
 *
 * Exercises all error/edge-case branches in jwt-verify.mjs
 * to lift branch coverage from ~42% to ~100%.
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  resolveDid,
  extractPublicKeyJwk,
  verifyJwt,
  signJwt,
  generateEs256KeyPair,
} from '../src/crypto/jwt-verify.mjs';

describe('resolveDid', () => {
  it('throws on non-ok HTTP response', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => ({ ok: false, status: 404 });
    try {
      await assert.rejects(resolveDid('did:test:1'), /404/);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('resolves and unwraps wrapped didDocument', async () => {
    const originalFetch = global.fetch;
    const doc = { id: 'did:test:1' };
    global.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ didDocument: doc }),
    });
    try {
      const result = await resolveDid('did:test:1');
      assert.strictEqual(result, doc);
    } finally {
      global.fetch = originalFetch;
    }
  });
});

describe('extractPublicKeyJwk', () => {
  const didDoc = {
    id: 'did:test:1',
    verificationMethod: [
      { id: 'did:test:1#key-1', publicKeyJwk: { kty: 'EC' } },
      { id: 'did:test:1#key-2', publicKeyJwk: { kty: 'RSA' } },
    ],
  };

  it('matches full keyId with hash', () => {
    const jwk = extractPublicKeyJwk(didDoc, 'did:test:1#key-1');
    assert.deepStrictEqual(jwk, { kty: 'EC' });
  });

  it('matches short keyId without hash', () => {
    const jwk = extractPublicKeyJwk(didDoc, 'key-1');
    assert.deepStrictEqual(jwk, { kty: 'EC' });
  });

  it('returns null when no method matches', () => {
    const jwk = extractPublicKeyJwk(didDoc, 'key-999');
    assert.strictEqual(jwk, null);
  });

  it('returns null when method lacks publicKeyJwk', () => {
    const doc = {
      id: 'did:test:1',
      verificationMethod: [{ id: 'did:test:1#key-1' }],
    };
    const jwk = extractPublicKeyJwk(doc, 'key-1');
    assert.strictEqual(jwk, null);
  });

  it('returns null for empty verificationMethod array', () => {
    const jwk = extractPublicKeyJwk({ id: 'did:test:1' }, 'key-1');
    assert.strictEqual(jwk, null);
  });
});

describe('verifyJwt', () => {
  /** @type {{ privateKeyJwk: object, publicKeyJwk: object }} */
  let keyPair;

  it('requires 3 parts', async () => {
    await assert.rejects(verifyJwt('a.b', {}), /3 parts/);
  });

  it('rejects non-ES256 algorithm', async () => {
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.signature';
    await assert.rejects(verifyJwt(jwt, {}), /Unsupported algorithm/);
  });

  it('rejects non-JWT type', async () => {
    const jwt = 'eyJhbGciOiJFUzI1NiIsInR5cCI6Im5vbmUifQ.eyJzdWIiOiIxIn0.signature';
    await assert.rejects(verifyJwt(jwt, {}), /Unsupported type/);
  });

  it('rejects invalid signature', async () => {
    const jwt = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.bad-signature';
    keyPair = await generateEs256KeyPair();
    await assert.rejects(verifyJwt(jwt, keyPair.publicKeyJwk), /signature verification failed/);
  });

  it('rejects audience mismatch', async () => {
    keyPair = await generateEs256KeyPair();
    const jwt = await signJwt({ aud: 'expected-aud' }, keyPair.privateKeyJwk);
    await assert.rejects(
      verifyJwt(jwt, keyPair.publicKeyJwk, { audience: 'wrong-aud' }),
      /audience mismatch/
    );
  });

  it('rejects expired JWT', async () => {
    keyPair = await generateEs256KeyPair();
    const jwt = await signJwt({ iat: 1000, exp: 1001 }, keyPair.privateKeyJwk);
    await assert.rejects(verifyJwt(jwt, keyPair.publicKeyJwk), /expired/);
  });

  it('rejects future-issued JWT', async () => {
    keyPair = await generateEs256KeyPair();
    const nowSec = Math.floor(Date.now() / 1000);
    const jwt = await signJwt({ iat: nowSec + 3600, exp: nowSec + 7200 }, keyPair.privateKeyJwk);
    await assert.rejects(verifyJwt(jwt, keyPair.publicKeyJwk), /future/);
  });

  it('verifies valid JWT without audience', async () => {
    keyPair = await generateEs256KeyPair();
    const nowSec = Math.floor(Date.now() / 1000);
    const jwt = await signJwt({ iat: nowSec, exp: nowSec + 300 }, keyPair.privateKeyJwk);
    const payload = await verifyJwt(jwt, keyPair.publicKeyJwk);
    assert.strictEqual(typeof payload.iat, 'number');
  });

  it('verifies valid JWT with matching audience', async () => {
    keyPair = await generateEs256KeyPair();
    const nowSec = Math.floor(Date.now() / 1000);
    const jwt = await signJwt(
      { aud: 'gtcx-api', iat: nowSec, exp: nowSec + 300 },
      keyPair.privateKeyJwk
    );
    const payload = await verifyJwt(jwt, keyPair.publicKeyJwk, { audience: 'gtcx-api' });
    assert.strictEqual(payload.aud, 'gtcx-api');
  });
});
