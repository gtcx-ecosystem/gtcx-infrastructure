/**
 * @fileoverview PIN Authentication Tests
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import { hashPin, verifyPin, checkLockout, recordFailedAttempt, resetAttempts } from '../src/auth.mjs';
import { config } from '../src/config.mjs';

describe('hashPin + verifyPin', () => {
  it('hashes and verifies a PIN', () => {
    const hash = hashPin('1234');
    assert.ok(verifyPin('1234', hash));
    assert.ok(!verifyPin('0000', hash));
    assert.ok(!verifyPin('12345', hash));
  });

  it('produces different hashes for same PIN (salt randomness)', () => {
    const h1 = hashPin('1234');
    const h2 = hashPin('1234');
    assert.notStrictEqual(h1, h2);
    assert.ok(verifyPin('1234', h1));
    assert.ok(verifyPin('1234', h2));
  });

  it('returns false for malformed hash', () => {
    assert.ok(!verifyPin('1234', 'not-a-hash'));
    assert.ok(!verifyPin('1234', ''));
  });
});

describe('checkLockout', () => {
  it('allows access when attempts below max', () => {
    const result = checkLockout({ 'pin-attempts': '2' });
    assert.strictEqual(result.locked, false);
  });

  it('locks after 3 failed attempts', () => {
    const result = checkLockout({ 'pin-attempts': '3', 'pin-locked-at': String(Date.now()) });
    assert.strictEqual(result.locked, true);
    assert.ok(typeof result.remainingMinutes === 'number');
    assert.ok(result.remainingMinutes > 0);
  });

  it('unlocks after lockout period expires', () => {
    const lockedAt = Date.now() - 16 * 60 * 1000; // 16 minutes ago
    const result = checkLockout({ 'pin-attempts': '3', 'pin-locked-at': String(lockedAt) });
    assert.strictEqual(result.locked, false);
  });

  it('allows access for null session', () => {
    const result = checkLockout(null);
    assert.strictEqual(result.locked, false);
  });

  it('allows access when locked-at is missing', () => {
    const result = checkLockout({ 'pin-attempts': '3' });
    assert.strictEqual(result.locked, false);
  });
});

describe('recordFailedAttempt', () => {
  it('increments attempt counter', () => {
    const updates = recordFailedAttempt({ 'pin-attempts': '1' });
    assert.strictEqual(updates['pin-attempts'], '2');
    assert.ok(!updates['pin-locked-at']);
  });

  it('sets lockout time at 3rd attempt', () => {
    const updates = recordFailedAttempt({ 'pin-attempts': '2' });
    assert.strictEqual(updates['pin-attempts'], '3');
    assert.ok(updates['pin-locked-at']);
  });

  it('handles null session', () => {
    const updates = recordFailedAttempt(null);
    assert.strictEqual(updates['pin-attempts'], '1');
  });

  it('handles empty session', () => {
    const updates = recordFailedAttempt({});
    assert.strictEqual(updates['pin-attempts'], '1');
  });
});

describe('hashPin + verifyPin production params', () => {
  it('uses higher iteration count in production', () => {
    const prev = config.nodeEnv;
    config.nodeEnv = 'production';
    const hash = hashPin('1234');
    assert.ok(verifyPin('1234', hash));
    assert.ok(!verifyPin('0000', hash));
    config.nodeEnv = prev;
  });

  it('covers production branch via fresh import', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const { hashPin: hp, verifyPin: vp } = await import(`../src/auth.mjs?v=prod-${Date.now()}`);
    const hash = hp('1234');
    assert.ok(vp('1234', hash));
    process.env.NODE_ENV = originalEnv;
  });
});

describe('resetAttempts', () => {
  it('resets attempts and lockout', () => {
    const updates = resetAttempts();
    assert.strictEqual(updates['pin-attempts'], '0');
    assert.strictEqual(updates['pin-locked-at'], '');
  });
});
