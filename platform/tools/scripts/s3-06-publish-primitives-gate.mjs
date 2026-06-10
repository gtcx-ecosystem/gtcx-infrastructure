#!/usr/bin/env node
/**
 * @fileoverview S3-06 Gate — Publish Primitives Readiness
 *
 * Validates that @gtcx/audit-signer is configured for npm publish
 * with provenance and that the CI workflow has a publish job.
 *
 * Usage: node platform/tools/scripts/s3-06-publish-primitives-gate.mjs
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const WORKFLOW = join(ROOT, '.github', 'workflows', 'slsa-provenance.yml');
const PKG_JSON = join(ROOT, 'platform/tools', 'audit-signer', 'package.json');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

const failures = [];

// 1. Workflow has publish-npm job
const workflowText = readFileSync(WORKFLOW, 'utf8');
if (!workflowText.includes('publish-npm')) {
  failures.push('slsa-provenance.yml missing publish-npm job');
}
if (!workflowText.includes('npm publish')) {
  failures.push('slsa-provenance.yml missing npm publish step');
}
if (!workflowText.includes('NODE_AUTH_TOKEN')) {
  failures.push('slsa-provenance.yml missing NODE_AUTH_TOKEN for npm auth');
}
if (!workflowText.includes("startsWith(github.ref, 'refs/tags/v')")) {
  failures.push('publish-npm job should only run on version tags');
}

// 2. Package has publishConfig.provenance
const pkg = JSON.parse(readFileSync(PKG_JSON, 'utf8'));
if (!pkg.publishConfig?.provenance) {
  failures.push(`@${pkg.name} missing publishConfig.provenance`);
}
if (pkg.publishConfig?.access !== 'public') {
  failures.push(`@${pkg.name} publishConfig.access should be 'public'`);
}

// 3. Package is not private
if (pkg.private) {
  failures.push(`@${pkg.name} is marked private — cannot publish`);
}

if (failures.length > 0) {
  console.error(`${RED}[s3-06-gate] FAIL:${RESET}`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`${GREEN}[s3-06-gate] PASS — @gtcx/audit-signer publish-ready with provenance.${RESET}`);
console.log(`  Workflow: ${WORKFLOW.replace(`${ROOT}/`, '')}`);
console.log(`  Package: ${PKG_JSON.replace(`${ROOT}/`, '')}`);
console.log(`  Trigger: version tags (refs/tags/v*)`);
console.log(`  Status: structural done — needs NPM_TOKEN in repo secrets for live publish`);
process.exit(0);
