/**
 * @fileoverview Unit tests for the batch flusher's verification + routing logic.
 *
 * These exercise the pure parts of the sidecar — verification, tenant
 * grouping (from JetStream subject), quarantine routing — without
 * touching NATS or S3.
 */

import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
  generateKeyPair,
  createChain,
  createRecord,
  append,
} from '@gtcx/audit-signer';

import { _resetForTests as resetS3 } from '../03-platform/src/s3-uploader.mjs';

// Set required env BEFORE importing the index so its startup guard
// doesn't fire process.exit during module load. AUDIT_S3_ALLOW_STUB=1
// permits the no-op S3 client in this unit-test environment where
// @aws-sdk/client-s3 may not be installed. Production must fail closed.
process.env.AUDIT_S3_BUCKET = 'gtcx-test-bucket';
process.env.NODE_ENV = 'test';
process.env.AUDIT_S3_ALLOW_STUB = '1';
const { flushBatch, tenantFromSubject } = await import('../03-platform/src/index.mjs');

function makeChainEnvelopes(count, subject = 'gtcx.audit.compliance-gateway.pilot') {
  const { privateKey, publicKey } = generateKeyPair();
  const chain = createChain();
  const envelopes = [];
  for (let i = 0; i < count; i += 1) {
    const record = createRecord({ actor: 'test', action: 'unit', target: `r${i}` });
    const signed = append(chain, record, privateKey, publicKey);
    envelopes.push({ record: signed, subject });
  }
  return envelopes;
}

describe('tenantFromSubject', () => {
  it('returns the last segment for a per-tenant subject', () => {
    assert.strictEqual(tenantFromSubject('gtcx.audit.compliance-gateway.pilot'), 'pilot');
    assert.strictEqual(tenantFromSubject('gtcx.audit.compliance-gateway.rbz-pilot'), 'rbz-pilot');
  });

  it('returns "default" for a bare service subject', () => {
    assert.strictEqual(tenantFromSubject('gtcx.audit.compliance-gateway'), 'default');
  });

  it('returns "unknown" for malformed or empty subjects', () => {
    assert.strictEqual(tenantFromSubject(''), 'unknown');
    assert.strictEqual(tenantFromSubject(undefined), 'unknown');
    assert.strictEqual(tenantFromSubject('foo'), 'unknown');
  });

  it('returns "default" if the 4th segment is not kebab-case (defensive)', () => {
    assert.strictEqual(tenantFromSubject('gtcx.audit.compliance-gateway.NOT_VALID'), 'default');
  });
});

describe('flushBatch — verification', () => {
  beforeEach(() => resetS3());
  afterEach(() => resetS3());

  it('writes a valid chain under the tenant prefix derived from subject', async () => {
    const envelopes = makeChainEnvelopes(5, 'gtcx.audit.compliance-gateway.pilot');
    const calls = [];
    const result = await flushBatch(envelopes, {
      putBatch: async (_client, _bucket, key, recs) => {
        calls.push({ key, count: recs.length });
        return { key, size: 0 };
      },
    });
    assert.strictEqual(result.written, 5);
    assert.strictEqual(result.quarantined, 0);
    assert.strictEqual(calls.length, 1);
    assert.match(calls[0].key, /^tenant=pilot\//);
  });

  it('quarantines a tampered batch', async () => {
    const envelopes = makeChainEnvelopes(3, 'gtcx.audit.compliance-gateway.pilot');
    envelopes[1].record.target = 'tampered';

    const calls = [];
    const result = await flushBatch(envelopes, {
      putBatch: async (_client, _bucket, key, recs, metadata) => {
        calls.push({ key, count: recs.length, metadata });
        return { key, size: 0 };
      },
    });
    assert.strictEqual(result.written, 0);
    assert.strictEqual(result.quarantined, 3);
    assert.strictEqual(calls.length, 1);
    assert.match(calls[0].key, /^_quarantine\//);
    assert.strictEqual(calls[0].metadata.reason, 'chain-verification-failed');
  });

  it('routes default subject to tenant=default prefix', async () => {
    const envelopes = makeChainEnvelopes(2, 'gtcx.audit.compliance-gateway');
    const calls = [];
    const result = await flushBatch(envelopes, {
      putBatch: async (_c, _b, key, recs) => {
        calls.push({ key, count: recs.length });
        return { key, size: 0 };
      },
    });
    assert.strictEqual(result.written, 2);
    assert.match(calls[0].key, /^tenant=default\//);
  });

  it('returns zero for an empty batch without calling putBatch', async () => {
    let called = false;
    const result = await flushBatch([], {
      putBatch: async () => { called = true; return {}; },
    });
    assert.strictEqual(result.written, 0);
    assert.strictEqual(result.quarantined, 0);
    assert.strictEqual(called, false);
  });

  it('quarantines on JSON-shape failure (records that cannot be re-parsed as a chain)', async () => {
    const envelopes = [{
      record: { id: 'broken', not: 'a valid signed record' },
      subject: 'gtcx.audit.compliance-gateway.pilot',
    }];
    const calls = [];
    const result = await flushBatch(envelopes, {
      putBatch: async (_c, _b, key, recs, metadata) => {
        calls.push({ key, recs, metadata });
        return { key, size: 0 };
      },
    });
    assert.strictEqual(result.quarantined, 1);
    assert.match(calls[0].key, /^_quarantine\//);
  });
});
