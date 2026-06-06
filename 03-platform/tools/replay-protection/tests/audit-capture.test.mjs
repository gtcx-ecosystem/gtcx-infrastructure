/**
 * @fileoverview Audit Capture Tests — Branch Coverage
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import { AuditCapture, consoleSink } from '../src/audit/audit-capture.mjs';

describe('AuditCapture — disabled mode', () => {
  it('returns event without calling sinks when disabled', async () => {
    const capture = new AuditCapture({ enabled: false, sinks: [] });
    const event = await capture.capture({ eventType: 'replay.accepted' });
    assert.strictEqual(event.eventType, 'replay.accepted');
    assert.ok(event.eventId);
    assert.ok(event.timestampMs);
  });
});

describe('AuditCapture — sink behavior', () => {
  it('calls all sinks with the event', async () => {
    const called = [];
    const sink = (event) => called.push(event);
    const capture = new AuditCapture({ enabled: true, sinks: [sink] });
    const event = await capture.capture({ eventType: 'replay.rejected' });
    assert.strictEqual(called.length, 1);
    assert.strictEqual(called[0].eventType, 'replay.rejected');
    assert.strictEqual(called[0].eventId, event.eventId);
  });

  it('does not break when a sink throws', async () => {
    const good = [];
    const capture = new AuditCapture({
      enabled: true,
      sinks: [
        () => {
          throw new Error('sink failure');
        },
        (event) => good.push(event),
      ],
    });
    const event = await capture.capture({ eventType: 'replay.accepted' });
    assert.strictEqual(good.length, 1);
    assert.strictEqual(good[0].eventId, event.eventId);
  });

  it('adds a sink dynamically', async () => {
    const capture = new AuditCapture({ enabled: true, sinks: [] });
    const called = [];
    capture.addSink((event) => called.push(event));
    await capture.capture({ eventType: 'replay.accepted' });
    assert.strictEqual(called.length, 1);
  });

  it('uses default enabled=true when omitted', async () => {
    const called = [];
    const capture = new AuditCapture({ sinks: [(e) => called.push(e)] });
    await capture.capture({ eventType: 'replay.accepted' });
    assert.strictEqual(called.length, 1);
  });

  it('uses empty sinks when omitted', async () => {
    const capture = new AuditCapture({});
    const event = await capture.capture({ eventType: 'replay.accepted' });
    assert.strictEqual(event.eventType, 'replay.accepted');
  });
});

describe('AuditCapture — optional fields', () => {
  it('includes all optional fields when provided', async () => {
    const capture = new AuditCapture({ enabled: true, sinks: [] });
    const event = await capture.capture({
      eventType: 'replay.rejected',
      nonce: 'n1',
      did: 'did:gtcx:device:test',
      reason: 'Nonce already consumed',
      code: 'REPLAY_NONCE',
      region: 'global-south',
      requestId: 'req-1',
      deviceId: 'dev-1',
      clockSkewMs: 420,
      acceptanceWindowMs: 900000,
      isDelayedOfflineReplay: true,
    });
    assert.strictEqual(event.nonce, 'n1');
    assert.strictEqual(event.region, 'global-south');
    assert.strictEqual(event.isDelayedOfflineReplay, true);
  });
});

describe('consoleSink', () => {
  it('outputs JSON to console', () => {
    const logs = [];
    // eslint-disable-next-line no-console
    const original = console.log;
    // eslint-disable-next-line no-console
    console.log = (...args) => logs.push(args.join(' '));
    try {
      consoleSink({ eventType: 'replay.accepted' });
      assert.strictEqual(logs.length, 1);
      const parsed = JSON.parse(logs[0]);
      assert.strictEqual(parsed.type, 'audit.replay');
      assert.strictEqual(parsed.eventType, 'replay.accepted');
    } finally {
      // eslint-disable-next-line no-console
      console.log = original;
    }
  });
});
