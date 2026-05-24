import { describe, it } from 'node:test';
import assert from 'node:assert';

import { NonceGate, NONCE_TTL_MS } from '../../src/audit-bundles/nonce-gate.mjs';

describe('NonceGate.checkAndSet', () => {
  it('accepts a never-seen nonce', () => {
    const gate = new NonceGate();
    const result = gate.checkAndSet('n-001');
    assert.deepStrictEqual(result, { accepted: true, alreadySeen: false });
  });

  it('rejects a replayed nonce within TTL', () => {
    const gate = new NonceGate();
    gate.checkAndSet('n-001');
    const result = gate.checkAndSet('n-001');
    assert.deepStrictEqual(result, { accepted: false, alreadySeen: true });
  });

  it('accepts the same nonce after TTL elapses', () => {
    let now = 1_000_000;
    const gate = new NonceGate({ now: () => now });
    gate.checkAndSet('n-001');
    now += NONCE_TTL_MS + 1;
    const result = gate.checkAndSet('n-001');
    assert.deepStrictEqual(result, { accepted: true, alreadySeen: false });
  });

  it('distinguishes between different nonces', () => {
    const gate = new NonceGate();
    assert.strictEqual(gate.checkAndSet('n-001').accepted, true);
    assert.strictEqual(gate.checkAndSet('n-002').accepted, true);
    assert.strictEqual(gate.checkAndSet('n-001').accepted, false);
    assert.strictEqual(gate.checkAndSet('n-002').accepted, false);
  });
});

describe('NonceGate — TTL boundary', () => {
  it('still rejects exactly at TTL boundary (not yet expired)', () => {
    let now = 1_000_000;
    const gate = new NonceGate({ now: () => now });
    gate.checkAndSet('n-001');
    now += NONCE_TTL_MS; // exactly at expiration; we use > so still rejected
    const result = gate.checkAndSet('n-001');
    assert.strictEqual(result.accepted, false);
  });

  it('accepts one ms past TTL boundary', () => {
    let now = 1_000_000;
    const gate = new NonceGate({ now: () => now });
    gate.checkAndSet('n-001');
    now += NONCE_TTL_MS + 1;
    const result = gate.checkAndSet('n-001');
    assert.strictEqual(result.accepted, true);
  });
});

describe('NonceGate — capacity', () => {
  it('respects maxSize by dropping oldest entries', () => {
    let now = 1000;
    const gate = new NonceGate({ maxSize: 10, now: () => now });
    for (let i = 0; i < 10; i += 1) {
      now += 1;
      gate.checkAndSet(`n-${i}`);
    }
    assert.strictEqual(gate.size, 10);
    now += 1;
    gate.checkAndSet('n-11');
    assert.ok(gate.size <= 10, `size should not exceed maxSize, got ${gate.size}`);
  });

  it('size shrinks as TTL elapses', () => {
    let now = 1_000_000;
    const gate = new NonceGate({ now: () => now });
    gate.checkAndSet('n-001');
    gate.checkAndSet('n-002');
    assert.strictEqual(gate.size, 2);
    now += NONCE_TTL_MS + 1;
    assert.strictEqual(gate.size, 0);
  });
});

describe('NonceGate — defaults', () => {
  it('exposes NONCE_TTL_MS as 5 minutes', () => {
    assert.strictEqual(NONCE_TTL_MS, 5 * 60 * 1000);
  });
});
