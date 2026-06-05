/**
 * k6 load test — Replay Protection /health
 *
 * Targets:
 *   - Availability: 99.5% success rate
 *   - Latency: p95 < 200ms (health endpoint should be very fast)
 *   - Error rate: < 0.5%
 */

import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

export const options = {
  stages: [
    { duration: '10s', target: 10 }, // ramp up
    { duration: '20s', target: 50 }, // steady state
    { duration: '10s', target: 0 }, // ramp down
  ],
  thresholds: {
    errors: ['rate<0.005'], // < 0.5% error rate
    response_time: ['p(95)<200'], // p95 < 200ms
    http_req_duration: ['p(95)<200'], // k6 built-in
    http_req_failed: ['rate<0.005'], // built-in error rate
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const res = http.get(`${BASE_URL}/health`);
  const isError = res.status !== 200;
  errorRate.add(isError);
  responseTime.add(res.timings.duration);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(0.1);
}
