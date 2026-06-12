#!/usr/bin/env node
/**
 * Trade ecosystem lanes — validate lane registry vs infra deploy matrix.
 *
 * Usage:
 *   node fabric-lanes-check.mjs [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REGISTRY = join(ROOT, 'pm/spec/trade-ecosystem-lanes.json');
const MATRIX = join(ROOT, 'docs/operations/coordination/infra-per-repo-action-matrix-2026-06-05.md');
const COORD_DIR = join(ROOT, 'docs/operations/coordination');
const OUT = join(ROOT, 'audit/evidence/fabric-lanes-check-latest.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

/** @type {Record<string, string>} */
const LEGACY_REPO_LANE = {
  'gtcx-platforms': 'C',
  'gtcx-protocols': 'T0',
  'gtcx-intelligence': 'L2',
  'gtcx-mobile': 'L1',
  'gtcx-core': 'T0.5',
  'gtcx-agentic': 'B',
  'gtcx-docs': 'U',
  'gtcx-agile': 'U',
  'gtcx-operations': 'L4a',
  'gtcx-hardware': 'L1',
  'gtcx-infrastructure': 'I',
};

function normalizeRepo(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/\*\*/g, '');
}

function buildExpectedRepoLanes(registry) {
  /** @type {Map<string, string>} */
  const map = new Map();
  for (const [laneId, lane] of Object.entries(registry.lanes ?? {})) {
    if (lane.repo) map.set(normalizeRepo(lane.repo), laneId);
    const members = lane.members;
    if (Array.isArray(members)) {
      for (const m of members) map.set(normalizeRepo(m), laneId);
    } else if (members && typeof members === 'object') {
      for (const s of members.siblings ?? []) map.set(normalizeRepo(s), laneId);
      for (const key of Object.keys(members)) {
        if (/(-os|-ui|-ai)$/.test(key)) map.set(normalizeRepo(key), laneId);
      }
    }
  }
  for (const [repo, lane] of Object.entries(LEGACY_REPO_LANE)) {
    map.set(normalizeRepo(repo), lane);
  }
  return map;
}

function parseMatrixRows(md) {
  /** @type {{ lane: string, repo: string, section: string }[]} */
  const rows = [];
  let section = 'unknown';
  for (const line of md.split('\n')) {
    if (line.startsWith('## ')) section = line.replace(/^##\s+/, '').trim();
    const m = line.match(/^\|\s*\*\*([A-Z0-9.]+)\*\*\s*\|\s*\*\*([^*|]+)\*\*/);
    if (!m) continue;
    rows.push({ lane: m[1], repo: normalizeRepo(m[2]), section });
  }
  return rows;
}

function scanHandoffsForLaneId() {
  /** @type {{ file: string, ok: boolean }[]} */
  const results = [];
  if (!existsSync(COORD_DIR)) return results;
  for (const name of readdirSync(COORD_DIR)) {
    if (!name.endsWith('.md')) continue;
    if (!/trade-ecosystem-lanes|trade-lanes|lane-deploy|lanes-registry/i.test(name)) continue;
    const rel = `docs/operations/coordination/${name}`;
    const text = readFileSync(join(COORD_DIR, name), 'utf8');
    const hasLaneId = /^laneId:\s*\S+/m.test(text);
    results.push({ file: rel, ok: hasLaneId });
  }
  return results;
}

const gates = {};
const failures = [];

gates.registryExists = { ok: existsSync(REGISTRY) };
gates.matrixExists = { ok: existsSync(MATRIX) };

if (!gates.registryExists.ok || !gates.matrixExists.ok) {
  const witness = {
    schema: 'gtcx://fabric-os/fabric-lanes-check/v1',
    checkedAt: new Date().toISOString(),
    owner: 'fabric-os',
    initiative: 'INIT-GTCX-TRADE-ECOSYSTEM-LANES',
    gates,
    ok: false,
    failures: ['missing registry or matrix'],
  };
  if (WRITE) {
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
  }
  if (JSON_OUT) console.log(JSON.stringify(witness, null, 2));
  else console.error('FAIL — missing lane registry or infra matrix');
  process.exit(1);
}

const registry = JSON.parse(readFileSync(REGISTRY, 'utf8'));
const matrixMd = readFileSync(MATRIX, 'utf8');
const validLaneIds = new Set(Object.keys(registry.lanes ?? {}));
const expected = buildExpectedRepoLanes(registry);
const matrixRows = parseMatrixRows(matrixMd);

gates.registryLanes = { ok: validLaneIds.size >= 10, count: validLaneIds.size };
gates.matrixRowsTagged = { ok: matrixRows.length >= 15, count: matrixRows.length };

for (const row of matrixRows) {
  if (!validLaneIds.has(row.lane)) {
    failures.push(`invalid lane \`${row.lane}\` for repo \`${row.repo}\` (${row.section})`);
  }
  const expect = expected.get(row.repo);
  if (expect && expect !== row.lane) {
    failures.push(`lane mismatch \`${row.repo}\`: matrix=${row.lane} registry=${expect}`);
  }
  if (row.repo === 'gtcx-os' && row.lane === 'I') {
    failures.push('boundary: gtcx-os must not be lane I');
  }
  if (row.repo === 'fabric-os' && row.lane === 'C') {
    failures.push('boundary: fabric-os must not be lane C');
  }
  if (row.repo === 'ledger-ui' && (row.lane === 'T0' || row.lane.startsWith('T0'))) {
    failures.push('boundary: ledger-ui (X) must not be T0');
  }
}

const handoffs = scanHandoffsForLaneId();
const handoffMissing = handoffs.filter((h) => !h.ok);
gates.tradeLaneHandoffs = {
  ok: handoffMissing.length === 0,
  checked: handoffs.length,
  missingLaneId: handoffMissing.map((h) => h.file),
};

for (const h of handoffMissing) {
  failures.push(`handoff missing laneId: ${h.file}`);
}

const ok =
  gates.registryLanes.ok &&
  gates.matrixRowsTagged.ok &&
  gates.tradeLaneHandoffs.ok &&
  failures.length === 0;

const witness = {
  schema: 'gtcx://fabric-os/fabric-lanes-check/v1',
  checkedAt: new Date().toISOString(),
  owner: 'fabric-os',
  initiative: 'INIT-GTCX-TRADE-ECOSYSTEM-LANES',
  sources: {
    registry: 'pm/spec/trade-ecosystem-lanes.json',
    matrix: 'docs/operations/coordination/infra-per-repo-action-matrix-2026-06-05.md',
  },
  gates,
  matrixRowCount: matrixRows.length,
  failures,
  ok,
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}

if (JSON_OUT) {
  console.log(JSON.stringify(witness, null, 2));
} else {
  console.log('=== fabric:lanes:check ===\n');
  for (const [k, v] of Object.entries(gates)) {
    console.log(`${v.ok ? 'OK' : 'FAIL'} ${k}${v.count != null ? ` (${v.count})` : ''}`);
  }
  if (failures.length) {
    console.log('\nFailures:');
    for (const f of failures.slice(0, 12)) console.log(`  - ${f}`);
    if (failures.length > 12) console.log(`  … +${failures.length - 12} more`);
  }
  console.log(`\n${ok ? 'PASS' : 'FAIL'} — ${matrixRows.length} matrix rows, ${handoffs.length} lane handoffs`);
  if (WRITE) console.log(`witness: ${OUT}`);
}

process.exit(ok ? 0 : 1);
