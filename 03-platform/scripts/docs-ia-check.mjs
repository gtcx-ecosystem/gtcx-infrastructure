#!/usr/bin/env node
/**
 * Docs IA gate — sor-map keys indexed, hub READMEs 8/8, INDEX.md present.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { DOCS_INDEX_PATH, REPO_ROOT, loadSorMap } from '../../config/paths.mjs';

const HUB_READMES = [
  '00-archive/README.md',
  '01-docs/README.md',
  '02-ops/README.md',
  '03-platform/README.md',
  '04-deploy/README.md',
  '05-audit/README.md',
  '06-workstream/README.md',
];

const failures = [];

if (!existsSync(DOCS_INDEX_PATH)) {
  failures.push('missing 01-docs/INDEX.md (tooling alias to README + sor-map table)');
}

const indexText = existsSync(DOCS_INDEX_PATH) ? readFileSync(DOCS_INDEX_PATH, 'utf8') : '';
const readmeText = existsSync(join(REPO_ROOT, '01-docs/README.md'))
  ? readFileSync(join(REPO_ROOT, '01-docs/README.md'), 'utf8')
  : '';
const iaCorpus = `${indexText}\n${readmeText}`;

if (!/config\/sor-map\.json/.test(iaCorpus)) {
  failures.push('01-docs IA must reference config/sor-map.json');
}

if (!/Layout v3 IA map|Agent IA map/i.test(iaCorpus)) {
  failures.push('01-docs README/INDEX missing Layout v3 IA map section');
}

const sor = loadSorMap();
for (const [key, rel] of Object.entries(sor.paths ?? {})) {
  if (typeof rel !== 'string') continue;
  const needle = rel.replace(/\/$/, '');
  if (!iaCorpus.includes(needle) && !iaCorpus.includes(key)) {
    failures.push(`sor-map paths.${key} (${rel}) not indexed in 01-docs/INDEX.md or README.md`);
  }
}

for (const rel of HUB_READMES) {
  if (!existsSync(join(REPO_ROOT, rel))) failures.push(`missing hub README: ${rel}`);
}

if (failures.length) {
  console.error('docs IA check failed:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log('docs IA check passed (gtcx-infrastructure).');
