#!/usr/bin/env node
/**
 * @fileoverview Validate dependabot tier 3-5 grouping for batched merges (S3-01 agent scope).
 *
 * Actual PR merges remain a GitHub operator step; this gate prevents config drift.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const PATH = join(ROOT, '.github', 'dependabot.yml');

const TIER3_PLUS_GROUPS = ['security-scanners:', 'actions-core:', 'aws-actions:', 'typescript:'];

export function validateDependabotTierGroups(text) {
  const failures = [];
  for (const marker of TIER3_PLUS_GROUPS) {
    if (!text.includes(marker)) failures.push(`missing group: ${marker}`);
  }
  if (!text.includes('open-pull-requests-limit')) {
    failures.push('missing open-pull-requests-limit');
  }
  return failures;
}

function main() {
  const text = readFileSync(PATH, 'utf8');
  const failures = validateDependabotTierGroups(text);
  if (failures.length > 0) {
    console.error('[dependabot-tier-merge-check] policy drift:');
    for (const f of failures) console.error(`- ${f}`);
    process.exit(1);
  }
  console.log('[dependabot-tier-merge-check] tier 3-5 batch groups configured');
}

if (import.meta.url === `file://${process.argv[1]}`) main();
