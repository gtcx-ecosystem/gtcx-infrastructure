#!/usr/bin/env node
/**
 * @fileoverview Audit Sink Gate — S2-02
 *
 * Verifies that the audit sink:
 *   1. Defaults to stdout in development
 *   2. Defaults to NATS in production
 *   3. Rejects stdout explicitly in production/staging
 *
 * Usage: node platform/tools/scripts/audit-sink-gate.mjs
 */

import { execSync } from 'node:child_process';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

console.log('[audit-sink-gate] Running audit-sink unit tests ...');

try {
  execSync('node --test tests/audit-sink.unit.test.mjs', {
    cwd: 'platform/tools/compliance-gateway',
    stdio: 'inherit',
    encoding: 'utf8',
    timeout: 120000,
  });
  console.log(`${GREEN}[audit-sink-gate] PASS — all sink tests pass.${RESET}`);
  process.exit(0);
} catch (e) {
  console.log(`${RED}[audit-sink-gate] FAIL — sink tests failed.${RESET}`);
  process.exit(1);
}
