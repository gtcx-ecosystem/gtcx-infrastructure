/**
 * @fileoverview Unit tests for the NATS consumer supervisor.
 *
 * Verifies the prior single-attempt-connect bug is gone: the consumer
 * now exponential-backoff retries indefinitely until `stop()` is
 * called, with full-jitter backoff, surviving broker rolling restarts.
 *
 * Uses an injectable `loadNats` to simulate connect failures and
 * subscription closures without a real broker. Tests run with tiny
 * delays (initialDelayMs: 5, maxDelayMs: 20) so the suite completes
 * in <1s.
 */

import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
  startNatsConsumer,
  natsConnectionState,
  nextRetryDelayMs,
  _resetForTests,
} from '../03-platform/src/nats-consumer.mjs';

process.env.AUDIT_S3_BUCKET = process.env.AUDIT_S3_BUCKET || 'gtcx-test-bucket';
process.env.AUDIT_S3_ALLOW_STUB = '1';

function makeMockNats({ failConnects = 0, subMessages = [], hangupAfter = null } = {}) {
  let connectAttempts = 0;
  let opens = 0;
  return {
    connect: async () => {
      connectAttempts += 1;
      if (connectAttempts <= failConnects) {
        throw new Error(`mock-connect-failed-${connectAttempts}`);
      }
      opens += 1;
      return {
        jetstreamManager: async () => ({
          consumers: { add: async () => {} },
        }),
        jetstream: () => ({
          subscribe: async () => {
            // Yield messages, then either close (default) or hang up.
            const messages = [...subMessages];
            async function* gen() {
              for (let i = 0; i < messages.length; i += 1) {
                if (hangupAfter !== null && i === hangupAfter) {
                  return;
                }
                yield {
                  data: Buffer.from(JSON.stringify(messages[i].record)),
                  subject: messages[i].subject,
                  ack: () => {},
                  nak: () => {},
                };
              }
            }
            const iter = gen();
            return Object.assign(iter, {
              drain: async () => {},
            });
          },
        }),
        close: async () => {},
      };
    },
    stats: () => ({ connectAttempts, opens }),
  };
}

async function waitFor(predicate, message, timeoutMs = 1_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.fail(message);
}

describe('nats-consumer — nextRetryDelayMs', () => {
  it('grows exponentially up to maxDelayMs', () => {
    const cfg = { initialDelayMs: 100, maxDelayMs: 1000, jitterFraction: 0 };
    assert.strictEqual(nextRetryDelayMs(1, cfg), 100);
    assert.strictEqual(nextRetryDelayMs(2, cfg), 200);
    assert.strictEqual(nextRetryDelayMs(3, cfg), 400);
    assert.strictEqual(nextRetryDelayMs(4, cfg), 800);
    assert.strictEqual(nextRetryDelayMs(5, cfg), 1000); // capped
    assert.strictEqual(nextRetryDelayMs(10, cfg), 1000); // still capped
  });

  it('applies jitter within bounds', () => {
    const cfg = { initialDelayMs: 1000, maxDelayMs: 1000, jitterFraction: 0.3 };
    for (let i = 0; i < 50; i += 1) {
      const d = nextRetryDelayMs(1, cfg);
      assert.ok(d >= 700 - 1, `delay ${d} below jitter floor`);
      assert.ok(d <= 1300 + 1, `delay ${d} above jitter ceiling`);
    }
  });
});

describe('nats-consumer — supervisor reconnect', () => {
  beforeEach(() => _resetForTests());
  afterEach(async () => {
    _resetForTests();
  });

  it('reconnects after the subscription ends (broker hangup)', async () => {
    const records = [];
    const messages = [
      { record: { id: 'm1' }, subject: 'gtcx.audit.compliance-gateway.t1' },
      { record: { id: 'm2' }, subject: 'gtcx.audit.compliance-gateway.t1' },
    ];
    const mock = makeMockNats({ subMessages: messages });
    const handle = await startNatsConsumer({
      onRecord: (rec) => records.push(rec.id),
      loadNats: async () => mock,
      retry: { initialDelayMs: 5, maxDelayMs: 20, jitterFraction: 0 },
    });

    // Drain a few reconnect cycles. Each cycle delivers 2 messages
    // then closes; supervisor reconnects after backoff.
    await waitFor(
      () => records.length >= 4 && mock.stats().opens >= 2,
      `expected reconnect records and opens, got records=${records.length}, opens=${mock.stats().opens}`
    );
    await handle.stop();

    const state = natsConnectionState();
    assert.ok(records.length >= 4, `expected >= 4 records over reconnects, got ${records.length}`);
    assert.ok(state.reconnectAttempts >= 1, 'reconnectAttempts should advance');
    assert.ok(mock.stats().opens >= 2, 'subscription should open more than once');
  });

  it('retries with backoff when initial connect fails', async () => {
    const mock = makeMockNats({ failConnects: 3, subMessages: [] });
    const handle = await startNatsConsumer({
      onRecord: () => {},
      loadNats: async () => mock,
      retry: { initialDelayMs: 5, maxDelayMs: 20, jitterFraction: 0 },
    });

    // Wait for the supervisor to push through several failed connects
    // and one successful open.
    await waitFor(
      () => mock.stats().connectAttempts >= 4 && mock.stats().opens >= 1,
      `expected >= 4 connect attempts and >= 1 open, got attempts=${mock.stats().connectAttempts}, opens=${mock.stats().opens}`
    );
    await handle.stop();

    assert.ok(
      mock.stats().connectAttempts >= 4,
      `expected >= 4 connect attempts, got ${mock.stats().connectAttempts}`
    );
    assert.ok(mock.stats().opens >= 1, 'should have at least one successful open');
    const state = natsConnectionState();
    assert.ok(
      state.reconnectAttempts >= 3,
      `reconnectAttempts >= 3, got ${state.reconnectAttempts}`
    );
  });

  it('returns a no-op handle when loader yields null (module missing)', async () => {
    const handle = await startNatsConsumer({
      onRecord: () => {},
      loadNats: async () => null,
    });
    assert.strictEqual(typeof handle.stop, 'function');
    await handle.stop();
    assert.strictEqual(natsConnectionState().connected, false);
  });
});
