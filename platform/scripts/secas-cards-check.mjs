#!/usr/bin/env node
/**
 * P42 SECAS-S3 — per-repo security card gate.
 * Usage: node secas-cards-check.mjs [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ROADMAP = join(ROOT, 'pm/secas-roadmap.json');
const REGISTER = join(ROOT, 'pm/security-friction-register.json');
const CARDS_DIR = join(ROOT, 'docs/operations/secas/cards');
const INDEX = join(ROOT, 'docs/operations/secas/README.md');
const OUT = join(ROOT, 'audit/evidence/secas-cards-check-latest.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

const REQUIRED = ['compliance-os', 'gtcx-markets', 'gtcx-intelligence'];
const gates = { index: { ok: existsSync(INDEX) }, cards: {} };

for (const repo of REQUIRED) {
  const path = join(CARDS_DIR, `${repo}.md`);
  gates.cards[repo] = { ok: existsSync(path), path: `docs/operations/secas/cards/${repo}.md` };
}

let s3Items = [];
if (existsSync(ROADMAP)) {
  const rm = JSON.parse(readFileSync(ROADMAP, 'utf8'));
  const s3 = (rm.sprints ?? []).find((s) => s.id === 'SECAS-S3');
  s3Items = s3?.items ?? [];
}
gates.s3FrictionCards = { ok: true, missing: [] };
const frictionToRepo = { 'SEC-IRSA-01': 'compliance-os' };
for (const id of s3Items) {
  const repo = frictionToRepo[id];
  if (repo && !gates.cards[repo]?.ok) {
    gates.s3FrictionCards.ok = false;
    gates.s3FrictionCards.missing.push(id);
  }
}

const cardOk = Object.values(gates.cards).every((c) => c.ok);
const ok = gates.index.ok && cardOk && gates.s3FrictionCards.ok;
const witness = {
  schema: 'gtcx://gtcx-infrastructure/secas-cards-check/v1',
  protocol: 'P42-SECURITY-AS-A-SERVICE',
  sprint: 'SECAS-S3',
  checkedAt: new Date().toISOString(),
  owner: 'gtcx-infrastructure',
  gates,
  ok,
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}
if (JSON_OUT) console.log(JSON.stringify(witness, null, 2));
else {
  console.log(`${gates.index.ok ? 'OK' : 'FAIL'} index`);
  for (const [repo, v] of Object.entries(gates.cards)) {
    console.log(`${v.ok ? 'OK' : 'FAIL'} card:${repo}`);
  }
  console.log(`${gates.s3FrictionCards.ok ? 'OK' : 'FAIL'} s3FrictionCards`);
  console.log(`\n${ok ? 'PASS' : 'FAIL'} — SECAS-S3 cards`);
  if (WRITE) console.log(`witness: ${OUT}`);
}
process.exit(ok ? 0 : 1);
