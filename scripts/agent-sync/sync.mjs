#!/usr/bin/env node
// AGENT-SYNC GENERATOR — canonical source: gtcx-agentic/agent-sync/sync.mjs
// Vendored into each ecosystem repo via `rollout.mjs`. Do not edit local copies.
//
// Reads .agent/targets.json and writes content into target files between
// <!-- AGENT-SYNC:START --> and <!-- AGENT-SYNC:END --> markers.
//
// Usage:
//   node scripts/agent-sync/sync.mjs           # write changes
//   node scripts/agent-sync/sync.mjs --check   # CI gate (exit 1 on drift)

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const agentDir = join(repoRoot, '.agent');
const configPath = join(agentDir, 'targets.json');

const args = new Set(process.argv.slice(2));
const checkMode = args.has('--check');

if (!existsSync(configPath)) {
  console.error(`agent-sync: ${configPath} not found`);
  process.exit(1);
}

const config = JSON.parse(readFileSync(configPath, 'utf8'));
const { start: markerStart, end: markerEnd } = config.markers;
const header = config.header || '';

function loadPartial(name) {
  const p = join(agentDir, name);
  if (!existsSync(p)) throw new Error(`partial not found: ${p}`);
  return readFileSync(p, 'utf8').trim();
}

function buildBlock(partials) {
  const body = partials.map(loadPartial).join('\n\n');
  return `${markerStart}\n${header}\n\n${body}\n${markerEnd}`;
}

function applyBlock(existing, block) {
  const startIdx = existing.indexOf(markerStart);
  const endIdx = existing.indexOf(markerEnd);
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const before = existing.slice(0, startIdx).trimEnd();
    const after = existing.slice(endIdx + markerEnd.length).trimStart();
    const parts = [before, block, after].filter(Boolean);
    return parts.join('\n\n') + '\n';
  }
  const before = existing.trimEnd();
  const parts = [before, block].filter(Boolean);
  return parts.join('\n\n') + '\n';
}

let drift = 0;
let updated = 0;
let created = 0;

for (const target of config.targets) {
  const targetPath = join(repoRoot, target.path);
  const block = buildBlock(target.partials);

  let existing = '';
  const exists = existsSync(targetPath);
  if (exists) {
    existing = readFileSync(targetPath, 'utf8');
  } else if (!target.createIfMissing) {
    continue;
  }

  const next = applyBlock(existing, block);

  if (existing === next) {
    console.log(`  ok    ${target.path}`);
    continue;
  }

  if (checkMode) {
    console.error(`  DRIFT ${target.path}`);
    drift++;
    continue;
  }

  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, next);
  if (exists) {
    console.log(`  write ${target.path}`);
    updated++;
  } else {
    console.log(`  new   ${target.path}`);
    created++;
  }
}

if (checkMode) {
  if (drift > 0) {
    console.error(`\nagent-sync: ${drift} file(s) out of sync. Run \`pnpm agent:sync\`.`);
    process.exit(1);
  }
  console.log('\nagent-sync: all targets in sync');
} else {
  console.log(`\nagent-sync: ${updated} updated, ${created} created`);
}
