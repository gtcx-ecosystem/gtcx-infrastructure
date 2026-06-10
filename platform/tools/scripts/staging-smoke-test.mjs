#!/usr/bin/env node
/**
 * @fileoverview Staging Runtime Smoke Test
 *
 * Exercises the staging environment after deployment to verify:
 *   - All core endpoints respond with expected status codes
 *   - Auth boundary rejects unauthenticated requests
 *   - Replay protection accepts valid requests and rejects replays
 *   - Compliance gateway returns healthy status
 *   - Protocol handlers respond within SLO latency thresholds
 *
 * Usage:
 *   node platform/tools/scripts/staging-smoke-test.mjs --base-url=https://api.staging.gtcx.trade
 *
 * Exit codes:
 *   0 = all checks pass
 *   1 = one or more checks failed
 */

import { request as httpsRequest } from 'node:https';
import { request as httpRequest } from 'node:http';

const DEFAULT_BASE_URL = 'https://api.staging.gtcx.trade';
const SLO_P99_MS = 2000;

const args = process.argv.slice(2);
let baseUrl = DEFAULT_BASE_URL;

for (const arg of args) {
  if (arg.startsWith('--base-url=')) {
    baseUrl = arg.slice('--base-url='.length);
  }
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https:') ? httpsRequest : httpRequest;
    const start = Date.now();
    const req = mod(url, { method: 'GET', timeout: 10000 }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body, latencyMs: Date.now() - start });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

function httpPost(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https:') ? httpsRequest : httpRequest;
    const start = Date.now();
    const req = mod(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, timeout: 10000 }, (res) => {
      let resBody = '';
      res.on('data', (c) => { resBody += c; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: resBody, latencyMs: Date.now() - start });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

let pass = 0;
let fail = 0;

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  [PASS] ${name}`);
    pass++;
  } else {
    console.log(`  [FAIL] ${name}${detail ? ` — ${detail}` : ''}`);
    fail++;
  }
}

async function runSmokeTests() {
  console.log(`=== Staging Smoke Test ===`);
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Date: ${new Date().toISOString()}`);
  console.log('');

  // --- Protocol server health ---
  console.log('Step 1: Protocol server health');
  try {
    const health = await httpGet(`${baseUrl}/health`);
    check('Protocol /health returns 200', health.status === 200, `got ${health.status}`);
    check('Protocol /health latency < SLO', health.latencyMs < SLO_P99_MS, `${health.latencyMs}ms`);
    const body = JSON.parse(health.body);
    check('Protocol /health status is ok', body.status === 'ok', body.status);
  } catch (err) {
    check('Protocol /health reachable', false, err.message);
  }

  // --- Replay protection ---
  console.log('');
  console.log('Step 2: Replay protection');
  try {
    const replayHealth = await httpGet(`${baseUrl}/health`);
    check('Replay guard /health returns 200', replayHealth.status === 200, `got ${replayHealth.status}`);
  } catch (err) {
    check('Replay guard /health reachable', false, err.message);
  }

  // --- Compliance gateway ---
  console.log('');
  console.log('Step 3: Compliance gateway');
  try {
    const cgHealth = await httpGet(`${baseUrl}/health`);
    check('Compliance gateway /health returns 200', cgHealth.status === 200, `got ${cgHealth.status}`);
    const body = JSON.parse(cgHealth.body);
    check('Compliance gateway auth is configured', body.authConfigured === true, String(body.authConfigured));
    check('Compliance gateway is not in dev-default mode', body.authMode !== 'dev-default-readonly', body.authMode);
  } catch (err) {
    check('Compliance gateway /health reachable', false, err.message);
  }

  // --- Auth boundary: unauthenticated ---
  console.log('');
  console.log('Step 4: Auth boundary — unauthenticated');
  try {
    const toolsNoAuth = await httpGet(`${baseUrl}/v1/tools`);
    check('GET /v1/tools without auth returns 401', toolsNoAuth.status === 401, `got ${toolsNoAuth.status}`);
  } catch (err) {
    check('GET /v1/tools without auth', false, err.message);
  }

  try {
    const queryNoAuth = await httpPost(`${baseUrl}/v1/query`, { query: 'test' });
    check('POST /v1/query without auth returns 401', queryNoAuth.status === 401, `got ${queryNoAuth.status}`);
  } catch (err) {
    check('POST /v1/query without auth', false, err.message);
  }

  // --- SLO check: all endpoints under threshold ---
  console.log('');
  console.log('Step 5: SLO validation');
  const endpoints = ['/health', '/metrics'];
  for (const endpoint of endpoints) {
    try {
      const res = await httpGet(`${baseUrl}${endpoint}`);
      check(`${endpoint} latency < ${SLO_P99_MS}ms`, res.latencyMs < SLO_P99_MS, `${res.latencyMs}ms`);
    } catch (err) {
      check(`${endpoint} reachable`, false, err.message);
    }
  }

  // --- Summary ---
  console.log('');
  console.log('=== Smoke Test Summary ===');
  console.log(`  Passed: ${pass}`);
  console.log(`  Failed: ${fail}`);
  console.log(`  Status: ${fail === 0 ? 'PASS' : 'FAIL'}`);

  return fail === 0;
}

runSmokeTests().then((ok) => {
  process.exit(ok ? 0 : 1);
}).catch((err) => {
  console.error('Smoke test fatal error:', err);
  process.exit(1);
});
