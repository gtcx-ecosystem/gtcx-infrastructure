#!/usr/bin/env node
/**
 * @fileoverview Secret Scanning Gate
 *
 * Runs gitleaks (or falls back to trufflehog if available) to detect
 * leaked secrets, API keys, tokens, and credentials in the repository.
 *
 * Usage: node platform/tools/scripts/secret-scan-gate.mjs
 */

import { execSync } from 'node:child_process';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function hasCommand(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function runGitleaks() {
  console.log('[secret-scan] Running gitleaks detect ...');
  execSync('gitleaks detect --source . --verbose --no-git', {
    stdio: 'inherit',
    timeout: 120000,
  });
}

function runTrufflehog() {
  console.log('[secret-scan] Running trufflehog filesystem --only-verified ...');
  execSync('trufflehog filesystem . --only-verified', {
    stdio: 'inherit',
    timeout: 120000,
  });
}

// =============================================================================
// Main
// =============================================================================

if (hasCommand('gitleaks')) {
  runGitleaks();
} else if (hasCommand('trufflehog')) {
  runTrufflehog();
} else {
  console.warn(
    `${YELLOW}[secret-scan] WARNING: Neither gitleaks nor trufflehog found in PATH.${RESET}`
  );
  console.warn(
    `${YELLOW}  Install one of them to enable local secret scanning:${RESET}`
  );
  console.warn(`${YELLOW}    brew install gitleaks${RESET}`);
  console.warn(`${YELLOW}    or see https://github.com/trufflesecurity/trufflehog${RESET}`);
  console.warn(`${YELLOW}  Skipping gate (CI will still run trufflehog).${RESET}`);
  process.exit(0);
}

console.log(`${GREEN}[secret-scan] No secrets detected.${RESET}`);
process.exit(0);
