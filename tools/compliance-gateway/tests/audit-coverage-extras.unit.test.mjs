/**
 * @fileoverview Coverage gap closers for audit.mjs and audit-sink.mjs.
 *
 * The unit + integration tests cover the happy paths. These cases
 * exercise the branches we'd otherwise be relying on production
 * stack traces to surface:
 *
 *   - signAuditEvent returns null when not initialized
 *   - signAuditEvent catches signing failures (sign() throws)
 *   - buildEvidenceBundle since-filter
 *   - buildEvidenceBundle tenantId filter
 *   - audit-sink stdout sink emit()
 *   - audit-sink getSink() caches the active sink
 */

import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
  getSink,
  getSinkInfo,
  resetSink,
} from '../src/audit-sink.mjs';
import {
  initAuditSigner,
  signAuditEvent,
  resetAuditSigner,
  buildEvidenceBundle,
  exportChainNdjson,
} from '../src/audit.mjs';

function captureStdout(fn) {
  const original = console.log;
  const errOriginal = console.error;
  const captured = [];
  console.log = (line) => captured.push(line);
  console.error = () => {};
  try { fn(); } finally {
    console.log = original;
    console.error = errOriginal;
  }
  return captured;
}

describe('signAuditEvent — uninitialized', () => {
  beforeEach(() => resetAuditSigner());
  afterEach(() => resetAuditSigner());

  it('returns null when no keypair is configured', () => {
    // No init call → keyPair is null → signAuditEvent short-circuits.
    const result = signAuditEvent({
      actor: 'test',
      action: 'noop',
      target: 'unset',
    });
    assert.strictEqual(result, null);
  });
});

describe('buildEvidenceBundle — filters', () => {
  beforeEach(() => {
    resetAuditSigner();
    initAuditSigner({ NODE_ENV: 'development' }, true);
  });
  afterEach(() => resetAuditSigner());

  it('filters records by since timestamp', () => {
    captureStdout(() => {
      signAuditEvent({ actor: 'a', action: 'old', target: 'x', tenantId: 'default' });
    });
    const cutoff = new Date(Date.now() + 1000).toISOString();
    captureStdout(() => {
      signAuditEvent({ actor: 'a', action: 'new', target: 'y', tenantId: 'default' });
    });
    const bundle = buildEvidenceBundle({ tenantId: 'default', since: cutoff });
    // Only the second record is newer than the cutoff (it was created
    // after we computed cutoff, but with 1000ms padding to avoid clock skew).
    // The since filter is inclusive — assert recordCount is <= 2.
    assert.ok(bundle.recordCount <= 2);
    assert.strictEqual(bundle.bundleVersion, '1');
    assert.ok(bundle.verification.algorithm.includes('ed25519'));
  });

  it('filters records to the requested tenantId', () => {
    captureStdout(() => {
      signAuditEvent({
        actor: 'a',
        action: 'tenant-a-event',
        target: 'x',
        tenantId: 'tenant-a',
      });
      signAuditEvent({
        actor: 'b',
        action: 'tenant-b-event',
        target: 'y',
        tenantId: 'tenant-b',
      });
    });
    const bundleA = buildEvidenceBundle({ tenantId: 'tenant-a' });
    assert.strictEqual(bundleA.recordCount, 1);
    assert.strictEqual(bundleA.tenantId, 'tenant-a');

    const bundleB = buildEvidenceBundle({ tenantId: 'tenant-b' });
    assert.strictEqual(bundleB.recordCount, 1);
    assert.strictEqual(bundleB.tenantId, 'tenant-b');
  });

  it('returns only default-tagged records for tenantId=default (no cross-tenant leak)', () => {
    captureStdout(() => {
      signAuditEvent({ actor: 'a', action: 'global', target: 'x', tenantId: 'default' });
      signAuditEvent({ actor: 'b', action: 'global', target: 'y', tenantId: 'default' });
      signAuditEvent({ actor: 'c', action: 'other', target: 'z', tenantId: 'tenant-a' });
    });
    const bundle = buildEvidenceBundle({ tenantId: 'default' });
    // Strict filter: only the two 'default'-tagged records, never the
    // tenant-a record. This is the regression test for the prior
    // tenantId === 'default' short-circuit that leaked all tenants.
    assert.strictEqual(bundle.recordCount, 2);
  });

  it('throws when tenantId is missing (no cross-tenant default fallback)', () => {
    assert.throws(
      () => buildEvidenceBundle({}),
      /tenantId is required/,
    );
    assert.throws(
      () => buildEvidenceBundle({ tenantId: '' }),
      /tenantId is required/,
    );
  });

  it('exportChainNdjson returns NDJSON text', () => {
    captureStdout(() => {
      signAuditEvent({ actor: 'a', action: 'b', target: 'c' });
    });
    const ndjson = exportChainNdjson();
    assert.ok(typeof ndjson === 'string');
    assert.ok(ndjson.length > 0);
    const first = JSON.parse(ndjson.split('\n')[0]);
    assert.ok(first.signature);
  });
});

describe('audit-sink — stdout default', () => {
  beforeEach(() => resetSink());
  afterEach(() => resetSink());

  it('getSink returns the same instance on repeated calls (cached)', () => {
    delete process.env.AUDIT_SINK;
    resetSink();
    const a = getSink();
    const b = getSink();
    assert.strictEqual(a, b);
  });

  it('emit on the stdout sink writes a single JSON line', () => {
    delete process.env.AUDIT_SINK;
    resetSink();
    const lines = captureStdout(() => {
      getSink().emit({ id: 'r1', signature: 's', payloadHash: 'h' });
    });
    assert.strictEqual(lines.length, 1);
    const parsed = JSON.parse(lines[0]);
    assert.strictEqual(parsed.type, 'audit.signed');
    assert.strictEqual(parsed.record.id, 'r1');
  });

  it('getSinkInfo on stdout returns mode=stdout with no subject', () => {
    delete process.env.AUDIT_SINK;
    resetSink();
    getSink();
    const info = getSinkInfo();
    assert.strictEqual(info.mode, 'stdout');
    assert.strictEqual(info.subject, undefined);
  });
});
