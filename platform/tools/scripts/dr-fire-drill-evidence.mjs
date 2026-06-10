#!/usr/bin/env node
/**
 * @fileoverview Generate structural DR drill evidence without live RDS credentials.
 *
 * Validates dr-test.sh contract and writes a dated evidence artifact for
 * quarterly review. Live RDS execution remains an operator step (S3-02).
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const DR_SCRIPT = join(ROOT, 'deploy/03-platform/scripts', 'dr-test.sh');
const OUT = join(ROOT, '01-docs/audit', 'dr-fire-drill-evidence-2026-05-31.md');

const REQUIRED_GUARDS = [
  'POSTGRES_HOST:?',
  'POSTGRES_PASSWORD:?',
  'AUDIT_HOST:?',
  'POSTGRES_AUDIT_PASSWORD:?',
  'record_step',
  'EVIDENCE_RTO_MS',
];

export function validateDrScript(text) {
  const failures = [];
  for (const marker of REQUIRED_GUARDS) {
    if (!text.includes(marker)) failures.push(`missing: ${marker}`);
  }
  return failures;
}

function main() {
  if (!existsSync(DR_SCRIPT)) {
    console.error('[dr-fire-drill-evidence] dr-test.sh not found');
    process.exit(1);
  }
  const text = readFileSync(DR_SCRIPT, 'utf8');
  const failures = validateDrScript(text);
  if (failures.length > 0) {
    console.error('[dr-fire-drill-evidence] dr-test.sh contract drift:');
    for (const f of failures) console.error(`- ${f}`);
    process.exit(1);
  }

  const body = `---
title: 'DR Fire Drill Evidence — Structural Validation'
status: current
date: '2026-05-31'
owner: agent:platform-architect
tier: critical
tags: ['audit', 'dr', 'evidence']
review_cycle: quarterly
agent_generated: true
live_rds_execution: pending
---

# DR Fire Drill Evidence — 2026-05-31

> Agent-generated structural evidence. Live RDS restore against staging is
> **pending** — requires operator credentials per \`deploy/platform/scripts/dr-test.sh\`.

## Validation performed

| Check | Result |
|-------|--------|
| \`dr-test.sh\` fail-fast env guards | PASS |
| Evidence fields (RTO/RPO/steps) | PASS |
| Script path | \`deploy/platform/scripts/dr-test.sh\` |

## Next operator step

\`\`\`bash
POSTGRES_HOST=... POSTGRES_USER=... POSTGRES_DB=... POSTGRES_PASSWORD=... \\
AUDIT_HOST=... AUDIT_USER=... AUDIT_DB=... POSTGRES_AUDIT_PASSWORD=... \\
./deploy/platform/scripts/dr-test.sh staging 01-docs/05-audit/evidence/
\`\`\`

## Agent attestation

- [x] Structural contract validated at HEAD
- [ ] Live RDS drill executed (human/operator with vault creds)
`;

  writeFileSync(OUT, body);
  console.log(`[dr-fire-drill-evidence] wrote ${OUT.replace(`${ROOT}/`, '')}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
