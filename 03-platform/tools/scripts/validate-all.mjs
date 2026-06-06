#!/usr/bin/env node
/**
 * @fileoverview Master Validation Script
 *
 * Runs all GTCX infrastructure validation gates in sequence.
 * Exits 0 only if ALL gates pass.
 *
 * Usage: node 03-platform/tools/scripts/validate-all.mjs
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

// Resolve REPO_ROOT from the script location, not cwd. Every gate runs
// with cwd defaulting to the repo root so paths like `03-platform/tools/scripts/...`
// resolve correctly no matter where the user invoked validate-all from.
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..', '..');

let totalPassed = 0;
let totalFailed = 0;

function run(name, command, cwd) {
  process.stdout.write(`[VALIDATE] ${name} ... `);
  try {
    execSync(command, {
      cwd: cwd || REPO_ROOT,
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 120000,
      // Node's default 1MB stdout buffer overflows on packages with
      // hundreds of TAP-formatted node:test output lines (compliance-
      // gateway is currently 187 tests). Raise to 32MB so the script
      // can never falsely report ENOBUFS as a gate failure.
      maxBuffer: 32 * 1024 * 1024,
    });
    console.log(`${GREEN}PASS${RESET}`);
    totalPassed++;
    return true;
  } catch (e) {
    console.log(`${RED}FAIL${RESET}`);
    const combined = [e.stderr, e.stdout, e.message].filter(Boolean).join('\n');
    const lines = combined.split('\n').filter((l) => l.trim());
    for (const line of lines.slice(-8)) {
      console.log(`  ${RED}>${RESET} ${line}`);
    }
    totalFailed++;
    return false;
  }
}

function section(title) {
  console.log(`\n${YELLOW}=== ${title} ===${RESET}`);
}

// =============================================================================
// 1. Coverage Gates
// =============================================================================
section('Coverage Gates');

const packages = [
  '03-platform/tools/compliance-gateway',
  '03-platform/tools/replay-protection',
  '03-platform/tools/deployment-guard',
  '03-platform/tools/ussd-handler',
  '03-platform/tools/low-bandwidth',
  '03-platform/tools/audit-signer',
  '03-platform/tools/audit-flush',
  '03-platform/tools/compliance-gateway-mcp',
  '03-platform/tools/compliance-data',
  '03-platform/tools/eval-pipeline',
];

for (const pkg of packages) {
  const pkgPath = path.join(REPO_ROOT, pkg);
  if (existsSync(path.join(pkgPath, 'package.json'))) {
    run(pkg, 'pnpm run test:coverage:gate', pkgPath);
  }
}

run('Coverage Honesty (per-file)', 'node 03-platform/tools/scripts/coverage-honesty-check.mjs');

// =============================================================================
// 2. Static Validators
// =============================================================================
section('Static Validators');

run('SIGNAL Scorecard', 'node 03-platform/tools/scripts/validate-signal.mjs');
run('Score Ledger', 'node 03-platform/tools/scripts/validate-score-ledger.mjs');
run('Docs Standard', 'node 03-platform/tools/scripts/docs-standard-validator.mjs');
run(
  'Workspace Root Cleanliness',
  'python3 03-platform/scripts/ops/check-workspace-root-cleanliness.py --strict',
);
run('Trace Correlation (SIGNAL)', 'node 03-platform/tools/scripts/validate-trace-correlation.mjs');
run('LLM Ops (SIGNAL)', 'node 03-platform/tools/scripts/validate-llm-ops.mjs');
run('Prompt Semver (SIGNAL)', 'node 03-platform/tools/scripts/validate-prompt-semver.mjs');
run('Injection Suite Witness (SIGNAL)', 'node 03-platform/scripts/ops/run-injection-suite-witness.mjs');
run('Kyverno Policies', 'node 03-platform/tools/scripts/kyverno-policy-validator.mjs');
run('SHA-pinned Actions', 'node 03-platform/tools/scripts/pin-actions-sha.mjs --check');
run('Node Version Floor', 'node 03-platform/tools/scripts/node-version-floor-check.mjs');
run('Alertmanager Env Guard', 'node 03-platform/tools/scripts/alertmanager-env-check.mjs');
run('Empty Catch Blocks', 'node 03-platform/tools/scripts/empty-catch-check.mjs');
run('Runbook Commands Exist', 'node 03-platform/tools/scripts/runbook-commands-check.mjs');
run('Runbook Frontmatter', 'node 03-platform/tools/scripts/runbook-frontmatter-check.mjs --check');
run('Production Overlay Tags', 'node 03-platform/tools/scripts/production-overlay-guard.mjs');
run(
  'Environment CI Preflight',
  'node 03-platform/tools/control-plane/validate-environment.mjs --ci',
);
run('Environment Preflight (CI)', 'node 03-platform/tools/control-plane/gtcx-ctl.mjs validate --ci');
run('Alert Runbook Anchors', 'node 03-platform/tools/scripts/alerts-add-runbook-url.mjs --check');
run('Dependabot Policy', 'node 03-platform/tools/scripts/dependabot-policy-check.mjs');
run('SOC2 Agent Owners', 'node 03-platform/tools/scripts/soc2-agent-owners-check.mjs');
run('Soak Baseline', 'node 03-platform/tools/scripts/soak-baseline-check.mjs --check');
run('USSD Soak Baseline', 'node 03-platform/tools/scripts/ussd-soak-baseline-check.mjs --check');
run('DR Drill Evidence', 'node 03-platform/tools/scripts/dr-fire-drill-evidence.mjs');
run('Cloudflared API Gateway', 'node 03-platform/tools/scripts/cloudflared-api-gateway-check.mjs');
run('Jurisdiction Catalog Parity', 'node 03-platform/tools/scripts/jurisdiction-catalog-parity-check.mjs');
run('Terraform Registry Readiness', 'node 03-platform/tools/scripts/terraform-registry-readiness-check.mjs');
run('NPM Publish Readiness', 'node 03-platform/tools/scripts/npm-publish-readiness-check.mjs');
run('Dependabot Tier Merge', 'node 03-platform/tools/scripts/dependabot-tier-merge-check.mjs');
run('Dependabot Merge Plan', 'node 03-platform/tools/scripts/dependabot-merge-plan.mjs');
run('Pen-Test Intake Evidence', 'node 03-platform/tools/scripts/pen-test-intake-evidence.mjs');
run(
  'Contract Tests',
  'node --test 03-platform/tools/contract-tests/protocol-schema.test.mjs 03-platform/tools/contract-tests/gateway-tenancy.test.mjs 03-platform/tools/contract-tests/audit-signer-catalog.test.mjs 03-platform/tools/contract-tests/replay-protection.test.mjs 03-platform/tools/contract-tests/agent-integration.test.mjs'
);
run(
  'Ecosystem Integration Matrix',
  'node 03-platform/tools/scripts/ecosystem-integration-matrix-check.mjs',
);

// =============================================================================
// 3. Security Validators
// =============================================================================
section('Security Validators');

run('Secret Scan', 'node 03-platform/tools/scripts/secret-scan-gate.mjs');
run('FIPS 140-3 Mode', 'node 03-platform/tools/scripts/fips-mode-gate.mjs');
run('Audit Sink Guard', 'node 03-platform/tools/scripts/audit-sink-gate.mjs');
run('Disk Queue Durability', 'node 03-platform/tools/scripts/disk-queue-gate.mjs');
run('SLSA Build L3', 'node 03-platform/tools/scripts/slsa-l3-gate.mjs');
run('Live RDS Restore', 'node 03-platform/tools/scripts/s3-07-rds-restore-gate.mjs');
run('Publish Primitives', 'node 03-platform/tools/scripts/s3-06-publish-primitives-gate.mjs');
run('Mesh Injection (prod)', 'node 03-platform/tools/scripts/verify-mesh-injection.mjs --namespace gtcx');
run(
  'Mesh Injection (staging)',
  'node 03-platform/tools/scripts/verify-mesh-injection.mjs --namespace gtcx-staging'
);

// =============================================================================
// 4. Build Validators
// =============================================================================
section('Build Validators');

run('Reproducible Build (dry)', 'node 03-platform/tools/scripts/verify-reproducible-build.mjs');
run('Runtime Evidence (dry)', 'node 03-platform/tools/scripts/runtime-evidence-check.mjs');

// =============================================================================
// Summary
// =============================================================================
console.log(`\n${YELLOW}=== Summary ===${RESET}`);
console.log(`Passed: ${GREEN}${totalPassed}${RESET}`);
console.log(`Failed: ${RED}${totalFailed}${RESET}`);

if (totalFailed > 0) {
  console.log(`\n${RED}VALIDATION FAILED${RESET}: ${totalFailed} gate(s) did not pass`);
  process.exit(1);
}

console.log(`\n${GREEN}VALIDATION PASSED${RESET}: all ${totalPassed} gate(s) passed`);
process.exit(0);
