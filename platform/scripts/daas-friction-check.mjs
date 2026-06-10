#!/usr/bin/env node
/**
 * P41 — DevOps-as-a-Service friction register gate.
 * Usage: node daas-friction-check.mjs [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REGISTER = join(ROOT, 'pm/friction-register.json');
const ROADMAP = join(ROOT, 'pm/daas-roadmap.json');
const OPS = join(ROOT, 'docs/operations/devops-as-a-service.md');
const OUT = join(ROOT, 'audit/evidence/daas-friction-check-latest.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

const gates = {};
gates.register = { ok: existsSync(REGISTER) };
gates.roadmap = { ok: existsSync(ROADMAP) };
gates.opsDoc = { ok: existsSync(OPS) };
gates.primaryRoadmap = { ok: false };
gates.openP0 = { ok: false, count: 0 };

if (existsSync(REGISTER)) {
  const reg = JSON.parse(readFileSync(REGISTER, 'utf8'));
  const openP0 = (reg.items ?? []).filter((i) => i.priority === 'P0' && i.status === 'open');
  gates.openP0 = { ok: true, count: openP0.length, ids: openP0.map((i) => i.id) };
}
if (existsSync(ROADMAP)) {
  const rm = JSON.parse(readFileSync(ROADMAP, 'utf8'));
  gates.primaryRoadmap = { ok: rm.primaryRoadmap === true && rm.owner === 'gtcx-infrastructure' };
}

const structuralOk = gates.register.ok && gates.roadmap.ok && gates.opsDoc.ok && gates.primaryRoadmap.ok;
const witness = {
  schema: 'gtcx://gtcx-infrastructure/daas-friction-check/v1',
  protocol: 'P41-DEVOPS-AS-A-SERVICE',
  checkedAt: new Date().toISOString(),
  owner: 'gtcx-infrastructure',
  gates,
  openP0: gates.openP0.count ?? 0,
  ok: structuralOk,
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}

if (JSON_OUT) console.log(JSON.stringify(witness, null, 2));
else {
  for (const [k, v] of Object.entries(gates)) {
    console.log(`${v.ok !== false ? 'OK' : 'FAIL'} ${k}${v.count != null ? ` (${v.count})` : ''}`);
  }
  console.log(`\n${structuralOk ? 'PASS' : 'FAIL'} — structural gates`);
  if (WRITE) console.log(`witness: ${OUT}`);
}
process.exit(structuralOk ? 0 : 1);
