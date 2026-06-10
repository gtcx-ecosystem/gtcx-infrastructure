#!/usr/bin/env node
/**
 * IR-5.2 gate — ecosystem integration matrix must be green and review fresh.
 *
 * Usage: node platform/tools/scripts/ecosystem-integration-matrix-check.mjs
 */

import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const MATRIX = join(ROOT, '01-docs/audit', 'ecosystem-integration-matrix-2026-06-07.json');
const REVIEW = join(ROOT, '01-docs/audit', 'ecosystem-repo-review-2026-06-07.md');
const MAX_AGE_DAYS = 120;

function fail(msg) {
  console.error(`[ecosystem-integration-matrix] ${msg}`);
  process.exit(1);
}

if (!existsSync(MATRIX)) fail('missing ecosystem-integration-matrix JSON');
if (!existsSync(REVIEW)) fail('missing ecosystem-repo-review markdown');

const matrix = JSON.parse(readFileSync(MATRIX, 'utf8'));
if (matrix.contractMatrix?.status !== 'green') {
  fail(`contract matrix status is ${matrix.contractMatrix?.status ?? 'unknown'}, expected green`);
}

const reviewDate = new Date(matrix.reviewDate);
const ageDays = (Date.now() - reviewDate.getTime()) / (1000 * 60 * 60 * 24);
if (ageDays > MAX_AGE_DAYS) {
  fail(`review dated ${matrix.reviewDate} is older than ${MAX_AGE_DAYS} days`);
}

try {
  execSync('node --test platform/tools/contract-tests/*.test.mjs', {
    cwd: ROOT,
    stdio: 'pipe',
    encoding: 'utf8',
  });
} catch (e) {
  fail(`contract tests failed: ${e.stderr || e.message}`);
}

console.log(
  `[ecosystem-integration-matrix] GREEN — review ${matrix.reviewDate}, scope ${matrix.contractMatrix.scope}`,
);
