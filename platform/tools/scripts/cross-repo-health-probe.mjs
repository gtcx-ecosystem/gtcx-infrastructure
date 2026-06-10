#!/usr/bin/env node
/**
 * Cross-repo health probe — S1-13.
 *
 * Probes the health endpoints of services deployed across the GTCX
 * ecosystem. Exits 0 when all services report healthy (HTTP 200);
 * exits 1 when ≥1 service is down or returns non-200.
 *
 * Services probed:
 *   - sovereign-staging.gtcx.trade/api/health  (gtcx-platforms)
 *   - api.staging.gtcx.trade/api/health        (gtcx-platforms / core)
 *   - intelligence-staging.gtcx.trade/health   (gtcx-intelligence)
 *   - compliance-gateway-staging in-cluster /health (optional; external hostname unwired)
 *
 * Usage:
 *   pnpm daas:fleet:health
 *   OUTPUT_DIR=audit/evidence/cross-repo-health node platform/tools/scripts/cross-repo-health-probe.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { setDefaultResultOrder } from 'node:dns';

// Prefer IPv4 — Node dual-stack fetch can fail (EHOSTUNREACH) while curl succeeds.
setDefaultResultOrder('ipv4first');

const execFileAsync = promisify(execFile);

const outputDir = process.env.OUTPUT_DIR ?? 'audit/evidence/cross-repo-health';
const ua = process.env.GTCX_PROBE_UA ?? 'Mozilla/5.0 (GTCX cross-repo-health-probe)';

const SERVICES = [
  {
    name: 'sovereign',
    repo: 'gtcx-platforms',
    url: 'https://sovereign-staging.gtcx.trade/api/health',
    required: true,
  },
  {
    name: 'agx-api',
    repo: 'gtcx-platforms',
    url: 'https://api.staging.gtcx.trade/api/health',
    required: true,
  },
  {
    name: 'intelligence',
    repo: 'gtcx-intelligence',
    url: 'https://intelligence-staging.gtcx.trade/health',
    required: true,
  },
  {
    name: 'compliance-gateway',
    repo: 'gtcx-infrastructure',
    url: 'https://compliance-gateway-staging.gtcx.trade/health',
    required: false,
    inClusterProbe: {
      namespace: 'gtcx-staging',
      deployment: 'compliance-gateway-staging',
      path: '/health',
    },
  },
];

async function probeWithCurl(url) {
  const { stdout } = await execFileAsync(
    'curl',
    [
      '-4',
      '-sS',
      '-A',
      ua,
      '--max-time',
      '15',
      '-w',
      '\n%{http_code}',
      url,
    ],
    { maxBuffer: 1024 * 1024 },
  );
  const lines = stdout.trimEnd().split('\n');
  const statusLine = lines.pop() ?? '000';
  const status = Number.parseInt(statusLine, 10);
  const text = lines.join('\n');
  let body = text;
  try {
    body = JSON.parse(text);
  } catch {
    body = text.slice(0, 500);
  }
  return { status: Number.isFinite(status) ? status : 0, body };
}

async function probeInCluster(service) {
  const ic = service.inClusterProbe;
  if (!ic) return null;
  const { stdout } = await execFileAsync(
    'kubectl',
    [
      'exec',
      '-n',
      ic.namespace,
      `deploy/${ic.deployment}`,
      '--',
      'wget',
      '-qO-',
      `http://127.0.0.1:8500${ic.path}`,
    ],
    { maxBuffer: 1024 * 1024 },
  );
  const body = JSON.parse(stdout);
  return { status: body.status === 'healthy' ? 200 : 503, body, transport: 'kubectl-exec' };
}

async function probe(service) {
  const start = Date.now();
  let status = '000';
  let error = null;
  let body = null;
  let transport = 'fetch';
  try {
    const res = await fetch(service.url, {
      headers: { 'User-Agent': ua },
      signal: AbortSignal.timeout(15000),
    });
    status = res.status;
    const text = await res.text();
    try {
      body = JSON.parse(text);
    } catch {
      body = text.slice(0, 500);
    }
  } catch (err) {
    error = err.message;
    try {
      const curlResult = await probeWithCurl(service.url);
      status = curlResult.status;
      body = curlResult.body;
      error = null;
      transport = 'curl';
    } catch (curlErr) {
      error = `${err.message}; curl: ${curlErr.message}`;
    }
  }
  if (!service.required && status !== 200 && service.inClusterProbe) {
    try {
      const ic = await probeInCluster(service);
      if (ic?.status === 200) {
        status = ic.status;
        body = ic.body;
        error = null;
        transport = ic.transport;
      }
    } catch (icErr) {
      error = error ? `${error}; in-cluster: ${icErr.message}` : icErr.message;
    }
  }
  return {
    name: service.name,
    repo: service.repo,
    url: service.url,
    status,
    error,
    body,
    transport,
    latencyMs: Date.now() - start,
    required: service.required,
  };
}

async function main() {
  const results = await Promise.all(SERVICES.map(probe));
  const failed = results.filter((r) => r.status !== 200);
  const requiredFailed = failed.filter((r) => r.required);

  const report = {
    schemaVersion: 1,
    testType: 'cross-repo-health-probe',
    storyId: 'S1-13',
    timestamp: new Date().toISOString(),
    environment: 'staging',
    overall: requiredFailed.length === 0 ? 'PASS' : 'FAIL',
    services: results,
    summary: {
      total: results.length,
      healthy: results.filter((r) => r.status === 200).length,
      unhealthy: failed.length,
      requiredUnhealthy: requiredFailed.length,
    },
  };

  console.log(`\n=== Cross-Repo Health Probe ===`);
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Overall:   ${report.overall}`);
  console.log('');

  for (const r of results) {
    const icon = r.status === 200 ? '✅' : r.required ? '❌' : '⚠️';
    const reqLabel = r.required ? 'required' : 'optional';
    console.log(
      `${icon} ${r.name.padEnd(20)} ${r.status}  ${r.latencyMs}ms  (${reqLabel})`
    );
    if (r.error) {
      console.log(`   └─ error: ${r.error}`);
    }
  }

  console.log('');

  if (outputDir) {
    const dir = resolve(outputDir);
    mkdirSync(dir, { recursive: true });
    const path = resolve(dir, 'cross-repo-health-probe-latest.json');
    writeFileSync(path, JSON.stringify(report, null, 2));
    console.log(`[INFO] Evidence written to: ${path}`);
  }

  if (requiredFailed.length > 0) {
    console.log(
      `[FAIL] ${requiredFailed.length} required service(s) unhealthy: ${requiredFailed.map((r) => r.name).join(', ')}`
    );
    process.exit(1);
  }

  console.log(`[PASS] All required services healthy (${results.filter((r) => r.status === 200).length}/${results.length})`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
