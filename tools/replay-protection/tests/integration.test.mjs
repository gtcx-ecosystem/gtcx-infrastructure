/**
 * @fileoverview Replay Guard Integration Tests
 *
 * Spins up the HTTP server on an ephemeral port and exercises:
 *   - /v1/replay/verify   (accept, reject nonce, reject stale, reject future)
 *   - /health             (liveness)
 *   - /metrics            (Prometheus exposition)
 *
 * Uses only Node.js built-ins — no external test framework.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createServer, request as httpRequest } from 'node:http';

// We import the server module dynamically so we can control its lifecycle.
// Because server.mjs calls server.listen() at module load, we stub PORT.

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
    if (opts.body) req.write(JSON.stringify(opts.body));
    req.end();
  });
}

describe('Replay Guard Integration', () => {
  before(async () => {
    // Pick an ephemeral port
    const stubServer = createServer();
    await new Promise((r) => stubServer.listen(0, '127.0.0.1', r));
    const port = stubServer.address().port;
    stubServer.close();

    process.env.PORT = String(port);
    process.env.REDIS_URL = ''; // force memory store
    process.env.OTLP_ENDPOINT = ''; // disable OTLP push

    const mod = await import('../src/server.mjs');
    testServer = mod.server;
    baseUrl = `http://127.0.0.1:${port}`;

    // Wait for server to be ready
    await new Promise((r) => setTimeout(r, 100));
  });

  after(() => {
    testServer?.close();
  });

  describe('POST /v1/replay/verify', () => {
    it('accepts a valid fresh request', async () => {
      const res = await fetchJson('/v1/replay/verify', {
        method: 'POST',
        body: {
          integrity: {
            scheme: 'did-jwt-es256',
            did: 'did:gtcx:device:test1',
            keyId: 'key-1',
            audience: 'gtcx-api',
            bodyHash: 'a'.repeat(64),
            headersHash: 'b'.repeat(64),
            timestamp: new Date().toISOString(),
            nonce: `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`,
            signature: 'c2lnbmF0dXJl',
            envelopeHash: 'c'.repeat(64),
          },
          region: 'us-east',
        },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.allowed, true);
      assert.strictEqual(res.body.code, 'REPLAY_OK');
      assert.ok(res.body.auditEventId);
    });

    it('rejects a replayed nonce', async () => {
      const nonce = `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
      const integrity = {
        scheme: 'did-jwt-es256',
        did: 'did:gtcx:device:test2',
        keyId: 'key-1',
        audience: 'gtcx-api',
        bodyHash: 'a'.repeat(64),
        headersHash: 'b'.repeat(64),
        timestamp: new Date().toISOString(),
        nonce,
        signature: 'c2lnbmF0dXJl',
        envelopeHash: 'c'.repeat(64),
      };

      const first = await fetchJson('/v1/replay/verify', {
        method: 'POST',
        body: { integrity, region: 'us-east' },
      });
      assert.strictEqual(first.status, 200);
      assert.strictEqual(first.body.allowed, true);

      const second = await fetchJson('/v1/replay/verify', {
        method: 'POST',
        body: { integrity, region: 'us-east' },
      });
      assert.strictEqual(second.status, 401);
      assert.strictEqual(second.body.allowed, false);
      assert.strictEqual(second.body.code, 'REPLAY_NONCE');
    });

    it('rejects a stale timestamp', async () => {
      const res = await fetchJson('/v1/replay/verify', {
        method: 'POST',
        body: {
          integrity: {
            scheme: 'did-jwt-es256',
            did: 'did:gtcx:device:test3',
            keyId: 'key-1',
            audience: 'gtcx-api',
            bodyHash: 'a'.repeat(64),
            headersHash: 'b'.repeat(64),
            timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            nonce: `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`,
            signature: 'c2lnbmF0dXJl',
            envelopeHash: 'c'.repeat(64),
          },
        },
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.code, 'REPLAY_STALE');
    });

    it('rejects a future timestamp', async () => {
      const res = await fetchJson('/v1/replay/verify', {
        method: 'POST',
        body: {
          integrity: {
            scheme: 'did-jwt-es256',
            did: 'did:gtcx:device:test4',
            keyId: 'key-1',
            audience: 'gtcx-api',
            bodyHash: 'a'.repeat(64),
            headersHash: 'b'.repeat(64),
            timestamp: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            nonce: `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`,
            signature: 'c2lnbmF0dXJl',
            envelopeHash: 'c'.repeat(64),
          },
        },
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.code, 'REPLAY_FUTURE');
    });

    it('accepts X-GTCX-* header map instead of integrity payload', async () => {
      const res = await fetchJson('/v1/replay/verify', {
        method: 'POST',
        body: {
          'x-gtcx-auth-scheme': 'did-jwt-es256',
          'x-gtcx-did': 'did:gtcx:device:header-test',
          'x-gtcx-key-id': 'key-1',
          'x-gtcx-audience': 'gtcx-api',
          'x-gtcx-body-sha256': 'a'.repeat(64),
          'x-gtcx-timestamp': new Date().toISOString(),
          'x-gtcx-nonce': `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`,
          'x-gtcx-signature': 'c2lnbmF0dXJl',
        },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.allowed, true);
    });

    it('allows low-connectivity region with extended window', async () => {
      const res = await fetchJson('/v1/replay/verify', {
        method: 'POST',
        body: {
          integrity: {
            scheme: 'did-jwt-es256',
            did: 'did:gtcx:device:global-south-test',
            keyId: 'key-1',
            audience: 'gtcx-api',
            bodyHash: 'a'.repeat(64),
            headersHash: 'b'.repeat(64),
            timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // 8 min old
            nonce: `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`,
            signature: 'c2lnbmF0dXJl',
            envelopeHash: 'c'.repeat(64),
          },
          region: 'global-south',
        },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.allowed, true);
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
      // Prime some metrics first
      await fetchJson('/v1/replay/verify', {
        method: 'POST',
        body: {
          integrity: {
            scheme: 'did-jwt-es256',
            did: 'did:gtcx:device:metrics',
            keyId: 'key-1',
            audience: 'gtcx-api',
            bodyHash: 'a'.repeat(64),
            headersHash: 'b'.repeat(64),
            timestamp: new Date().toISOString(),
            nonce: `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`,
            signature: 'c2lnbmF0dXJl',
            envelopeHash: 'c'.repeat(64),
          },
        },
      });

      const res = await fetchJson('/metrics');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes('replay_protection_total'));
      assert.ok(res.body.includes('REPLAY_OK'));
    });
  });
});
