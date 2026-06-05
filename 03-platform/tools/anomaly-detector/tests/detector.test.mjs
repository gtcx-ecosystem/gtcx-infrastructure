#!/usr/bin/env node
/**
 * @fileoverview Anomaly Detector CI Tests
 *
 * Validates all 5 detection rules against synthetic data.
 * Runs with `node --test` (Node.js 20 native test runner).
 */

import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DETECTOR = join(__dirname, '..', 'detector.mjs');

function runDetector(fixture, extraArgs = []) {
  const result = spawnSync(
    process.execPath,
    [DETECTOR, `--synthetic-data=${fixture}`, ...extraArgs],
    { encoding: 'utf8', timeout: 10000 }
  );
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    status: result.status,
  };
}

describe('Anomaly Detector — Synthetic Data', () => {
  it('detects query rate spike', () => {
    const { stderr, status } = runDetector(
      join(__dirname, '..', 'test-fixtures', 'synthetic-metrics.json')
    );
    assert.strictEqual(status, 1, 'Expected non-zero exit for anomalies');
    assert(stderr.includes('query_rate_spike'), 'Should detect query_rate_spike');
  });

  it('detects mutating tool without approval', () => {
    const { stderr, status } = runDetector(
      join(__dirname, '..', 'test-fixtures', 'synthetic-metrics.json')
    );
    assert.strictEqual(status, 1);
    assert(
      stderr.includes('mutating_tool_without_approval'),
      'Should detect mutating_tool_without_approval'
    );
  });

  it('detects replay rejection rate > 5%', () => {
    const { stderr, status } = runDetector(
      join(__dirname, '..', 'test-fixtures', 'synthetic-metrics.json')
    );
    assert.strictEqual(status, 1);
    assert(
      stderr.includes('replay_rejection_rate'),
      'Should detect replay_rejection_rate'
    );
  });

  it('detects unknown DID frequency > 3/min', () => {
    const { stderr, status } = runDetector(
      join(__dirname, '..', 'test-fixtures', 'synthetic-metrics.json')
    );
    assert.strictEqual(status, 1);
    assert(
      stderr.includes('unknown_did_frequency'),
      'Should detect unknown_did_frequency'
    );
  });

  it('reports healthy when no anomalies present', () => {
    const { stdout, status } = runDetector(
      join(__dirname, '..', 'test-fixtures', 'healthy-metrics.json')
    );
    assert.strictEqual(status, 0, 'Expected zero exit for healthy metrics');
    assert(stdout.includes('anomaly.detector.healthy'), 'Should report healthy');
    assert(stdout.includes('"rulesEvaluated":5'), 'Should evaluate all 5 rules');
  });

  it('dry-run mode exits 0 even with anomalies', () => {
    const { stdout, status } = runDetector(
      join(__dirname, '..', 'test-fixtures', 'synthetic-metrics.json'),
      ['--dry-run']
    );
    assert.strictEqual(status, 0, 'Dry-run should exit 0');
    assert(stdout.includes('"dryRun":true'), 'Should indicate dry-run');
  });
});
