/**
 * @fileoverview Replay Metrics Tests — Branch Coverage
 *
 * Exercises defensive branches (enabled=false, nullish coalescing,
 * bucket truncation) to lift replay-metrics branch coverage.
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import { ReplayMetrics } from '../03-platform/src/metrics/replay-metrics.mjs';

describe('ReplayMetrics — disabled mode', () => {
  it('inc() is a no-op when disabled', () => {
    const m = new ReplayMetrics({ enabled: false });
    m.inc('accepted_total');
    assert.strictEqual(m.snapshot().acceptedTotal, 0);
  });

  it('snapshot() returns zeros when disabled', () => {
    const m = new ReplayMetrics({ enabled: false });
    const snap = m.snapshot();
    assert.strictEqual(snap.acceptedTotal, 0);
    assert.strictEqual(snap.rejectedNonceTotal, 0);
    assert.strictEqual(snap.rejectedStaleTotal, 0);
    assert.strictEqual(snap.rejectedFutureTotal, 0);
    assert.strictEqual(snap.rejectedSignatureTotal, 0);
    assert.strictEqual(snap.rejectedEnvelopeTotal, 0);
  });
});

describe('ReplayMetrics — reset and delta', () => {
  it('reset() zeros all counters', () => {
    const m = new ReplayMetrics();
    m.inc('accepted_total', 5);
    m.reset();
    assert.strictEqual(m.snapshot().acceptedTotal, 0);
  });

  it('inc() accepts custom delta', () => {
    const m = new ReplayMetrics();
    m.inc('accepted_total', 3);
    assert.strictEqual(m.snapshot().acceptedTotal, 3);
  });

  it('inc() initializes an unknown label defensively', () => {
    const m = new ReplayMetrics();
    m.inc('diagnostic_total', 4);
    assert.strictEqual(m.snapshot().acceptedTotal, 0);
  });
});

describe('ReplayMetrics — Redis connectivity', () => {
  it('setRedisConnected(0) sets gauge to 0', () => {
    const m = new ReplayMetrics();
    m.setRedisConnected(0);
    assert.strictEqual(m.redisConnected(), 0);
  });

  it('setRedisConnected(1) sets gauge to 1', () => {
    const m = new ReplayMetrics();
    m.setRedisConnected(1);
    assert.strictEqual(m.redisConnected(), 1);
  });
});

describe('ReplayMetrics — clock skew histogram', () => {
  it('observeClockSkew ignores null input', () => {
    const m = new ReplayMetrics();
    m.observeClockSkew(null);
    const hist = m.clockSkewHistogram();
    assert.ok(hist.includes('replay_protection_clock_skew_ms_count 0'));
  });

  it('observeClockSkew ignores undefined input', () => {
    const m = new ReplayMetrics();
    m.observeClockSkew(undefined);
    const hist = m.clockSkewHistogram();
    assert.ok(hist.includes('replay_protection_clock_skew_ms_count 0'));
  });

  it('truncates buckets to last 5000 after 10001 samples', () => {
    const m = new ReplayMetrics();
    for (let i = 0; i < 10001; i++) {
      m.observeClockSkew(i);
    }
    const hist = m.clockSkewHistogram();
    // After truncation, count should be 5000
    assert.ok(hist.includes('replay_protection_clock_skew_ms_count 5000'));
  });

  it('produces correct histogram for mixed values', () => {
    const m = new ReplayMetrics();
    m.observeClockSkew(500);
    m.observeClockSkew(1500);
    m.observeClockSkew(70000);
    const hist = m.clockSkewHistogram();
    assert.ok(hist.includes('replay_protection_clock_skew_ms_bucket{le="1000"} 1'));
    assert.ok(hist.includes('replay_protection_clock_skew_ms_bucket{le="5000"} 2'));
    assert.ok(hist.includes('replay_protection_clock_skew_ms_bucket{le="60000"} 2'));
    assert.ok(hist.includes('replay_protection_clock_skew_ms_bucket{le="+Inf"} 3'));
  });
});

describe('ReplayMetrics — prometheus exposition', () => {
  it('formats all counters', () => {
    const m = new ReplayMetrics();
    m.inc('accepted_total');
    m.inc('rejected_nonce_total', 2);
    const text = m.prometheus();
    assert.ok(text.includes('replay_protection_total{code="REPLAY_OK"} 1'));
    assert.ok(text.includes('replay_protection_total{code="REPLAY_NONCE"} 2'));
  });
});
