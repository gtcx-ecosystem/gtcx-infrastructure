/**
 * @fileoverview End-to-end audit chain integration test.
 *
 * Composition contract under test:
 *
 *   gateway requestPermission → signAuditEvent → audit-sink emit
 *     → (captured via stdout) → fromNdjson → verifyChain → valid
 *
 * Every previous test exercised one hop in isolation. This is the
 * test that proves the hops actually compose. If the gateway's audit
 * event format and the audit-flush sidecar's verifyChain ever drift,
 * this test catches it.
 *
 * Uses the stdout sink (default) instead of NATS so the test runs
 * without infrastructure. The NATS integration test at
 * 03-platform/tools/audit-flush/test/run-integration.mjs covers the broker hop;
 * this test covers the application hop.
 */

import assert from 'node:assert';
import { generateKeyPairSync } from 'node:crypto';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { verifyChain, fromNdjson } from '@gtcx/audit-signer';

import {
  initAuditSigner,
  signAuditEvent,
  resetAuditSigner,
} from '../src/audit.mjs';

function freshKeyB64() {
  const { privateKey } = generateKeyPairSync('ed25519');
  const der = privateKey.export({ format: 'der', type: 'pkcs8' });
  return Buffer.from(der).toString('base64');
}

function captureStdout(fn) {
  const original = console.log;
  const errOriginal = console.error;
  const captured = [];
  console.log = (line) => captured.push(line);
  console.error = () => {};
  try {
    fn();
  } finally {
    console.log = original;
    console.error = errOriginal;
  }
  return captured;
}

function parseEmittedRecords(lines) {
  const records = [];
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.type === 'audit.signed' && parsed.record) {
        records.push(parsed.record);
      }
    } catch { /* skip non-JSON */ }
  }
  return records;
}

describe('end-to-end audit chain', () => {
  beforeEach(() => {
    delete process.env.AUDIT_SINK;
    resetAuditSigner();
  });
  afterEach(() => {
    resetAuditSigner();
    delete process.env.AUDIT_SIGNING_KEY_B64;
  });

  it('full lifecycle: 10 signed events round-trip through stdout sink and verify cleanly', () => {
    process.env.AUDIT_SIGNING_KEY_B64 = freshKeyB64();
    initAuditSigner(process.env, true);

    const lines = captureStdout(() => {
      for (let i = 0; i < 10; i += 1) {
        signAuditEvent({
          actor: 'e2e-test',
          action: i % 3 === 0 ? 'auth:success' : 'query:success',
          target: `/v1/test/${i}`,
          payload: { tenantId: 'e2e', idx: i, provider: 'mock' },
        });
      }
    });

    const records = parseEmittedRecords(lines);
    assert.strictEqual(records.length, 10);

    // Reconstruct + verify the same way audit-flush does it.
    const ndjson = records.map((r) => JSON.stringify(r)).join('\n');
    const reconstructed = fromNdjson(ndjson);
    const verification = verifyChain(reconstructed);

    assert.strictEqual(verification.valid, true);
    assert.strictEqual(verification.firstInvalidIndex, -1);
  });

  it('mixed action types maintain chain integrity', () => {
    process.env.AUDIT_SIGNING_KEY_B64 = freshKeyB64();
    initAuditSigner(process.env, true);

    const actions = [
      { action: 'auth:success', payload: { permission: 'query:read' } },
      { action: 'query:success', payload: { provider: 'claude-haiku' } },
      { action: 'auth:failure', reason: 'invalid token' },
      { action: 'query:throttled', reason: 'budget exceeded' },
      { action: 'resilience.policy.adaptation', payload: { previous: 'auto', next: 'reduced' } },
      { action: 'query:failure', payload: { status: 502 } },
    ];

    const lines = captureStdout(() => {
      for (const a of actions) {
        signAuditEvent({
          actor: 'mixed-test',
          action: a.action,
          target: '/v1/test',
          reason: a.reason,
          payload: a.payload,
        });
      }
    });

    const records = parseEmittedRecords(lines);
    assert.strictEqual(records.length, actions.length);

    const reconstructed = fromNdjson(records.map((r) => JSON.stringify(r)).join('\n'));
    assert.strictEqual(verifyChain(reconstructed).valid, true);
  });

  it('tampering a record after emit produces verifiable failure with correct firstInvalidIndex', () => {
    process.env.AUDIT_SIGNING_KEY_B64 = freshKeyB64();
    initAuditSigner(process.env, true);

    const lines = captureStdout(() => {
      for (let i = 0; i < 5; i += 1) {
        signAuditEvent({
          actor: 'tamper-test',
          action: 'query:success',
          target: `/v1/test/${i}`,
        });
      }
    });

    const records = parseEmittedRecords(lines);

    // Tamper with record index 2 (in the middle of the chain).
    records[2].target = 'TAMPERED';
    const ndjson = records.map((r) => JSON.stringify(r)).join('\n');
    const verification = verifyChain(fromNdjson(ndjson));

    assert.strictEqual(verification.valid, false);
    assert.strictEqual(verification.firstInvalidIndex, 2);
  });

  it('omitting a record produces chain-link failure (audit-flush would quarantine)', () => {
    process.env.AUDIT_SIGNING_KEY_B64 = freshKeyB64();
    initAuditSigner(process.env, true);

    const lines = captureStdout(() => {
      for (let i = 0; i < 5; i += 1) {
        signAuditEvent({
          actor: 'omit-test',
          action: 'query:success',
          target: `/v1/test/${i}`,
        });
      }
    });

    const records = parseEmittedRecords(lines);
    // Drop index 2 — simulating a message lost in transport.
    const truncated = [...records.slice(0, 2), ...records.slice(3)];
    const ndjson = truncated.map((r) => JSON.stringify(r)).join('\n');
    const verification = verifyChain(fromNdjson(ndjson));

    assert.strictEqual(verification.valid, false);
    // The drop is detected at the index where prevHash no longer matches.
    assert.ok(verification.firstInvalidIndex >= 1);
  });

  it('every emitted record carries the signer publicKey (no keystore lookup needed)', () => {
    process.env.AUDIT_SIGNING_KEY_B64 = freshKeyB64();
    initAuditSigner(process.env, true);

    const lines = captureStdout(() => {
      signAuditEvent({ actor: 'pk', action: 'test', target: 'self' });
    });

    const records = parseEmittedRecords(lines);
    assert.strictEqual(records.length, 1);
    assert.ok(records[0].publicKey, 'publicKey must be present on every record');
    assert.ok(records[0].signature, 'signature must be present');
    assert.ok(/^[A-Za-z0-9+/=]+$/.test(records[0].publicKey), 'publicKey must be base64');
  });

  it('chain links across many sign calls (prevHash chains forward)', () => {
    process.env.AUDIT_SIGNING_KEY_B64 = freshKeyB64();
    initAuditSigner(process.env, true);

    const lines = captureStdout(() => {
      for (let i = 0; i < 50; i += 1) {
        signAuditEvent({ actor: 'chain', action: 'tick', target: String(i) });
      }
    });

    const records = parseEmittedRecords(lines);
    assert.strictEqual(records.length, 50);

    // Every record except the genesis has a non-empty prevHash.
    for (let i = 1; i < records.length; i += 1) {
      assert.ok(records[i].prevHash && records[i].prevHash.length > 0,
        `record ${i} missing prevHash`);
    }

    // Full chain verifies.
    const reconstructed = fromNdjson(records.map((r) => JSON.stringify(r)).join('\n'));
    assert.strictEqual(verifyChain(reconstructed).valid, true);
  });
});
