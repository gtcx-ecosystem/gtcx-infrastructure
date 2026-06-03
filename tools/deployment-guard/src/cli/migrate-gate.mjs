#!/usr/bin/env node
/**
 * CLI wrapper for migration gating decisions.
 *
 * Used by infra/scripts/migrate.sh to delegate safety-critical decisions to
 * typed, tested modules.
 */

import { auditVerificationPolicy } from '../audit-verifier.mjs';
import { normalizeEnvironment } from '../gate.mjs';

/**
 * @returns {never}
 */
function printUsage() {
  console.error(`Usage: migrate-gate.mjs --environment=<env> [--dry-run] [--force] [--audit-admin-url=<url>] [--audit-writer-url=<url>]`);
  process.exit(2);
}

const args = process.argv.slice(2);
if (args.length === 0) printUsage();

/** @type {Map<string, string | boolean>} */
const flags = new Map();
for (const arg of args) {
  if (arg === '--dry-run') {
    flags.set('dry-run', true);
  } else if (arg === '--force') {
    flags.set('force', true);
  } else if (arg.startsWith('--') && arg.includes('=')) {
    const [key, value] = arg.slice(2).split(/=(.*)/s, 2);
    flags.set(key, value ?? '');
  } else if (arg.startsWith('--')) {
    flags.set(arg.slice(2), true);
  }
}

const environmentFlag = flags.get('environment');
if (typeof environmentFlag !== 'string' || !environmentFlag) {
  console.error('Missing required --environment');
  printUsage();
}
const environment = environmentFlag;

// Validate environment normalization
try {
  normalizeEnvironment(environment);
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`MIGRATE_GATE_BLOCKED: ${message}`);
  process.exit(1);
}

const dryRun = flags.get('dry-run') === true;
const force = flags.get('force') === true;
const auditAdminUrl = flags.get('audit-admin-url');
const auditWriterUrl = flags.get('audit-writer-url');

// Production confirmation gate (outside development)
if (environment === 'production' && !force && !dryRun) {
  // Shell is responsible for the interactive prompt; this CLI validates
  // that the gate logic would require it.
  console.log('MIGRATE_GATE_REQUIRES_CONFIRM');
}

// Audit verification policy
const auditPolicy = auditVerificationPolicy({
  environment,
  auditAdminUrl: typeof auditAdminUrl === 'string' ? auditAdminUrl : undefined,
  auditWriterUrl: typeof auditWriterUrl === 'string' ? auditWriterUrl : undefined,
});

if (auditPolicy.required && !auditPolicy.shouldRun) {
  console.error(`MIGRATE_GATE_BLOCKED: ${auditPolicy.reason}`);
  process.exit(1);
}

console.error('MIGRATE_GATE_ALLOWED');
process.exit(0);
