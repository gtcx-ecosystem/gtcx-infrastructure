/**
 * @fileoverview Integration test for the adaptive policy scheduler.
 *
 * The unit tests exercise evaluatePolicy as a pure state machine. This
 * test confirms the scheduler half:
 *   - polls at the configured interval
 *   - calls the metric-sample callbacks
 *   - fires onChange exactly when the state machine transitions
 *   - tolerates exceptions inside the sample callbacks without crashing
 *
 * Uses tight 30ms tick intervals so the suite finishes in well under a
 * second; the threshold counts (2 error breaches, 3 latency breaches,
 * 5 recovery windows) are unchanged from the production defaults.
 */

import assert from 'node:assert';
import { afterEach, describe, it } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';

import { startAdaptiveScheduler } from '../03-platform/src/adaptive-policy.mjs';

function withEnv(overrides, fn) {
  const original = {};
  for (const k of Object.keys(overrides)) {
    original[k] = process.env[k];
    process.env[k] = overrides[k];
  }
  return fn().finally(() => {
    for (const k of Object.keys(overrides)) {
      if (original[k] === undefined) delete process.env[k];
      else process.env[k] = original[k];
    }
  });
}

const TICK_MS = 30;

describe('adaptive policy scheduler', () => {
  let handle;
  afterEach(() => {
    handle?.stop?.();
    handle = null;
  });

  it('is a no-op when GTCX_ADAPTIVE_POLICY_ENABLED is not set', async () => {
    await withEnv({}, async () => {
      let fired = 0;
      handle = startAdaptiveScheduler({
        sampleLatencyP95Ms: () => 99_999,
        sampleErrorRate: () => 1,
        getCurrentMode: () => 'auto',
        onChange: () => { fired += 1; },
        intervalMs: TICK_MS,
      });
      await delay(TICK_MS * 4);
      assert.strictEqual(fired, 0);
    });
  });

  it('fires onChange with mode=minimal after 2 consecutive error-rate breaches', async () => {
    await withEnv({
      GTCX_ADAPTIVE_POLICY_ENABLED: 'true',
      GTCX_ADAPTIVE_ERROR_THRESHOLD: '0.10',
      GTCX_ADAPTIVE_LATENCY_THRESHOLD_MS: '5000',
    }, async () => {
      let currentMode = 'auto';
      const events = [];
      handle = startAdaptiveScheduler({
        sampleLatencyP95Ms: () => 100,
        sampleErrorRate: () => 0.5,
        getCurrentMode: () => currentMode,
        onChange: (next, reason) => {
          events.push({ next, reason });
          currentMode = next;
        },
        intervalMs: TICK_MS,
      });
      // Allow ~5 ticks to elapse — enough for the 2-window error-rate
      // breach threshold + comfortable margin.
      await delay(TICK_MS * 6);
      assert.ok(events.length >= 1, `expected ≥1 transition, got ${events.length}`);
      assert.strictEqual(events[0].next, 'minimal');
      assert.match(events[0].reason, /error_rate/);
    });
  });

  it('fires onChange with mode=reduced after 3 consecutive latency breaches', async () => {
    await withEnv({
      GTCX_ADAPTIVE_POLICY_ENABLED: 'true',
      GTCX_ADAPTIVE_LATENCY_THRESHOLD_MS: '5000',
    }, async () => {
      let currentMode = 'auto';
      const events = [];
      handle = startAdaptiveScheduler({
        sampleLatencyP95Ms: () => 6000,
        sampleErrorRate: () => 0,
        getCurrentMode: () => currentMode,
        onChange: (next, reason) => {
          events.push({ next, reason });
          currentMode = next;
        },
        intervalMs: TICK_MS,
      });
      await delay(TICK_MS * 6);
      assert.ok(events.length >= 1, `expected ≥1 transition, got ${events.length}`);
      assert.strictEqual(events[0].next, 'reduced');
      assert.match(events[0].reason, /latencyP95Ms/);
    });
  });

  it('does NOT fire when neither threshold is breached', async () => {
    await withEnv({
      GTCX_ADAPTIVE_POLICY_ENABLED: 'true',
      GTCX_ADAPTIVE_LATENCY_THRESHOLD_MS: '5000',
    }, async () => {
      let fired = 0;
      handle = startAdaptiveScheduler({
        sampleLatencyP95Ms: () => 100,
        sampleErrorRate: () => 0,
        getCurrentMode: () => 'auto',
        onChange: () => { fired += 1; },
        intervalMs: TICK_MS,
      });
      await delay(TICK_MS * 6);
      assert.strictEqual(fired, 0);
    });
  });

  it('survives sample-callback exceptions without crashing the scheduler', async () => {
    await withEnv({
      GTCX_ADAPTIVE_POLICY_ENABLED: 'true',
    }, async () => {
      let callCount = 0;
      let fired = 0;
      handle = startAdaptiveScheduler({
        sampleLatencyP95Ms: () => {
          callCount += 1;
          if (callCount === 1) throw new Error('synthetic sample failure');
          return 100;
        },
        sampleErrorRate: () => 0,
        getCurrentMode: () => 'auto',
        onChange: () => { fired += 1; },
        intervalMs: TICK_MS,
      });
      await delay(TICK_MS * 4);
      // The throwing tick was tolerated; the scheduler kept polling.
      assert.ok(callCount >= 2, `expected ≥2 sample calls, got ${callCount}`);
      assert.strictEqual(fired, 0);
    });
  });

  it('returns a no-op stop when disabled', async () => {
    await withEnv({}, async () => {
      const h = startAdaptiveScheduler({
        sampleLatencyP95Ms: () => 0,
        sampleErrorRate: () => 0,
        getCurrentMode: () => 'auto',
        onChange: () => {},
      });
      assert.strictEqual(typeof h.stop, 'function');
      h.stop(); // Should not throw.
    });
  });
});
