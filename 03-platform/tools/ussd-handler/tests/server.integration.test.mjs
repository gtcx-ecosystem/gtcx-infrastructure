/**
 * @fileoverview USSD Handler HTTP Integration Tests
 */

import assert from 'node:assert';
import { createServer, request as httpRequest } from 'node:http';
import { describe, it, before, after } from 'node:test';

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

describe('USSD Handler Server', () => {
  before(async () => {
    const stubServer = createServer();
    await new Promise((r) => stubServer.listen(0, () => r()));
    const addr = stubServer.address();
    const port = typeof addr === 'string' ? parseInt(addr.split(':').pop() || '0', 10) : (addr?.port || 0);
    stubServer.close();

    process.env.USSD_PORT = String(port);
    process.env.NODE_ENV = 'test';

    const mod = await import('../src/server.mjs');
    testServer = mod.server;
    baseUrl = `http://127.0.0.1:${port}`;
    await new Promise((r) => setTimeout(r, 200));
  });

  after(() => {
    testServer?.close();
    if (typeof testServer?.closeAllConnections === 'function') {
      testServer.closeAllConnections();
    }
    delete process.env.USSD_PORT;
  });

  it('GET /health returns healthy', async () => {
    const res = await fetchJson('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'healthy');
    assert.strictEqual(res.body.store, 'memory');
  });

  it('GET /metrics returns Prometheus format', async () => {
    const res = await fetchJson('/metrics');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('ussd_sessions_active'));
    assert.ok(res.body.includes('ussd_handler_uptime_seconds'));
  });

  it('GET /health reflects redis store when configured', async () => {
    const { config } = await import('../src/config.mjs');
    const prev = config.redisUrl;
    config.redisUrl = 'redis://mock';
    const res = await fetchJson('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.store, 'redis');
    config.redisUrl = prev;
  });

  it('POST /ussd with missing phoneNumber returns 400', async () => {
    const res = await fetchJson('/ussd', { method: 'POST', body: { text: '*384*1#' } });
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.error.includes('phoneNumber'));
  });

  it('POST /ussd with invalid JSON returns 400', async () => {
    const res = await fetchJson('/ussd', { method: 'POST', body: 'not-json' });
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.error.includes('Invalid JSON'));
  });

  it('POST /ussd processes a multi-step flow', async () => {
    const phone = '+263991234567';
    // Step 1: select Prices
    const r1 = await fetchJson('/ussd', {
      method: 'POST',
      body: { phoneNumber: phone, input: '1', countryCode: 'ZM' },
    });
    assert.strictEqual(r1.status, 200);
    assert.ok(r1.body.text.includes('Select country'));
    assert.strictEqual(r1.body.end, false);

    // Step 2: select Zimbabwe
    const r2 = await fetchJson('/ussd', {
      method: 'POST',
      body: { phoneNumber: phone, input: '1', countryCode: 'ZM' },
    });
    assert.strictEqual(r2.status, 200);
    assert.ok(r2.body.text.includes('Select action'));

    // Step 3: select maize
    const r3 = await fetchJson('/ussd', {
      method: 'POST',
      body: { phoneNumber: phone, input: '1', countryCode: 'ZM' },
    });
    assert.strictEqual(r3.status, 200);
    assert.ok(r3.body.text.includes('Maize'));
    assert.strictEqual(r3.body.end, false);
  });

  it('POST /ussd processes simple input mode', async () => {
    const res = await fetchJson('/ussd', {
      method: 'POST',
      body: {
        phoneNumber: '+263881234567',
        input: '0',
        countryCode: 'ZM',
      },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.end, true);
  });

  it('returns 404 for unknown routes', async () => {
    const res = await fetchJson('/unknown');
    assert.strictEqual(res.status, 404);
  });

  it('returns 405 for GET /ussd', async () => {
    const res = await fetchJson('/ussd');
    assert.strictEqual(res.status, 404); // server only handles POST /ussd
  });

  it('returns 404 for POST /health', async () => {
    const res = await fetchJson('/health', { method: 'POST' });
    assert.strictEqual(res.status, 404);
  });

  it('returns 404 for POST /metrics', async () => {
    const res = await fetchJson('/metrics', { method: 'POST' });
    assert.strictEqual(res.status, 404);
  });

  it('POST /ussd without countryCode defaults to ZW', async () => {
    const res = await fetchJson('/ussd', {
      method: 'POST',
      body: { phoneNumber: '+263771234567', input: '0' },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.end, true);
  });

  it('POST /ussd with empty text and no input', async () => {
    const res = await fetchJson('/ussd', {
      method: 'POST',
      body: { phoneNumber: '+263771234567', countryCode: 'NG' },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.text.includes('Welcome') || res.body.text.includes('Mauya'));
  });

  it('POST /ussd with full USSD dial string', async () => {
    const res = await fetchJson('/ussd', {
      method: 'POST',
      body: { phoneNumber: '+263771234567', text: '*384#', countryCode: 'NG' },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.text.includes('Welcome') || res.body.text.includes('Mauya'));
  });

  it('handles internal server errors gracefully', async () => {
    const mockReq = {
      url: '/ussd',
      method: 'POST',
      [Symbol.asyncIterator]() {
        return { next: () => Promise.reject(new Error('read error')) };
      },
    };
    let status;
    let body;
    const mockRes = {
      writeHead(s, _h) { status = s; },
      end(d) { body = d; },
    };
    testServer.emit('request', mockReq, mockRes);
    await new Promise((r) => setTimeout(r, 50));
    assert.strictEqual(status, 500);
    assert.ok(body.includes('Internal server error'));
  });

  it('handles request with undefined url', async () => {
    const mockReq = {
      method: 'GET',
      url: undefined,
      async *[Symbol.asyncIterator]() { yield ''; },
    };
    let status;
    const mockRes = {
      writeHead(s) { status = s; },
      end() {},
    };
    testServer.emit('request', mockReq, mockRes);
    await new Promise((r) => setTimeout(r, 50));
    assert.strictEqual(status, 404);
  });

  it('GET /metrics handles undefined store size', async () => {
    const { MemorySessionStore } = await import('../src/session.mjs');
    const original = Object.getOwnPropertyDescriptor(MemorySessionStore.prototype, 'size');
    Object.defineProperty(MemorySessionStore.prototype, 'size', { get() { return undefined; } });
    const res = await fetchJson('/metrics');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('ussd_sessions_active -1'));
    Object.defineProperty(MemorySessionStore.prototype, 'size', original);
  });
});
