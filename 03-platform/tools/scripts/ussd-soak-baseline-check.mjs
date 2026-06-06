#!/usr/bin/env node
/**
 * Compare USSD soak metrics against committed baseline (IR-4.1).
 *
 * Usage:
 *   node 03-platform/tools/scripts/ussd-soak-baseline-check.mjs --check
 *   node 03-platform/tools/scripts/ussd-soak-baseline-check.mjs --metrics=ussd-soak-metrics.json
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { compareSoakMetrics } from './soak-baseline-check.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const BASELINE_PATH = join(ROOT, 'docs', 'audit', 'ussd-soak-baseline.json');

function checkFlowCompletion(baseline, actual) {
  const min = baseline.minimumFlowCompletion ?? 0.95;
  const rate = actual.metrics?.ussd_flow_completion_rate;
  if (typeof rate !== 'number') {
    return ['missing metric: ussd_flow_completion_rate'];
  }
  if (rate < min) {
    return [`ussd_flow_completion_rate: ${rate} below minimum ${min}`];
  }
  return [];
}

function main() {
  const checkOnly = process.argv.includes('--check');
  const metricsArg = process.argv.find((a) => a.startsWith('--metrics='));

  if (!existsSync(BASELINE_PATH)) {
    console.error('[ussd-soak-baseline-check] missing baseline file');
    process.exit(1);
  }

  const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));

  if (checkOnly && !metricsArg) {
    if (!baseline.metrics || Object.keys(baseline.metrics).length === 0) {
      console.error('[ussd-soak-baseline-check] baseline has no metrics');
      process.exit(1);
    }
    console.log(
      `[ussd-soak-baseline-check] baseline v${baseline.version} OK (${Object.keys(baseline.metrics).length} metric(s))`,
    );
    return;
  }

  if (!metricsArg) {
    console.error('[ussd-soak-baseline-check] pass --metrics=<path> or --check');
    process.exit(1);
  }

  const actual = JSON.parse(readFileSync(metricsArg.slice('--metrics='.length), 'utf8'));
  const failures = [
    ...compareSoakMetrics(baseline, actual),
    ...checkFlowCompletion(baseline, actual),
  ];

  if (failures.length > 0) {
    console.error('[ussd-soak-baseline-check] regression detected:');
    for (const f of failures) console.error(`- ${f}`);
    process.exit(1);
  }

  console.log('[ussd-soak-baseline-check] metrics within baseline tolerance');
}

if (import.meta.url === `file://${process.argv[1]}`) main();
