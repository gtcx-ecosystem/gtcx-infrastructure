/**
 * k6 load test — Compliance Gateway audit rate limiting (/audit/query)
 *
 * Purpose: prove that the shared checkBudget rate limiter returns 429
 * when a principal exceeds the QPS threshold.
 *
 * The same checkBudget gate is used by /v1/query, /audit/bundles, and
 * /audit/query. A 429 on this endpoint demonstrates that all audit
 * surfaces are rate-limited.
 *
 * Targets:
 *   - 429 responses appear after >10 requests from the same principal
 *     within the 1-second QPS window.
 *   - No 500 errors during the burst.
 */

import { check } from 'k6';
import http from 'k6/http';
import { Rate, Counter, Trend } from 'k6/metrics';

const throttledRate = new Rate('throttled');
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const reqCounter = new Counter('requests');

export const options = {
  scenarios: {
    burst: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 20,
      maxDuration: '5s',
    },
  },
  thresholds: {
    throttled: ['rate>0.25'], // expect at least 25% of requests throttled (5/20)
    errors: ['rate<0.05'], // expect <5% hard errors
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TOKEN = __ENV.AUDIT_TOKEN || 'load-test-token';

export default function () {
  const res = http.post(`${BASE_URL}/audit/query`, JSON.stringify({}), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
      'X-GTCX-Tenant-Id': 'zw',
    },
    expectedStatuses: [200, 429],
  });

  reqCounter.add(1);
  const isThrottled = res.status === 429;
  const isError = res.status >= 500;
  throttledRate.add(isThrottled);
  errorRate.add(isError);
  responseTime.add(res.timings.duration);

  check(res, {
    'status is 200 or 429': (r) => r.status === 200 || r.status === 429,
    'no 5xx errors': (r) => r.status < 500,
  });
}
