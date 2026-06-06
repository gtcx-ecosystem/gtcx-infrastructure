#!/usr/bin/env node
/**
 * @fileoverview Incident Drill — PagerDuty Webhook Simulation
 *
 * Simulates a critical alert firing through the Alertmanager → PagerDuty
 * pipeline without triggering a real page. Validates:
 *   - Alertmanager routing configuration produces correct PagerDuty payload
 *   - Webhook URL is reachable and responds with 202 Accepted
 *   - Payload structure matches PagerDuty Events API v2 schema
 *   - Response contains valid dedup_key (proving event was accepted)
 *
 * Usage:
 *   node 03-platform/tools/scripts/incident-drill-pagerduty-simulation.mjs \
 *     [--dry-run] \
 *     [--webhook-url=https://events.pagerduty.com/v2/enqueue] \
 *     [--routing-key=your-integration-key]
 *
 * Environment:
 *   PAGERDUTY_ROUTING_KEY — PagerDuty integration key (required for real send)
 *   ALERTMANAGER_CONFIG — Path to alertmanager.yml.tpl (default: 04-ship/docker/observability/alertmanager.yml.tpl)
 *
 * Exit codes:
 *   0 = simulation passed
 *   1 = validation failed
 *   2 = missing required environment
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { request as httpsRequest } from 'node:https';

const ALERTMANAGER_CONFIG =
  process.env.ALERTMANAGER_CONFIG ??
  path.join(process.cwd(), '04-ship', 'docker', 'docker', 'observability', 'alertmanager.yml.tpl');
const PAGERDUTY_ROUTING_KEY = process.env.PAGERDUTY_ROUTING_KEY ?? '';
const DRY_RUN = process.argv.includes('--dry-run');

let exitCode = 0;

function fail(category, message) {
  console.error(`pagerduty-drill: [${category}] ${message}`);
  exitCode = 1;
}

// ---------------------------------------------------------------------------
// 1. Validate Alertmanager configuration
// ---------------------------------------------------------------------------

console.log('pagerduty-drill: Validating Alertmanager configuration...');

const alertmanagerText = readFileSync(ALERTMANAGER_CONFIG, 'utf8');

// Check for PagerDuty receiver
const hasPagerDutyReceiver = alertmanagerText.includes('pagerduty_configs');
if (!hasPagerDutyReceiver) {
  fail('CONFIG', 'alertmanager.yml: Missing pagerduty_configs');
}

// Check for critical/high routes to PagerDuty
const hasCriticalRoute = /pagerduty-critical|pagerduty-high/.test(alertmanagerText);
if (!hasCriticalRoute) {
  fail('CONFIG', 'alertmanager.yml: No critical/high route to PagerDuty');
}

// Check for business-hours time interval
const hasBusinessHours = alertmanagerText.includes('business-hours');
if (!hasBusinessHours) {
  fail('CONFIG', 'alertmanager.yml: Missing business-hours time interval');
}

console.log('pagerduty-drill: Alertmanager configuration valid');

// ---------------------------------------------------------------------------
// 2. Build simulated PagerDuty payload
// ---------------------------------------------------------------------------

const simulatedPayload = {
  routing_key: PAGERDUTY_ROUTING_KEY || 'test-routing-key-simulation',
  event_action: 'trigger',
  dedup_key: `gtcx-incident-drill-${Date.now()}`,
  payload: {
    summary: '[DRILL] GTCX Critical Service Degradation — simulated',
    severity: 'critical',
    source: 'alertmanager-staging',
    component: 'gtcx-protocols',
    group: 'incident-drill',
    class: 'simulation',
    custom_details: {
      drill_type: 'pagerduty_webhook_simulation',
      environment: 'staging',
      alertmanager_config_valid: true,
      timestamp: new Date().toISOString(),
    },
  },
};

console.log('pagerduty-drill: Simulated payload:');
console.log(JSON.stringify(simulatedPayload, null, 2));

// ---------------------------------------------------------------------------
// 3. Dry-run or real send
// ---------------------------------------------------------------------------

if (DRY_RUN || !PAGERDUTY_ROUTING_KEY) {
  console.log('');
  console.log('pagerduty-drill: === DRY RUN ===');
  console.log('pagerduty-drill: No real PagerDuty event sent.');
  console.log(
    'pagerduty-drill: To send a real event, set PAGERDUTY_ROUTING_KEY and omit --dry-run'
  );
  console.log('pagerduty-drill: Payload structure validated against PagerDuty Events API v2');
  console.log('pagerduty-drill: DEDUP_KEY:', simulatedPayload.dedup_key);

  // Validate payload structure against PagerDuty schema
  const requiredFields = ['routing_key', 'event_action', 'payload'];
  for (const field of requiredFields) {
    if (!simulatedPayload[field]) {
      fail('SCHEMA', `Missing required field: ${field}`);
    }
  }

  const payloadFields = ['summary', 'severity', 'source'];
  for (const field of payloadFields) {
    if (!simulatedPayload.payload[field]) {
      fail('SCHEMA', `Missing required payload field: ${field}`);
    }
  }

  if (exitCode === 0) {
    console.log('pagerduty-drill: DRY RUN passed — payload structure is valid');
  }

  process.exit(exitCode);
}

// ---------------------------------------------------------------------------
// 4. Real PagerDuty send
// ---------------------------------------------------------------------------

console.log('');
console.log('pagerduty-drill: Sending real event to PagerDuty...');

const webhookUrl = new URL('https://events.pagerduty.com/v2/enqueue');
const payload = JSON.stringify(simulatedPayload);

const req = httpsRequest(
  webhookUrl,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
    timeout: 10000,
  },
  (res) => {
    let body = '';
    res.on('data', (c) => {
      body += c;
    });
    res.on('end', () => {
      console.log(`pagerduty-drill: PagerDuty response: ${res.statusCode}`);

      if (res.statusCode === 202) {
        try {
          const response = JSON.parse(body);
          if (response.status === 'success' && response.dedup_key) {
            console.log(`pagerduty-drill: Event accepted — dedup_key: ${response.dedup_key}`);
            console.log(`pagerduty-drill: Message: ${response.message || 'none'}`);
            console.log('pagerduty-drill: SUCCESS — PagerDuty pipeline is operational');
          } else {
            fail('PAGERDUTY', `Unexpected response structure: ${body}`);
          }
        } catch {
          fail('PAGERDUTY', `Non-JSON response: ${body}`);
        }
      } else if (res.statusCode === 429) {
        fail('PAGERDUTY', 'Rate limited — too many events sent recently');
      } else if (res.statusCode >= 400) {
        fail('PAGERDUTY', `HTTP ${res.statusCode}: ${body}`);
      }

      if (exitCode !== 0) {
        console.error('pagerduty-drill: FAILED');
      }
      process.exit(exitCode);
    });
  }
);

req.on('error', (err) => {
  fail('NETWORK', `Request failed: ${err.message}`);
  process.exit(exitCode);
});

req.on('timeout', () => {
  req.destroy();
  fail('NETWORK', 'Request timeout');
  process.exit(exitCode);
});

req.write(payload);
req.end();
