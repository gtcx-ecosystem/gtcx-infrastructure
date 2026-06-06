#!/usr/bin/env node
/**
 * L3 agent bootstrap checks — sor-map, repo-kind, governance spine, hub READMEs.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  ALLOWLIST_PATH,
  GOVERNANCE_SPINE_PATH,
  REPO_KIND_PATH,
  REPO_ROOT,
  SOR_MAP_PATH,
} from '../../config/paths.mjs';

const failures = [];

function requireFile(rel, label) {
  const abs = join(REPO_ROOT, rel);
  if (!existsSync(abs)) failures.push(`missing ${label}: ${rel}`);
  return abs;
}

requireFile('03-platform/README.md', 'inner hub map');
requireFile('01-docs/README.md', 'docs IA');
requireFile('01-docs/INDEX.md', 'docs INDEX alias');
requireFile('00-archive/README.md', 'archive hub README');
requireFile('02-ops/README.md', 'ops hub README');
requireFile('04-deploy/README.md', 'deploy hub README');
requireFile('06-workstream/README.md', 'workstream hub README');
requireFile('05-audit/README.md', 'audit hub README');
requireFile('config/sor-map.json', 'sor-map');
requireFile('config/paths.mjs', 'paths module');
requireFile('config/repo-kind.json', 'repo-kind');
requireFile('config/governance-spine.json', 'governance spine mirror');

if (existsSync(SOR_MAP_PATH)) {
  const sor = JSON.parse(readFileSync(SOR_MAP_PATH, 'utf8'));
  for (const [key, rel] of Object.entries(sor.paths ?? {})) {
    if (typeof rel !== 'string') continue;
    const trimmed = rel.replace(/\/$/, '');
    const abs = join(REPO_ROOT, trimmed);
    if (!existsSync(abs)) failures.push(`sor-map path missing (${key}): ${rel}`);
  }
}

if (existsSync(REPO_KIND_PATH)) {
  const kind = JSON.parse(readFileSync(REPO_KIND_PATH, 'utf8'));
  if (kind.kind !== 'infra-platform') failures.push('repo-kind.json kind must be infra-platform');
}

if (existsSync(GOVERNANCE_SPINE_PATH)) {
  const spine = JSON.parse(readFileSync(GOVERNANCE_SPINE_PATH, 'utf8'));
  if (spine.repo !== 'gtcx-infrastructure') failures.push('governance-spine.json repo mismatch');
}

if (existsSync(ALLOWLIST_PATH)) {
  const allow = JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf8'));
  if (!allow.migration_tier) failures.push('root-allowlist.json missing migration_tier');
}

const nextWork = spawnSync('node', ['03-platform/scripts/agent-next-work.mjs'], {
  cwd: REPO_ROOT,
  encoding: 'utf8',
  env: { ...process.env, FORCE_COLOR: '0' },
});
if (nextWork.status !== 0) {
  failures.push('agent:next-work failed — check 01-docs/audit/execution-roadmap.md');
} else {
  try {
    const payload = JSON.parse(nextWork.stdout);
    const hasStory = Boolean(payload.next?.storyId);
    const backlogClear = payload.backlogClear === true;
    if (!hasStory && !backlogClear && !payload.blocker) {
      failures.push('agent:next-work JSON missing next.storyId, backlogClear, or blocker');
    }
  } catch {
    failures.push('agent:next-work did not emit valid JSON');
  }
}

const entry = spawnSync('node', ['03-platform/scripts/agent-entry.mjs'], {
  cwd: REPO_ROOT,
  encoding: 'utf8',
  env: { ...process.env, FORCE_COLOR: '0' },
});
if (entry.status !== 0) {
  failures.push('agent:entry failed — run pnpm agent:entry');
}

const docsIa = spawnSync('node', ['03-platform/scripts/docs-ia-check.mjs'], {
  cwd: REPO_ROOT,
  encoding: 'utf8',
});
if (docsIa.status !== 0) {
  failures.push('docs:ia:check failed — see 01-docs/INDEX.md');
}

if (failures.length) {
  console.error('agent bootstrap check failed:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log('agent bootstrap check passed (gtcx-infrastructure).');
