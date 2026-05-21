/**
 * @fileoverview MCP server contract tests.
 *
 * Verifies tool discovery, JSON-RPC framing, and dispatch routing.
 * The actual HTTP gateway calls are mocked via global.fetch stub.
 */

import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { handleRpc, TOOLS } from '../src/server.mjs';

let fetchCalls = [];
const originalFetch = globalThis.fetch;

function installFetchStub() {
  fetchCalls = [];
  globalThis.fetch = async (url, init) => {
    fetchCalls.push({ url, init });
    return {
      status: 200,
      text: async () => JSON.stringify({ ok: true, url }),
    };
  };
  process.env.GATEWAY_TOKEN = 'test-token';
  process.env.GATEWAY_URL = 'http://gateway.test';
}

function uninstallFetchStub() {
  globalThis.fetch = originalFetch;
  delete process.env.GATEWAY_TOKEN;
  delete process.env.GATEWAY_URL;
}

describe('MCP — tool catalog', () => {
  beforeEach(installFetchStub);
  afterEach(uninstallFetchStub);

  it('exposes 4 tools', () => {
    assert.strictEqual(TOOLS.length, 4);
  });

  it('every tool has a description and inputSchema', () => {
    for (const t of TOOLS) {
      assert.ok(t.name, 'name missing');
      assert.ok(t.description, `description missing for ${t.name}`);
      assert.ok(t.inputSchema, `inputSchema missing for ${t.name}`);
    }
  });

  it('does not expose any mutating tool', () => {
    const mutating = TOOLS.filter((t) => /mutate|approve|issue|revoke|execute/i.test(t.name));
    assert.deepStrictEqual(mutating, [], 'mutating tools must require an HTTP approval ticket');
  });
});

describe('MCP — JSON-RPC dispatch', () => {
  beforeEach(installFetchStub);
  afterEach(uninstallFetchStub);

  it('initialize returns server info + protocolVersion', async () => {
    const r = await handleRpc({ jsonrpc: '2.0', id: 1, method: 'initialize' });
    assert.strictEqual(r.result.serverInfo.name, 'gtcx-compliance-gateway-mcp');
    assert.ok(r.result.protocolVersion);
  });

  it('tools/list returns the catalog', async () => {
    const r = await handleRpc({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
    assert.strictEqual(r.result.tools.length, 4);
  });

  it('tools/call → gtcx_compliance_query POSTs to /v1/query', async () => {
    const r = await handleRpc({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: { name: 'gtcx_compliance_query', arguments: { query: 'check status' } },
    });
    assert.strictEqual(fetchCalls[0].url, 'http://gateway.test/v1/query');
    assert.strictEqual(fetchCalls[0].init.method, 'POST');
    assert.strictEqual(r.result.isError, false);
  });

  it('tools/call → gtcx_audit_chain GETs /v1/audit/chain', async () => {
    await handleRpc({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: { name: 'gtcx_audit_chain', arguments: {} },
    });
    assert.strictEqual(fetchCalls[0].url, 'http://gateway.test/v1/audit/chain');
  });

  it('tools/call → unknown tool returns 404 isError', async () => {
    const r = await handleRpc({
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: { name: 'does-not-exist', arguments: {} },
    });
    assert.strictEqual(r.result.isError, true);
  });

  it('rejects unknown methods with JSON-RPC -32601', async () => {
    const r = await handleRpc({ jsonrpc: '2.0', id: 6, method: 'no/such/method' });
    assert.strictEqual(r.error.code, -32601);
  });

  it('evidence-bundle passes through ?since query param', async () => {
    await handleRpc({
      jsonrpc: '2.0',
      id: 7,
      method: 'tools/call',
      params: { name: 'gtcx_audit_evidence_bundle', arguments: { since: '2026-05-01T00:00:00Z' } },
    });
    assert.match(fetchCalls[0].url, /\/v1\/audit\/evidence-bundle\?since=2026-05-01/);
  });
});
