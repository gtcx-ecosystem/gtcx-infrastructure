#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

function fail(message) {
  console.error(`runtime-smoke-evidence error: ${message}`);
  process.exit(1);
}

function usage() {
  console.log(`Usage:
  node 03-platform/tools/control-plane/capture-runtime-smoke-evidence.mjs \\
    --environment=<env> \\
    --base-url=<url> \\
    [--endpoint=<name>=<path>]... \\
    [--mode=public|bearer] \\
    [--bearer-token-env=<ENV_VAR>] \\
    [--timeout-ms=<n>] \\
    [--strict] \\
    [--output-dir=<path>]

Notes:
  - Default endpoints are health=/health and metrics=/metrics.
  - Bearer tokens are read from the named environment variable and never written to evidence.
  - Without --strict, failed probes are captured as evidence but do not make the command fail.`);
}

function parseAssignment(value, flagName) {
  const index = value.indexOf('=');
  if (index <= 0 || index === value.length - 1) {
    fail(`${flagName} entries must use <name>=<value>`);
  }
  return { name: value.slice(0, index), value: value.slice(index + 1) };
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function safeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-');
}

function normalizePath(endpointPath) {
  return endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
}

function selectHeaders(headers) {
  const selected = {};
  for (const name of ['content-type', 'server', 'x-request-id', 'x-amzn-trace-id']) {
    const value = headers.get(name);
    if (value) selected[name] = value;
  }
  return selected;
}

const args = process.argv.slice(2);
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  usage();
  process.exit(0);
}

const options = {
  endpoints: [],
  mode: 'public',
  strict: false,
  timeoutMs: 10_000,
};

for (const arg of args) {
  if (arg === '--strict') {
    options.strict = true;
    continue;
  }
  if (!arg.startsWith('--') || !arg.includes('=')) {
    fail(`Unsupported argument: ${arg}`);
  }

  const [key, value] = arg.slice(2).split(/=(.*)/s, 2);
  switch (key) {
    case 'environment':
    case 'base-url':
    case 'mode':
    case 'bearer-token-env':
    case 'output-dir':
      options[key] = value;
      break;
    case 'timeout-ms': {
      const parsed = Number.parseInt(value, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        fail('--timeout-ms must be a positive integer');
      }
      options.timeoutMs = parsed;
      break;
    }
    case 'endpoint':
      options.endpoints.push(parseAssignment(value, '--endpoint'));
      break;
    default:
      fail(`Unsupported argument: --${key}`);
  }
}

if (!options.environment) fail('Missing required argument: --environment=...');
if (!options['base-url']) fail('Missing required argument: --base-url=...');
if (!['public', 'bearer'].includes(options.mode)) {
  fail('--mode must be public or bearer');
}

let token = null;
if (options.mode === 'bearer') {
  if (!options['bearer-token-env']) {
    fail('--mode=bearer requires --bearer-token-env=<ENV_VAR>');
  }
  token = process.env[options['bearer-token-env']];
  if (!token) {
    fail(`Bearer token env var is empty or unset: ${options['bearer-token-env']}`);
  }
}

if (options.endpoints.length === 0) {
  options.endpoints = [
    { name: 'health', value: '/health' },
    { name: 'metrics', value: '/metrics' },
  ];
}

const timestamp = new Date()
  .toISOString()
  .replaceAll(':', '')
  .replace(/\.\d{3}Z$/, 'Z');
const outputDir =
  options['output-dir'] ??
  path.join(
    'infra',
    'security',
    'reports',
    'runtime-smoke-evidence',
    options.environment,
    timestamp
  );
mkdirSync(outputDir, { recursive: true });

const baseUrl = new URL(options['base-url']);
const probes = [];

for (const endpoint of options.endpoints) {
  const endpointPath = normalizePath(endpoint.value);
  const url = new URL(endpointPath, baseUrl);
  const startedAt = new Date();
  const startedNs = process.hrtime.bigint();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

  const headers = {
    Accept: endpoint.name === 'metrics' ? 'text/plain,*/*' : 'application/json,*/*',
    'User-Agent': 'gtcx-runtime-smoke-evidence/1',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    const body = await response.text();
    const durationMs = Number(process.hrtime.bigint() - startedNs) / 1_000_000;
    const bodyFile = `response-${safeFilename(endpoint.name)}.txt`;
    writeFileSync(path.join(outputDir, bodyFile), body, 'utf8');

    probes.push({
      name: endpoint.name,
      path: endpointPath,
      url: url.toString(),
      method: 'GET',
      startedAt: startedAt.toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Math.round(durationMs * 100) / 100,
      status: response.status,
      ok: response.ok,
      result: response.ok ? 'passed' : 'failed',
      headers: selectHeaders(response.headers),
      request: {
        authMode: options.mode,
        authorization: token ? 'Bearer <redacted>' : null,
      },
      body: {
        file: bodyFile,
        bytes: Buffer.byteLength(body),
        sha256: sha256(body),
      },
    });
  } catch (err) {
    const durationMs = Number(process.hrtime.bigint() - startedNs) / 1_000_000;
    probes.push({
      name: endpoint.name,
      path: endpointPath,
      url: url.toString(),
      method: 'GET',
      startedAt: startedAt.toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Math.round(durationMs * 100) / 100,
      status: null,
      ok: false,
      result: 'failed',
      error: err?.name === 'AbortError' ? 'timeout' : err?.message,
      request: {
        authMode: options.mode,
        authorization: token ? 'Bearer <redacted>' : null,
      },
      body: null,
    });
  } finally {
    clearTimeout(timeout);
  }
}

const failed = probes.filter((probe) => !probe.ok);
const evidence = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  environment: options.environment,
  baseUrl: baseUrl.toString(),
  mode: options.mode,
  strict: options.strict,
  timeoutMs: options.timeoutMs,
  status: failed.length === 0 ? 'passed' : 'failed',
  summary: {
    total: probes.length,
    passed: probes.length - failed.length,
    failed: failed.length,
  },
  probes,
};

writeFileSync(
  path.join(outputDir, 'runtime-smoke-evidence.json'),
  `${JSON.stringify(evidence, null, 2)}\n`,
  'utf8'
);

const summary = [
  '# Runtime Smoke Evidence',
  '',
  `- Generated at: ${evidence.generatedAt}`,
  `- Environment: ${evidence.environment}`,
  `- Base URL: ${evidence.baseUrl}`,
  `- Mode: ${evidence.mode}`,
  `- Status: ${evidence.status}`,
  `- Probes: ${evidence.summary.passed}/${evidence.summary.total} passed`,
  '',
  '## Probes',
  ...probes.map((probe) => `- ${probe.name}: ${probe.result} (${probe.status ?? 'n/a'})`),
  '',
  '## Files',
  '- runtime-smoke-evidence.json',
  ...probes.filter((probe) => probe.body?.file).map((probe) => `- ${probe.body.file}`),
];

writeFileSync(path.join(outputDir, 'summary.md'), `${summary.join('\n')}\n`, 'utf8');

console.log(outputDir);

if (options.strict && failed.length > 0) {
  process.exit(1);
}
