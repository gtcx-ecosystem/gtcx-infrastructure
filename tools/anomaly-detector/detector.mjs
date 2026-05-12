#!/usr/bin/env node
/**
 * @fileoverview Anomaly Detector PoC
 *
 * Polls Prometheus metrics endpoint and detects anomalies based on
 * configurable rules. Integrates with SIGNAL scorecard S3 control.
 *
 * Usage:
 *   node tools/anomaly-detector/detector.mjs [--threshold=N] [--window=Ms] [--dry-run]
 */

import { request } from 'node:http';

const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://localhost:9090';
const THRESHOLD_MULTIPLIER = Number(process.argv.find((a) => a.startsWith('--threshold='))?.slice(12)) || 10;
const WINDOW_MS = Number(process.argv.find((a) => a.startsWith('--window='))?.slice(9)) || 300_000;
const DRY_RUN = process.argv.includes('--dry-run');

function fetchMetrics() {
  return new Promise((resolve, reject) => {
    const req = request(`${PROMETHEUS_URL}/api/v1/query?query=rate(gtcx_query_total[5m])`, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(null);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => reject(new Error('Prometheus timeout')));
    req.end();
  });
}

function evaluateRules(metrics) {
  const anomalies = [];

  if (!metrics || !metrics.data || !metrics.data.result) {
    return anomalies;
  }

  for (const series of metrics.data.result) {
    const value = Number(series.value?.[1] || 0);
    const labels = series.metric || {};

    // Rule: query rate spike > threshold × baseline
    if (value > THRESHOLD_MULTIPLIER) {
      anomalies.push({
        rule: 'query_rate_spike',
        severity: 'high',
        value,
        threshold: THRESHOLD_MULTIPLIER,
        labels,
        timestamp: new Date().toISOString(),
      });
    }
  }

  return anomalies;
}

async function main() {
  console.log(JSON.stringify({
    level: 'info',
    type: 'anomaly.detector.start',
    threshold: THRESHOLD_MULTIPLIER,
    windowMs: WINDOW_MS,
    dryRun: DRY_RUN,
  }));

  try {
    const metrics = await fetchMetrics();
    const anomalies = evaluateRules(metrics);

    if (anomalies.length === 0) {
      console.log(JSON.stringify({
        level: 'info',
        type: 'anomaly.detector.healthy',
        message: 'No anomalies detected',
      }));
      process.exit(0);
    }

    for (const a of anomalies) {
      console.error(JSON.stringify({
        level: 'warn',
        type: 'anomaly.detector.triggered',
        ...a,
      }));

      if (!DRY_RUN) {
        // In production, this would call PagerDuty / Slack webhook
        // For PoC, we just log
      }
    }

    process.exit(anomalies.length > 0 ? 1 : 0);
  } catch (err) {
    console.error(JSON.stringify({
      level: 'error',
      type: 'anomaly.detector.error',
      message: err instanceof Error ? err.message : 'unknown error',
    }));
    process.exit(1);
  }
}

main();
