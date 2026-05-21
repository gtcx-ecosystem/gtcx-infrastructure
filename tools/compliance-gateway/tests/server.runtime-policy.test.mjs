/**
 * @fileoverview Runtime Policy Tests
 *
 * Tests that the compliance-gateway respects GTCX_DEGRADATION_MODE
 * and other runtime policies from the ConfigMap.
 */

import assert from 'node:assert';
import { createServer, request } from 'node:http';
import { describe, it, before, after } from 'node:test';

let testServer;
let baseUrl;

async function setupServer(envOverrides = {}) {
  const stub = createServer();
  await new Promise((r) => stub.listen(0, () => r()));
  const port = typeof stub.address() === 'string'
    ? parseInt(stub.address().split(':').pop(), 10)
    : stub.address().port;
  stub.close();

  process.env.PORT = String(port);
  process.env.NODE_ENV = 'test';
  process.env.COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON = JSON.stringify([
    { token: 'rp-test-token', subject: 'rp-test', permissions: ['query:read', 'tools:read', 'providers:read', 'audit:read'] },
  ]);
  process.env.PROTOCOL_BASE_URL = 'http://localhost:9999';

  for (const [k, v] of Object.entries(envOverrides)) {
    process.env[k] = v;
  }

  const mod = await import(`../src/server.mjs?v=rp-${Date.now()}`);
  testServer = mod.server;
  baseUrl = `http://127.0.0.1:${port}`;
  await new Promise((r) => setTimeout(r, 300));
  return { server: testServer, baseUrl };
}

async function teardown() {
  if (testServer) {
    await new Promise((r) => testServer.close(r));
  }
  delete process.env.PORT;
  delete process.env.COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON;
  delete process.env.PROTOCOL_BASE_URL;
  delete process.env.GTCX_DEGRADATION_MODE;
  delete process.env.GTCX_LBW_CACHE_SECONDS;
}

async function fetchHealth(headers = {}) {
  const url = new URL('/health', baseUrl);
  return new Promise((resolve, reject) => {
    const req = request(url, { headers }, (response) => {
      let body = '';
      response.on('data', (c) => { body += c; });
      response.on('end', () => {
        try { resolve({ status: response.statusCode, body: JSON.parse(body), headers: response.headers }); }
        catch { resolve({ status: response.statusCode, body, headers: response.headers }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

describe('Runtime policy — degradation mode', () => {
  it('forced normal mode ignores Save-Data: on', async () => {
    await setupServer({ GTCX_DEGRADATION_MODE: 'normal' });
    try {
      const res = await fetchHealth({ 'Save-Data': 'on' });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['x-low-bandwidth'], 'false');
      assert.strictEqual(res.headers['x-degradation-mode'], 'normal');
    } finally {
      await teardown();
    }
  });

  it('forced minimal mode strips even on fast connections', async () => {
    await setupServer({ GTCX_DEGRADATION_MODE: 'minimal' });
    try {
      const res = await fetchHealth({ Downlink: '10' });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['x-low-bandwidth'], 'true');
      assert.strictEqual(res.headers['x-degradation-mode'], 'minimal');
      assert.strictEqual(res.body._lowBandwidth, true);
    } finally {
      await teardown();
    }
  });

  it('auto mode respects Save-Data header', async () => {
    await setupServer({ GTCX_DEGRADATION_MODE: 'auto' });
    try {
      const res = await fetchHealth({ 'Save-Data': 'on' });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['x-low-bandwidth'], 'true');
      assert.strictEqual(res.headers['x-degradation-mode'], 'auto');
    } finally {
      await teardown();
    }
  });

  it('auto mode respects Downlink < 0.5', async () => {
    await setupServer({ GTCX_DEGRADATION_MODE: 'auto' });
    try {
      const res = await fetchHealth({ Downlink: '0.3' });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['x-low-bandwidth'], 'true');
    } finally {
      await teardown();
    }
  });

  it('uses custom cache seconds from policy', async () => {
    await setupServer({ GTCX_DEGRADATION_MODE: 'minimal', GTCX_LBW_CACHE_SECONDS: '600' });
    try {
      const res = await fetchHealth({ 'Save-Data': 'on' });
      assert.strictEqual(res.status, 200);
      assert.ok(res.headers['cache-control'].includes('max-age=600'), `got ${res.headers['cache-control']}`);
    } finally {
      await teardown();
    }
  });
});
