/**
 * @fileoverview Integration tests for the routes added in Sprints 1-6:
 *   /v1/audit/evidence-bundle, /v1/brief, /v1/budget, /metrics
 *
 * Each route is auth-gated and emits signed audit events. We exercise
 * happy paths, permission gates, and basic shape assertions so the
 * coverage gate reflects the route handlers actually running.
 */

import assert from 'node:assert';
import { createServer, request } from 'node:http';
import { describe, it, before, after } from 'node:test';

import { resetAuditSigner } from '../03-platform/src/audit.mjs';

let testServer;
let baseUrl;

async function setupServer() {
  const stub = createServer();
  await new Promise((r) => stub.listen(0, () => r()));
  const port = stub.address().port;
  stub.close();

  process.env.PORT = String(port);
  process.env.NODE_ENV = 'test';
  process.env.COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON = JSON.stringify([
    {
      token: 'new-routes-token',
      subject: 'new-routes-test',
      permissions: ['query:read', 'tools:read', 'providers:read', 'audit:read'],
      tenantId: 'pilot',
    },
    {
      token: 'no-audit-token',
      subject: 'no-audit',
      permissions: ['query:read', 'tools:read', 'providers:read'],
      tenantId: 'pilot',
    },
  ]);

  resetAuditSigner();
  const mod = await import(`../03-platform/src/server.mjs?v=new-routes-${Date.now()}`);
  testServer = mod.server;
  baseUrl = `http://127.0.0.1:${port}`;
  await new Promise((r) => setTimeout(r, 200));
}

async function teardown() {
  if (testServer) {
    await new Promise((r) => testServer.close(r));
  }
  delete process.env.PORT;
  delete process.env.COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON;
  resetAuditSigner();
}

function httpGet(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = request(`${baseUrl}${path}`, { headers }, (res) => {
      let data = '';
      res.on('data', (c) => {
        data += c;
      });
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

describe('Sprint 1-6 routes — integration', () => {
  before(setupServer);
  after(teardown);

  describe('GET /v1/audit/evidence-bundle', () => {
    it('returns a verifiable bundle for the caller tenant', async () => {
      const res = await httpGet('/v1/audit/evidence-bundle', {
        Authorization: 'Bearer new-routes-token',
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.bundleVersion, '1');
      assert.strictEqual(res.body.tenantId, 'pilot');
      assert.ok(typeof res.body.ndjson === 'string');
      assert.ok(res.body.verification.algorithm.includes('ed25519'));
      assert.ok(res.body.verification.instructions.includes('@gtcx/audit-signer'));
    });

    it('accepts a since query parameter', async () => {
      const since = encodeURIComponent('2026-01-01T00:00:00Z');
      const res = await httpGet(`/v1/audit/evidence-bundle?since=${since}`, {
        Authorization: 'Bearer new-routes-token',
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.producedAt);
    });

    it('returns 403 without audit:read permission', async () => {
      const res = await httpGet('/v1/audit/evidence-bundle', {
        Authorization: 'Bearer no-audit-token',
      });
      assert.strictEqual(res.status, 403);
    });

    it('returns 401 without a token', async () => {
      const res = await httpGet('/v1/audit/evidence-bundle');
      assert.strictEqual(res.status, 401);
    });

    it('sets a restrictive CSP header for HTML evidence', async () => {
      const res = await httpGet('/v1/audit/evidence-bundle?format=html', {
        Authorization: 'Bearer new-routes-token',
      });
      assert.strictEqual(res.status, 200);
      assert.match(res.headers['content-type'], /text\/html/);
      assert.match(res.headers['content-security-policy'], /default-src 'none'/);
      assert.match(res.headers['content-security-policy'], /script-src 'none'/);
    });

    it('emits request and record-count metrics', async () => {
      await httpGet('/v1/audit/evidence-bundle', {
        Authorization: 'Bearer new-routes-token',
      });
      const metrics = await httpGet('/metrics');
      assert.match(
        metrics.body,
        /compliance_gateway_requests_total\{route="\/v1\/audit\/evidence-bundle",status="200",tenantId="pilot"\}/
      );
      assert.match(
        metrics.body,
        /compliance_gateway_evidence_bundle_records_total\{format="json",tenantId="pilot"\}/
      );
    });
  });

  describe('GET /v1/exceptions', () => {
    it('returns exception feed for the caller tenant', async () => {
      const res = await httpGet('/v1/exceptions', {
        Authorization: 'Bearer new-routes-token',
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.tenantId, 'pilot');
      assert.ok(Array.isArray(res.body.exceptions));
    });

    it('emits request and served-count metrics', async () => {
      await httpGet('/v1/exceptions', {
        Authorization: 'Bearer new-routes-token',
      });
      const metrics = await httpGet('/metrics');
      assert.match(
        metrics.body,
        /compliance_gateway_requests_total\{route="\/v1\/exceptions",status="200",tenantId="pilot"\}/
      );
      assert.match(
        metrics.body,
        /compliance_gateway_exceptions_served_total\{tenantId="pilot",truncated="false"\}/
      );
    });
  });

  describe('GET /v1/brief', () => {
    it('returns a one-paragraph morning brief', async () => {
      const res = await httpGet('/v1/brief', {
        Authorization: 'Bearer new-routes-token',
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.tenantId, 'pilot');
      assert.ok(res.body.producedAt);
      assert.ok(typeof res.body.narrative === 'string');
      assert.ok(res.body.signing === true || res.body.signing === false);
    });

    it('accepts a since query param', async () => {
      const since = encodeURIComponent('2026-01-01T00:00:00Z');
      const res = await httpGet(`/v1/brief?since=${since}`, {
        Authorization: 'Bearer new-routes-token',
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.since, '2026-01-01T00:00:00Z');
    });

    it('returns 401 without a token', async () => {
      const res = await httpGet('/v1/brief');
      assert.strictEqual(res.status, 401);
    });
  });

  describe('GET /v1/budget', () => {
    it('returns current spend + limits for the caller', async () => {
      const res = await httpGet('/v1/budget', {
        Authorization: 'Bearer new-routes-token',
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.subject, 'new-routes-test');
      assert.strictEqual(res.body.tenantId, 'pilot');
      assert.ok(typeof res.body.spentUsd === 'number');
      assert.ok(typeof res.body.limits.qps === 'number');
      assert.ok(typeof res.body.limits.dailyUsd === 'number');
    });

    it('returns 401 without a token', async () => {
      const res = await httpGet('/v1/budget');
      assert.strictEqual(res.status, 401);
    });
  });

  describe('GET /metrics', () => {
    it('returns Prometheus exposition format', async () => {
      const res = await httpGet('/metrics');
      assert.strictEqual(res.status, 200);
      assert.ok(typeof res.body === 'string');
      assert.match(res.body, /# HELP compliance_gateway_audit/);
      assert.match(res.body, /# TYPE compliance_gateway_audit/);
    });

    it('exposes the audit_signing gauge', async () => {
      const res = await httpGet('/metrics');
      assert.match(res.body, /compliance_gateway_audit_signing/);
    });

    it('exposes the inflight_requests gauge', async () => {
      const res = await httpGet('/metrics');
      assert.match(res.body, /compliance_gateway_inflight_requests/);
    });

    it('is reachable without auth (Prometheus scrape pattern)', async () => {
      const res = await httpGet('/metrics');
      assert.strictEqual(res.status, 200);
    });
  });
});
