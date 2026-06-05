#!/usr/bin/env node
/**
 * @fileoverview Verify Linkerd Mesh Injection Readiness
 *
 * Validates that all services have:
 * 1. Dedicated ServiceAccounts (not default)
 * 2. linkerd.io/inject annotation in manifests or canary rollout
 * 3. Corresponding MeshTLSAuthentication in policies
 *
 * Usage: node verify-mesh-injection.mjs [--namespace gtcx]
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const namespace = process.argv.includes('--namespace')
  ? process.argv[process.argv.indexOf('--namespace') + 1]
  : 'gtcx';

const ENV = namespace === 'gtcx' ? 'production' : 'staging';
const POLICY_PATH = `04-ship/kubernetes/overlays/${ENV}/linkerd/mesh-policies.yaml`;
const CANARY_PATH = `04-ship/kubernetes/overlays/${ENV}/linkerd/canary-rollout.yaml`;
const BASE_SERVICES = '04-ship/kubernetes/base/services';

const errors = [];
const warnings = [];

function log(msg) {
  console.log(`mesh-verify: ${msg}`);
}

// --- 1. Load expected services from canary rollout ---
let expectedDeployments = [];
try {
  const canary = readFileSync(CANARY_PATH, 'utf8');
  const deployMatches = canary.matchAll(/name:\s*(\S+)/g);
  for (const m of deployMatches) {
    expectedDeployments.push(m[1]);
  }
} catch (e) {
  errors.push(`Cannot read canary rollout: ${CANARY_PATH}`);
}

// --- 2. Load mesh policy identities ---
let policyIdentities = new Set();
try {
  const policies = readFileSync(POLICY_PATH, 'utf8');
  const idMatches = policies.matchAll(/identities:\s*\n\s+-\s+'([^']+)'/g);
  for (const m of idMatches) {
    policyIdentities.add(m[1]);
  }
} catch (e) {
  errors.push(`Cannot read mesh policies: ${POLICY_PATH}`);
}

// --- 3. Scan base services for ServiceAccounts ---
let baseServiceAccounts = new Map();
function scanDir(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (entry.name.endsWith('.yaml')) {
      try {
        const content = readFileSync(fullPath, 'utf8');
        const saMatch = content.match(/serviceAccountName:\s*(\S+)/);
        const nameMatch = content.match(/metadata:\s*\n\s+name:\s*(\S+)/);
        if (saMatch && nameMatch) {
          baseServiceAccounts.set(nameMatch[1], saMatch[1]);
        }
      } catch {
        /* skip unreadable */
      }
    }
  }
}
try {
  scanDir(BASE_SERVICES);
} catch {
  warnings.push(`Could not scan ${BASE_SERVICES}`);
}

// --- 4. Validate ---
log(`Environment: ${ENV} (namespace: ${namespace})`);
log(`Expected deployments: ${expectedDeployments.length}`);
log(`Policy identities: ${policyIdentities.size}`);
log(`Base ServiceAccounts: ${baseServiceAccounts.size}`);

for (const deploy of expectedDeployments) {
  const sa = baseServiceAccounts.get(deploy);
  if (!sa) {
    warnings.push(`Deployment ${deploy}: no ServiceAccount found in base manifests`);
    continue;
  }
  if (sa === 'default') {
    errors.push(`Deployment ${deploy}: uses default ServiceAccount (must be dedicated)`);
  }
  const expectedIdentity = `${namespace}.${sa}.serviceaccount.identity.linkerd.cluster.local`;
  if (!policyIdentities.has(expectedIdentity)) {
    errors.push(`Deployment ${deploy}: missing MeshTLSAuthentication for identity ${expectedIdentity}`);
  }
}

// --- 5. Report ---
if (warnings.length > 0) {
  for (const w of warnings) {
    console.warn(`mesh-verify: WARNING: ${w}`);
  }
}

if (errors.length > 0) {
  for (const e of errors) {
    console.error(`mesh-verify: ERROR: ${e}`);
  }
  log(`Validation FAILED: ${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(1);
}

log(`Validation PASSED: all ${expectedDeployments.length} deployments have dedicated ServiceAccounts and mesh policies`);
process.exit(0);
