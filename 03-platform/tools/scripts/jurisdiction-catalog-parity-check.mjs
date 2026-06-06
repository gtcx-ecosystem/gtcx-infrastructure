#!/usr/bin/env node
/**
 * @fileoverview Ensure signed jurisdiction catalog keys match terraform presets (S3-12).
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const CATALOG = join(ROOT, '03-platform/tools', 'compliance-data', 'jurisdictions.json');
const VARIABLES = join(ROOT, '04-deploy/terraform', 'modules', 'compliance-db', 'variables.tf');

export function extractTerraformJurisdictions(text) {
  const match = text.match(/contains\(\[\s*([\s\S]*?)\],\s*var\.jurisdiction\)/);
  if (!match) return [];
  return [...match[1].matchAll(/"([a-z_]+)"/g)].map((m) => m[1]);
}

export function compareJurisdictionCatalog(catalog, terraformJurisdictions) {
  const failures = [];
  const catalogKeys = Object.keys(catalog.jurisdictions ?? {});
  const tfSet = new Set(terraformJurisdictions.filter((j) => j !== 'generic'));
  for (const key of catalogKeys) {
    if (!tfSet.has(key)) {
      failures.push(`catalog jurisdiction "${key}" missing from terraform presets`);
    }
  }
  return failures;
}

function main() {
  const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'));
  const variables = readFileSync(VARIABLES, 'utf8');
  const terraformJurisdictions = extractTerraformJurisdictions(variables);
  const failures = compareJurisdictionCatalog(catalog, terraformJurisdictions);
  if (failures.length > 0) {
    console.error('[jurisdiction-catalog-parity-check] drift:');
    for (const f of failures) console.error(`- ${f}`);
    process.exit(1);
  }
  console.log(
    `[jurisdiction-catalog-parity-check] ${Object.keys(catalog.jurisdictions).length} catalog jurisdiction(s) OK`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main();
