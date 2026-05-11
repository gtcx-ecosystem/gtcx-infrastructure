/**
 * @fileoverview Replay Guard Integration Tests
 *
 * Spins up the HTTP server on an ephemeral port and exercises:
 *   - /v1/replay/verify   (accept, reject nonce, reject stale, reject future, hash mismatch)
 *   - /health             (liveness)
 *   - /metrics            (Prometheus exposition)
 *
 * Uses only Node.js built-ins — no external test framework.
 */

import assert from 'node:assert';
import { createServer, request as httpRequest } from 'node:http';
import { describe, it, before, after } from 'node:test';

import { computeBodyHash, computeHeadersHash, computeEnvelopeHash } from '../src/crypto/hash.mjs';

import { installMockFetch, signEnvelopeV1, signTestJwt } from './helpers/jwt-fixture.mjs';

/** @type {import('node:http').Server} */
let testServer;
let baseUrl;

async function fetchJson(path, opts = {}) {
  const url = new URL(path, baseUrl);
  return new Promise((resolve, reject) => {
    const req = httpRequest(url, { method: opts.method ?? 'GET', headers: opts.headers }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (opts.body) {
    if (typeof opts.body === 'string') {
      req.write(opts.body);
    } else {
      req.write(JSON.stringify(opts.body));
    }
  }
    req.end();
  });
}

async function makeIntegrityPayload(requestData, overrides = {}) {
  const now = new Date().toISOString();
  const nonce = overrides.nonce ?? `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
  const timestamp = overrides.timestamp ?? now;
  const did = overrides.did ?? 'did:gtcx:device:test';
  const keyId = overrides.keyId ?? 'key-1';
  const audience = overrides.audience ?? 'gtcx-api';
  const scheme = overrides.scheme ?? 'gtcx-queue-envelope-v1';
  const bodyHash = computeBodyHash(requestData.body);
  const headersHash = computeHeadersHash(requestData.headers);
  const envelopeHash = computeEnvelopeHash({
    method: requestData.method,
    url: requestData.url,
    bodyHash,
    headersHash,
    timestamp,
    nonce,
    did,
    keyId,
    audience,
  });
  const signature = overrides.signature ?? await (
    scheme === 'gtcx-queue-envelope-v1'
      ? signEnvelopeV1(envelopeHash)
      : signTestJwt(envelopeHash, audience)
  );

  return {
    scheme,
    did,
    keyId,
    audience,
    bodyHash,
    headersHash,
    timestamp,
    nonce,
    signature,
    envelopeHash,
    ...overrides,
  };
}

const defaultRequestData = {
  body: '{"action":"create","payload":{"id":1}}',
  headers: { 'content-type': 'application/json', 'x-request-id': 'req-123' },
  method: 'POST',
  url: 'http://api.gtcx.local/v1/tradepass/issue',
};

describe('Replay Guard Integration', () => {
  /** @type {Function} */
  let originalFetch;

  before(async () => {
    originalFetch = await installMockFetch();

    const stubServer = createServer();
    await new Promise((r) => stubServer.listen(0, () => r()));
    const addr = stubServer.address();
    const port = typeof addr === 'string' ? parseInt(addr.split(':').pop() || '0', 10) : (addr?.port || 0);
    await new Promise((r) => stubServer.close(r));

    process.env.PORT = String(port);
    process.env.REDIS_URL = '';
    process.env.OTLP_ENDPOINT = '';
    // REPLAY_GUARD_ALLOW_STUB_SIGNATURE removed — real crypto verification is active

    const mod = await import('../src/server.mjs');
    testServer = mod.server;
    baseUrl = `http://127.0.0.1:${port}`;
    await new Promise((r) => setTimeout(r, 100));
  });

  after(() => {
    global.fetch = /** @type {typeof global.fetch} */ (originalFetch);
    testServer?.close();
  });

  describe('POST /v1/replay/verify', () => {
    it('accepts a valid fresh request with matching hashes', async () => {
      const reqData = defaultRequestData;
      const integrity = await makeIntegrityPayload(reqData);
      const res = await fetchJson('/v1/replay/verify', {
        method: 'POST',
        body: { integrity, ...reqData, region: 'us-east' },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.allowed, true);
      assert.strictEqual(res.body.code, 'REPLAY_OK');
      assert.ok(res.body.auditEventId);
    });

    it('accepts a real mobile queue envelope fixture (gtcx-queue-envelope-v1)', async () => {
      // This fixture represents exactly what gtcx-mobile's offline queue produces.
      // Ed25519 signature over the envelopeHash, scheme = gtcx-queue-envelope-v1.
      const mobileBody = '{"action":"transfer","amount":100}';
      const mobileHeaders = { 'content-type': 'application/json', 'x-request-id': 'req-abc' };
      const mobileUrl = 'http://api.gtcx.local/v1/transfer';
      const mobileMethod = 'POST';
      const mobileNonce = 'deadbeef12345678';
      const mobileTimestamp = new Date().toISOString();

      const bodyHash = computeBodyHash(mobileBody);
      const headersHash = computeHeadersHash(mobileHeaders);
      const envelopeHash = computeEnvelopeHash({
        method: mobileMethod,
        url: mobileUrl,
        bodyHash,
        headersHash,
        timestamp: mobileTimestamp,
        nonce: mobileNonce,
        did: 'did:gtcx:device:abc123',
        keyId: 'key-1',
        audience: 'gtcx-api',
      });

      // Verify bodyHash and headersHash match the expected mobile-computed values.
      assert.strictEqual(bodyHash, '3e3fcfb382a1b6e25308382c117e39e27754f8816c0cbcec6167b657f2f83092');
      assert.strictEqual(headersHash, '77379377611b75759693c33d15b695393316b077476de62f0ee5453bb652e6ea');

      const signature = await signEnvelopeV1(envelopeHash);
      const integrity = {
        scheme: 'gtcx-queue-envelope-v1',
        did: 'did:gtcx:device:abc123',
        keyId: 'key-1',
        audience: 'gtcx-api',
        bodyHash,
        headersHash,
        timestamp: mobileTimestamp,
        nonce: mobileNonce,
        signature,
        envelopeHash,
      };

      const res = await fetchJson('/v1/replay/verify', {
        method: 'POST',
        body: {
          integrity,
          body: mobileBody,
          headers: mobileHeaders,
          method: mobileMethod,
          url: mobileUrl,
          region: 'us-east',
        },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.allowed, true);
      assert.strictEqual(res.body.code, 'REPLAY_OK');
    });

    it('accepts did-jwt-es256 scheme (forward compatibility)', async () => {
      const reqData = {
        body: '{"action":"es256-test"}',
        headers: { 'content-type': 'application/json' },
        method: 'POST',
        url: 'http://api.gtcx.local/v1/es256-test',
      };
      const integrity = await makeIntegrityPayload(reqData, { scheme: 'did-jwt-es256', did: 'did:gtcx:device:es256-test' });
      const res = await fetchJson('/v1/replay/verify', {
        method: 'POST',
        body: { integrity, ...reqData, region: 'us-east' },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.allowed, true);
      assert.strictEqual(res.body.code, 'REPLAY_OK');
    });

    it('rejects a replayed nonce', async () => {
      const reqData = defaultRequestData;
      const nonce = `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
      const integrity = await makeIntegrityPayload(reqData, { nonce });

      const first = await fetchJson('/v1/replay/verify', {
        method: 'POST',
        body: { integrity, ...reqData, region: 'us-east' },
      });
      assert.strictEqual(first.status, 200);
      assert.strictEqual(first.body.allowed, true);

      const second = await fetchJson('/v1/replay/verify', {
        method: 'POST',
        body: { integrity, ...reqData, region: 'us-east' },
      });
      assert.strictEqual(second.status, 401);
      assert.strictEqual(second.body.allowed, false);
      assert.strictEqual(second.body.code, 'REPLAY_NONCE');
    });

    it('rejects stale timestamps', async () => {
      const reqData = defaultRequestData;
      const oldTs = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const integrity = await makeIntegrityPayload(reqData, { timestamp: oldTs });
      const res = await fetchJson('/v1/replay/verify', {
        method: 'POST',
        body: { integrity, ...reqData },
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.code, 'REPLAY_STALE');
    });

    it('rejects future timestamps', async () => {
      const reqData = defaultRequestData;
      const futureTs = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const integrity = await makeIntegrityPayload(reqData, { timestamp: futureTs });
      const res = await fetchJson('/v1/replay/verify', {
        method: 'POST',
        body: { integrity, ...reqData },
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.code, 'REPLAY_FUTURE');
    });

    it('accepts timestamps inside the window', async () => {
      const reqData = defaultRequestData;
      const ts = new Date(Date.now() - 30 * 1000).toISOString();
      const integrity = await makeIntegrityPayload(reqData, { timestamp: ts });
      const res = await fetchJson('/v1/replay/verify', {
        method: 'POST',
        body: { integrity, ...reqData },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.allowed, true);
    });

    it('rejects bodyHash mismatch', async () => {
      const reqData = defaultRequestData;
      const integrity = await makeIntegrityPayload(reqData, { bodyHash: 'a'.repeat(64) });
      const res = await fetchJson('/v1/replay/verify', {
        method: 'POST',
        body: { integrity, ...reqData },
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.code, 'REPLAY_ENVELOPE');
      assert.ok(res.body.reason?.includes('bodyHash'));
    });

    it('rejects headersHash mismatch', async () => {
      const reqData = defaultRequestData;
      const integrity = await makeIntegrityPayload(reqData, { headersHash: 'b'.repeat(64) });
      const res = await fetchJson('/v1/replay/verify', {
        method: 'POST',
        body: { integrity, ...reqData },
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.code, 'REPLAY_ENVELOPE');
      assert.ok(res.body.reason?.includes('headersHash'));
    });

    it('rejects envelopeHash mismatch', async () => {
      const reqData = defaultRequestData;
      const integrity = await makeIntegrityPayload(reqData, { envelopeHash: 'c'.repeat(64) });
      const res = await fetchJson('/v1/replay/verify', {
        method: 'POST',
        body: { integrity, ...reqData },
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.code, 'REPLAY_ENVELOPE');
      assert.ok(res.body.reason?.includes('envelopeHash'));
    });

    it('accepts X-GTCX-* header map instead of integrity payload', async () => {
      const reqData = {
        body: '{"action":"test"}',
        headers: { 'content-type': 'application/json' },
        method: 'POST',
        url: 'http://api.gtcx.local/v1/test',
      };
      const now = new Date().toISOString();
      const bodyHash = computeBodyHash(reqData.body);
      const headersHash = computeHeadersHash(reqData.headers);
      const nonce = `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
      const envelopeHash = computeEnvelopeHash({
        method: reqData.method,
        url: reqData.url,
        bodyHash,
        headersHash,
        timestamp: now,
        nonce,
        did: 'did:gtcx:device:header-test',
        keyId: 'key-1',
        audience: 'gtcx-api',
      });
      const signature = await signEnvelopeV1(envelopeHash);

      const res = await fetchJson('/v1/replay/verify', {
        method: 'POST',
        body: {
          ...reqData,
          'x-gtcx-auth-scheme': 'gtcx-queue-envelope-v1',
          'x-gtcx-did': 'did:gtcx:device:header-test',
          'x-gtcx-key-id': 'key-1',
          'x-gtcx-audience': 'gtcx-api',
          'x-gtcx-body-sha256': bodyHash,
          'x-gtcx-headers-hash': headersHash,
          'x-gtcx-timestamp': now,
          'x-gtcx-nonce': nonce,
          'x-gtcx-signature': signature,
          'x-gtcx-envelope-hash': envelopeHash,
        },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.allowed, true);
    });

    it('rejects requests with an invalid Ed25519 signature', async () => {
      const reqData = defaultRequestData;
      const integrity = await makeIntegrityPayload(reqData, { signature: 'invalid-signature-bytes' });
      const res = await fetchJson('/v1/replay/verify', {
        method: 'POST',
        body: { integrity, ...reqData, region: 'us-east' },
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.allowed, false);
      assert.strictEqual(res.body.code, 'REPLAY_SIGNATURE');
    });

    it('rejects requests with a tampered Ed25519 signature', async () => {
      const reqData = defaultRequestData;
      const integrity = await makeIntegrityPayload(reqData);
      // Flip one character in the base64url signature to corrupt it.
      // We modify a character in the middle (not the last) because the final
      // base64url character may only encode 2 bits of the 64-byte Ed25519
      // signature; changing it to 'A' can accidentally preserve those 2 bits.
      const idx = Math.floor(integrity.signature.length / 2);
      const tamperedSignature =
        integrity.signature.slice(0, idx) +
        (integrity.signature[idx] === 'A' ? 'B' : 'A') +
        integrity.signature.slice(idx + 1);
      const res = await fetchJson('/v1/replay/verify', {
        method: 'POST',
        body: { integrity: { ...integrity, signature: tamperedSignature }, ...reqData, region: 'us-east' },
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.allowed, false);
      assert.strictEqual(res.body.code, 'REPLAY_SIGNATURE');
    });

    it('allows low-connectivity region with extended window', async () => {
      const reqData = defaultRequestData;
      const oldTs = new Date(Date.now() - 8 * 60 * 1000).toISOString();
      const integrity = await makeIntegrityPayload(reqData, { timestamp: oldTs });
      const res = await fetchJson('/v1/replay/verify', {
        method: 'POST',
        body: { integrity, ...reqData, region: 'global-south' },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.allowed, true);
    });

    it('still rejects beyond extended window', async () => {
      const reqData = defaultRequestData;
      const oldTs = new Date(Date.now() - 20 * 60 * 1000).toISOString();
      const integrity = await makeIntegrityPayload(reqData, { timestamp: oldTs });
      const res = await fetchJson('/v1/replay/verify', {
        method: 'POST',
        body: { integrity, ...reqData, region: 'global-south' },
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.allowed, false);
      assert.strictEqual(res.body.code, 'REPLAY_STALE');
    });
  });

  describe('GET /health', () => {
    it('returns healthy status', async () => {
      const res = await fetchJson('/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'healthy');
      assert.ok(typeof res.body.uptimeSeconds === 'number');
    });
  });

  describe('GET /metrics', () => {
    it('returns prometheus exposition', async () => {
      const reqData = defaultRequestData;
      const integrity = await makeIntegrityPayload(reqData);
      await fetchJson('/v1/replay/verify', {
        method: 'POST',
        body: { integrity, ...reqData },
      });

      const res = await fetchJson('/metrics');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('replay_protection_total'));
      assert.ok(res.body.includes('REPLAY_OK'));
    });
  });
});
