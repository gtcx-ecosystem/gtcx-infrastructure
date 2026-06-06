/**
 * @fileoverview Replay Guard Production-Mode Fail-Closed Integration Test
 *
 * Spins up the HTTP server with NODE_ENV=production and REDIS_URL unset,
 * then verifies that ALL traffic is blocked with 503 + REPLAY_STORE_UNAVAILABLE.
 *
 * Acceptance gate: the server fails closed in production without Redis.
 */

import assert from 'node:assert';
import { createServer, request as httpRequest } from 'node:http';
import { describe, it, before, after } from 'node:test';

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
      req.write(typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body));
    }
    req.end();
  });
}

describe('Replay Guard Production Fail-Closed', () => {
  before(async () => {
    const stubServer = createServer();
    await new Promise((r) => stubServer.listen(0, '127.0.0.1', () => r()));
    const addr = stubServer.address();
    const port = typeof addr === 'string' ? parseInt(addr.split(':').pop() || '0', 10) : (addr?.port || 0);
    await new Promise((r) => stubServer.close(r));

    process.env.PORT = String(port);
    process.env.HOST = '127.0.0.1';
    process.env.NODE_ENV = 'production';
    process.env.REDIS_URL = '';
    process.env.OTLP_ENDPOINT = '';

    // Dynamic import so the server picks up our env vars
    const mod = await import('../src/server.mjs');
    testServer = mod.server;
    baseUrl = `http://127.0.0.1:${port}`;
    await new Promise((r) => setTimeout(r, 100));
  });

  after(() => {
    testServer?.close();
    delete process.env.PORT;
    delete process.env.HOST;
    delete process.env.NODE_ENV;
    delete process.env.REDIS_URL;
  });

  it('blocks /v1/replay/verify with 503 when Redis is unavailable in production', async () => {
    const res = await fetchJson('/v1/replay/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        integrity: { nonce: 'test-nonce-123', scheme: 'test' },
        body: '{}',
        headers: {},
        method: 'POST',
        url: 'http://localhost/',
      }),
    });
    assert.strictEqual(res.status, 503);
    assert.strictEqual(res.body.allowed, false);
    assert.strictEqual(res.body.code, 'REPLAY_STORE_UNAVAILABLE');
    assert.match(res.body.reason, /REDIS_URL is not set/);
  });

  it('reports unhealthy on /health when Redis is unavailable in production', async () => {
    const res = await fetchJson('/health');
    assert.strictEqual(res.status, 503);
    assert.strictEqual(res.body.status, 'unhealthy');
    assert.strictEqual(res.body.nonceStore, 'down');
    assert.strictEqual(res.body.trafficAccepted, false);
    assert.match(res.body.reason, /REDIS_URL is not set/);
  });

  it('still exposes /metrics even when store is down', async () => {
    const res = await fetchJson('/metrics');
    assert.strictEqual(res.status, 200);
    assert.ok(typeof res.body === 'string');
    assert.match(res.body, /replay_protection_total/);
  });
});
