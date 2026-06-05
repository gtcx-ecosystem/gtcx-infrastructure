#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

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

/** Logical environment name → overlay directory under infra/kubernetes/overlays */
const overlayDirNames = {
  development: 'development',
  staging: 'staging',
  'testnet-pilot': 'testnet',
  production: 'production',
};

/** CI preflight validates these paths without a live cluster. */
const ciDefaultEnvironments = ['staging', 'production'];

function fail(message) {
  console.error(`validate-env: ${message}`);
  process.exitCode = 1;
}

function ok(message) {
  console.log(`✓ ${message}`);
}

function run(cmd, args, options = {}) {
  return spawnSync(cmd, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    ...options,
  });
}

function parseArgs() {
  const args = process.argv.slice(2);
  const flags = new Map();
  for (const arg of args) {
    if (arg.startsWith('--environment=')) {
      flags.set('environment', arg.slice(14));
    } else if (arg === '--dry-run') {
      flags.set('dry-run', true);
    } else if (arg === '--ci') {
      flags.set('ci', true);
    }
  }
  return flags;
}

function overlayDirForEnvironment(environment) {
  const dirName = overlayDirNames[environment] ?? environment;
  return path.join(repoRoot, 'infra', 'kubernetes', 'overlays', dirName);
}

function assertNoLatestTags(rendered, label) {
  const latestMatches = rendered.match(/image:\s*[^'"\n]*:latest/g);
  const realLatest = latestMatches?.filter((m) => !m.includes('!*')) ?? [];
  if (realLatest.length > 0) {
    fail(`Found mutable image tags in ${label}: ${[...new Set(realLatest)].join(', ')}`);
    return false;
  }
  ok(`No :latest tags in ${label}`);
  return true;
}

function validateKustomizeOverlay(environment) {
  const overlayDir = overlayDirForEnvironment(environment);
  if (!existsSync(overlayDir)) {
    fail(`Overlay directory not found: ${overlayDir}`);
    return false;
  }

  const kustResult = run('kubectl', ['kustomize', overlayDir], { stdio: 'pipe' });
  if (kustResult.status !== 0) {
    fail(`Kustomize build failed for ${environment} overlay (${overlayDir})`);
    if (kustResult.stderr?.trim()) {
      console.error(kustResult.stderr.trim());
    }
    return false;
  }

  ok(`Kustomize build successful for ${environment}`);
  assertNoLatestTags(kustResult.stdout ?? '', `${environment} overlay`);
  return process.exitCode !== 1;
}

function validateCi(environment) {
  const targets = environment ? [environment] : ciDefaultEnvironments;
  console.log(
    `CI preflight: ${targets.join(', ')} (offline — no cluster/AWS required)\n`,
  );

  for (const env of targets) {
    if (!environments.has(env)) {
      fail(`Unknown environment: ${env}. Must be one of: ${[...environments].join(', ')}`);
      continue;
    }
    validateKustomizeOverlay(env);
  }
}

function validateLive(environment, dryRun) {
  console.log(`Validating environment: ${environment}${dryRun ? ' (dry-run)' : ''}\n`);

  const ctxResult = run('kubectl', ['config', 'current-context']);
  const currentContext = ctxResult.stdout?.trim() ?? 'unknown';

  if (!currentContext.includes(environment)) {
    fail(`kubectl context mismatch: expected *${environment}*, got ${currentContext}`);
  } else {
    ok(`kubectl context matches: ${currentContext}`);
  }

  for (const crd of requiredCrds) {
    const result = run('kubectl', ['get', 'crd', crd], { stdio: 'pipe' });
    if (result.status !== 0) {
      fail(`Required CRD not found: ${crd}`);
    } else {
      ok(`CRD installed: ${crd}`);
    }
  }

  const ecrModule = path.join(repoRoot, 'infra', 'terraform', 'modules', 'ecr', 'main.tf');
  if (existsSync(ecrModule)) {
    const ecrText = readFileSync(ecrModule, 'utf8');
    const repoMatch = ecrText.match(/"gtcx-agx"/);
    if (repoMatch) {
      const awsResult = run(
        'aws',
        ['ecr', 'describe-repositories', '--repository-names', 'gtcx-agx'],
        { stdio: 'pipe' },
      );
      if (awsResult.status !== 0) {
        fail('ECR registry not reachable or gtcx-agx repo missing');
      } else {
        ok('ECR registry reachable');
      }
    }
  }

  const overlayDir = overlayDirForEnvironment(environment);
  if (!existsSync(overlayDir)) {
    fail(`Overlay directory not found: ${overlayDir}`);
  } else {
    const kustResult = run('kubectl', ['kustomize', overlayDir], { stdio: 'pipe' });
    if (kustResult.status !== 0) {
      fail(`Kustomize build failed for ${environment} overlay`);
    } else {
      ok(`Kustomize build successful for ${environment}`);
    }

    if (dryRun && kustResult.stdout) {
      assertNoLatestTags(kustResult.stdout, `${environment} overlay`);
    }
  }
}

const flags = parseArgs();
const environment = flags.get('environment');
const dryRun = flags.get('dry-run') ?? false;
const ci = flags.get('ci') ?? false;

if (ci) {
  validateCi(environment);
} else {
  if (!environment) {
    console.error(
      'Usage: validate-environment.mjs --environment=<env> [--dry-run] [--ci]',
    );
    console.error('       validate-environment.mjs --ci [--environment=<env>]');
    process.exit(1);
  }

  if (!environments.has(environment)) {
    fail(`Unknown environment: ${environment}. Must be one of: ${[...environments].join(', ')}`);
    process.exit(1);
  }

  validateLive(environment, dryRun);
}

console.log('');
if (process.exitCode) {
  console.error(`Environment validation FAILED${environment ? ` for ${environment}` : ''}`);
  process.exit(process.exitCode);
}

console.log(`Environment validation PASSED${environment ? ` for ${environment}` : ''}`);
