#!/usr/bin/env node
/**
 * @fileoverview FIPS 140-3 Mode Gate
 *
 * Verifies that the audit-signer compiles and all tests pass when
 * GTCX_FIPS_MODE=1 (ECDSA P-256 instead of Ed25519).
 *
 * Usage: node platform/tools/scripts/fips-mode-gate.mjs
 */

import { execSync } from 'node:child_process';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

console.log('[fips-gate] Running audit-signer tests with GTCX_FIPS_MODE=1 ...');

try {
  execSync('node --test tests/**/*.test.mjs', {
    cwd: 'platform/tools/audit-signer',
    stdio: 'inherit',
    encoding: 'utf8',
    timeout: 120000,
    env: {
      ...process.env,
      GTCX_FIPS_MODE: '1',
    },
  });
  console.log(`${GREEN}[fips-gate] PASS — all tests green in FIPS mode.${RESET}`);
  process.exit(0);
} catch (e) {
  console.log(`${RED}[fips-gate] FAIL — tests failed in FIPS mode.${RESET}`);
  process.exit(1);
}
