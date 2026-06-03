import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { normalizeEnvironment, validateDeploymentGate, validateRollbackGate } from '../src/gate.mjs';

describe('normalizeEnvironment', () => {
  it('normalizes aliases', () => {
    assert.deepEqual(normalizeEnvironment('dev'), {
      environment: 'development',
      namespace: 'gtcx-dev',
      requiresApproval: false,
    });
    assert.deepEqual(normalizeEnvironment('stg'), {
      environment: 'staging',
      namespace: 'gtcx-staging',
      requiresApproval: false,
    });
    assert.deepEqual(normalizeEnvironment('prod'), {
      environment: 'production',
      namespace: 'gtcx-production',
      requiresApproval: true,
    });
    assert.deepEqual(normalizeEnvironment('testnet'), {
      environment: 'testnet-pilot',
      namespace: 'gtcx-testnet',
      requiresApproval: false,
    });
  });

  it('accepts canonical names', () => {
    assert.equal(normalizeEnvironment('production').environment, 'production');
    assert.equal(normalizeEnvironment('development').environment, 'development');
  });

  it('rejects unknown environments', () => {
    assert.throws(() => normalizeEnvironment('uat'), /Invalid environment/);
    assert.throws(() => normalizeEnvironment(''), /Invalid environment/);
  });
});

describe('validateDeploymentGate', () => {
  it('allows development without approval', () => {
    const result = validateDeploymentGate({
      environment: 'development',
      hasKubeconfig: true,
      rollback: false,
      dryRun: false,
    });
    assert.equal(result.allowed, true);
  });

  it('blocks production without approval ticket', () => {
    const result = validateDeploymentGate({
      environment: 'production',
      hasKubeconfig: true,
      rollback: false,
      dryRun: false,
    });
    assert.equal(result.allowed, false);
    assert.ok(result.reason?.includes('approval-ticket'));
  });

  it('allows production with valid approval ticket', () => {
    const result = validateDeploymentGate({
      environment: 'production',
      hasKubeconfig: true,
      rollback: false,
      dryRun: false,
      approvalTicket: 'GTCX-1234',
    });
    assert.equal(result.allowed, true);
  });

  it('blocks invalid approval ticket format', () => {
    const result = validateDeploymentGate({
      environment: 'production',
      hasKubeconfig: true,
      rollback: false,
      dryRun: false,
      approvalTicket: 'INVALID',
    });
    assert.equal(result.allowed, false);
    assert.ok(result.reason?.includes('GTCX-NNNN'));
  });

  it('allows production dry-run without ticket', () => {
    const result = validateDeploymentGate({
      environment: 'production',
      hasKubeconfig: true,
      rollback: false,
      dryRun: true,
    });
    assert.equal(result.allowed, true);
  });

  it('allows production rollback without ticket', () => {
    const result = validateDeploymentGate({
      environment: 'production',
      hasKubeconfig: true,
      rollback: true,
      dryRun: false,
    });
    assert.equal(result.allowed, true);
  });

  it('blocks when kubeconfig is missing and not dry-run', () => {
    const result = validateDeploymentGate({
      environment: 'staging',
      hasKubeconfig: false,
      rollback: false,
      dryRun: false,
    });
    assert.equal(result.allowed, false);
    assert.ok(result.reason?.includes('Kubernetes'));
  });

  it('allows dry-run even without kubeconfig', () => {
    const result = validateDeploymentGate({
      environment: 'staging',
      hasKubeconfig: false,
      rollback: false,
      dryRun: true,
    });
    assert.equal(result.allowed, true);
  });

  it('blocks unknown environment', () => {
    const result = validateDeploymentGate({
      environment: 'uat',
      hasKubeconfig: true,
      rollback: false,
      dryRun: false,
    });
    assert.equal(result.allowed, false);
  });
});

describe('validateRollbackGate', () => {
  it('allows rollback with kubeconfig', () => {
    const result = validateRollbackGate({ environment: 'production', hasKubeconfig: true });
    assert.equal(result.allowed, true);
  });

  it('blocks rollback without kubeconfig', () => {
    const result = validateRollbackGate({ environment: 'production', hasKubeconfig: false });
    assert.equal(result.allowed, false);
  });

  it('blocks unknown environment', () => {
    const result = validateRollbackGate({ environment: 'unknown', hasKubeconfig: true });
    assert.equal(result.allowed, false);
  });
});
