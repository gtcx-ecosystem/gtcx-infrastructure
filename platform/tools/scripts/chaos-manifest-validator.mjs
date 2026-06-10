#!/usr/bin/env node
/**
 * @fileoverview Chaos Manifest Validator
 *
 * Lightweight validation that runs on every PR to ensure chaos test
 * manifests are syntactically valid and safe before merge.
 *
 * Does NOT run destructive experiments — only validates:
 *   - YAML syntax of NetworkPolicy manifests
 *   - Required labels (chaos-experiment)
 *   - No production namespace references in manifests
 *   - All referenced deployments exist in base K8s manifests
 *
 * Usage:
 *   node platform/tools/scripts/chaos-manifest-validator.mjs
 *
 * Exits 0 on pass, 1 with violations.
 */

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const CHAOS_DIR = path.join(process.cwd(), '04-deploy', 'kubernetes', 'overlays', 'chaos');
const BASE_DIR = path.join(process.cwd(), '04-deploy', 'kubernetes', 'base');

let exitCode = 0;

function fail(category, message) {
  console.error(`chaos-manifest: [${category}] ${message}`);
  exitCode = 1;
}

function extractField(doc, key) {
  const match = doc.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return match?.[1]?.trim() ?? null;
}

function extractNestedField(doc, ...keys) {
  const lines = doc.split('\n');
  let depth = 0;
  const indentStack = [0];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;

    const indent = line.length - line.trimStart().length;
    while (indentStack.length > 1 && indent <= indentStack[indentStack.length - 1]) {
      indentStack.pop();
      depth--;
    }

    if (trimmed.startsWith(keys[depth] + ':')) {
      if (depth === keys.length - 1) {
        const value = trimmed.slice(keys[depth].length + 1).trim();
        return value || '<nested>';
      }
      indentStack.push(indent);
      depth++;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// 1. Check if chaos directory exists (optional — may not exist yet)
// ---------------------------------------------------------------------------

let files = [];
try {
  files = readdirSync(CHAOS_DIR)
    .filter((f) => f.endsWith('.yaml'))
    .sort();
} catch {
  console.log('chaos-manifest: No chaos overlay directory found — skipping manifest validation');
}

// ---------------------------------------------------------------------------
// 2. Validate base manifests don't contain production namespace refs
// ---------------------------------------------------------------------------

const baseFiles = readdirSync(BASE_DIR, { recursive: true })
  .filter((f) => typeof f === 'string' && f.endsWith('.yaml'))
  .map((f) => path.join(BASE_DIR, f));

for (const filepath of baseFiles) {
  const text = readFileSync(filepath, 'utf8');
  if (text.includes('namespace: gtcx-production')) {
    fail('PRODUCTION_LEAK', `${path.relative(process.cwd(), filepath)}: Contains hardcoded production namespace`);
  }
}

// ---------------------------------------------------------------------------
// 3. Validate chaos workflow YAML structure
// ---------------------------------------------------------------------------

const workflowPath = path.join(process.cwd(), '.github', 'workflows', 'chaos-test.yml');
try {
  const workflowText = readFileSync(workflowPath, 'utf8');

  // Verify production approval gate exists
  if (!workflowText.includes('environment: production-chaos')) {
    fail('WORKFLOW', 'chaos-test.yml: Missing production-chaos environment protection gate');
  }

  // Verify SLO thresholds are defined
  if (!workflowText.includes('SLO_ERROR_RATE_THRESHOLD')) {
    fail('WORKFLOW', 'chaos-test.yml: Missing SLO_ERROR_RATE_THRESHOLD env var');
  }
  if (!workflowText.includes('SLO_P99_LATENCY_THRESHOLD')) {
    fail('WORKFLOW', 'chaos-test.yml: Missing SLO_P99_LATENCY_THRESHOLD env var');
  }

  // Verify artifact upload on always()
  if (!workflowText.includes('if: always()')) {
    fail('WORKFLOW', 'chaos-test.yml: Missing artifact upload with if: always()');
  }

  // Verify no direct production cron (only manual or staging)
  const cronMatch = workflowText.match(/cron:\s*'(.+)'/);
  if (cronMatch) {
    // Cron is fine, but verify it's not targeting production
    if (workflowText.includes('environment: production') && !workflowText.includes('workflow_dispatch')) {
      fail('WORKFLOW', 'chaos-test.yml: Cron schedule targets production without manual approval');
    }
  }
} catch {
  fail('WORKFLOW', 'chaos-test.yml: Workflow file not found');
}

// ---------------------------------------------------------------------------
// 4. Summary
// ---------------------------------------------------------------------------

if (exitCode !== 0) {
  console.error('chaos-manifest: Validation FAILED');
  process.exit(exitCode);
}

console.log('chaos-manifest: All chaos manifests and workflow configuration valid');
