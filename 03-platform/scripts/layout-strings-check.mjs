#!/usr/bin/env node
/**
 * String-level layout drift scan (active code + operational docs).
 * Complements layout-drift-check.mjs (executable code paths).
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { REPO_ROOT } from '../../config/paths.mjs';

const SKIP = new Set(['node_modules', '.git', 'dist', '.turbo', 'coverage', '00-archive', '.baseline']);
const CODE_EXT = /\.(mjs|js|ts|tsx|sh|yaml|yml|d\.ts)$/;
const MD_EXT = /\.md$/;

const STRING_PATTERNS = [
  { re: /03-platform\/03-platform\//, label: 'double hub prefix' },
  { re: /(?<!04-deploy\/)(?<![@/])['"]infra\//, label: 'deprecated root infra/ string (use 04-deploy/)' },
  { re: /(?<!03-platform\/)(?<![@/])['"]tools\//, label: 'deprecated root tools/ string (use 03-platform/tools/)' },
  { re: /['"]docs\/audit\//, label: 'deprecated docs/audit/ (use 01-docs/audit/)' },
  { re: /['"]docs\/gtm\//, label: 'deprecated docs/gtm/ (use 01-docs/gtm/)' },
  { re: /\.\/04-ship\//, label: 'deprecated local script path ./04-ship (use 04-deploy/)' },
  { re: /`04-ship\//, label: 'deprecated local path 04-ship (use 04-deploy/)' },
  { re: /04-ship\/(03-platform|helm|grafana|docker|init|terraform|prometheus|otel|kubernetes)/, label: 'deprecated hub path 04-ship' },
];

function walk(dir, out = [], depth = 0, extRe = CODE_EXT) {
  if (depth > 10 || !existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name) || name === 'pnpm-lock.yaml') continue;
    if (name === 'layout-strings-check.mjs' || name === 'agent-bootstrap-check.mjs') continue;
    const abs = join(dir, name);
    let st;
    try {
      st = statSync(abs);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (name === 'audit' && dir.endsWith('01-docs')) continue;
      walk(abs, out, depth + 1, extRe);
    } else if (extRe.test(name)) out.push(abs);
  }
  return out;
}

function scanFiles(files) {
  const hits = [];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const rel = relative(REPO_ROOT, file);
    for (const { re, label } of STRING_PATTERNS) {
      if (re.test(text)) {
        if (label.includes('04-ship') && /deprecated|forbidden|LEGACY|migrate|use 04-deploy/i.test(text)) continue;
        if (label.includes('tools/') && rel.includes('layout-strings-check')) continue;
        hits.push(`${rel} — ${label}`);
        break;
      }
    }
  }
  return hits;
}

const codeRoots = [
  join(REPO_ROOT, '03-platform'),
  join(REPO_ROOT, '04-deploy'),
  join(REPO_ROOT, '.github'),
  join(REPO_ROOT, 'config'),
  REPO_ROOT,
];

const mdRoots = [
  join(REPO_ROOT, '03-platform'),
  join(REPO_ROOT, '01-docs/operations'),
  join(REPO_ROOT, '01-docs/04-ops'),
  join(REPO_ROOT, '05-audit'),
];

const codeFiles = [...new Set(codeRoots.flatMap((r) => walk(r, [], 0, CODE_EXT)))];
const mdFiles = [...new Set(mdRoots.flatMap((r) => walk(r, [], 0, MD_EXT)))];
for (const name of ['README.md', 'AGENTS.md', 'CHANGELOG.md']) {
  const abs = join(REPO_ROOT, name);
  if (existsSync(abs)) mdFiles.push(abs);
}

const hits = [...scanFiles(codeFiles), ...scanFiles(mdFiles)];

if (hits.length) {
  console.error('layout strings check failed:');
  for (const h of hits.slice(0, 40)) console.error(`  - ${h}`);
  if (hits.length > 40) console.error(`  … and ${hits.length - 40} more`);
  process.exit(1);
}

console.log('layout strings check passed (gtcx-infrastructure).');
