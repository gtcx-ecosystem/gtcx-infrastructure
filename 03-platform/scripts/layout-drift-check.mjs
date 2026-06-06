#!/usr/bin/env node
/**
 * Read-only layout path drift scan (executable files only).
 * Spec: gtcx-agentic migration-health scorecard P dimension.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(fileURLToPath(import.meta.url), '../../..');
const SKIP = new Set(['node_modules', '.git', 'dist', '.turbo', 'coverage', '00-archive', '.next', 'baseline-os']);
const FORBIDDEN = [
  /01-01-docs\//,
  /11-03-platform\//,
  /03-platform\/tools\/03-platform\//,
  /(?:join|resolve|from)\([^)]*['"]infra\/kubernetes/,
  /(?<!03-platform\/)(?<![@/])['"]packages\//,
  /(?<!03-platform\/)(?<![@/])['"]services\//,
  /(?<!03-platform\/)(?<![@/])['"]apps\//,
  /(?<!04-deploy\/)(?<![@/])['"]infra\//,
  /(?<!03-platform\/)(?<![@/])['"]data\//,
  /(?<!03-platform\/)(?<![@/])['"]tools\//,
  /(?<!03-platform\/)(?<![@/])['"]sdk\//,
];
const CODE_EXT = /\.(mjs|js|ts|tsx|sh|yaml|yml)$/;

function walk(dir, out = [], depth = 0) {
  if (depth > 8 || !existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const abs = join(dir, name);
    const st = statSync(abs);
    if (st.isDirectory()) walk(abs, out, depth + 1);
    else if (CODE_EXT.test(name)) out.push(abs);
  }
  return out;
}

const FORBIDDEN_ROOT = ['CLAUDE.md', 'GEMINI.md', 'KIMI.md', 'CODEX.md', 'CONVENTIONS.md'];

const hits = [];
for (const name of FORBIDDEN_ROOT) {
  if (existsSync(join(REPO, name))) hits.push(`forbidden root file: ${name}`);
}
for (const root of [REPO, join(REPO, '03-platform'), join(REPO, '04-deploy'), join(REPO, '.github')]) {
  if (!existsSync(root)) continue;
  for (const file of walk(root)) {
    const rel = relative(REPO, file);
    if (rel.endsWith('layout-strings-check.mjs') || rel.endsWith('layout-drift-check.mjs')) continue;
    const text = readFileSync(file, 'utf8');
    for (const re of FORBIDDEN) {
      if (re.test(text)) {
        hits.push(`${relative(REPO, file)} (${re})`);
        break;
      }
    }
  }
}

if (hits.length) {
  console.error('layout drift check failed:');
  for (const h of hits.slice(0, 30)) console.error(`  - ${h}`);
  process.exit(1);
}

console.log('layout drift check passed (gtcx-infrastructure).');
