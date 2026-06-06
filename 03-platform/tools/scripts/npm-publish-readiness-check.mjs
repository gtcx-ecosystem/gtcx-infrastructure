#!/usr/bin/env node
/**
 * @fileoverview Verify npm publish prep for @gtcx primitives (S3-07 agent scope).
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const PACKAGES = [
  join(ROOT, 'tools', 'audit-signer', 'package.json'),
  join(ROOT, 'tools', 'compliance-data', 'package.json'),
];

export function validatePublishReadiness(manifests) {
  const failures = [];
  for (const { name, pkg } of manifests) {
    if (pkg.private === true) failures.push(`${name} must not be private:true`);
    if (pkg.publishConfig?.access !== 'public') {
      failures.push(`${name} publishConfig.access must be public`);
    }
    if (pkg.publishConfig?.provenance !== true) {
      failures.push(`${name} publishConfig.provenance must be true`);
    }
    if (!pkg.scripts?.prepublishOnly) {
      failures.push(`${name} must define prepublishOnly verification`);
    }
  }
  return failures;
}

function main() {
  const manifests = PACKAGES.map((path) => {
    const pkg = JSON.parse(readFileSync(path, 'utf8'));
    return { name: pkg.name, pkg };
  });
  const failures = validatePublishReadiness(manifests);
  if (failures.length > 0) {
    console.error('[npm-publish-readiness-check] not ready:');
    for (const f of failures) console.error(`- ${f}`);
    process.exit(1);
  }
  console.log(`[npm-publish-readiness-check] ${manifests.length} package(s) publish-ready`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
