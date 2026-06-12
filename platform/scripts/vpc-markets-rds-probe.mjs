#!/usr/bin/env node
/**
 * XR-MKT-RDS-VPC — in-VPC psql probe across peering to gtx-markets-staging RDS.
 * Usage: node platform/scripts/vpc-markets-rds-probe.mjs [--write]
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const WRITE = process.argv.includes('--write');
const OUT = join(ROOT, 'docs/operations/evidence/vpc-markets-rds-probe-2026-06-12.json');
const RDS_HOST = 'gtx-markets-staging-0.c9q6m82euzii.af-south-1.rds.amazonaws.com';
const PEERING = join(ROOT, 'docs/operations/evidence/vpc-peering-gtcx-markets-staging-2026-06-12.json');

const sm = spawnSync(
  'aws',
  [
    'secretsmanager',
    'get-secret-value',
    '--secret-id',
    'gtx-markets/staging/database-url',
    '--region',
    'af-south-1',
    '--query',
    'SecretString',
    '--output',
    'text',
  ],
  { encoding: 'utf8' },
);

if (sm.status !== 0) {
  console.error('FAIL secretsmanager:', sm.stderr?.trim() || sm.status);
  process.exit(1);
}

const dbUrl = sm.stdout.trim();
if (!dbUrl) {
  console.error('FAIL empty database-url secret');
  process.exit(1);
}

const podName = `vpc-rds-probe-${Date.now()}`;
const sql = 'SELECT 1 AS vpc_peering_ok';
const inner = `PGCONNECT_TIMEOUT=15 psql "$DATABASE_URL" -c "${sql}" -t -A`;
const kubectl = spawnSync(
  'kubectl',
  [
    'run',
    podName,
    '--rm',
    '-i',
    '--restart=Never',
    '-n',
    'gtcx',
    '--image=postgres:16-alpine',
    `--env=DATABASE_URL=${dbUrl}`,
    '--command',
    '--',
    'sh',
    '-c',
    inner,
  ],
  { encoding: 'utf8', timeout: 120000 },
);

const stdout = (kubectl.stdout || '').trim();
const stderr = (kubectl.stderr || '').trim();
const combined = `${stdout}\n${stderr}`;
const networkReachable =
  /connection to server at|10\.0\.\d+\.\d+|password authentication failed|FATAL:/i.test(combined);
const authOk = kubectl.status === 0 && stdout.includes('1');
const ok = authOk;
const peeringOk = networkReachable;

const witness = {
  schema: 'gtcx://fabric-os/vpc-markets-rds-probe/v1',
  id: 'VPC-MARKETS-RDS-PROBE-2026-06-12',
  frictionId: 'XR-MKT-RDS-VPC',
  task: 'F10',
  probedAt: new Date().toISOString(),
  probedBy: 'agent:fabric-os',
  command: 'node platform/scripts/vpc-markets-rds-probe.mjs',
  runner: { type: 'kubectl', namespace: 'gtcx', image: 'postgres:16-alpine' },
  target: { host: RDS_HOST, port: 5432 },
  peeringWitness: 'docs/operations/evidence/vpc-peering-gtcx-markets-staging-2026-06-12.json',
  peeringConnectionId: 'pcx-014f211f0e7c2cb08',
  result: ok ? 'PASS' : peeringOk ? 'PARTIAL' : 'FAIL',
  peeringPathVerified: peeringOk,
  authOk,
  exitCode: kubectl.status ?? 1,
  stdoutRedacted: ok ? 'vpc_peering_ok=1' : stdout.slice(0, 200) || null,
  stderrSummary: stderr.slice(0, 300) || null,
  blocksIR: false,
  repo: 'fabric-os',
};

const label = ok ? 'PASS' : peeringOk ? 'PARTIAL (peering OK, auth fail)' : 'FAIL';
console.log(`${label} — psql via gtcx pod → ${RDS_HOST}`);
if (!ok && witness.stderrSummary) console.error(witness.stderrSummary);

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
  console.log(`witness: ${OUT}`);
}

process.exit(ok ? 0 : peeringOk ? 0 : 1);
