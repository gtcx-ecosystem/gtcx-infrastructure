import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  createDegradationEvent,
  shouldAlert,
  toPrometheusMetrics,
} from '../src/telemetry.mjs';

describe('createDegradationEvent', () => {
  it('creates a basic event', () => {
    const event = createDegradationEvent({
      level: 'reduced',
      region: 'zimbabwe-masvingo',
    });
    assert.strictEqual(event.type, 'resilience.degradation');
    assert.strictEqual(event.level, 'reduced');
    assert.strictEqual(event.region, 'zimbabwe-masvingo');
    assert.ok(event.timestamp);
  });

  it('includes optional fields', () => {
    const event = createDegradationEvent({
      level: 'minimal',
      region: 'nairobi',
      bandwidthBps: 384000,
      latencyMs: 2800,
      queueDepth: 47,
      service: 'compliance-gateway',
    });
    assert.strictEqual(event.bandwidth_bps, 384000);
    assert.strictEqual(event.latency_ms, 2800);
    assert.strictEqual(event.queue_depth, 47);
    assert.strictEqual(event.service, 'compliance-gateway');
  });

  it('omits negative optional fields', () => {
    const event = createDegradationEvent({
      level: 'normal',
      region: 'lagos',
      bandwidthBps: -1,
      latencyMs: -5,
      queueDepth: -10,
    });
    assert.strictEqual(event.bandwidth_bps, undefined);
    assert.strictEqual(event.latency_ms, undefined);
    assert.strictEqual(event.queue_depth, undefined);
  });

  it('rounds fractional values', () => {
    const event = createDegradationEvent({
      level: 'reduced',
      region: 'test',
      bandwidthBps: 384000.7,
      latencyMs: 2800.3,
    });
    assert.strictEqual(event.bandwidth_bps, 384001);
    assert.strictEqual(event.latency_ms, 2800);
  });

  it('uses custom now', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const event = createDegradationEvent({
      level: 'offline',
      region: 'test',
      now,
    });
    assert.strictEqual(event.timestamp, '2026-01-01T00:00:00.000Z');
  });

  it('throws when level missing', () => {
    assert.throws(() => createDegradationEvent({ region: 'test' }), /level and region are required/);
  });

  it('throws when region missing', () => {
    assert.throws(() => createDegradationEvent({ level: 'normal' }), /level and region are required/);
  });

  it('throws when both missing', () => {
    assert.throws(() => createDegradationEvent({}), /level and region are required/);
  });
});

describe('shouldAlert', () => {
  it('returns false for empty history', () => {
    const result = shouldAlert({ history: [], region: 'test' });
    assert.strictEqual(result.shouldAlert, false);
    assert.strictEqual(result.offlineRatio, 0);
  });

  it('returns false for null history', () => {
    const result = shouldAlert({ history: null, region: 'test' });
    assert.strictEqual(result.shouldAlert, false);
  });

  it('returns false when no events in window', () => {
    const old = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const history = [{ type: 'resilience.degradation', level: 'offline', region: 'test', timestamp: old }];
    const result = shouldAlert({ history, region: 'test', windowMinutes: 30 });
    assert.strictEqual(result.shouldAlert, false);
    assert.strictEqual(result.totalCount, 0);
  });

  it('fires when offline ratio exceeds threshold', () => {
    const now = new Date();
    const history = Array.from({ length: 100 }, (_, i) => ({
      type: 'resilience.degradation',
      level: i < 10 ? 'offline' : 'normal',
      region: 'test',
      timestamp: now.toISOString(),
    }));
    const result = shouldAlert({ history, region: 'test', thresholdPercent: 5 });
    assert.strictEqual(result.shouldAlert, true);
    assert.strictEqual(result.offlineCount, 10);
    assert.strictEqual(result.totalCount, 100);
    assert.strictEqual(result.offlineRatio, 10);
  });

  it('does not fire when offline ratio is exactly threshold', () => {
    const now = new Date();
    const history = Array.from({ length: 100 }, (_, i) => ({
      type: 'resilience.degradation',
      level: i < 5 ? 'offline' : 'normal',
      region: 'test',
      timestamp: now.toISOString(),
    }));
    const result = shouldAlert({ history, region: 'test', thresholdPercent: 5 });
    assert.strictEqual(result.shouldAlert, false);
  });

  it('ignores events from other regions', () => {
    const now = new Date();
    const history = [
      { type: 'resilience.degradation', level: 'offline', region: 'other', timestamp: now.toISOString() },
    ];
    const result = shouldAlert({ history, region: 'test' });
    assert.strictEqual(result.shouldAlert, false);
    assert.strictEqual(result.totalCount, 0);
  });

  it('respects custom windowMinutes', () => {
    const now = new Date();
    const history = [
      { type: 'resilience.degradation', level: 'offline', region: 'test', timestamp: now.toISOString() },
    ];
    const result = shouldAlert({ history, region: 'test', windowMinutes: 1, thresholdPercent: 0 });
    assert.strictEqual(result.shouldAlert, true);
  });

  it('respects custom now', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const history = [
      { type: 'resilience.degradation', level: 'offline', region: 'test', timestamp: '2026-01-01T00:00:00Z' },
    ];
    const result = shouldAlert({ history, region: 'test', now, windowMinutes: 30, thresholdPercent: 100 });
    assert.strictEqual(result.shouldAlert, false);
    assert.strictEqual(result.totalCount, 1);
    assert.strictEqual(result.offlineRatio, 100);
  });
});

describe('toPrometheusMetrics', () => {
  it('formats a basic event', () => {
    const event = createDegradationEvent({ level: 'reduced', region: 'zw' });
    const lines = toPrometheusMetrics(event);
    assert.ok(lines.includes('gtcx_degradation_events_total'));
    assert.ok(lines.includes('level="reduced"'));
    assert.ok(lines.includes('region="zw"'));
  });

  it('includes bandwidth gauge', () => {
    const event = createDegradationEvent({
      level: 'minimal',
      region: 'ke',
      bandwidthBps: 128000,
    });
    const lines = toPrometheusMetrics(event);
    assert.ok(lines.includes('gtcx_degradation_bandwidth_bps'));
    assert.ok(lines.includes('128000'));
  });

  it('includes latency gauge', () => {
    const event = createDegradationEvent({
      level: 'minimal',
      region: 'ng',
      latencyMs: 3000,
    });
    const lines = toPrometheusMetrics(event);
    assert.ok(lines.includes('gtcx_degradation_latency_ms'));
    assert.ok(lines.includes('3000'));
  });

  it('omits missing optional metrics', () => {
    const event = createDegradationEvent({ level: 'normal', region: 'tz' });
    const lines = toPrometheusMetrics(event);
    assert.ok(!lines.includes('gtcx_degradation_bandwidth_bps'));
    assert.ok(!lines.includes('gtcx_degradation_latency_ms'));
  });
});
