/**
 * @fileoverview Server Edge-Case Tests
 *
 * Unit tests for previously uncovered branches in server.mjs and system-prompt.mjs:
 *   - handleQuery success + fallback failure paths
 *   - estimateCost with/without usage
 *   - stripForLowBandwidth for all endpoints
 *   - sendJson compression + low-bandwidth branches
 *   - Top-level server catch block (500)
 *   - authState.defaulted startup warning
 *   - system-prompt.mjs jurisdictions file missing fallback
 */

import assert from 'node:assert';
import { createServer, request as httpRequest } from 'node:http';
import { describe, it, before, after } from 'node:test';
import { renameSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const jurisdictionsPath = join(__dirname, '../../compliance-data/jurisdictions.json');

async function getEphemeralPort() {
  const srv = createServer();
  await new Promise((r) => srv.listen(0, () => r()));
  const addr = srv.address();
  const port = typeof addr === 'string' ? parseInt(addr.split(':').pop() || '0', 10) : (addr?.port || 0);
  srv.close();
  await new Promise((r) => srv.once('close', r));
  return port;
}

async function fetchJson(baseUrl, path, opts = {}) {
  const url = new URL(path, baseUrl);
  return new Promise((resolve, reject) => {
    const req = httpRequest(url, { method: opts.method ?? 'GET', headers: opts.headers }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, body }); }
      });
    });
    req.on('error', reject);
    if (opts.body) req.write(typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body));
    req.end();
  });
}

function createMockReq(body, headers = {}) {
  return {
    headers,
    method: 'POST',
    url: '/v1/query',
    async *[Symbol.asyncIterator]() {
      yield Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
    },
  };
}

function createMockRes() {
  return {
    statusCode: null,
    _headers: {},
    _data: null,
    writeHead(status, headers) {
      this.statusCode = status;
      Object.assign(this._headers, headers);
    },
    end(data) {
      this._data = data;
    },
  };
}

// ---------------------------------------------------------------------------
// handleQuery
// ---------------------------------------------------------------------------

describe('handleQuery', () => {
  let handleQuery;
  let srv;

  before(async () => {
    process.env.PORT = '0';
    process.env.COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON = JSON.stringify([
      { token: 'hq-test-token', subject: 'hq-test', permissions: ['query:read'] },
    ]);
    const mod = await import('../src/server.mjs?v=hq');
    handleQuery = mod.handleQuery;
    srv = mod.server;
  });

  after(() => {
    srv?.close();
    delete process.env.PORT;
    delete process.env.COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON;
  });

  it('returns 200 with routing metadata on successful generation', async () => {
    const mockProvider = {
      name: 'mock-gemini',
      model: 'gemini-mock',
      tier: 'cheap',
      inputCostPer1M: 0.1,
      outputCostPer1M: 0.4,
      maxTools: 10,
      createModel: () => 'mock-model-instance',
    };

    const mockGenerateText = async () => ({
      text: 'Compliant — all checks passed.',
      usage: { promptTokens: 120, completionTokens: 40 },
      steps: [
        {
          toolCalls: [{ toolName: 'gci_getScoreBreakdown', args: { id: 'T-123' } }],
          toolResults: [{ toolName: 'gci_getScoreBreakdown', result: 'Score: 95' }],
        },
      ],
    });

    const req = createMockReq({ query: 'Check compliance status', jurisdiction: 'ZA' }, {
      authorization: 'Bearer hq-test-token',
      'content-type': 'application/json',
    });
    const res = createMockRes();

    await handleQuery(req, res, {
      generateText: mockGenerateText,
      selectProvider: () => mockProvider,
      getFallbackChain: () => [],
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res._data);
    assert.strictEqual(body.answer, 'Compliant — all checks passed.');
    assert.ok(Array.isArray(body.toolCalls));
    assert.strictEqual(body.toolCalls[0].tool, 'gci_getScoreBreakdown');
    assert.ok(body.routing);
    assert.strictEqual(body.routing.provider, 'mock-gemini');
    assert.strictEqual(body.routing.model, 'gemini-mock');
    assert.strictEqual(body.routing.tier, 'cheap');
    assert.strictEqual(body.routing.complexity, 'simple');
    assert.ok(typeof body.routing.latencyMs === 'number');
    assert.strictEqual(body.routing.fallbacksAvailable, 0);
    assert.ok(body.routing.estimatedCost);
    assert.strictEqual(body.routing.estimatedCost.inputTokens, 120);
    assert.strictEqual(body.routing.estimatedCost.outputTokens, 40);
    assert.ok(body.authz);
    assert.strictEqual(body.authz.subject, 'hq-test');
    assert.strictEqual(body.usage.promptTokens, 120);
    assert.ok(body.routing.estimatedCost.totalCostUSD >= 0);
  });

  it('returns 502 when all providers in fallback chain fail', async () => {
    const mockProviderA = {
      name: 'mock-a',
      model: 'model-a',
      tier: 'cheap',
      inputCostPer1M: 0.1,
      outputCostPer1M: 0.4,
      maxTools: 10,
      createModel: () => 'model-a',
    };
    const mockProviderB = {
      name: 'mock-b',
      model: 'model-b',
      tier: 'mid',
      inputCostPer1M: 1.0,
      outputCostPer1M: 4.0,
      maxTools: 10,
      createModel: () => 'model-b',
    };

    const mockGenerateText = async () => {
      throw new Error('Provider unreachable');
    };

    const req = createMockReq({ query: 'Settlement dispute' }, {
      authorization: 'Bearer hq-test-token',
      'content-type': 'application/json',
    });
    const res = createMockRes();

    await handleQuery(req, res, {
      generateText: mockGenerateText,
      selectProvider: () => mockProviderA,
      getFallbackChain: () => [mockProviderB],
    });

    assert.strictEqual(res.statusCode, 502);
    const body = JSON.parse(res._data);
    assert.match(body.error, /All LLM providers failed/);
    assert.ok(Array.isArray(body.attempts));
    assert.strictEqual(body.attempts.length, 2);
    assert.strictEqual(body.attempts[0].provider, 'mock-a');
    assert.strictEqual(body.attempts[1].provider, 'mock-b');
  });

  it('returns 503 when no providers are available', async () => {
    const req = createMockReq({ query: 'Check status' }, {
      authorization: 'Bearer hq-test-token',
      'content-type': 'application/json',
    });
    const res = createMockRes();

    await handleQuery(req, res, {
      generateText: async () => ({ text: 'x', usage: {}, steps: [] }),
      selectProvider: () => null,
      getFallbackChain: () => [],
    });

    assert.strictEqual(res.statusCode, 503);
    const body = JSON.parse(res._data);
    assert.match(body.error, /No LLM providers configured/);
  });
});

// ---------------------------------------------------------------------------
// estimateCost
// ---------------------------------------------------------------------------

describe('estimateCost', () => {
  let estimateCost;
  let srv;

  before(async () => {
    process.env.PORT = '0';
    const mod = await import('../src/server.mjs?v=ec');
    estimateCost = mod.estimateCost;
    srv = mod.server;
  });

  after(() => {
    srv?.close();
    delete process.env.PORT;
  });

  it('returns null when usage is absent', () => {
    const provider = { inputCostPer1M: 0.1, outputCostPer1M: 0.4 };
    assert.strictEqual(estimateCost(provider, null), null);
  });

  it('calculates cost correctly for given usage', () => {
    const provider = { inputCostPer1M: 1.0, outputCostPer1M: 4.0 };
    const usage = { promptTokens: 1_000_000, completionTokens: 500_000 };
    const cost = estimateCost(provider, usage);
    assert.strictEqual(cost.inputTokens, 1_000_000);
    assert.strictEqual(cost.outputTokens, 500_000);
    assert.strictEqual(cost.inputCostUSD, 1.0);
    assert.strictEqual(cost.outputCostUSD, 2.0);
    assert.strictEqual(cost.totalCostUSD, 3.0);
  });

  it('handles zero tokens gracefully', () => {
    const provider = { inputCostPer1M: 1.0, outputCostPer1M: 4.0 };
    const cost = estimateCost(provider, { promptTokens: 0, completionTokens: 0 });
    assert.strictEqual(cost.totalCostUSD, 0);
  });
});

// ---------------------------------------------------------------------------
// stripForLowBandwidth
// ---------------------------------------------------------------------------

describe('stripForLowBandwidth', () => {
  let stripForLowBandwidth;
  let srv;

  before(async () => {
    process.env.PORT = '0';
    const mod = await import('../src/server.mjs?v=slb');
    stripForLowBandwidth = mod.stripForLowBandwidth;
    srv = mod.server;
  });

  after(() => {
    srv?.close();
    delete process.env.PORT;
  });

  it('returns non-objects unchanged', () => {
    assert.strictEqual(stripForLowBandwidth(null, '/v1/query'), null);
    assert.strictEqual(stripForLowBandwidth('string', '/v1/query'), 'string');
  });

  it('strips /v1/query response fields', () => {
    const body = {
      answer: 'Yes, compliant.',
      authz: { subject: 'user' },
      usage: { tokens: 100 },
      routing: {
        provider: 'gemini',
        model: 'flash',
        tier: 'free',
        latencyMs: 120,
        complexity: 'simple',
      },
      toolResults: [
        { tool: 'gci', result: 'a'.repeat(500) },
        { tool: 'geo', result: { lat: 1, lng: 2 } },
      ],
      extra: 'field',
    };
    const stripped = stripForLowBandwidth(body, '/v1/query');
    assert.strictEqual(stripped.answer, 'Yes, compliant.');
    assert.strictEqual(stripped._lowBandwidth, true);
    assert.strictEqual(stripped.authz, undefined);
    assert.strictEqual(stripped.usage, undefined);
    assert.strictEqual(stripped.routing.provider, 'gemini');
    assert.strictEqual(stripped.routing.latencyMs, 120);
    assert.strictEqual(stripped.routing.model, undefined);
    assert.strictEqual(stripped.toolResults[0].result, 'a'.repeat(200));
    assert.deepStrictEqual(stripped.toolResults[1].result, { lat: 1, lng: 2 });
    assert.strictEqual(stripped.extra, 'field');
  });

  it('strips /v1/tools response fields', () => {
    const body = {
      tools: [
        { name: 'gci_getScore', parameters: { id: 'string' }, description: 'Get score' },
      ],
    };
    const stripped = stripForLowBandwidth(body, '/v1/tools');
    assert.strictEqual(stripped._lowBandwidth, true);
    assert.deepStrictEqual(stripped.tools[0], { name: 'gci_getScore', parameters: { id: 'string' } });
  });

  it('strips /v1/providers response fields', () => {
    const body = {
      providers: [
        { name: 'gemini', model: 'flash', tier: 'free', inputCostPer1M: 0.1, outputCostPer1M: 0.4, maxTools: 10 },
      ],
    };
    const stripped = stripForLowBandwidth(body, '/v1/providers');
    assert.strictEqual(stripped._lowBandwidth, true);
    assert.deepStrictEqual(stripped.providers[0], { name: 'gemini', tier: 'free' });
  });

  it('adds _lowBandwidth for unknown endpoints without stripping', () => {
    const body = { data: 'value' };
    const stripped = stripForLowBandwidth(body, '/v1/unknown');
    assert.strictEqual(stripped._lowBandwidth, true);
    assert.strictEqual(stripped.data, 'value');
  });
});

// ---------------------------------------------------------------------------
// sendJson
// ---------------------------------------------------------------------------

describe('sendJson', () => {
  let sendJson;
  let srv;

  before(async () => {
    process.env.PORT = '0';
    const mod = await import('../src/server.mjs?v=sj');
    sendJson = mod.sendJson;
    srv = mod.server;
  });

  after(() => {
    srv?.close();
    delete process.env.PORT;
  });

  it('sends uncompressed JSON when no Accept-Encoding', () => {
    const res = createMockRes();
    const req = { headers: {}, url: '/health' };
    sendJson(res, 200, { status: 'ok' }, req);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res._headers['Content-Type'], 'application/json');
    assert.strictEqual(res._headers['Content-Encoding'], undefined);
    assert.deepStrictEqual(JSON.parse(res._data), { status: 'ok' });
  });

  it('applies gzip compression when requested', () => {
    const res = createMockRes();
    const req = { headers: { 'accept-encoding': 'gzip' }, url: '/health' };
    sendJson(res, 200, { status: 'ok' }, req);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res._headers['Content-Encoding'], 'gzip');
    const data = Buffer.from(res._data);
    assert.ok(data[0] === 0x1f && data[1] === 0x8b, 'should be gzip');
  });

  it('applies brotli compression when requested', () => {
    const res = createMockRes();
    const req = { headers: { 'accept-encoding': 'br' }, url: '/health' };
    sendJson(res, 200, { status: 'ok' }, req);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res._headers['Content-Encoding'], 'br');
  });

  it('skips compression for unrecognized encodings', () => {
    const res = createMockRes();
    const req = { headers: { 'accept-encoding': 'deflate' }, url: '/health' };
    sendJson(res, 200, { status: 'ok' }, req);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res._headers['Content-Encoding'], undefined);
    assert.deepStrictEqual(JSON.parse(res._data), { status: 'ok' });
  });

  it('sets low-bandwidth headers when Save-Data is on', () => {
    const res = createMockRes();
    const req = { headers: { 'save-data': 'on' }, url: '/health' };
    sendJson(res, 200, { status: 'ok' }, req);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res._headers['X-Low-Bandwidth'], 'true');
    assert.strictEqual(res._headers['Cache-Control'], 'max-age=300, public');
  });

  it('sets no-cache when not low-bandwidth', () => {
    const res = createMockRes();
    const req = { headers: {}, url: '/health' };
    sendJson(res, 200, { status: 'ok' }, req);
    assert.strictEqual(res._headers['Cache-Control'], 'no-cache');
    assert.strictEqual(res._headers['X-Low-Bandwidth'], 'false');
  });
});

// ---------------------------------------------------------------------------
// Server top-level error handling
// ---------------------------------------------------------------------------

describe('Server top-level error handling', () => {
  it('returns 500 when request handler throws', async () => {
    const port = await getEphemeralPort();
    process.env.PORT = String(port);
    process.env.NODE_ENV = 'test';
    process.env.COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON = JSON.stringify([
      { token: 'err-token', subject: 'err', permissions: ['query:read'] },
    ]);

    const mod = await import('../src/server.mjs?v=catch');
    const srv = mod.server;
    await new Promise((r) => setTimeout(r, 200));

    try {
      const mockReq = {
        url: '/v1/query',
        headers: { authorization: 'Bearer err-token', 'content-type': 'application/json' },
        method: 'POST',
        // Missing [Symbol.asyncIterator] so readBody throws
      };
      const mockRes = createMockRes();
      srv.emit('request', mockReq, mockRes);
      await new Promise((r) => setImmediate(r));

      assert.strictEqual(mockRes.statusCode, 500);
      const body = JSON.parse(mockRes._data);
      assert.strictEqual(body.error, 'Internal server error');
    } finally {
      srv.close();
      delete process.env.PORT;
      delete process.env.COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON;
    }
  });
});

// ---------------------------------------------------------------------------
// Server startup warning
// ---------------------------------------------------------------------------

describe('Server startup warning', () => {
  it('warns when using default dev token', async () => {
    const port = await getEphemeralPort();
    process.env.PORT = String(port);
    process.env.NODE_ENV = 'development';
    delete process.env.COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON;

    const warnings = [];
    const originalWarn = console.warn;
    console.warn = (...args) => warnings.push(args.join(' '));

    try {
      const mod = await import('../src/server.mjs?v=defaulted');
      const srv = mod.server;
      await new Promise((r) => setTimeout(r, 200));
      srv.close();
      assert.ok(
        warnings.some((w) => w.includes('default development read-only token')),
        'should warn about default token'
      );
    } finally {
      console.warn = originalWarn;
      delete process.env.PORT;
    }
  });
});

// ---------------------------------------------------------------------------
// System prompt fallback
// ---------------------------------------------------------------------------

describe('System prompt fallback', () => {
  it('loads without jurisdictions file', async () => {
    const { spawnSync } = await import('node:child_process');
    const { writeFileSync, unlinkSync } = await import('node:fs');
    const { join } = await import('node:path');

    const tmpScript = join(__dirname, 'tmp-system-prompt-test.mjs');
    writeFileSync(tmpScript, `
      import fs from 'node:fs';
      const jurPath = process.env.JURISDICTIONS_PATH;
      const tempPath = jurPath + '.bak';
      const existed = fs.existsSync(jurPath);
      if (existed) fs.renameSync(jurPath, tempPath);
      try {
        const mod = await import('../src/system-prompt.mjs');
        const hasBase = mod.systemPrompt.includes('GTCX Compliance Gateway');
        const hasJur = mod.systemPrompt.includes('KYC 1825d');
        console.log(JSON.stringify({ hasBase, hasJur }));
      } finally {
        if (existed) fs.renameSync(tempPath, jurPath);
      }
    `);
    const result = spawnSync('node', [tmpScript], {
      cwd: '/Users/amanianai/Sites/gtcx-ecosystem/gtcx-infrastructure/tools/compliance-gateway',
      encoding: 'utf8',
      env: { ...process.env, JURISDICTIONS_PATH: jurisdictionsPath },
    });
    unlinkSync(tmpScript);
    const output = result.stdout.trim().split('\n').pop();
    const parsed = JSON.parse(output);
    assert.strictEqual(parsed.hasBase, true, 'should still have base prompt');
    assert.strictEqual(parsed.hasJur, false, 'should not include jurisdiction data');
  });
});
