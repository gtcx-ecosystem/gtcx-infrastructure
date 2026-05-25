import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  extractPublicKey,
  createTradePassResolver,
  createMockResolver,
  DidResolverError,
} from '../../src/audit-bundles/did-resolver.mjs';

const SAMPLE_JWK = { kty: 'OKP', crv: 'Ed25519', x: 'base64-public-key-bytes' };

function makeDidDoc(verificationMethod) {
  return { id: 'did:gtcx:tp_zw_001', verificationMethod };
}

describe('extractPublicKey', () => {
  it('matches by bare keyId', () => {
    const doc = makeDidDoc([{ id: 'k-1', publicKeyJwk: SAMPLE_JWK }]);
    assert.deepStrictEqual(extractPublicKey(doc, 'k-1'), SAMPLE_JWK);
  });

  it('matches by suffix (fully-qualified key id)', () => {
    const doc = makeDidDoc([{ id: 'did:gtcx:tp_zw_001#k-1', publicKeyJwk: SAMPLE_JWK }]);
    assert.deepStrictEqual(extractPublicKey(doc, 'k-1'), SAMPLE_JWK);
  });

  it('throws key-id-not-found when no method matches', () => {
    const doc = makeDidDoc([{ id: 'k-2', publicKeyJwk: SAMPLE_JWK }]);
    assert.throws(
      () => extractPublicKey(doc, 'k-1'),
      (e) => e instanceof DidResolverError && e.reason === 'key-id-not-found',
    );
  });

  it('throws public-key-jwk-missing when method lacks JWK', () => {
    const doc = makeDidDoc([{ id: 'k-1' }]);
    assert.throws(
      () => extractPublicKey(doc, 'k-1'),
      (e) => e instanceof DidResolverError && e.reason === 'public-key-jwk-missing',
    );
  });

  it('throws did-document-malformed for non-object inputs', () => {
    assert.throws(
      () => extractPublicKey(null, 'k-1'),
      (e) => e instanceof DidResolverError && e.reason === 'did-document-malformed',
    );
  });

  it('returns the first matching method when multiple keyIds exist', () => {
    const a = { kty: 'OKP', crv: 'Ed25519', x: 'a' };
    const b = { kty: 'OKP', crv: 'Ed25519', x: 'b' };
    const doc = makeDidDoc([
      { id: 'k-1', publicKeyJwk: a },
      { id: 'k-2', publicKeyJwk: b },
    ]);
    assert.deepStrictEqual(extractPublicKey(doc, 'k-2'), b);
  });
});

describe('createTradePassResolver', () => {
  it('hits the canonical URL pattern /identity/${encoded-did}', async () => {
    let capturedUrl;
    const fetcher = async (url) => {
      capturedUrl = url;
      return {
        ok: true,
        json: async () => makeDidDoc([{ id: 'k-1', publicKeyJwk: SAMPLE_JWK }]),
      };
    };
    const resolve = createTradePassResolver({ baseUrl: 'https://tradepass.example/', fetcher });
    const result = await resolve('did:gtcx:tp_zw_001', 'k-1');
    assert.deepStrictEqual(result, SAMPLE_JWK);
    assert.strictEqual(capturedUrl, 'https://tradepass.example/identity/did%3Agtcx%3Atp_zw_001');
  });

  it('throws did-malformed for non-DID input', async () => {
    const resolve = createTradePassResolver({ baseUrl: 'https://x', fetcher: async () => ({}) });
    await assert.rejects(resolve('not-a-did', 'k-1'), (e) => e.reason === 'did-malformed');
  });

  it('throws http-NNN on non-2xx response', async () => {
    const fetcher = async () => ({ ok: false, status: 404, json: async () => ({}) });
    const resolve = createTradePassResolver({ baseUrl: 'https://x', fetcher });
    await assert.rejects(resolve('did:gtcx:x', 'k-1'), (e) => e.reason === 'http-404');
  });

  it('throws fetch-failed on fetcher exception', async () => {
    const fetcher = async () => { throw new Error('network down'); };
    const resolve = createTradePassResolver({ baseUrl: 'https://x', fetcher });
    await assert.rejects(resolve('did:gtcx:x', 'k-1'), (e) => e.reason === 'fetch-failed');
  });

  it('throws timeout when fetcher aborts', async () => {
    const fetcher = async (_url, opts) => {
      await new Promise((resolve, reject) => {
        opts.signal?.addEventListener('abort', () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
    };
    const resolve = createTradePassResolver({ baseUrl: 'https://x', fetcher, timeoutMs: 5 });
    await assert.rejects(resolve('did:gtcx:x', 'k-1'), (e) => e.reason === 'timeout');
  });

  it('requires baseUrl', () => {
    assert.throws(() => createTradePassResolver({}));
  });

  it('requires a fetcher when global fetch missing', () => {
    const savedFetch = globalThis.fetch;
    // @ts-ignore intentional removal
    globalThis.fetch = undefined;
    try {
      assert.throws(() => createTradePassResolver({ baseUrl: 'https://x' }));
    } finally {
      globalThis.fetch = savedFetch;
    }
  });
});

describe('createMockResolver', () => {
  it('returns the JWK for a known (did, keyId)', async () => {
    const resolve = createMockResolver({
      'did:gtcx:tp_zw_001': { 'k-1': SAMPLE_JWK },
    });
    assert.deepStrictEqual(await resolve('did:gtcx:tp_zw_001', 'k-1'), SAMPLE_JWK);
  });

  it('rejects with did-not-found for unknown DID', async () => {
    const resolve = createMockResolver({});
    await assert.rejects(resolve('did:gtcx:x', 'k-1'), (e) => e.reason === 'did-not-found');
  });

  it('rejects with key-id-not-found for unknown keyId', async () => {
    const resolve = createMockResolver({ 'did:gtcx:x': { 'k-1': SAMPLE_JWK } });
    await assert.rejects(resolve('did:gtcx:x', 'k-2'), (e) => e.reason === 'key-id-not-found');
  });
});
