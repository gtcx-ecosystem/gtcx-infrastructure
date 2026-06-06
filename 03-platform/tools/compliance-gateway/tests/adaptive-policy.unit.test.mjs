/**
 * @fileoverview Tests for the adaptive policy tuner.
 *
 * The policy is pure, so we exercise the state machine directly without
 * touching metrics or audit signing.
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import { evaluatePolicy } from '../src/adaptive-policy.mjs';

const T = {
  enabled: true,
  latencyMs: 5000,
  errorRate: 0.10,
  latencyBreachWindows: 3,
  errorBreachWindows: 2,
  recoveryWindows: 5,
};

function fresh(currentMode = 'auto') {
  return {
    currentMode,
    latencyP95Ms: 100,
    errorRate: 0,
    consecutiveLatencyBreaches: 0,
    consecutiveErrorBreaches: 0,
    consecutiveRecoveryWindows: 0,
  };
}

describe('adaptive-policy.evaluatePolicy', () => {
  it('is a no-op when disabled', () => {
    const r = evaluatePolicy({ ...fresh(), latencyP95Ms: 99_999, errorRate: 1 },
      { ...T, enabled: false });
    assert.strictEqual(r.changed, false);
    assert.strictEqual(r.nextMode, 'auto');
  });

  it('does not switch mode after a single latency breach', () => {
    const r = evaluatePolicy({ ...fresh(), latencyP95Ms: 6000 }, T);
    assert.strictEqual(r.changed, false);
    assert.strictEqual(r.consecutiveLatencyBreaches, 1);
  });

  it('switches auto → reduced after 3 consecutive latency breaches', () => {
    let state = fresh();
    let last;
    for (let i = 0; i < 3; i += 1) {
      last = evaluatePolicy({ ...state, latencyP95Ms: 6000 }, T);
      state = {
        ...state,
        consecutiveLatencyBreaches: last.consecutiveLatencyBreaches,
        consecutiveErrorBreaches: last.consecutiveErrorBreaches,
        consecutiveRecoveryWindows: last.consecutiveRecoveryWindows,
        currentMode: last.nextMode,
      };
    }
    assert.strictEqual(last.changed, true);
    assert.strictEqual(last.nextMode, 'reduced');
    assert.match(last.reason, /latencyP95Ms>5000/);
  });

  it('switches to minimal after 2 consecutive error-rate breaches (regardless of latency)', () => {
    let state = fresh();
    let last;
    for (let i = 0; i < 2; i += 1) {
      last = evaluatePolicy({ ...state, errorRate: 0.5 }, T);
      state = {
        ...state,
        consecutiveLatencyBreaches: last.consecutiveLatencyBreaches,
        consecutiveErrorBreaches: last.consecutiveErrorBreaches,
        consecutiveRecoveryWindows: last.consecutiveRecoveryWindows,
        currentMode: last.nextMode,
      };
    }
    assert.strictEqual(last.changed, true);
    assert.strictEqual(last.nextMode, 'minimal');
    assert.match(last.reason, /error_rate/);
  });

  it('error-rate breach takes precedence over latency breach', () => {
    // Already in reduced from latency; now error rate spikes.
    let state = { ...fresh('reduced'), consecutiveErrorBreaches: 1 };
    let last;
    for (let i = 0; i < 1; i += 1) {
      last = evaluatePolicy({ ...state, latencyP95Ms: 6000, errorRate: 0.5 }, T);
      state = {
        ...state,
        consecutiveLatencyBreaches: last.consecutiveLatencyBreaches,
        consecutiveErrorBreaches: last.consecutiveErrorBreaches,
        consecutiveRecoveryWindows: last.consecutiveRecoveryWindows,
        currentMode: last.nextMode,
      };
    }
    assert.strictEqual(last.nextMode, 'minimal');
  });

  it('recovers to auto after 5 healthy windows', () => {
    let state = fresh('reduced');
    let last;
    for (let i = 0; i < 5; i += 1) {
      last = evaluatePolicy({ ...state, latencyP95Ms: 100, errorRate: 0 }, T);
      state = {
        ...state,
        consecutiveLatencyBreaches: last.consecutiveLatencyBreaches,
        consecutiveErrorBreaches: last.consecutiveErrorBreaches,
        consecutiveRecoveryWindows: last.consecutiveRecoveryWindows,
        currentMode: last.nextMode,
      };
    }
    assert.strictEqual(last.changed, true);
    assert.strictEqual(last.nextMode, 'auto');
    assert.match(last.reason, /recovered for 5 windows/);
  });

  it('does not recover prematurely from minimal', () => {
    let state = fresh('minimal');
    let last;
    for (let i = 0; i < 3; i += 1) {
      last = evaluatePolicy({ ...state, latencyP95Ms: 100, errorRate: 0 }, T);
      state = {
        ...state,
        consecutiveLatencyBreaches: last.consecutiveLatencyBreaches,
        consecutiveErrorBreaches: last.consecutiveErrorBreaches,
        consecutiveRecoveryWindows: last.consecutiveRecoveryWindows,
        currentMode: last.nextMode,
      };
    }
    assert.strictEqual(last.nextMode, 'minimal'); // still in minimal after 3 healthy windows
  });

  it('resets breach counter on a healthy window', () => {
    const r = evaluatePolicy({ ...fresh(), latencyP95Ms: 6000, consecutiveLatencyBreaches: 2 }, T);
    assert.strictEqual(r.consecutiveLatencyBreaches, 3);
    const r2 = evaluatePolicy({
      ...fresh(),
      latencyP95Ms: 100,
      consecutiveLatencyBreaches: 2,
    }, T);
    assert.strictEqual(r2.consecutiveLatencyBreaches, 0);
  });
});
