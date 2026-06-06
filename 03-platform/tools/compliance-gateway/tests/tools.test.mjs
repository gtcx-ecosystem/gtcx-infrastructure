/**
 * @fileoverview Protocol Tool Execution Tests
 *
 * Tests the protocol tool execute path with mocked fetch.
 */

import assert from 'node:assert';
import { describe, it, before, after } from 'node:test';

const originalFetch = global.fetch;

describe('listToolsForAccess', () => {
  it('lists tools accessible to the given profile', async () => {
    const { listToolsForAccess } = await import('../src/tools.mjs?v=list1');
    const tools = listToolsForAccess({
      canMutate: false,
      canQuery: true,
      permissions: ['query:read'],
      subject: 'test-operator',
    });
    assert.ok(Array.isArray(tools));
    assert.ok(tools.some((t) => t.name === 'tradepass_resolveIdentity'));
    assert.ok(!tools.some((t) => t.name === 'tradepass_createIdentity'));
  });
});

describe('protocolTool execute', () => {
  before(() => {
    process.env.PROTOCOL_BASE_URL = 'http://test-protocol.local';
  });

  after(() => {
    global.fetch = originalFetch;
    delete process.env.PROTOCOL_BASE_URL;
  });

  it('calls the protocol endpoint via raw tool definition (no access profile)', async () => {
    let capturedRequest = null;
    global.fetch = async (url, init) => {
      capturedRequest = { url, init };
      return {
        json: async () => ({ success: true, data: 'mocked' }),
      };
    };

    const { toolDefinitions } = await import('../src/tools.mjs?v=raw1');
    const result = await toolDefinitions.tradepass_resolveIdentity.execute({ did: 'did:gtcx:test-123' });

    assert.strictEqual(capturedRequest.url, 'http://test-protocol.local/v1/tradepass/resolveIdentity');
    assert.strictEqual(capturedRequest.init.method, 'POST');
    assert.strictEqual(capturedRequest.init.headers['Content-Type'], 'application/json');
    assert.strictEqual(
      capturedRequest.init.headers['X-GTCX-Gateway-Principal'],
      undefined
    );
    assert.deepStrictEqual(result, { success: true, data: 'mocked' });
  });

  it('calls the protocol endpoint with correct headers and body', async () => {
    let capturedRequest = null;
    global.fetch = async (url, init) => {
      capturedRequest = { url, init };
      return {
        json: async () => ({ success: true, data: 'mocked' }),
      };
    };

    // Re-import to pick up the mocked fetch and PROTOCOL_BASE_URL
    const { createToolRegistry } = await import('../src/tools.mjs?v=exec1');
    const registry = createToolRegistry({
      canMutate: false,
      canQuery: true,
      permissions: ['query:read'],
      subject: 'test-operator',
    });

    assert.ok(registry.tradepass_resolveIdentity, 'should have tradepass_resolveIdentity tool');
    const result = await registry.tradepass_resolveIdentity.execute({ did: 'did:gtcx:test-123' });

    assert.strictEqual(capturedRequest.url, 'http://test-protocol.local/v1/tradepass/resolveIdentity');
    assert.strictEqual(capturedRequest.init.method, 'POST');
    assert.strictEqual(capturedRequest.init.headers['Content-Type'], 'application/json');
    assert.strictEqual(
      capturedRequest.init.headers['X-GTCX-Gateway-Principal'],
      'test-operator'
    );
    assert.deepStrictEqual(JSON.parse(capturedRequest.init.body), { did: 'did:gtcx:test-123' });
    assert.deepStrictEqual(result, { success: true, data: 'mocked' });
  });

  it('includes approval headers for mutating tools when approval is valid', async () => {
    let capturedRequest = null;
    global.fetch = async (url, init) => {
      capturedRequest = { url, init };
      return {
        json: async () => ({ success: true }),
      };
    };

    const { createToolRegistry } = await import('../src/tools.mjs?v=exec2');
    const registry = createToolRegistry({
      canMutate: true,
      canQuery: true,
      permissions: ['query:read', 'query:mutate'],
      subject: 'security-operator',
      approval: {
        valid: true,
        ticket: 'GTCX-TEST-456',
        approvedBy: 'security-lead',
        reason: 'test mutation',
        idempotencyKey: 'idem-abc',
      },
    });

    assert.ok(registry.tradepass_createIdentity, 'should have tradepass_createIdentity tool');
    await registry.tradepass_createIdentity.execute({
      name: 'Test Co-op',
      type: 'cooperative',
      jurisdiction: 'zimbabwe',
    });

    assert.strictEqual(capturedRequest.init.headers['X-GTCX-Approval-Ticket'], 'GTCX-TEST-456');
    assert.strictEqual(capturedRequest.init.headers['X-GTCX-Approved-By'], 'security-lead');
    assert.strictEqual(capturedRequest.init.headers['X-GTCX-Approval-Reason'], 'test mutation');
    assert.strictEqual(capturedRequest.init.headers['X-Idempotency-Key'], 'idem-abc');
  });

  it('skips approval headers when approval is absent', async () => {
    let capturedRequest = null;
    global.fetch = async (url, init) => {
      capturedRequest = { url, init };
      return {
        json: async () => ({ success: true }),
      };
    };

    const { createToolRegistry } = await import('../src/tools.mjs?v=exec3');
    const registry = createToolRegistry({
      canMutate: false,
      canQuery: true,
      permissions: ['query:read'],
      subject: 'readonly-operator',
    });

    await registry.tradepass_resolveIdentity.execute({ did: 'did:gtcx:test-789' });
    assert.strictEqual(capturedRequest.init.headers['X-GTCX-Approval-Ticket'], undefined);
    assert.strictEqual(capturedRequest.init.headers['X-Idempotency-Key'], undefined);
  });
});
