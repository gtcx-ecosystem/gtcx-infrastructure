#!/usr/bin/env node
/**
 * @fileoverview Validate dependabot.yml policy (Q7 pin + tier groups).
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PATH = join(ROOT, '.github', 'dependabot.yml');

const REQUIRED = [
  "dependency-name: '@types/node'",
  'version-update:semver-major',
  'open-pull-requests-limit',
  'groups:',
  'actions-core:',
];

export function validateDependabotPolicy(text) {
  const failures = [];
  for (const marker of REQUIRED) {
    if (!text.includes(marker)) failures.push(`missing: ${marker}`);
  }
  return failures;
}

function main() {
  const text = readFileSync(PATH, 'utf8');
  const failures = validateDependabotPolicy(text);
  if (failures.length > 0) {
    console.error('[dependabot-policy-check] policy drift:');
    for (const f of failures) console.error(`- ${f}`);
    process.exit(1);
  }
  console.log('[dependabot-policy-check] dependabot.yml satisfies Q7 + tier grouping');
}

if (import.meta.url === `file://${process.argv[1]}`) main();
