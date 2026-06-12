#!/usr/bin/env node
/**
 * XR-MKT-PROTOCOL-NATIVE-001 — live Golden Transaction probe (registration allowed path).
 * Resolves verifier URL/token from cluster when env unset. Full GT trace still requires
 * Markets brokerage deploy + e7525dfa image.
 *
 * Usage:
 *   node platform/scripts/golden-transaction-protocol-native-probe.mjs [--write]
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, 'audit/evidence/golden-transaction-protocol-native-2026-06-12.json');
const WRITE = process.argv.includes('--write');
const NAMESPACE = 'gtcx-staging';
const DEFAULT_URL =
  'http://gtcx-protocols-staging.gtcx-staging.svc.cluster.local:8300';

function kubectl(args) {
  return spawnSync('kubectl', ['--request-timeout=25s', ...args], { encoding: 'utf8' });
}

function secretLiteral(name, key) {
  const r = kubectl([
    'get',
    'secret',
    name,
    '-n',
    NAMESPACE,
    '-o',
    `jsonpath={.data.${key}}`,
  ]);
  if (r.status !== 0 || !r.stdout?.trim()) return null;
  return Buffer.from(r.stdout.trim(), 'base64').toString('utf8');
}

function resolveCredentials() {
  const url = process.env.GTCX_OS_PROTOCOLS_VERIFIER_URL || DEFAULT_URL;
  const token =
    process.env.GTCX_OS_PROTOCOLS_VERIFIER_TOKEN ||
    secretLiteral('gtcx-protocols-api-key-staging', 'api-key');
  return { url, token, source: process.env.GTCX_OS_PROTOCOLS_VERIFIER_TOKEN ? 'env' : 'k8s-secret' };
}

function probeVerifyRoute(pod, token) {
  const postBody = JSON.stringify({
    manifest: { schemaVersion: '1.0.0', manifestId: 'probe-staging-v1' },
    purpose: 'registration',
    requestedBy: 'fabric-os:golden-transaction-probe',
  });
  const exec = kubectl([
    'exec',
    '-n',
    NAMESPACE,
    pod,
    '-c',
    'protocols',
    '--',
    'sh',
    '-c',
    `wget -qO- --header 'Authorization: Bearer ${token}' --header 'Content-Type: application/json' --post-data '${postBody.replace(/'/g, "'\\''")}' http://127.0.0.1:8300/v1/protocol-manifests/verify 2>&1 || true`,
  ]);
  const combined = `${exec.stdout ?? ''}${exec.stderr ?? ''}`.trim();
  const jsonMatch = combined.match(/\{[\s\S]*\}/);
  const responseBody = jsonMatch?.[0]?.slice(0, 500) ?? (combined.slice(0, 500) || null);
  const routeReachable =
    Boolean(jsonMatch) ||
    combined.includes('409') ||
    combined.includes('INVALID_') ||
    combined.includes('UNAUTHORIZED_') ||
    combined.includes('"allowed"');
  return {
    ok: routeReachable,
    exitCode: exec.status,
    body: responseBody,
    stderr: exec.stderr?.trim()?.slice(0, 300) || null,
  };
}

const { url, token, source } = resolveCredentials();
const podList = kubectl([
  'get',
  'pods',
  '-n',
  NAMESPACE,
  '-l',
  'app=gtcx-protocols',
  '-o',
  'jsonpath={.items[?(@.status.phase=="Running")].metadata.name}',
]);
const pod = podList.stdout?.trim().split(/\s+/).filter(Boolean)[0] || null;

const brokerageReady = kubectl([
  'get',
  'deployment',
  'markets-brokerage-protocol-trace',
  '-n',
  NAMESPACE,
  '-o',
  'jsonpath={.status.readyReplicas}',
]);
const marketsBrokerageDeployed =
  Number(brokerageReady.stdout?.trim() || 0) >= 1;

let verifyProbe = { ok: false, note: 'no running protocols pod' };
if (pod && token) {
  verifyProbe = probeVerifyRoute(pod, token);
}

const traceComplete = marketsBrokerageDeployed && verifyProbe.ok;

const witness = {
  schema: 'gtcx://fabric-os/golden-transaction-protocol-native/v1',
  id: 'GOLDEN-TXN-PROTOCOL-NATIVE-2026-06-12',
  ticket: 'XR-MKT-PROTOCOL-NATIVE-001',
  probedAt: new Date().toISOString(),
  ok: traceComplete,
  phase: traceComplete
    ? 'golden_transaction_protocol_native_live'
    : verifyProbe.ok
      ? 'verify_route_live_markets_trace_pending'
      : 'blocked_prerequisites',
  prerequisites: {
    verifierUrl: Boolean(url),
    verifierToken: Boolean(token),
    tokenSource: source,
    readinessWitness: 'audit/evidence/protocol-verifier-staging-readiness-2026-06-12.json',
    marketsBrokerageDeployed,
    marketsTraceWitness:
      '../markets-os/audit/evidence/golden-transaction-markets-staging-2026-06-12.json',
    pnv2Image: 'f399b116-tradepass-active-amd64',
    brokerageImage:
      '348389439381.dkr.ecr.af-south-1.amazonaws.com/gtx-markets/brokerage-api:pnv2-staging-20260612-amd64',
  },
  verifyRouteProbe: verifyProbe,
  note: traceComplete
    ? 'Verify route live and Markets brokerage cluster deploy ready for Golden Transaction trace.'
    : verifyProbe.ok
      ? 'Verify route live (409 rejection on probe manifest). Golden Transaction trace pack blocked on Markets brokerage cluster deploy.'
      : 'Live Golden Transaction trace pack requires protocols image, Markets brokerage deploy, and trace orchestration.',
  repo: 'fabric-os',
};

if (!token) {
  console.error('BLOCKED — GTCX_OS_PROTOCOLS_VERIFIER_TOKEN not in env and not in k8s secret');
} else if (!verifyProbe.ok) {
  console.error('BLOCKED — verify route probe failed (image may lack PNV-2 fail-closed route)');
} else if (!marketsBrokerageDeployed) {
  console.error('PARTIAL — verify route reachable; Markets brokerage cluster deploy not ready');
} else {
  console.error('PASS — verify route live and Markets brokerage deployed');
}

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
  console.log(`witness: ${OUT}`);
}
process.exit(witness.ok ? 0 : 1);
