#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();

const requiredCrds = [
  'rollouts.argoproj.io',
  'externalsecrets.external-secrets.io',
  'gateways.gateway.networking.k8s.io',
];

const environments = new Set([
  'development',
  'staging',
  'testnet-pilot',
  'production',
]);

function fail(message) {
  console.error(`validate-env: ${message}`);
  process.exitCode = 1;
}

function ok(message) {
  console.log(`✓ ${message}`);
}

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    ...options,
  });
  return result;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const flags = new Map();
  for (const arg of args) {
    if (arg.startsWith('--environment=')) {
      flags.set('environment', arg.slice(14));
    } else if (arg === '--dry-run') {
      flags.set('dry-run', true);
    }
  }
  return flags;
}

const flags = parseArgs();
const environment = flags.get('environment');
const dryRun = flags.get('dry-run') ?? false;

if (!environment) {
  console.error('Usage: validate-environment.mjs --environment=<env> [--dry-run]');
  process.exit(1);
}

if (!environments.has(environment)) {
  fail(`Unknown environment: ${environment}. Must be one of: ${[...environments].join(', ')}`);
  process.exit(1);
}

console.log(`Validating environment: ${environment}${dryRun ? ' (dry-run)' : ''}\n`);

// ---------------------------------------------------------------------------
// 1. kubectl context check
// ---------------------------------------------------------------------------
const ctxResult = run('kubectl', ['config', 'current-context']);
const currentContext = ctxResult.stdout?.trim() ?? 'unknown';

if (!currentContext.includes(environment)) {
  fail(`kubectl context mismatch: expected *${environment}*, got ${currentContext}`);
} else {
  ok(`kubectl context matches: ${currentContext}`);
}

// ---------------------------------------------------------------------------
// 2. Required CRDs
// ---------------------------------------------------------------------------
for (const crd of requiredCrds) {
  const result = run('kubectl', ['get', 'crd', crd], { stdio: 'pipe' });
  if (result.status !== 0) {
    fail(`Required CRD not found: ${crd}`);
  } else {
    ok(`CRD installed: ${crd}`);
  }
}

// ---------------------------------------------------------------------------
// 3. ECR registry reachability
// ---------------------------------------------------------------------------
const ecrModule = path.join(repoRoot, 'infra', 'terraform', 'modules', 'ecr', 'main.tf');
if (existsSync(ecrModule)) {
  const ecrText = readFileSync(ecrModule, 'utf8');
  const repoMatch = ecrText.match(/"gtcx-agx"/);
  if (repoMatch) {
    const awsResult = run('aws', ['ecr', 'describe-repositories', '--repository-names', 'gtcx-agx'], { stdio: 'pipe' });
    if (awsResult.status !== 0) {
      fail('ECR registry not reachable or gtcx-agx repo missing');
    } else {
      ok('ECR registry reachable');
    }
  }
}

// ---------------------------------------------------------------------------
// 4. Kustomize render check
// ---------------------------------------------------------------------------
const overlayDir = path.join(repoRoot, 'infra', 'kubernetes', 'overlays', environment);
if (existsSync(overlayDir)) {
  const kustResult = run('kubectl', ['kustomize', overlayDir], { stdio: 'pipe' });
  if (kustResult.status !== 0) {
    fail(`Kustomize build failed for ${environment} overlay`);
  } else {
    ok(`Kustomize build successful for ${environment}`);
  }
} else {
  fail(`Overlay directory not found: ${overlayDir}`);
}

// ---------------------------------------------------------------------------
// 5. Image tag immutability check (dry-run only)
// ---------------------------------------------------------------------------
if (dryRun) {
  const rendered = run('kubectl', ['kustomize', overlayDir], { stdio: 'pipe' }).stdout;
  const latestMatches = rendered.match(/image:\s*[^'"\n]*:latest/g);
  const realLatest = latestMatches?.filter((m) => !m.includes('!*')) ?? [];
  if (realLatest.length > 0) {
    fail(`Found mutable image tags in rendered manifests: ${[...new Set(realLatest)].join(', ')}`);
  } else {
    ok('No :latest tags in rendered manifests');
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('');
if (process.exitCode) {
  console.error(`Environment validation FAILED for ${environment}`);
} else {
  console.log(`Environment validation PASSED for ${environment}`);
}
