#!/usr/bin/env node
/**
 * @fileoverview SLSA Build L3 Gate — S2-05
 *
 * Verifies that the SLSA provenance workflow is configured to generate
 * Level 3 provenance for both container images and npm packages.
 *
 * Checks:
 *   1. slsa-provenance.yml workflow exists
 *   2. Container image provenance job is present
 *   3. npm package provenance job is present
 *   4. Verification job is present
 *   5. @gtcx/audit-signer has publishConfig.provenance = true
 *
 * Usage: node tools/scripts/slsa-l3-gate.mjs
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

const failures = [];

// 1. Workflow exists
const workflowPath = '.github/workflows/slsa-provenance.yml';
try {
  const workflow = readFileSync(workflowPath, 'utf8');

  // 2. Container provenance
  if (!workflow.includes('generator_container_slsa3')) {
    failures.push('Missing container SLSA provenance generator');
  }

  // 3. npm provenance
  if (!workflow.includes('generator_generic_slsa3')) {
    failures.push('Missing npm package SLSA provenance generator');
  }

  // 4. Verification job
  if (!workflow.includes('slsa-verifier')) {
    failures.push('Missing slsa-verifier verification step');
  }

  // 5. Rekor attestation
  if (!workflow.includes('cosign attest')) {
    failures.push('Missing cosign attestation publish step');
  }
} catch (err) {
  failures.push(`Cannot read ${workflowPath}: ${err.message}`);
}

// 6. Audit-signer has npm provenance enabled
const auditSignerPkgPath = 'tools/audit-signer/package.json';
try {
  const pkg = JSON.parse(readFileSync(auditSignerPkgPath, 'utf8'));
  if (!pkg.publishConfig?.provenance) {
    failures.push(`@${pkg.name} missing publishConfig.provenance`);
  }
} catch (err) {
  failures.push(`Cannot read ${auditSignerPkgPath}: ${err.message}`);
}

if (failures.length > 0) {
  console.error(`${RED}[slsa-l3-gate] FAIL:${RESET}`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`${GREEN}[slsa-l3-gate] PASS — SLSA L3 workflow + npm provenance configured.${RESET}`);
process.exit(0);
