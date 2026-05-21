/**
 * @fileoverview Unit tests for the audit module's hardening contract.
 *
 * Covers:
 *   - Fail-closed semantics in production when no key is provided
 *   - Ephemeral key fallback in non-production
 *   - Successful key load from AUDIT_SIGNING_KEY_B64
 *   - In-memory chain bounding + checkpoint behavior
 *   - getSignerHealth posture reporting
 */

import assert from 'node:assert';
import { generateKeyPairSync } from 'node:crypto';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
  initAuditSigner,
  signAuditEvent,
  getChainState,
  getSignerHealth,
  resetAuditSigner,
} from '../src/audit.mjs';

function freshKeyB64() {
  const { privateKey } = generateKeyPairSync('ed25519');
  const der = privateKey.export({ format: 'der', type: 'pkcs8' });
  return Buffer.from(der).toString('base64');
}

function withQuietConsole(fn) {
  const errOriginal = console.error;
  const logOriginal = console.log;
  const warnOriginal = console.warn;
  console.error = () => {};
  console.log = () => {};
  console.warn = () => {};
  try {
    return fn();
  } finally {
    console.error = errOriginal;
    console.log = logOriginal;
    console.warn = warnOriginal;
  }
}

describe('audit signer initialization', () => {
  beforeEach(() => resetAuditSigner());
  afterEach(() => resetAuditSigner());

  it('refuses to initialize in production without AUDIT_SIGNING_KEY_B64', () => {
    const result = withQuietConsole(() =>
      initAuditSigner({ NODE_ENV: 'production' }, true),
    );
    assert.strictEqual(result.initialized, false);
    assert.match(result.error, /AUDIT_SIGNING_KEY_B64/);
    assert.strictEqual(getSignerHealth().signing, false);
  });

  it('initializes with an ephemeral key in non-production when no key is provided', () => {
    const result = initAuditSigner({ NODE_ENV: 'development' }, true);
    assert.strictEqual(result.initialized, true);
    assert.strictEqual(result.ephemeral, true);
    assert.strictEqual(getSignerHealth().signing, true);
  });

  it('initializes with a configured key in production', () => {
    const keyB64 = freshKeyB64();
    const result = initAuditSigner({ NODE_ENV: 'production', AUDIT_SIGNING_KEY_B64: keyB64 }, true);
    assert.strictEqual(result.initialized, true);
    assert.strictEqual(result.ephemeral, false);
    assert.strictEqual(getSignerHealth().signing, true);
  });

  it('reports a malformed key as a load failure (fail-closed)', () => {
    const result = withQuietConsole(() =>
      initAuditSigner({ NODE_ENV: 'production', AUDIT_SIGNING_KEY_B64: 'not-base64-key' }, true),
    );
    assert.strictEqual(result.initialized, false);
    assert.ok(result.error);
    assert.strictEqual(getSignerHealth().signing, false);
  });
});

describe('audit chain bounding', () => {
  beforeEach(() => {
    resetAuditSigner();
    initAuditSigner({ NODE_ENV: 'development', AUDIT_CHAIN_MAX_RECORDS: '5' }, true);
  });
  afterEach(() => resetAuditSigner());

  it('rolls in-memory window over to checkpoint when MAX_RECORDS exceeded', () => {
    // AUDIT_CHAIN_MAX_RECORDS is read at module load, so this test exercises
    // the default 10K boundary. The contract under test: when the window rolls,
    // recordCount resets, checkpointHash is non-empty, totalRecords keeps growing.
    // We simulate by emitting more records than the configured ceiling.
    for (let i = 0; i < 12_001; i += 1) {
      signAuditEvent({ actor: 'bound-test', action: 'tick', target: `i:${i}` });
    }
    const state = getChainState();
    assert.ok(state.recordCount <= 10_001, `expected ≤ 10001 in-memory records, got ${state.recordCount}`);
    assert.ok(state.totalRecords >= 12_001, `expected ≥ 12001 total records, got ${state.totalRecords}`);
    assert.ok(state.checkpointHash.length > 0, 'expected non-empty checkpointHash after rollover');
  });
});

describe('signerHealth', () => {
  beforeEach(() => resetAuditSigner());
  afterEach(() => resetAuditSigner());

  it('reports not-signing before initialization', () => {
    const health = getSignerHealth();
    assert.strictEqual(health.signing, false);
  });

  it('reports signing after successful initialization', () => {
    initAuditSigner({ NODE_ENV: 'test' }, true);
    const health = getSignerHealth();
    assert.strictEqual(health.signing, true);
    assert.ok(health.maxInMemoryRecords > 0);
  });
});
