#!/usr/bin/env node
/**
 * P41 DAAS-S2 — per-repo card gate.
 * Usage: node daas-cards-check.mjs [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ROADMAP = join(ROOT, 'pm/daas-roadmap.json');
const REGISTER = join(ROOT, 'pm/friction-register.json');
const CARDS_DIR = join(ROOT, 'docs/operations/daas/cards');
const INDEX = join(ROOT, 'docs/operations/daas/README.md');
const OUT = join(ROOT, 'audit/evidence/daas-cards-check-latest.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

const REQUIRED = ['terminal-os', 'compliance-os', 'gtcx-markets'];
const gates = { index: { ok: existsSync(INDEX) }, cards: {} };

for (const repo of REQUIRED) {
  const path = join(CARDS_DIR, `${repo}.md`);
  gates.cards[repo] = { ok: existsSync(path), path: `docs/operations/daas/cards/${repo}.md` };
}

let s2Items = [];
if (existsSync(ROADMAP)) {
  const rm = JSON.parse(readFileSync(ROADMAP, 'utf8'));
  const s2 = (rm.sprints ?? []).find((s) => s.id === 'DAAS-S2');
  s2Items = s2?.items ?? [];
}
gates.s2FrictionCards = { ok: true, missing: [] };
const frictionToRepo = { F1: 'terminal-os', F2: 'compliance-os' };
for (const id of s2Items) {
  const repo = frictionToRepo[id];
  if (repo && !gates.cards[repo]?.ok) {
    gates.s2FrictionCards.ok = false;
    gates.s2FrictionCards.missing.push(id);
  }
}

const cardOk = Object.values(gates.cards).every((c) => c.ok);
const ok = gates.index.ok && cardOk && gates.s2FrictionCards.ok;
const witness = {
  schema: 'gtcx://gtcx-infrastructure/daas-cards-check/v1',
  protocol: 'P41-DEVOPS-AS-A-SERVICE',
  sprint: 'DAAS-S2',
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
  console.log(`${gates.s2FrictionCards.ok ? 'OK' : 'FAIL'} s2FrictionCards`);
  console.log(`\n${ok ? 'PASS' : 'FAIL'} — DAAS-S2 cards`);
  if (WRITE) console.log(`witness: ${OUT}`);
}
process.exit(ok ? 0 : 1);
