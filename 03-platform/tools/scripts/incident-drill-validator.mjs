#!/usr/bin/env node
/**
 * Incident-drill validator
 *
 * Validates that the Alertmanager configuration satisfies incident-response
 * requirements:
 *   1. Required receivers exist (pagerduty-critical, pagerduty-high,
 *      slack-incidents, slack-alerts)
 *   2. Every receiver referenced by a route is defined
 *   3. Critical and high severity alerts route to PagerDuty
 *   4. At least 2 inhibition rules are defined
 *   5. Global PagerDuty URL is configured
 *   6. business-hours time interval is defined
 *
 * Usage:
 *   node 03-platform/tools/03-platform/scripts/incident-drill-validator.mjs
 *   node 03-platform/tools/03-platform/scripts/incident-drill-validator.mjs --config=path/to/alertmanager.yml.tpl
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';

const REPO_ROOT = process.cwd();

const args = process.argv.slice(2);
const configArg = args.find((a) => a.startsWith('--config='));
const configPath = configArg
  ? configArg.slice(9)
  : path.join('infra', 'docker', 'observability', 'alertmanager.yml.tpl');

// ---------------------------------------------------------------------------
// Parse YAML into top-level sections (minimal, indentation-aware)
// ---------------------------------------------------------------------------

function parseSections(text) {
  const lines = text.split('\n');
  const sections = {};
  let current = null;
  let start = -1;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;

    const indent = raw.length - raw.trimStart().length;
    if (indent === 0 && /^[a-zA-Z0-9_-]+:$/.test(trimmed)) {
      if (current !== null) {
        sections[current] = lines.slice(start, i);
      }
      current = trimmed.slice(0, -1);
      start = i + 1;
    }
  }

  if (current !== null) {
    sections[current] = lines.slice(start);
  }

  return sections;
}

function extractQuotedOrPlain(value) {
  return value.replace(/^['"]|['"]$/g, '');
}

// ---------------------------------------------------------------------------
// Validation rules
// ---------------------------------------------------------------------------

const violations = [];

function fail(code, message) {
  violations.push({ code, message });
}

let content;
try {
  content = readFileSync(configPath, 'utf8');
} catch (err) {
  console.error(`ERROR: Unable to read ${configPath}: ${err.message}`);
  process.exit(1);
}

const sections = parseSections(content);

// 1. Required receivers
const REQUIRED_RECEIVERS = [
  'pagerduty-critical',
  'pagerduty-high',
  'slack-incidents',
  'slack-alerts',
];

const receiverLines = (sections.receivers || []).filter(
  (l) => !l.trim().startsWith('#') && l.trim() !== ''
);

const definedReceivers = new Set();
for (const line of receiverLines) {
  const m = line.match(/^\s*- name:\s*(.+)$/);
  if (m) {
    definedReceivers.add(extractQuotedOrPlain(m[1].trim()));
  }
}

for (const r of REQUIRED_RECEIVERS) {
  if (!definedReceivers.has(r)) {
    fail('MISSING-RECEIVER', `Required receiver "${r}" is not defined`);
  }
}

// 2. Route receiver references must be defined
const routeLines = (sections.route || []).filter(
  (l) => !l.trim().startsWith('#') && l.trim() !== ''
);

const referencedReceivers = new Set();
for (const line of routeLines) {
  const m = line.match(/^\s*receiver:\s*(.+)$/);
  if (m) {
    referencedReceivers.add(extractQuotedOrPlain(m[1].trim()));
  }
}

for (const r of referencedReceivers) {
  if (!definedReceivers.has(r)) {
    fail('UNDEFINED-ROUTE-RECEIVER', `Route references undefined receiver "${r}"`);
  }
}

// 3. Critical and high severity route to PagerDuty
const routeText = routeLines.join('\n');
if (!routeText.includes('severity: critical') || !routeText.includes('pagerduty-critical')) {
  fail('PAGERDUTY-CRITICAL', 'No route maps severity=critical to pagerduty-critical');
}
if (!routeText.includes('severity: high') || !routeText.includes('pagerduty-high')) {
  fail('PAGERDUTY-HIGH', 'No route maps severity=high to pagerduty-high');
}

// 4. At least 2 inhibition rules
const inhibitLines = (sections.inhibit_rules || []).filter(
  (l) => !l.trim().startsWith('#') && l.trim() !== ''
);

const inhibitCount = inhibitLines.filter((l) => /^\s*- /.test(l)).length;
if (inhibitCount < 2) {
  fail('INHIBITION-RULES', `Expected >=2 inhibition rules, found ${inhibitCount}`);
}

// 5. Global PagerDuty URL
const globalLines = (sections.global || []).filter(
  (l) => !l.trim().startsWith('#') && l.trim() !== ''
);

let hasPagerDutyUrl = false;
for (const line of globalLines) {
  const m = line.match(/^\s*pagerduty_url:\s*(.+)$/);
  if (m) {
    const url = extractQuotedOrPlain(m[1].trim());
    if (url.startsWith('https://')) {
      hasPagerDutyUrl = true;
    }
  }
}
if (!hasPagerDutyUrl) {
  fail('GLOBAL-PAGERDUTY-URL', 'Global pagerduty_url is missing or not a valid HTTPS URL');
}

// 6. business-hours time interval
const timeIntervalLines = (sections.time_intervals || []).filter(
  (l) => !l.trim().startsWith('#') && l.trim() !== ''
);

let hasBusinessHours = false;
for (const line of timeIntervalLines) {
  const m = line.match(/^\s*-?\s*name:\s*business-hours\s*$/);
  if (m) {
    hasBusinessHours = true;
  }
}
if (!hasBusinessHours) {
  fail('BUSINESS-HOURS', 'Time interval "business-hours" is not defined');
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

if (violations.length === 0) {
  console.log(
    `[PASS] Incident-drill validation: ${definedReceivers.size} receivers, ${referencedReceivers.size} route refs, ${inhibitCount} inhibition rules, business-hours interval defined, PagerDuty URL configured`
  );
  process.exit(0);
} else {
  console.error(`[FAIL] Incident-drill validation: ${violations.length} violation(s)`);
  for (const v of violations) {
    console.error(`  ${v.code}: ${v.message}`);
  }
  process.exit(1);
}
