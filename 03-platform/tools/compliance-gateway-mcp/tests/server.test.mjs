/**
 * @fileoverview MCP server contract tests.
 *
 * Verifies tool discovery, JSON-RPC framing, and dispatch routing.
 * The actual HTTP gateway calls are mocked via global.fetch stub.
 */

import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { handleRpc, TOOLS, RESOURCES, PROMPTS } from '../03-platform/src/server.mjs';

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

  it('exposes 5 tools', () => {
    assert.strictEqual(TOOLS.length, 5);
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

  it('03-platform/tools/list returns the catalog', async () => {
    const r = await handleRpc({ jsonrpc: '2.0', id: 2, method: '03-platform/tools/list' });
    assert.strictEqual(r.result.tools.length, 5);
  });

  it('03-platform/tools/call → gtcx_compliance_query POSTs to /v1/query', async () => {
    const r = await handleRpc({
      jsonrpc: '2.0',
      id: 3,
      method: '03-platform/tools/call',
      params: { name: 'gtcx_compliance_query', arguments: { query: 'check status' } },
    });
    assert.strictEqual(fetchCalls[0].url, 'http://gateway.test/v1/query');
    assert.strictEqual(fetchCalls[0].init.method, 'POST');
    assert.strictEqual(r.result.isError, false);
  });

  it('03-platform/tools/call → gtcx_audit_chain GETs /v1/audit/chain', async () => {
    await handleRpc({
      jsonrpc: '2.0',
      id: 4,
      method: '03-platform/tools/call',
      params: { name: 'gtcx_audit_chain', arguments: {} },
    });
    assert.strictEqual(fetchCalls[0].url, 'http://gateway.test/v1/audit/chain');
  });

  it('03-platform/tools/call → unknown tool returns 404 isError', async () => {
    const r = await handleRpc({
      jsonrpc: '2.0',
      id: 5,
      method: '03-platform/tools/call',
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
      method: '03-platform/tools/call',
      params: { name: 'gtcx_audit_evidence_bundle', arguments: { since: '2026-05-01T00:00:00Z' } },
    });
    assert.match(fetchCalls[0].url, /\/v1\/audit\/evidence-bundle\?since=2026-05-01/);
  });

  it('initialize advertises resources + prompts capabilities', async () => {
    const r = await handleRpc({ jsonrpc: '2.0', id: 8, method: 'initialize' });
    assert.ok(r.result.capabilities.resources, 'resources capability missing');
    assert.ok(r.result.capabilities.prompts, 'prompts capability missing');
    assert.ok(r.result.capabilities.tools, 'tools capability missing');
  });
});

describe('MCP — resources (AI-native ambient context)', () => {
  beforeEach(installFetchStub);
  afterEach(uninstallFetchStub);

  it('exposes the morning brief as a discoverable resource', () => {
    const morning = RESOURCES.find((r) => r.uri === 'gtcx://brief/morning');
    assert.ok(morning, 'morning brief resource missing');
    assert.strictEqual(morning.mimeType, 'text/plain');
  });

  it('resources/list returns the catalog', async () => {
    const r = await handleRpc({ jsonrpc: '2.0', id: 10, method: 'resources/list' });
    assert.ok(r.result.resources.length >= 1);
    assert.ok(r.result.resources.some((res) => res.uri === 'gtcx://brief/morning'));
  });

  it('resources/read for morning brief fetches /v1/brief and returns narrative', async () => {
    // Override the stub to return a realistic brief body.
    globalThis.fetch = async () => ({
      status: 200,
      text: async () =>
        JSON.stringify({
          tenantId: 'zw',
          narrative: 'Audit chain is healthy: 4 records, head deadbeef…',
          chainHead: 'deadbeefcafe',
          signing: true,
          spend: { spentUsd: 0.42, limits: { dailyUsd: 5 } },
          producedAt: '2026-05-30T12:00:00Z',
        }),
    });
    const r = await handleRpc({
      jsonrpc: '2.0',
      id: 11,
      method: 'resources/read',
      params: { uri: 'gtcx://brief/morning' },
    });
    assert.strictEqual(r.result.contents.length, 1);
    assert.match(r.result.contents[0].text, /Audit chain is healthy/);
    assert.match(r.result.contents[0].text, /chainHead=deadbeefcafe/);
    assert.match(r.result.contents[0].text, /spendUsd=0.42/);
  });

  it('resources/read for an unknown uri returns isError', async () => {
    const r = await handleRpc({
      jsonrpc: '2.0',
      id: 12,
      method: 'resources/read',
      params: { uri: 'gtcx://no/such/thing' },
    });
    assert.strictEqual(r.result.isError, true);
  });
});

describe('MCP — prompts (named drop-in patterns)', () => {
  beforeEach(installFetchStub);
  afterEach(uninstallFetchStub);

  it('advertises a morning-brief prompt', () => {
    const morning = PROMPTS.find((p) => p.name === 'morning-brief');
    assert.ok(morning, 'morning-brief prompt missing');
  });

  it('prompts/list returns the catalog', async () => {
    const r = await handleRpc({ jsonrpc: '2.0', id: 20, method: 'prompts/list' });
    assert.ok(r.result.prompts.some((p) => p.name === 'morning-brief'));
  });

  it('prompts/get morning-brief expands with live brief content', async () => {
    globalThis.fetch = async () => ({
      status: 200,
      text: async () =>
        JSON.stringify({ narrative: 'All systems nominal.', tenantId: 'zw' }),
    });
    const r = await handleRpc({
      jsonrpc: '2.0',
      id: 21,
      method: 'prompts/get',
      params: { name: 'morning-brief' },
    });
    assert.strictEqual(r.result.messages.length, 1);
    assert.strictEqual(r.result.messages[0].role, 'user');
    assert.match(r.result.messages[0].content.text, /All systems nominal/);
    assert.match(r.result.messages[0].content.text, /THREE short headline items/);
  });

  it('prompts/get for an unknown prompt returns a JSON-RPC error', async () => {
    const r = await handleRpc({
      jsonrpc: '2.0',
      id: 22,
      method: 'prompts/get',
      params: { name: 'nope' },
    });
    assert.ok(r.error);
    assert.match(r.error.message, /Unknown prompt/);
  });
});

describe('MCP — exceptions (AI-native exception-only view)', () => {
  beforeEach(installFetchStub);
  afterEach(uninstallFetchStub);

  it('exposes gtcx_exceptions as a tool', () => {
    const tool = TOOLS.find((t) => t.name === 'gtcx_exceptions');
    assert.ok(tool, 'gtcx_exceptions tool missing');
    assert.match(tool.description, /human judgment/);
  });

  it('exposes the exceptions resource', () => {
    const res = RESOURCES.find((r) => r.uri === 'gtcx://exceptions/current');
    assert.ok(res, 'exceptions resource missing');
    assert.strictEqual(res.mimeType, 'application/json');
  });

  it('03-platform/tools/call → gtcx_exceptions GETs /v1/exceptions and passes kinds + since', async () => {
    await handleRpc({
      jsonrpc: '2.0',
      id: 30,
      method: '03-platform/tools/call',
      params: {
        name: 'gtcx_exceptions',
        arguments: {
          since: '2026-05-01T00:00:00Z',
          kinds: ['query-failure', 'auth-failure'],
          limit: 100,
        },
      },
    });
    const url = fetchCalls[0].url;
    assert.match(url, /\/v1\/exceptions\?/);
    assert.match(url, /since=2026-05-01/);
    assert.match(url, /kinds=query-failure%2Cauth-failure/);
    assert.match(url, /limit=100/);
  });

  it('resources/read of exceptions URI returns JSON payload from the gateway', async () => {
    globalThis.fetch = async () => ({
      status: 200,
      text: async () => JSON.stringify({
        tenantId: 'zw',
        totalExceptions: 2,
        truncated: false,
        exceptions: [
          { kind: 'query-failure', action: 'query:failure' },
          { kind: 'low-confidence', action: 'query:success' },
        ],
      }),
    });
    const r = await handleRpc({
      jsonrpc: '2.0',
      id: 31,
      method: 'resources/read',
      params: { uri: 'gtcx://exceptions/current' },
    });
    assert.strictEqual(r.result.contents[0].mimeType, 'application/json');
    const body = JSON.parse(r.result.contents[0].text);
    assert.strictEqual(body.totalExceptions, 2);
    assert.strictEqual(body.exceptions[0].kind, 'query-failure');
  });
});
