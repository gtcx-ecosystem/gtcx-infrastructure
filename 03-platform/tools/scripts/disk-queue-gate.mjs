#!/usr/bin/env node
/**
 * @fileoverview Disk Queue Gate — S2-03
 *
 * Verifies that the durable offline queue:
 *   1. Survives process restart (cursor + records file persisted)
 *   2. Recovers from crash (partial cursor resumes correctly)
 *
 * Usage: node 03-platform/tools/03-platform/scripts/disk-queue-gate.mjs
 */

import { execSync } from 'node:child_process';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

console.log('[disk-queue-gate] Running disk-queue tests ...');

try {
  execSync('node --test tests/disk-queue-coverage.unit.test.mjs', {
    cwd: '03-platform/tools/compliance-gateway',
    stdio: 'inherit',
    encoding: 'utf8',
    timeout: 180000,
  });
  console.log(`${GREEN}[disk-queue-gate] PASS — all disk-queue tests pass.${RESET}`);
  process.exit(0);
} catch (e) {
  console.log(`${RED}[disk-queue-gate] FAIL — disk-queue tests failed.${RESET}`);
  process.exit(1);
}
