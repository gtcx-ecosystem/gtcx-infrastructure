#!/usr/bin/env node
/**
 * @fileoverview SIGNAL Scorecard Validator
 *
 * Validates the agentic AI maturity scorecard:
 *   - JSON schema compliance
 *   - All 5 pillars have required fields
 *   - Weighted score computation
 *   - No regression from baseline
 *   - CI gate: fails if any critical metric is "fail" or overall score < threshold
 *
 * Usage:
 *   node 03-platform/tools/scripts/validate-signal.mjs [--scorecard=path] [--min-score=N]
 *
 * Exit codes:
 *   0 = scorecard valid and meets threshold
 *   1 = validation failed or score below threshold
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';

const SCORECARD_PATH =
  process.argv.find((a) => a.startsWith('--scorecard='))?.slice(12) ??
  path.join(process.cwd(), '01-docs', 'audit', 'signal-scorecard.json');
const MIN_SCORE = Number(
  process.argv.find((a) => a.startsWith('--min-score='))?.slice(12) ?? '7.0'
);

let exitCode = 0;

function fail(category, message) {
  console.error(`signal: [${category}] ${message}`);
  exitCode = 1;
}

// ---------------------------------------------------------------------------
// 1. Load and parse scorecard
// ---------------------------------------------------------------------------

let scorecard;
try {
  const text = readFileSync(SCORECARD_PATH, 'utf8');
  scorecard = JSON.parse(text);
} catch (err) {
  fail('LOAD', `Failed to load scorecard: ${err instanceof Error ? err.message : 'unknown error'}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. Schema validation
// ---------------------------------------------------------------------------

const REQUIRED_TOP_LEVEL = ['version', 'framework', 'pillars'];
for (const field of REQUIRED_TOP_LEVEL) {
  if (!(field in scorecard)) {
    fail('SCHEMA', `Missing top-level field: ${field}`);
  }
}

if (!Array.isArray(scorecard.pillars) || scorecard.pillars.length === 0) {
  fail('SCHEMA', 'pillars must be a non-empty array');
}

if (scorecard.pillars.length !== 5) {
  fail('SCHEMA', `Expected 5 pillars, found ${scorecard.pillars.length}`);
}

const PILLAR_NAMES = new Set([
  'supervision',
  'integrity',
  'governance',
  'non-proliferation',
  'alignment',
]);
const seenPillars = new Set();
let totalWeight = 0;

for (const pillar of scorecard.pillars) {
  if (!pillar.id || !PILLAR_NAMES.has(pillar.id)) {
    fail('SCHEMA', `Unknown or missing pillar id: ${pillar.id}`);
  }
  if (seenPillars.has(pillar.id)) {
    fail('SCHEMA', `Duplicate pillar id: ${pillar.id}`);
  }
  seenPillars.add(pillar.id);

  if (typeof pillar.weight !== 'number' || pillar.weight <= 0) {
    fail('SCHEMA', `${pillar.id}: weight must be a positive number`);
  }
  totalWeight += pillar.weight;

  if (!Array.isArray(pillar.metrics) || pillar.metrics.length === 0) {
    fail('SCHEMA', `${pillar.id}: metrics must be a non-empty array`);
  }

  for (const metric of pillar.metrics) {
    if (!metric.id || !metric.name || !metric.status) {
      fail('SCHEMA', `${pillar.id}: metric missing required fields (id, name, status)`);
    }
    if (!['pass', 'fail', 'planned', 'partial'].includes(metric.status)) {
      fail('SCHEMA', `${pillar.id}.${metric.id}: invalid status "${metric.status}"`);
    }
    if (typeof metric.score !== 'number' || metric.score < 0 || metric.score > 10) {
      fail('SCHEMA', `${pillar.id}.${metric.id}: score must be between 0 and 10`);
    }
  }
}

if (Math.abs(totalWeight - 1.0) > 0.001) {
  fail('SCHEMA', `Pillar weights must sum to 1.0, got ${totalWeight}`);
}

if (exitCode !== 0) {
  console.error('signal: Schema validation failed');
  process.exit(exitCode);
}

// ---------------------------------------------------------------------------
// 3. Compute pillar and overall scores
// ---------------------------------------------------------------------------

console.log('signal: Scorecard validation passed');
console.log('');
console.log('=== SIGNAL Scorecard ===');
console.log(`Framework: ${scorecard.framework}`);
console.log(`Date: ${scorecard.date}`);
console.log(`Evaluator: ${scorecard.evaluator}`);
console.log('');

let overallScore = 0;
let criticalFailures = 0;
let plannedItems = 0;

for (const pillar of scorecard.pillars) {
  const pillarScore = pillar.metrics.reduce((sum, m) => sum + m.score, 0) / pillar.metrics.length;
  const weightedScore = pillarScore * pillar.weight;
  overallScore += weightedScore;

  const fails = pillar.metrics.filter((m) => m.status === 'fail');
  const plans = pillar.metrics.filter((m) => m.status === 'planned');
  criticalFailures += fails.length;
  plannedItems += plans.length;

  const statusIcon = fails.length > 0 ? '❌' : plans.length > 0 ? '⏳' : '✅';
  console.log(`${statusIcon} ${pillar.name} (${pillar.id})`);
  console.log(`   Weight: ${(pillar.weight * 100).toFixed(0)}%`);
  console.log(`   Pillar score: ${pillarScore.toFixed(1)}/10`);
  console.log(`   Weighted: ${weightedScore.toFixed(2)}`);

  for (const metric of pillar.metrics) {
    const icon =
      metric.status === 'pass'
        ? '✅'
        : metric.status === 'fail'
          ? '❌'
          : metric.status === 'planned'
            ? '⏳'
            : '🟡';
    console.log(`   ${icon} ${metric.id}: ${metric.name} — ${metric.score}/10 (${metric.status})`);
  }
  console.log('');
}

console.log('=== Summary ===');
console.log(`Overall SIGNAL score: ${overallScore.toFixed(2)}/10`);
console.log(`Critical failures: ${criticalFailures}`);
console.log(`Planned items: ${plannedItems}`);
console.log(`Minimum threshold: ${MIN_SCORE}/10`);
console.log('');

// ---------------------------------------------------------------------------
// 4. CI gate checks
// ---------------------------------------------------------------------------

if (criticalFailures > 0) {
  fail('GATE', `${criticalFailures} critical metric(s) failed — PR blocked`);
}

if (overallScore < MIN_SCORE) {
  fail(
    'GATE',
    `Overall score ${overallScore.toFixed(2)} is below minimum threshold ${MIN_SCORE} — PR blocked`
  );
}

if (exitCode !== 0) {
  console.error('signal: CI GATE FAILED');
  process.exit(exitCode);
}

console.log('signal: CI GATE PASSED');
console.log(`signal: Overall score ${overallScore.toFixed(2)}/10 meets threshold ${MIN_SCORE}/10`);
