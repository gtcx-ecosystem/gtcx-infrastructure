#!/usr/bin/env node
/**
 * @fileoverview Structural readiness for terraform-aws-compliance-db v1.0.0 registry publish (S3-12).
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MODULE = join(ROOT, 'infra', 'terraform', 'modules', 'compliance-db');

const REQUIRED_FILES = [
  'README.md',
  'variables.tf',
  'main.tf',
  'VERSION',
  'compliance-db.tftest.hcl',
];

export function validateRegistryReadiness({ version, readme, variables, presentFiles }) {
  const failures = [];
  for (const name of REQUIRED_FILES) {
    if (!presentFiles.has(name)) failures.push(`missing ${name}`);
  }
  if (!/^\d+\.\d+\.\d+$/.test(version.trim())) {
    failures.push('VERSION must be semver x.y.z');
  }
  if (!readme.includes('terraform-aws-compliance-db')) {
    failures.push('README must name terraform-aws-compliance-db');
  }
  if (!variables.includes('var.jurisdiction')) {
    failures.push('variables.tf must declare jurisdiction');
  }
  return failures;
}

function main() {
  const presentFiles = new Set(REQUIRED_FILES.filter((name) => existsSync(join(MODULE, name))));
  const version = readFileSync(join(MODULE, 'VERSION'), 'utf8');
  const readme = readFileSync(join(MODULE, 'README.md'), 'utf8');
  const variables = readFileSync(join(MODULE, 'variables.tf'), 'utf8');
  const failures = validateRegistryReadiness({ version, readme, variables, presentFiles });
  if (failures.length > 0) {
    console.error('[terraform-registry-readiness-check] not ready:');
    for (const f of failures) console.error(`- ${f}`);
    process.exit(1);
  }
  console.log(`[terraform-registry-readiness-check] module v${version.trim()} registry-ready`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
