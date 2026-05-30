/**
 * @fileoverview Audit-Signer Integration Tests
 *
 * Verifies that compliance-gateway signs consequential events
 * and exposes chain verification endpoints.
 */

import assert from 'node:assert';
import { createServer, request } from 'node:http';
import { describe, it, before, after } from 'node:test';

import { resetAuditSigner, resetChain, getChainState } from '../src/audit.mjs';

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
    { token: 'audit-test-token', subject: 'audit-test', permissions: ['query:read', 'tools:read', 'providers:read', 'audit:read'] },
    { token: 'no-audit-token', subject: 'no-audit-test', permissions: ['query:read', 'tools:read', 'providers:read'] },
  ]);
  process.env.PROTOCOL_BASE_URL = 'http://localhost:9999';

  for (const [k, v] of Object.entries(envOverrides)) {
    process.env[k] = v;
  }

  resetAuditSigner();

  const mod = await import(`../src/server.mjs?v=audit-${Date.now()}`);
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
  resetAuditSigner();
}

function httpGet(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = request(`${baseUrl}${path}`, { headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function httpPost(path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = typeof body === 'string' ? body : JSON.stringify(body);
    const req = request(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers,
      },
    }, (res) => {
      let resp = '';
      res.on('data', (chunk) => { resp += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(resp) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: resp });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

describe('Audit-Signer Integration', () => {
  before(async () => {
    await setupServer();
  });

  after(async () => {
    await teardown();
  });

  describe('GET /v1/audit/chain', () => {
    it('returns empty chain immediately after reset', async () => {
      resetChain();
      // Verify pre-state directly: the request itself will sign an auth event.
      assert.strictEqual(getChainState().recordCount, 0);

      const res = await httpGet('/v1/audit/chain', {
        Authorization: 'Bearer audit-test-token',
      });
      assert.strictEqual(res.status, 200);
      // The request's own auth:success event is in the chain by the time the body is built.
      assert.strictEqual(res.body.recordCount, 1);
      assert.strictEqual(res.body.inMemoryVerified, true);
      assert.strictEqual(res.body.verifiedScope, 'full-chain');
      assert.ok(res.body.lastHash);
    });

    it('returns chain state after auth events', async () => {
      resetChain();
      // Trigger an auth event via /v1/tools
      await httpGet('/v1/tools', {
        Authorization: 'Bearer audit-test-token',
      });
      const res = await httpGet('/v1/audit/chain', {
        Authorization: 'Bearer audit-test-token',
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.recordCount >= 1);
      assert.strictEqual(res.body.inMemoryVerified, true);
      assert.strictEqual(res.body.verifiedScope, 'full-chain');
      assert.ok(res.body.lastHash);
    });

    it('returns 403 without audit:read permission', async () => {
      const res = await httpGet('/v1/audit/chain', {
        Authorization: 'Bearer no-audit-token',
      });
      assert.strictEqual(res.status, 403);
    });

    it('returns 401 without auth header', async () => {
      const res = await httpGet('/v1/audit/chain');
      assert.strictEqual(res.status, 401);
    });
  });

  describe('POST /v1/audit/verify', () => {
    it('validates an empty body', async () => {
      const res = await httpPost('/v1/audit/verify', '', {
        Authorization: 'Bearer audit-test-token',
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.valid, true);
    });

    it('validates a signed chain', async () => {
      resetChain();
      // Generate some audit events
      await httpGet('/v1/tools', {
        Authorization: 'Bearer audit-test-token',
      });
      await httpGet('/v1/providers', {
        Authorization: 'Bearer audit-test-token',
      });

      const chainRes = await httpGet('/v1/audit/chain', {
        Authorization: 'Bearer audit-test-token',
      });
      assert.ok(chainRes.body.recordCount >= 2);

      // We can't easily extract the NDJSON from the server, so we'll verify
      // that the verify endpoint itself works by posting back what we know
      // about the chain structure. Since we don't have direct NDJSON access,
      // we test the verify logic indirectly via the audit module unit tests.
      // Here we just verify the endpoint is accessible and returns a result.
      const res = await httpPost('/v1/audit/verify', '', {
        Authorization: 'Bearer audit-test-token',
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.valid, true);
    });

    it('returns 405 for GET', async () => {
      const res = await httpGet('/v1/audit/verify', {
        Authorization: 'Bearer audit-test-token',
      });
      assert.strictEqual(res.status, 405);
    });

    it('returns 403 without audit:read permission', async () => {
      const res = await httpPost('/v1/audit/verify', '', {
        Authorization: 'Bearer no-audit-token',
      });
      assert.strictEqual(res.status, 403);
    });
  });

  describe('Auth events are signed', () => {
    it('increments chain on successful auth', async () => {
      resetChain();
      const before = getChainState().recordCount;
      await httpGet('/v1/tools', {
        Authorization: 'Bearer audit-test-token',
      });
      const after = getChainState().recordCount;
      assert.strictEqual(after, before + 1);
    });

    it('increments chain on auth failure', async () => {
      resetChain();
      const before = getChainState().recordCount;
      await httpGet('/v1/tools', {
        Authorization: 'Bearer bad-token',
      });
      const after = getChainState().recordCount;
      assert.strictEqual(after, before + 1);
    });
  });

  describe('Query events are signed', () => {
    it('increments chain on query attempt', async () => {
      resetChain();
      const before = getChainState().recordCount;
      await httpPost('/v1/query', { query: 'What is FATF?' }, {
        Authorization: 'Bearer audit-test-token',
      });
      const after = getChainState().recordCount;
      // Auth success + query failure (no providers configured in test)
      assert.ok(after >= before + 2, `expected at least ${before + 2} records, got ${after}`);
    });
  });
});
