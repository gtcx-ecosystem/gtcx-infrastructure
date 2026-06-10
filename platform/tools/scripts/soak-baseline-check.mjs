#!/usr/bin/env node
/**
 * @fileoverview Compare k6 (or smoke) soak metrics against a committed baseline.
 *
 * Usage:
 *   node platform/tools/scripts/soak-baseline-check.mjs --check
 *   node platform/tools/scripts/soak-baseline-check.mjs --metrics=path/to/metrics.json
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const BASELINE_PATH = join(ROOT, 'audit', 'soak-baseline.json');

export function compareSoakMetrics(baseline, actual) {
  const failures = [];
  const threshold = baseline.regressionThreshold ?? 0.25;

  for (const [key, baseValue] of Object.entries(baseline.metrics)) {
    const actualValue = actual.metrics?.[key];
    if (typeof actualValue !== 'number') {
      failures.push(`missing metric: ${key}`);
      continue;
    }
    if (typeof baseValue !== 'number' || baseValue <= 0) continue;
    const regression = (actualValue - baseValue) / baseValue;
    if (regression > threshold) {
      failures.push(
        `${key}: ${actualValue} exceeds baseline ${baseValue} by ${(regression * 100).toFixed(1)}% (> ${threshold * 100}% threshold)`
      );
    }
  }
  return failures;
}

function main() {
  const checkOnly = process.argv.includes('--check');
  const metricsArg = process.argv.find((a) => a.startsWith('--metrics='));

  if (!existsSync(BASELINE_PATH)) {
    console.error('[soak-baseline-check] missing baseline file');
    process.exit(1);
  }

  const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));

  if (checkOnly && !metricsArg) {
    if (!baseline.metrics || Object.keys(baseline.metrics).length === 0) {
      console.error('[soak-baseline-check] baseline has no metrics');
      process.exit(1);
    }
    console.log(
      `[soak-baseline-check] baseline v${baseline.version} OK (${Object.keys(baseline.metrics).length} metric(s))`
    );
    return;
  }

  if (!metricsArg) {
    console.error('[soak-baseline-check] pass --metrics=<path> or --check');
    process.exit(1);
  }

  const actual = JSON.parse(readFileSync(metricsArg.slice('--metrics='.length), 'utf8'));
  const failures = compareSoakMetrics(baseline, actual);
  if (failures.length > 0) {
    console.error('[soak-baseline-check] regression detected:');
    for (const f of failures) console.error(`- ${f}`);
    process.exit(1);
  }
  console.log('[soak-baseline-check] metrics within baseline tolerance');
}

if (import.meta.url === `file://${process.argv[1]}`) main();
