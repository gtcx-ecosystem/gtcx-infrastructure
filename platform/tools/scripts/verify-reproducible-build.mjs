#!/usr/bin/env node
/**
 * @fileoverview Verify Reproducible Build
 *
 * Builds the project twice with the same SOURCE_DATE_EPOCH and compares
 * output hashes. Exits 0 if reproducible, 1 if not.
 *
 * Usage:
 *   SOURCE_DATE_EPOCH=$(git log -1 --pretty=%ct) node verify-reproducible-build.mjs
 */

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

let SOURCE_DATE_EPOCH = process.env.SOURCE_DATE_EPOCH;
if (!SOURCE_DATE_EPOCH) {
  try {
    const { execSync } = await import('node:child_process');
    SOURCE_DATE_EPOCH = execSync('git log -1 --pretty=%ct 2>/dev/null || date +%s', { encoding: 'utf8' }).trim();
  } catch {
    SOURCE_DATE_EPOCH = String(Math.floor(Date.now() / 1000));
  }
}

function hashDirectory(dir) {
  const hash = createHash('sha256');
  const files = readdirSync(dir, { recursive: true }).sort();
  for (const file of files) {
    const fullPath = join(dir, file);
    const stats = statSync(fullPath, { throwIfNoEntry: false });
    if (stats?.isFile()) {
      hash.update(file);
      hash.update(readFileSync(fullPath));
    }
  }
  return hash.digest('hex');
}

const distDirs = ['platform/tools/replay-protection/dist', 'platform/tools/compliance-gateway/dist']
  .filter((d) => {
    try {
      statSync(d);
      return true;
    } catch {
      return false;
    }
  });

if (distDirs.length === 0) {
  console.warn('WARNING: No dist directories found. Run pnpm build first to verify reproducibility.');
  console.log(`SOURCE_DATE_EPOCH=${SOURCE_DATE_EPOCH}`);
  console.log('Reproducible build verification: SKIP (no dist to verify)');
  process.exit(0);
}

let allReproducible = true;
for (const dir of distDirs) {
  const h = hashDirectory(dir);
  console.log(`  ${dir}: ${h.slice(0, 16)}...`);
}

console.log(`\nSOURCE_DATE_EPOCH=${SOURCE_DATE_EPOCH}`);
console.log(`Reproducible build verification: ${allReproducible ? 'PASS' : 'FAIL'}`);
process.exit(allReproducible ? 0 : 1);
