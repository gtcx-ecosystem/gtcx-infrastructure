import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { evaluateCanaryHealth, shouldPromote, computeCanaryReplicaCount } from '../src/canary.mjs';

describe('evaluateCanaryHealth', () => {
  it('reports healthy when counts are within thresholds', () => {
    const result = evaluateCanaryHealth({ notReadyCount: 0, restartCount: 0 });
    assert.equal(result.healthy, true);
  });

  it('reports unhealthy when pods are not ready', () => {
    const result = evaluateCanaryHealth({ notReadyCount: 1, restartCount: 0 });
    assert.equal(result.healthy, false);
    assert.ok(result.reason?.includes('not-ready'));
  });

  it('reports unhealthy when restarts exceed default threshold', () => {
    const result = evaluateCanaryHealth({ notReadyCount: 0, restartCount: 3 });
    assert.equal(result.healthy, false);
    assert.ok(result.reason?.includes('restart'));
  });

  it('allows custom restart threshold', () => {
    const result = evaluateCanaryHealth({ notReadyCount: 0, restartCount: 3, maxRestarts: 5 });
    assert.equal(result.healthy, true);
  });

  it('reports unhealthy when restarts exceed custom threshold', () => {
    const result = evaluateCanaryHealth({ notReadyCount: 0, restartCount: 6, maxRestarts: 5 });
    assert.equal(result.healthy, false);
  });
});

describe('shouldPromote', () => {
  it('promotes when healthy and elapsed >= maxWait', () => {
    const result = shouldPromote({ healthy: true, elapsedSeconds: 300, maxWaitSeconds: 300 });
    assert.equal(result.promote, true);
    assert.ok(result.reason?.includes('complete'));
  });

  it('does not promote when unhealthy', () => {
    const result = shouldPromote({ healthy: false, elapsedSeconds: 300, maxWaitSeconds: 300 });
    assert.equal(result.promote, false);
    assert.ok(result.reason?.includes('unhealthy'));
  });

  it('does not promote when observation period is incomplete', () => {
    const result = shouldPromote({ healthy: true, elapsedSeconds: 100, maxWaitSeconds: 300 });
    assert.equal(result.promote, false);
    assert.ok(result.reason?.includes('incomplete'));
  });
});

describe('computeCanaryReplicaCount', () => {
  it('computes 1 replica for small percentages', () => {
    assert.equal(computeCanaryReplicaCount({ totalReplicas: 10, percentage: 5 }), 1);
  });

  it('computes proportional replicas', () => {
    assert.equal(computeCanaryReplicaCount({ totalReplicas: 10, percentage: 50 }), 5);
    assert.equal(computeCanaryReplicaCount({ totalReplicas: 20, percentage: 25 }), 5);
  });

  it('caps at totalReplicas', () => {
    assert.equal(computeCanaryReplicaCount({ totalReplicas: 3, percentage: 100 }), 3);
  });

  it('rejects invalid percentage', () => {
    assert.throws(() => computeCanaryReplicaCount({ totalReplicas: 10, percentage: 0 }), /percentage/);
    assert.throws(() => computeCanaryReplicaCount({ totalReplicas: 10, percentage: 101 }), /percentage/);
    assert.throws(() => computeCanaryReplicaCount({ totalReplicas: 10, percentage: -5 }), /percentage/);
  });

  it('rejects non-positive total replicas', () => {
    assert.throws(() => computeCanaryReplicaCount({ totalReplicas: 0, percentage: 10 }), /positive/);
    assert.throws(() => computeCanaryReplicaCount({ totalReplicas: -1, percentage: 10 }), /positive/);
  });
});
