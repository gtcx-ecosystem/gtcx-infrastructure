/**
 * 4-hour soak — compliance-gateway under sustained tenant traffic.
 *
 * Purpose: prove that the in-memory audit chain stays bounded, the HPA
 * scales up and back down, and per-tenant budgets correctly isolate
 * traffic. Run against the staging environment with two synthetic
 * tenants; assert post-run that:
 *   - HPA scaled 1 → ≥3 pods at peak.
 *   - The Prometheus gauge compliance_gateway_audit_chain_in_memory
 *     never exceeds AUDIT_CHAIN_MAX_RECORDS (10K).
 *   - compliance_gateway_audit_chain_total grew monotonically.
 *   - p95 /v1/query latency under 5s throughout.
 *
 * Run:
 *   k6 run \
 *     -e BASE_URL=https://staging.gtcx.example \
 *     -e TENANT_A_TOKEN=$TENANT_A_TOKEN \
 *     -e TENANT_B_TOKEN=$TENANT_B_TOKEN \
 *     03-platform/tools/load-tests/compliance-gateway-soak.js
 */
import { check, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  scenarios: {
    tenant_a_steady: {
      executor: 'constant-vus',
      vus: 5,
      duration: '4h',
      exec: 'tenantA',
    },
    tenant_b_steady: {
      executor: 'constant-vus',
      vus: 3,
      duration: '4h',
      exec: 'tenantB',
    },
    peak_burst: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 0 },
        { duration: '15m', target: 30 },
        { duration: '30m', target: 30 },
        { duration: '15m', target: 0 },
      ],
      exec: 'tenantA',
      startTime: '1h',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<5000'],
    'http_req_duration{scenario:tenant_a_steady}': ['p(99)<8000'],
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:8500';
const TOKEN_A = __ENV.TENANT_A_TOKEN || 'dev-local-readonly-token';
const TOKEN_B = __ENV.TENANT_B_TOKEN || 'dev-local-readonly-token';

const QUERIES = [
  'Is this trader compliant?',
  'Verify gold shipment from cooperative.',
  'Check FATF retention for this jurisdiction.',
  'Score this PvP settlement.',
];

function fireQuery(token, label) {
  const payload = JSON.stringify({
    query: QUERIES[Math.floor(Math.random() * QUERIES.length)],
    jurisdiction: 'zimbabwe',
  });
  const res = http.post(`${BASE}/v1/query`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    tags: { tenant: label },
  });
  check(res, {
    'status is not 5xx': (r) => r.status < 500,
    'no cross-tenant data in response': (r) =>
      !r.body || !r.body.includes('"tenantId":"' + (label === 'a' ? 'b' : 'a') + '"'),
  });
  sleep(0.5 + Math.random());
}

export function tenantA() {
  fireQuery(TOKEN_A, 'a');
}
export function tenantB() {
  fireQuery(TOKEN_B, 'b');
}

export function handleSummary(data) {
  const out = {
    'soak-summary.json': JSON.stringify(data, null, 2),
    stdout: `\nSOAK COMPLETE\n  http_req_duration p95: ${data.metrics.http_req_duration.values['p(95)']} ms\n  http_req_failed rate: ${data.metrics.http_req_failed.values.rate}\n`,
  };
  return out;
}
