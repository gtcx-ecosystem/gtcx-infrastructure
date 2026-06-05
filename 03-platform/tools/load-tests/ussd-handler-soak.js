/**
 * USSD path soak — sustained multi-step menu traffic (CI smoke profile).
 *
 * Simulates feature-phone operators stepping through the compliance menu
 * under concurrent sessions. Full 4h staging soak uses the same script
 * with USSD_SOAK_DURATION=4h.
 *
 * Run:
 *   k6 run -e BASE_URL=http://localhost:8600 03-platform/tools/load-tests/ussd-handler-soak.js
 */
import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';

const flowOk = new Rate('ussd_flow_ok');

const BASE = __ENV.BASE_URL || 'http://localhost:8600';
const DURATION = __ENV.USSD_SOAK_DURATION || '60s';
const VUS = Number(__ENV.USSD_SOAK_VUS || '10');

const COUNTRY_CODES = ['ZW', 'ZM', 'NG', 'KE', 'GH'];

export const options = {
  scenarios: {
    ussd_path_soak: {
      executor: 'constant-vus',
      vus: VUS,
      duration: DURATION,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<2000'],
    ussd_flow_ok: ['rate>0.95'],
  },
};

function postUssd(phone, body) {
  return http.post(`${BASE}/ussd`, JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'ussd' },
  });
}

export default function ussdPathSoak() {
  const suffix = String(__VU * 100000 + __ITER).padStart(7, '0');
  const phone = `+26377${suffix.slice(-7)}`;
  const countryCode = COUNTRY_CODES[__VU % COUNTRY_CODES.length];

  const steps = [
    { phoneNumber: phone, countryCode },
    { phoneNumber: phone, input: '1', countryCode },
    { phoneNumber: phone, input: '1', countryCode },
    { phoneNumber: phone, input: '0', countryCode },
  ];

  let ok = true;
  for (const body of steps) {
    const res = postUssd(phone, body);
    const stepOk = check(res, {
      'status is 200': (r) => r.status === 200,
      'response has text': (r) => {
        try {
          const parsed = JSON.parse(r.body);
          return typeof parsed.text === 'string' && parsed.text.length > 0;
        } catch {
          return false;
        }
      },
    });
    ok = ok && stepOk;
    sleep(0.05 + Math.random() * 0.1);
  }

  flowOk.add(ok);
}

export function handleSummary(data) {
  const p95 = data.metrics?.http_req_duration?.values?.['p(95)'] ?? 0;
  const failRate = data.metrics?.http_req_failed?.values?.rate ?? 0;
  const flowRate = data.metrics?.ussd_flow_ok?.values?.rate ?? 0;

  const metrics = {
    schemaVersion: 1,
    testType: 'ussd-soak',
    capturedAt: new Date().toISOString(),
    metrics: {
      http_req_duration_p95_ms: Math.round(p95),
      http_req_failed_rate: failRate,
      ussd_flow_completion_rate: flowRate,
    },
  };

  return {
    stdout: `\nUSSD SOAK COMPLETE\n  p95: ${p95} ms\n  failed rate: ${failRate}\n  flow completion: ${flowRate}\n`,
    'ussd-soak-metrics.json': JSON.stringify(metrics, null, 2),
  };
}
