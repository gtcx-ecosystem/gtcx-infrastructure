#!/usr/bin/env node
/**
 * Agent session entry (L3) — sor-map + repo-kind + P22 + tiers in one JSON payload.
 * Fast by default; pass --with-gates to run layout + bootstrap checks inline.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  ALLOWLIST_PATH,
  DOCS_INDEX_PATH,
  REPO_KIND_PATH,
  REPO_ROOT,
  loadSorMap,
  relFromSor,
} from '../../config/paths.mjs';

const withGates = process.argv.includes('--with-gates');

const HUB_READMES = [
  '00-archive/README.md',
  '01-docs/README.md',
  '02-ops/README.md',
  '03-platform/README.md',
  '04-deploy/README.md',
  '05-audit/README.md',
  '06-workstream/README.md',
];

function findAgenticRoot() {
  for (const rel of ['../gtcx-agentic', '../../gtcx-agentic']) {
    const root = join(REPO_ROOT, rel);
    if (existsSync(join(root, 'package.json'))) return root;
  }
  return null;
}

function readMigrationTiers() {
  const agentic = findAgenticRoot();
  if (!agentic) return null;
  const evidence = join(agentic, '05-audit/evidence/migration-health-gtcx-infrastructure-latest.json');
  if (!existsSync(evidence)) return null;
  try {
    const raw = JSON.parse(readFileSync(evidence, 'utf8'));
    return {
      L1: raw.tiers?.L1?.score ?? raw.total ?? null,
      L2: raw.tiers?.L2?.score ?? null,
      L3: raw.tiers?.L3?.score ?? null,
      worldClass: raw.worldClass ?? false,
      total: raw.total ?? null,
      grade: raw.grade ?? null,
      source: 'gtcx-agentic/05-audit/evidence/migration-health-gtcx-infrastructure-latest.json',
      date: raw.date ?? null,
    };
  } catch {
    return null;
  }
}

function transitionalDebt() {
  const notes = [];
  if (existsSync(ALLOWLIST_PATH)) {
    const allow = JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf8'));
    if (allow.migration_tier && allow.migration_tier !== 'stable') {
      notes.push(`migration_tier=${allow.migration_tier}`);
    }
    for (const [dir, meta] of Object.entries(allow.transitional_allowed_directories ?? {})) {
      if (existsSync(join(REPO_ROOT, dir))) {
        notes.push(`transitional allowlist: ${dir}/ → ${meta?.target ?? '?'}`);
      }
    }
  }
  return notes;
}

function hubReadmeStatus() {
  const missing = HUB_READMES.filter((rel) => !existsSync(join(REPO_ROOT, rel)));
  return { complete: missing.length === 0, expected: HUB_READMES.length, missing };
}

function runGate(script) {
  const r = spawnSync('pnpm', [script], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '0' },
  });
  return { ok: r.status === 0, exitCode: r.status ?? 1 };
}

function runNextWork() {
  const r = spawnSync('node', ['03-platform/scripts/agent-next-work.mjs'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '0' },
  });
  if (r.status !== 0) {
    return { ok: false, exitCode: r.status ?? 1, error: (r.stderr || r.stdout || '').trim().slice(0, 500) };
  }
  try {
    return { ok: true, payload: JSON.parse(r.stdout) };
  } catch {
    return { ok: false, exitCode: 1, error: 'agent:next-work did not emit valid JSON' };
  }
}

const sor = loadSorMap();
const kind = JSON.parse(readFileSync(REPO_KIND_PATH, 'utf8'));
const paths = {};
for (const key of Object.keys(sor.paths ?? {})) {
  paths[key] = relFromSor(key);
}

const nextWork = runNextWork();
const gates = {};
if (withGates) {
  for (const script of ['agent:bootstrap:check', 'layout:migrate:v6:check', 'docs:ia:check']) {
    gates[script] = runGate(script);
  }
}

const entry = {
  schema: 'gtcx.agentEntry.v1',
  repo: sor.repo,
  repoKind: kind.kind,
  migrationTier: sor.migrationTier ?? kind.migrationTier,
  repoKindProfile: kind,
  auditEntry: relFromSor('auditEntry'),
  docsIndex: existsSync(DOCS_INDEX_PATH) ? '01-docs/INDEX.md' : null,
  docsIamap: relFromSor('docsIamap'),
  paths,
  deprecated: sor.deprecated ?? {},
  transitionalDebt: transitionalDebt(),
  hubReadmes: hubReadmeStatus(),
  tiers: readMigrationTiers(),
  nextWork: nextWork.ok ? nextWork.payload : { error: nextWork.error, exitCode: nextWork.exitCode },
  gates: withGates ? gates : undefined,
  allGatesGreen: withGates ? Object.values(gates).every((g) => g.ok) : undefined,
  commands: {
    sessionStart: 'pnpm agent:start',
    nextWork: 'pnpm agent:next-work',
    bootstrap: 'pnpm agent:bootstrap:check',
    layout: 'pnpm layout:migrate:v6:check',
    docsIa: 'pnpm docs:ia:check',
  },
};

console.log(JSON.stringify(entry, null, 2));

const ok =
  hubReadmeStatus().complete &&
  existsSync(DOCS_INDEX_PATH) &&
  nextWork.ok &&
  transitionalDebt().length === 0 &&
  (!withGates || entry.allGatesGreen);

process.exit(ok ? 0 : 1);
