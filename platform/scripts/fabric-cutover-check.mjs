#!/usr/bin/env node
/**
 * INIT-FABRIC-OS-CUTOVER closure — canonical fabric-os identity + lane I + gates.
 *
 * Usage:
 *   node fabric-cutover-check.mjs [--write] [--json]
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, 'audit/evidence/fabric-cutover-check-latest.json');
const BRIDGE_REG = join(ROOT, '../bridge-os/config/zenhub-ecosystem-registry.json');
const DEPLOY_REG = join(ROOT, '../bridge-os/config/fleet-deploy-readiness-registry.json');
const LANES = join(ROOT, 'pm/spec/trade-ecosystem-lanes.v1.json');
const TASKS = join(ROOT, 'pm/_tasks');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

/** @type {Record<string, { ok: boolean, detail?: string }>} */
const gates = {};

function runPnpm(script) {
  const r = spawnSync('pnpm', [script], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return { ok: (r.status ?? 1) === 0, exitCode: r.status ?? 1, tail: `${r.stdout ?? ''}${r.stderr ?? ''}`.trim().split('\n').slice(-2).join(' ') };
}

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
gates.packageName = { ok: pkg.name === 'fabric-os', detail: pkg.name };
gates.repositoryUrl = {
  ok: String(pkg.repository?.url ?? '').includes('fabric-os'),
  detail: pkg.repository?.url ?? 'missing',
};

const lanes = JSON.parse(readFileSync(LANES, 'utf8'));
const laneI = lanes.lanes?.I ?? {};
gates.laneRegistry = {
  ok: laneI.repo === 'fabric-os' && laneI.legacyRepo === 'gtcx-infrastructure',
  detail: `I.repo=${laneI.repo} legacy=${laneI.legacyRepo ?? '—'}`,
};

if (existsSync(BRIDGE_REG)) {
  const zen = JSON.parse(readFileSync(BRIDGE_REG, 'utf8'));
  const row = zen.repos?.find((r) => r.localDir === 'fabric-os');
  gates.zenhubRegistry = {
    ok: row?.github === 'fabric-os' && row?.status === 'active',
    detail: row ? `github=${row.github}` : 'missing row',
  };
} else {
  gates.zenhubRegistry = { ok: false, detail: 'bridge zenhub registry not found' };
}

if (existsSync(DEPLOY_REG)) {
  const dep = JSON.parse(readFileSync(DEPLOY_REG, 'utf8'));
  const row = dep.repos?.['fabric-os'];
  gates.deployRegistry = {
    ok: row?.laneId === 'I' && (row?.legacyIds ?? []).includes('gtcx-infrastructure'),
    detail: `laneId=${row?.laneId ?? '—'}`,
  };
} else {
  gates.deployRegistry = { ok: false, detail: 'deploy registry not found' };
}

const tasksText = existsSync(TASKS) ? readFileSync(TASKS, 'utf8') : '';
gates.tasksOwner = {
  ok: !tasksText.includes('Owner: gtcx-infrastructure') && !tasksText.startsWith('# gtcx-infrastructure task inbox'),
  detail: 'pm/_tasks header uses fabric-os',
};

gates.opsCheck = runPnpm('ops:check');
gates.lanesCheck = runPnpm('fabric:lanes:check');

const ok = Object.values(gates).every((g) => g.ok);
const witness = {
  schema: 'gtcx://fabric-os/fabric-cutover-check/v1',
  initiative: 'INIT-FABRIC-OS-CUTOVER',
  at: new Date().toISOString(),
  status: ok ? 'complete' : 'blocked',
  gates,
  ok,
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}

if (JSON_OUT) {
  console.log(JSON.stringify(witness, null, 2));
} else {
  console.log('=== INIT-FABRIC-OS-CUTOVER closure ===\n');
  for (const [k, g] of Object.entries(gates)) {
    console.log(`${g.ok ? 'OK' : 'FAIL'} ${k}${g.detail ? ` — ${g.detail}` : ''}`);
  }
  console.log(`\n${ok ? 'PASS' : 'FAIL'} — ${witness.status}`);
  if (WRITE) console.log(`witness: ${OUT}`);
}

process.exit(ok ? 0 : 1);
