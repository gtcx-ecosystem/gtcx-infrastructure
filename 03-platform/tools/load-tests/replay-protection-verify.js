/**
 * k6 load test — Replay Protection /v1/replay/verify
 *
 * Sends validly-hashed (but stub-signed) replay-verify requests.
 * Requires the server to run with REPLAY_GUARD_ALLOW_STUB_SIGNATURE=true.
 *
 * Targets:
 *   - Availability: 99.5% success rate (2xx)
 *   - Latency: p95 < 500ms
 *   - Error rate: < 0.5% (5xx only; 4xx from stale nonces is expected at ramp)
 */

import { check, sleep } from 'k6';
import crypto from 'k6/crypto';
import http from 'k6/http';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

export const options = {
  stages: [
    { duration: '10s', target: 10 },
    { duration: '20s', target: 50 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    errors: ['rate<0.005'],
    response_time: ['p(95)<500'],
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.005'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

function sha256Hex(input) {
  return crypto.sha256(input, 'hex');
}

function normalizeHeaders(headers) {
  const entries = Object.entries(headers)
    .map(([key, value]) => [key.toLowerCase(), value])
    .sort(([aKey, aValue], [bKey, bValue]) => {
      if (aKey === bKey) return aValue.localeCompare(bValue);
      return aKey.localeCompare(bKey);
    });
  return JSON.stringify(entries);
}

function computeBodyHash(body) {
  return sha256Hex(body);
}

function computeHeadersHash(headers) {
  return sha256Hex(normalizeHeaders(headers));
}

function computeEnvelopeHash(params) {
  // Manual URL parsing (k6 does not have URL API)
  let pathname = '/';
  let query = '';
  const queryIdx = params.url.indexOf('?');
  if (queryIdx >= 0) {
    pathname = params.url.slice(params.url.indexOf('/', 8), queryIdx);
    query = params.url.slice(queryIdx + 1);
  } else {
    const pathStart = params.url.indexOf('/', 8);
    if (pathStart >= 0) {
      pathname = params.url.slice(pathStart);
    }
  }
  pathname = pathname.replace(/\/{2,}/g, '/') || '/';

  // Sort query parameters
  if (query) {
    const pairs = query
      .split('&')
      .map((p) => {
        const eq = p.indexOf('=');
        return eq >= 0 ? [p.slice(0, eq), p.slice(eq + 1)] : [p, ''];
      })
      .sort(([aKey, aValue], [bKey, bValue]) => {
        if (aKey === bKey) return aValue.localeCompare(bValue);
        return aKey.localeCompare(bKey);
      });
    query = pairs.map(([k, v]) => `${k}=${v}`).join('&');
  }

  const canonicalEnvelope = [
    params.method.toUpperCase(),
    pathname,
    query,
    params.bodyHash,
    params.headersHash,
    params.timestamp,
    params.nonce,
    params.did,
    params.keyId,
    params.audience,
  ].join('\n');

  return sha256Hex(canonicalEnvelope);
}

function makeIntegrityPayload(vuId, iter) {
  const now = new Date();
  const timestamp = now.toISOString();
  const nonce = `${Date.now().toString(16)}${vuId.toString(16)}${iter.toString(16)}${Math.floor(Math.random() * 0xffffff).toString(16)}`;
  const did = 'did:gtcx:device:test';
  const keyId = 'key-1';
  const audience = 'gtcx-api';
  const scheme = 'gtcx-queue-envelope-v1';

  const body = '{"action":"create","payload":{"id":1}}';
  const headers = { 'content-type': 'application/json', 'x-request-id': 'req-123' };
  const method = 'POST';
  const url = 'http://api.gtcx.local/v1/tradepass/issue';

  const bodyHash = computeBodyHash(body);
  const headersHash = computeHeadersHash(headers);
  const envelopeHash = computeEnvelopeHash({
    method,
    url,
    bodyHash,
    headersHash,
    timestamp,
    nonce,
    did,
    keyId,
    audience,
  });

  // Stub signature — server must run with REPLAY_GUARD_ALLOW_STUB_SIGNATURE=true
  const signature = 'stub-signature-for-load-test';

  return {
    scheme,
    did,
    keyId,
    audience,
    bodyHash,
    headersHash,
    timestamp,
    nonce,
    signature,
    envelopeHash,
  };
}

export default function () {
  const integrity = makeIntegrityPayload(__VU, __ITER);

  const res = http.post(
    `${BASE_URL}/v1/replay/verify`,
    JSON.stringify({
      integrity,
      body: '{"action":"create","payload":{"id":1}}',
      headers: { 'content-type': 'application/json', 'x-request-id': 'req-123' },
      method: 'POST',
      url: 'http://api.gtcx.local/v1/tradepass/issue',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  // Count 5xx as errors; 4xx (stale nonce, replay nonce) is acceptable under load
  const isError = res.status >= 500;
  errorRate.add(isError);
  responseTime.add(res.timings.duration);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(0.1);
}
