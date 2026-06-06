#!/usr/bin/env node
/**
 * SIGNAL INF-014 — prompt semver manifest gate.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

let failed = 0;

function fail(msg) {
  console.error(`prompt-semver: FAIL — ${msg}`);
  failed += 1;
}

function pass(msg) {
  console.log(`prompt-semver: PASS — ${msg}`);
}

const out = execSync('node -e "import(\'./03-platform/tools/compliance-gateway/src/system-prompt.mjs\').then(m=>console.log(JSON.stringify(m.getPromptMetadata())))"', {
  cwd: ROOT,
  encoding: 'utf8',
});
const meta = JSON.parse(out.trim());
const version = meta.promptVersion;
const dir = path.join(ROOT, `01-docs/05-audit/prompts/compliance-gateway@${version}`);
for (const file of ['manifest.json', 'system.md', 'CHANGELOG.md']) {
  const abs = path.join(dir, file);
  if (!existsSync(abs)) fail(`missing ${file} for @${version}`);
  else pass(file);
}

const manifest = JSON.parse(readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
if (manifest.version !== version) {
  fail(`manifest.version ${manifest.version} !== runtime ${version}`);
} else {
  pass('manifest version matches runtime');
}

if (failed > 0) process.exit(1);
console.log('prompt-semver: all checks passed');
