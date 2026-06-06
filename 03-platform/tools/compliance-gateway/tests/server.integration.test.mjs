/**
 * @fileoverview Compliance Gateway HTTP Integration Tests
 *
 * Spins up the HTTP server on an ephemeral port and exercises the auth boundary:
 *   - 401 without authentication
 *   - 401 with invalid token
 *   - 403 with valid token but missing permission
 *   - Read-only token → mutating tools excluded from /v1/tools
 *   - Mutate token without approval → mutating tools still excluded
 *   - Mutate token with approval → mutating tools included
 *
 * Uses only Node.js built-ins — no external test framework.
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

describe('Compliance Gateway Integration', () => {
  before(async () => {
    // Find an ephemeral port
    const stubServer = createServer();
    await new Promise((r) => stubServer.listen(0, () => r()));
    const addr = stubServer.address();
    const port = typeof addr === 'string' ? parseInt(addr.split(':').pop() || '0', 10) : (addr?.port || 0);
    stubServer.close();

    process.env.PORT = String(port);
    process.env.NODE_ENV = 'test';
    process.env.COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON = JSON.stringify([
      {
        token: 'readonly-test-token',
        subject: 'readonly-operator',
        permissions: ['query:read', 'tools:read', 'providers:read', 'audit:read'],
      },
      {
        token: 'mutate-test-token',
        subject: 'security-operator',
        permissions: ['query:read', 'query:mutate', 'tools:read', 'providers:read', 'audit:read'],
      },
      {
        token: 'limited-test-token',
        subject: 'limited-operator',
        permissions: ['query:read'],
      },
    ]);
    process.env.PROTOCOL_BASE_URL = 'http://localhost:9999'; // Dummy — no real protocol calls in these tests

    // The ai package import is slow; allow extra time for module load
    const mod = await import('../src/server.mjs');
    testServer = mod.server;
    baseUrl = `http://127.0.0.1:${port}`;
    // Wait for server to be listening
    await new Promise((r) => setTimeout(r, 500));
  });

  after(() => {
    testServer?.close();
    delete process.env.PORT;
    delete process.env.COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON;
  });

  describe('GET /health', () => {
    it('returns healthy with auth configured', async () => {
      const res = await fetchJson('/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'healthy');
      assert.strictEqual(res.body.authConfigured, true);
      assert.strictEqual(res.body.authMode, 'configured');
    });
  });

  describe('Authentication boundary', () => {
    it('returns 401 when no Authorization header is provided', async () => {
      const res = await fetchJson('/v1/tools');
      assert.strictEqual(res.status, 401);
      assert.match(res.body.error, /Missing bearer token/);
    });

    it('returns 401 when bearer token is invalid', async () => {
      const res = await fetchJson('/v1/tools', {
        headers: { authorization: 'Bearer invalid-token' },
      });
      assert.strictEqual(res.status, 401);
      assert.match(res.body.error, /Invalid bearer token/);
    });

    it('returns 403 when token lacks required permission', async () => {
      // limited-test-token only has 'query:read', not 'tools:read'
      const res = await fetchJson('/v1/tools', {
        headers: { authorization: 'Bearer limited-test-token' },
      });
      assert.strictEqual(res.status, 403);
      assert.match(res.body.error, /Missing required permission: tools:read/);
    });
  });

  describe('GET /v1/tools — tool segregation', () => {
    it('read-only token excludes mutating tools', async () => {
      const res = await fetchJson('/v1/tools', {
        headers: { authorization: 'Bearer readonly-test-token' },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.mutatingToolsEnabled, false);

      const toolNames = res.body.tools.map((t) => t.name);
      assert.ok(toolNames.length > 0, 'should have some tools');
      assert.ok(!toolNames.some((n) => n.startsWith('pvp_execute')), 'should not include pvp_executeSettlement');
      assert.ok(!toolNames.some((n) => n.startsWith('tradepass_createIdentity')), 'should not include tradepass_createIdentity');
    });

    it('mutate token WITHOUT approval still excludes mutating tools', async () => {
      const res = await fetchJson('/v1/tools', {
        headers: { authorization: 'Bearer mutate-test-token' },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.mutatingToolsEnabled, false);

      const toolNames = res.body.tools.map((t) => t.name);
      assert.ok(!toolNames.some((n) => n.startsWith('pvp_execute')), 'should not include mutating tools without approval');
    });

    it('mutate token WITH approval includes mutating tools', async () => {
      const res = await fetchJson('/v1/tools', {
        headers: {
          authorization: 'Bearer mutate-test-token',
          'x-gtcx-approval-ticket': 'GTCX-TEST-123',
          'x-gtcx-approved-by': 'security-lead',
          'x-gtcx-approval-reason': 'integration test',
          'x-idempotency-key': 'idem-test-123',
        },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.mutatingToolsEnabled, true);

      const toolNames = res.body.tools.map((t) => t.name);
      assert.ok(toolNames.some((n) => n === 'pvp_executeSettlement'), 'should include pvp_executeSettlement with approval');
      assert.ok(toolNames.some((n) => n === 'tradepass_createIdentity'), 'should include tradepass_createIdentity with approval');
    });
  });

  describe('GET /v1/providers', () => {
    it('requires authentication', async () => {
      const res = await fetchJson('/v1/providers');
      assert.strictEqual(res.status, 401);
    });

    it('returns provider list with valid token', async () => {
      const res = await fetchJson('/v1/providers', {
        headers: { authorization: 'Bearer readonly-test-token' },
      });
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.providers));
    });
  });

  describe('GET /v1/exceptions', () => {
    it('requires audit:read permission', async () => {
      const res = await fetchJson('/v1/exceptions', {
        headers: { authorization: 'Bearer limited-test-token' },
      });
      assert.strictEqual(res.status, 403);
    });

    it('returns exceptions list with kinds filter', async () => {
      const res = await fetchJson('/v1/exceptions?kinds=auth,rate&limit=10', {
        headers: { authorization: 'Bearer readonly-test-token' },
      });
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.exceptions));
    });
  });

  describe('POST /v1/query', () => {
    it('requires authentication', async () => {
      const res = await fetchJson('/v1/query', { method: 'POST' });
      assert.strictEqual(res.status, 401);
    });

    it('returns 503 when no LLM providers are configured', async () => {
      const res = await fetchJson('/v1/query', {
        method: 'POST',
        headers: {
          authorization: 'Bearer readonly-test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: 'What is the compliance status?' }),
      });
      // No API keys set, so no providers available → 503
      assert.strictEqual(res.status, 503);
      assert.match(res.body.error, /No LLM providers configured/);
    });
  });

  describe('POST /v1/query — input validation', () => {
    it('returns 405 for GET /v1/query', async () => {
      const res = await fetchJson('/v1/query', {
        headers: { authorization: 'Bearer readonly-test-token' },
      });
      assert.strictEqual(res.status, 405);
      assert.match(res.body.error, /Method not allowed/);
    });

    it('returns 400 for invalid JSON body', async () => {
      const res = await fetchJson('/v1/query', {
        method: 'POST',
        headers: {
          authorization: 'Bearer readonly-test-token',
          'Content-Type': 'application/json',
        },
        body: 'not-json',
      });
      assert.strictEqual(res.status, 400);
      assert.match(res.body.error, /Invalid JSON/);
    });

    it('returns 400 when query field is missing', async () => {
      const res = await fetchJson('/v1/query', {
        method: 'POST',
        headers: {
          authorization: 'Bearer readonly-test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jurisdiction: 'south_africa' }),
      });
      assert.strictEqual(res.status, 400);
      assert.match(res.body.error, /query/);
      assert.ok(res.body.fieldErrors);
    });

    it('returns 400 when query field is not a string', async () => {
      const res = await fetchJson('/v1/query', {
        method: 'POST',
        headers: {
          authorization: 'Bearer readonly-test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: 123 }),
      });
      assert.strictEqual(res.status, 400);
      assert.match(res.body.error, /query/);
    });

    it('returns 400 with fieldErrors when jurisdiction is unknown', async () => {
      const res = await fetchJson('/v1/query', {
        method: 'POST',
        headers: {
          authorization: 'Bearer readonly-test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: 'Check compliance', jurisdiction: 'narnia' }),
      });
      assert.strictEqual(res.status, 400);
      assert.match(res.body.error, /jurisdiction/);
    });
  });

  describe('Low bandwidth mode', () => {
    it('strips verbose fields when Save-Data: on', async () => {
      const res = await fetchJson('/v1/providers', {
        headers: {
          authorization: 'Bearer readonly-test-token',
          'Save-Data': 'on',
        },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body._lowBandwidth, true);
      if (res.body.providers && res.body.providers.length > 0) {
        assert.ok(!('inputCostPer1M' in res.body.providers[0]), 'should strip cost details in low-bandwidth mode');
      }
    });

    it('strips verbose fields via ?lowBandwidth=true query param', async () => {
      const res = await fetchJson('/v1/tools?lowBandwidth=true', {
        headers: { authorization: 'Bearer readonly-test-token' },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body._lowBandwidth, true);
      if (res.body.tools && res.body.tools.length > 0) {
        const tool = res.body.tools[0];
        const keys = Object.keys(tool);
        assert.deepStrictEqual(keys, ['name'], 'should only include name in low-bandwidth mode');
      }
    });

    it('activates low bandwidth when downlink < 0.5', async () => {
      const res = await fetchJson('/health', {
        headers: { Downlink: '0.3' },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body._lowBandwidth, true);
    });
  });

  describe('Compression', () => {
    it('supports gzip compression when requested', async () => {
      const url = new URL('/health', baseUrl);
      const res = await new Promise((resolve, reject) => {
        const req = httpRequest(url, {
          method: 'GET',
          headers: { 'Accept-Encoding': 'gzip' },
        }, (response) => {
          const chunks = [];
          response.on('data', (c) => chunks.push(c));
          response.on('end', () => {
            resolve({
              status: response.statusCode,
              encoding: response.headers['content-encoding'],
              body: Buffer.concat(chunks),
            });
          });
        });
        req.on('error', reject);
        req.end();
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.encoding, 'gzip');
      // Verify it's actually gzipped by checking magic bytes
      assert.ok(res.body[0] === 0x1f && res.body[1] === 0x8b, 'response should be gzip compressed');
    });

    it('supports brotli compression when requested', async () => {
      const url = new URL('/health', baseUrl);
      const res = await new Promise((resolve, reject) => {
        const req = httpRequest(url, {
          method: 'GET',
          headers: { 'Accept-Encoding': 'br' },
        }, (response) => {
          const chunks = [];
          response.on('data', (c) => chunks.push(c));
          response.on('end', () => {
            resolve({
              status: response.statusCode,
              encoding: response.headers['content-encoding'],
              body: Buffer.concat(chunks),
            });
          });
        });
        req.on('error', reject);
        req.end();
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.encoding, 'br');
    });
  });

  describe('Query with context', () => {
    it('returns 503 with context included in error (no providers configured)', async () => {
      const res = await fetchJson('/v1/query', {
        method: 'POST',
        headers: {
          authorization: 'Bearer readonly-test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'Check compliance',
          jurisdiction: 'south_africa',
          context: { shipmentId: 'SHP-123' },
        }),
      });
      assert.strictEqual(res.status, 503);
    });
  });

  describe('Unknown routes', () => {
    it('returns 404 for unmapped paths', async () => {
      const res = await fetchJson('/v1/unknown');
      assert.strictEqual(res.status, 404);
    });
  });
});
