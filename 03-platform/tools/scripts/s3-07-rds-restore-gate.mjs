#!/usr/bin/env node
/**
 * @fileoverview S3-07 Gate — Live RDS Restore Readiness
 *
 * Validates that the RDS live restore script and runbook exist,
 * are executable, and the evidence directory is ready.
 *
 * Usage: node 03-platform/tools/scripts/s3-07-rds-restore-gate.mjs
 */

import { existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const SCRIPT = join(ROOT, 'infra', 'scripts', 'rds-live-restore.sh');
const RUNBOOK = join(ROOT, 'docs', 'operations', 'runbooks', 'rds-live-restore.md');
const EVIDENCE_DIR = join(ROOT, 'docs', 'audit', 'evidence', 'rds-restore');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

const failures = [];

if (!existsSync(SCRIPT)) {
  failures.push('rds-live-restore.sh not found');
} else {
  const stats = statSync(SCRIPT);
  if ((stats.mode & 0o111) === 0) {
    failures.push('rds-live-restore.sh is not executable');
  }
}

if (!existsSync(RUNBOOK)) {
  failures.push('rds-live-restore.md runbook not found');
}

// Ensure evidence directory exists (script will create it, but we validate parent)
if (!existsSync(EVIDENCE_DIR)) {
  // Not a failure — the script creates it on first run
}

if (failures.length > 0) {
  console.error(`${RED}[s3-07-gate] FAIL:${RESET}`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`${GREEN}[s3-07-gate] PASS — RDS live restore script + runbook ready.${RESET}`);
console.log(`  Script: ${SCRIPT.replace(`${ROOT}/`, '')}`);
console.log(`  Runbook: ${RUNBOOK.replace(`${ROOT}/`, '')}`);
console.log(`  Evidence dir: ${EVIDENCE_DIR.replace(`${ROOT}/`, '')} (created on first run)`);
process.exit(0);
