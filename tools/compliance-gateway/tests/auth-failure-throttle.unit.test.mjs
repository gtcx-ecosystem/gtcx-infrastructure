/**
 * @fileoverview Unit tests for the per-IP auth-failure throttle.
 *
 * Threshold/window are kept small (3 fails in 100ms → 100ms lockout)
 * to keep tests fast without changing the production defaults.
 */

import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
  _resetForTests,
  _stateSizeForTests,
  clearAuthFailures,
  isAuthThrottled,
  isIpInCidrs,
  recordAndCheckAuthFailure,
  recordAuthFailure,
  sourceIpFromRequest,
} from '../src/auth-failure-throttle.mjs';

const CFG = { threshold: 3, windowMs: 100, throttleMs: 100 };
const CAP_CFG = { threshold: 100, windowMs: 60_000, throttleMs: 60_000, maxIps: 3 };

describe('auth-failure-throttle — counter + window', () => {
  beforeEach(() => _resetForTests());
  afterEach(() => _resetForTests());

  it('does not throttle a fresh IP', () => {
    assert.strictEqual(isAuthThrottled('1.2.3.4').throttled, false);
  });

  it('throttles after the threshold is crossed', () => {
    recordAuthFailure('a', CFG);
    recordAuthFailure('a', CFG);
    const r = recordAuthFailure('a', CFG);
    assert.strictEqual(r.throttled, true, '3rd failure crosses threshold');
    assert.ok(r.retryAfterSeconds >= 1);
    assert.strictEqual(isAuthThrottled('a').throttled, true);
  });

  it('does not affect other IPs', () => {
    for (let i = 0; i < 5; i += 1) recordAuthFailure('a', CFG);
    assert.strictEqual(isAuthThrottled('a').throttled, true);
    assert.strictEqual(isAuthThrottled('b').throttled, false);
  });

  it('clearAuthFailures resets the counter', () => {
    for (let i = 0; i < 3; i += 1) recordAuthFailure('a', CFG);
    assert.strictEqual(isAuthThrottled('a').throttled, true);
    clearAuthFailures('a');
    assert.strictEqual(isAuthThrottled('a').throttled, false);
  });

  it('lockout expires after throttleMs', async () => {
    for (let i = 0; i < 3; i += 1) recordAuthFailure('a', CFG);
    assert.strictEqual(isAuthThrottled('a').throttled, true);
    await new Promise((r) => setTimeout(r, 130));
    assert.strictEqual(isAuthThrottled('a').throttled, false);
  });

  it('counter resets if no failures within window', async () => {
    recordAuthFailure('a', CFG);
    recordAuthFailure('a', CFG);
    await new Promise((r) => setTimeout(r, 130));
    // Next failure should start a fresh window, not immediately throttle.
    const r = recordAuthFailure('a', CFG);
    assert.strictEqual(r.throttled, false);
    assert.strictEqual(r.count, 1);
  });

  it('recordAndCheckAuthFailure suppresses signing on the threshold-crossing failure', () => {
    assert.strictEqual(recordAndCheckAuthFailure('a', CFG).shouldSign, true);
    assert.strictEqual(recordAndCheckAuthFailure('a', CFG).shouldSign, true);
    const thresholdCrossing = recordAndCheckAuthFailure('a', CFG);
    assert.strictEqual(thresholdCrossing.throttled, true);
    assert.strictEqual(thresholdCrossing.alreadyThrottled, false);
    assert.strictEqual(thresholdCrossing.shouldSign, false);

    const locked = recordAndCheckAuthFailure('a', CFG);
    assert.strictEqual(locked.throttled, true);
    assert.strictEqual(locked.alreadyThrottled, true);
    assert.strictEqual(locked.shouldSign, false);
    assert.strictEqual(locked.count, thresholdCrossing.count);
  });

  it('bounds tracked IP state with LRU eviction', () => {
    recordAuthFailure('ip-1', CAP_CFG);
    recordAuthFailure('ip-2', CAP_CFG);
    recordAuthFailure('ip-3', CAP_CFG);
    assert.strictEqual(_stateSizeForTests(), 3);

    // Touch ip-1 so ip-2 becomes the oldest evictable entry.
    assert.strictEqual(isAuthThrottled('ip-1').throttled, false);
    recordAuthFailure('ip-4', CAP_CFG);

    assert.strictEqual(_stateSizeForTests(), 3);
    assert.strictEqual(isAuthThrottled('ip-1').throttled, false);
    assert.strictEqual(isAuthThrottled('ip-3').throttled, false);
    assert.strictEqual(isAuthThrottled('ip-4').throttled, false);
    assert.strictEqual(
      recordAuthFailure('ip-2', { ...CAP_CFG, maxIps: 10 }).count,
      1,
      'evicted IP should start a fresh counter'
    );
  });

  it('does not evict the IP currently being recorded when maxIps is tiny', () => {
    recordAuthFailure('old', { ...CAP_CFG, maxIps: 1 });
    recordAuthFailure('current', { ...CAP_CFG, maxIps: 1 });
    assert.strictEqual(_stateSizeForTests(), 1);
    assert.strictEqual(recordAuthFailure('current', { ...CAP_CFG, maxIps: 1 }).count, 2);
  });
});

describe('auth-failure-throttle — sourceIpFromRequest', () => {
  it('prefers x-forwarded-for first hop only when socket peer is trusted', () => {
    const req = {
      headers: { 'x-forwarded-for': '10.0.0.1, 172.16.0.1' },
      socket: { remoteAddress: '127.0.0.1' },
    };
    assert.strictEqual(
      sourceIpFromRequest(req, { trustedProxyCidrs: ['127.0.0.0/8'] }),
      '10.0.0.1'
    );
  });

  it('ignores x-forwarded-for from untrusted socket peers', () => {
    const req = {
      headers: { 'x-forwarded-for': '10.0.0.1, 172.16.0.1' },
      socket: { remoteAddress: '198.51.100.20' },
    };
    assert.strictEqual(
      sourceIpFromRequest(req, { trustedProxyCidrs: ['127.0.0.0/8'] }),
      '198.51.100.20'
    );
  });

  it('ignores malformed x-forwarded-for even from trusted peers', () => {
    const req = {
      headers: { 'x-forwarded-for': 'not-an-ip, 10.0.0.1' },
      socket: { remoteAddress: '127.0.0.1' },
    };
    assert.strictEqual(
      sourceIpFromRequest(req, { trustedProxyCidrs: ['127.0.0.0/8'] }),
      '127.0.0.1'
    );
  });

  it('supports IPv4-mapped socket addresses for trusted proxy checks', () => {
    const req = {
      headers: { 'x-forwarded-for': '203.0.113.44' },
      socket: { remoteAddress: '::ffff:127.0.0.1' },
    };
    assert.strictEqual(
      sourceIpFromRequest(req, { trustedProxyCidrs: ['127.0.0.0/8'] }),
      '203.0.113.44'
    );
  });

  it('falls back to socket.remoteAddress', () => {
    const req = { headers: {}, socket: { remoteAddress: '192.168.1.50' } };
    assert.strictEqual(sourceIpFromRequest(req), '192.168.1.50');
  });

  it('returns "unknown" when no source can be determined', () => {
    assert.strictEqual(sourceIpFromRequest({ headers: {} }), 'unknown');
  });
});

describe('auth-failure-throttle — CIDR matching', () => {
  it('matches IPv4 CIDR ranges', () => {
    assert.strictEqual(isIpInCidrs('10.0.5.10', ['10.0.0.0/16']), true);
    assert.strictEqual(isIpInCidrs('10.1.5.10', ['10.0.0.0/16']), false);
  });

  it('matches IPv6 CIDR ranges', () => {
    assert.strictEqual(isIpInCidrs('2001:db8::42', ['2001:db8::/32']), true);
    assert.strictEqual(isIpInCidrs('2001:db9::42', ['2001:db8::/32']), false);
  });

  it('ignores invalid CIDR entries safely', () => {
    assert.strictEqual(isIpInCidrs('10.0.0.1', ['not-cidr', '10.0.0.0/8']), true);
    assert.strictEqual(isIpInCidrs('10.0.0.1', ['not-cidr', '10.0.0.0/99']), false);
    assert.strictEqual(isIpInCidrs('10.0.0.1', ['10.0.0.0/8junk']), false);
    assert.strictEqual(isIpInCidrs('10.0.0.1', ['10.0.0.0/8/extra']), false);
  });

  it('matches IPv4 CIDR with non-multiple-of-8 prefix', () => {
    assert.strictEqual(isIpInCidrs('10.0.0.1', ['10.0.0.0/20']), true);
    assert.strictEqual(isIpInCidrs('10.0.15.255', ['10.0.0.0/20']), true);
    assert.strictEqual(isIpInCidrs('10.0.16.1', ['10.0.0.0/20']), false);
  });

  it('matches IPv6 with embedded IPv4 ending', () => {
    assert.strictEqual(isIpInCidrs('2001:db8::192.168.1.1', ['2001:db8::/32']), true);
    assert.strictEqual(isIpInCidrs('2001:db9::192.168.1.1', ['2001:db8::/32']), false);
  });

  it('prunes stale IP state after window expires', async () => {
    recordAuthFailure('stale', { threshold: 100, windowMs: 50, throttleMs: 50 });
    assert.strictEqual(_stateSizeForTests(), 1);
    await new Promise((r) => setTimeout(r, 80));
    // Recording a new failure should prune the stale entry
    recordAuthFailure('fresh', { threshold: 100, windowMs: 50, throttleMs: 50 });
    assert.strictEqual(_stateSizeForTests(), 1);
    assert.strictEqual(isAuthThrottled('stale').throttled, false);
  });
});
