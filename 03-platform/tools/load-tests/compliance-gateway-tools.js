/**
 * k6 load test — Compliance Gateway /v1/tools
 *
 * Uses the default development read-only token.
 *
 * Targets:
 *   - Availability: 99.5% success rate
 *   - Latency: p95 < 500ms
 *   - Error rate: < 0.5%
 */

import { check, sleep } from 'k6';
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
const DEV_TOKEN = 'dev-local-readonly-token';

export default function () {
  const res = http.get(`${BASE_URL}/v1/tools`, {
    headers: {
      Authorization: `Bearer ${DEV_TOKEN}`,
    },
  });

  const isError = res.status !== 200;
  errorRate.add(isError);
  responseTime.add(res.timings.duration);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(0.1);
}
