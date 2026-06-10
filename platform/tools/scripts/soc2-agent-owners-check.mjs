#!/usr/bin/env node
/**
 * @fileoverview Ensure SOC 2 checklist control owners use agent roles (agent-led ops).
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const CHECKLIST = join(ROOT, 'docs/governance/regulatory', 'soc2-readiness-checklist.md');

const ALLOWED_HUMAN_ESCALATION = new Set(['CISO', 'Legal', 'Board']);

export function validateSoc2Owners(text) {
  const failures = [];
  const rows = text.split('\n').filter((line) => line.startsWith('| CC'));
  for (const row of rows) {
    const cells = row.split('|').map((c) => c.trim()).filter(Boolean);
    if (cells.length < 7) continue;
    const owner = cells[cells.length - 2];
    if (owner.startsWith('agent:')) continue;
    if (ALLOWED_HUMAN_ESCALATION.has(owner)) continue;
    failures.push(`row ${cells[0]} owner "${owner}" must be agent:<role> or escalation role`);
  }
  return failures;
}

function main() {
  const text = readFileSync(CHECKLIST, 'utf8');
  if (!text.includes('Agent ownership model')) {
    console.error('[soc2-agent-owners-check] missing Agent ownership model section');
    process.exit(1);
  }
  const failures = validateSoc2Owners(text);
  if (failures.length > 0) {
    console.error('[soc2-agent-owners-check] owner mapping drift:');
    for (const f of failures) console.error(`- ${f}`);
    process.exit(1);
  }
  console.log(`[soc2-agent-owners-check] ${text.split('\n').filter((l) => l.startsWith('| CC')).length} control row(s) OK`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
