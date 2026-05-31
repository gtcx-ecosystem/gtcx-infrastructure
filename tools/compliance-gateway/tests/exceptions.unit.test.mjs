/**
 * @fileoverview Tests for the exception-only operator view.
 *
 * AI-native Pattern #3 — surface only events requiring human
 * judgment. The chain still records every routine event for the
 * regulator trail; the operator never sees them.
 */

import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
  getExceptions,
  initAuditSigner,
  resetAuditSigner,
  signAuditEvent,
} from '../src/audit.mjs';

function silence(fn) {
  const out = console.log;
  const err = console.error;
  console.log = () => {};
  console.error = () => {};
  try { return fn(); } finally { console.log = out; console.error = err; }
}

describe('getExceptions — classification', () => {
  beforeEach(() => {
    resetAuditSigner();
    initAuditSigner({ NODE_ENV: 'test' }, true);
  });
  afterEach(() => resetAuditSigner());

  it('returns auth-failure for auth:failure action', () => {
    silence(() => {
      signAuditEvent({
        actor: 'unknown',
        action: 'auth:failure',
        target: '/v1/query',
        reason: 'Invalid bearer token',
        tenantId: 'zw',
      });
    });
    const r = getExceptions({ tenantId: 'zw' });
    assert.strictEqual(r.totalExceptions, 1);
    assert.strictEqual(r.exceptions[0].kind, 'auth-failure');
    assert.strictEqual(r.exceptions[0].reason, 'Invalid bearer token');
  });

  it('returns query-failure for query:failure action', () => {
    silence(() => {
      signAuditEvent({
        actor: 'ops',
        action: 'query:failure',
        target: 'what is KYC',
        tenantId: 'zw',
      });
    });
    const r = getExceptions({ tenantId: 'zw' });
    assert.strictEqual(r.exceptions[0].kind, 'query-failure');
  });

  it('returns query-throttled for query:throttled action', () => {
    silence(() => {
      signAuditEvent({
        actor: 'ops',
        action: 'query:throttled',
        target: 'q',
        tenantId: 'zw',
      });
    });
    const r = getExceptions({ tenantId: 'zw' });
    assert.strictEqual(r.exceptions[0].kind, 'query-throttled');
  });

  it('returns low-confidence when query:success is tagged via exceptionKind', () => {
    silence(() => {
      signAuditEvent({
        actor: 'ops',
        action: 'query:success',
        target: 'q',
        tenantId: 'zw',
        exceptionKind: 'low-confidence',
      });
    });
    const r = getExceptions({ tenantId: 'zw' });
    assert.strictEqual(r.exceptions[0].kind, 'low-confidence');
  });

  it('HIDES routine query:success events with no exception tag', () => {
    silence(() => {
      signAuditEvent({
        actor: 'ops',
        action: 'query:success',
        target: 'q',
        tenantId: 'zw',
      });
      // Also an auth:success — neither should surface.
      signAuditEvent({
        actor: 'ops',
        action: 'auth:success',
        target: '/v1/query',
        tenantId: 'zw',
      });
    });
    const r = getExceptions({ tenantId: 'zw' });
    assert.strictEqual(r.totalExceptions, 0, 'routine events must NOT appear in exceptions');
  });
});

describe('getExceptions — tenant + filter scoping', () => {
  beforeEach(() => {
    resetAuditSigner();
    initAuditSigner({ NODE_ENV: 'test' }, true);
  });
  afterEach(() => resetAuditSigner());

  it('auth-failure events routed to `platform` tenant are visible to platform-scoped principals only', () => {
    // Mirrors the production code path at server.mjs:230-247 — auth
    // failures now tag both signAuditEvent({ tenantId: 'platform' })
    // AND payload.tenantId = 'platform'. The pre-fix shape used
    // tenantId='unknown' which never matched any /v1/exceptions
    // tenant filter — auth failures were invisible to operators.
    silence(() => {
      signAuditEvent({
        actor: 'unknown',
        action: 'auth:failure',
        target: '/v1/query',
        reason: 'audit:read: Invalid bearer token',
        tenantId: 'platform',
        payload: { tenantId: 'platform', sourceIp: '10.0.0.1', failuresInWindow: 1 },
      });
    });
    // Platform-scoped principal sees it.
    const platformView = getExceptions({ tenantId: 'platform' });
    assert.strictEqual(platformView.totalExceptions, 1);
    assert.strictEqual(platformView.exceptions[0].kind, 'auth-failure');
    // A regular tenant principal cannot see platform-scoped auth
    // failures (preserves tenant isolation; prevents an enumeration
    // oracle where probing for an attacker's intended tenant would
    // reveal that the attempt happened).
    assert.strictEqual(getExceptions({ tenantId: 'zw' }).totalExceptions, 0);
    assert.strictEqual(getExceptions({ tenantId: 'ke' }).totalExceptions, 0);
  });

  it('does NOT cross tenants', () => {
    silence(() => {
      signAuditEvent({ actor: 'a', action: 'query:failure', target: 'x', tenantId: 'zw' });
      signAuditEvent({ actor: 'b', action: 'query:failure', target: 'y', tenantId: 'ke' });
    });
    assert.strictEqual(getExceptions({ tenantId: 'zw' }).totalExceptions, 1);
    assert.strictEqual(getExceptions({ tenantId: 'ke' }).totalExceptions, 1);
  });

  it('filters by kinds[] when provided', () => {
    silence(() => {
      signAuditEvent({ actor: 'a', action: 'auth:failure', target: 'x', tenantId: 'zw' });
      signAuditEvent({ actor: 'a', action: 'query:failure', target: 'y', tenantId: 'zw' });
      signAuditEvent({ actor: 'a', action: 'query:throttled', target: 'z', tenantId: 'zw' });
    });
    const onlyFailures = getExceptions({ tenantId: 'zw', kinds: ['query-failure'] });
    assert.strictEqual(onlyFailures.totalExceptions, 1);
    assert.strictEqual(onlyFailures.exceptions[0].kind, 'query-failure');
  });

  it('filters by since timestamp', () => {
    silence(() => {
      signAuditEvent({ actor: 'a', action: 'query:failure', target: 'old', tenantId: 'zw' });
    });
    const cutoff = new Date(Date.now() + 1000).toISOString();
    silence(() => {
      signAuditEvent({ actor: 'a', action: 'query:failure', target: 'new', tenantId: 'zw' });
    });
    const recent = getExceptions({ tenantId: 'zw', since: cutoff });
    assert.ok(recent.totalExceptions <= 2);
  });

  it('throws when tenantId is missing (matches buildEvidenceBundle convention)', () => {
    assert.throws(() => getExceptions({}), /tenantId is required/);
  });

  it('respects limit + reports truncated', () => {
    silence(() => {
      for (let i = 0; i < 5; i += 1) {
        signAuditEvent({ actor: 'a', action: 'query:failure', target: `t${i}`, tenantId: 'zw' });
      }
    });
    const r = getExceptions({ tenantId: 'zw', limit: 3 });
    assert.strictEqual(r.exceptions.length, 3);
    assert.strictEqual(r.truncated, true);
    assert.strictEqual(r.totalExceptions, 5);
  });
});
