import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  generateKeyPair,
  canonicalize,
  hashCanonical,
  signRecord,
  verifyRecord,
  createRecord,
} from '../03-platform/src/signer.mjs';

describe('generateKeyPair', () => {
  it('produces a valid Ed25519 key pair', () => {
    const pair = generateKeyPair();
    const pubDer = pair.publicKey.export({ type: 'spki', format: 'der' });
    const privDer = pair.privateKey.export({ type: 'pkcs8', format: 'der' });
    assert.ok(pubDer.length >= 32);
    assert.ok(privDer.length >= 32);
  });

  it('produces different keys each time', () => {
    const a = generateKeyPair();
    const b = generateKeyPair();
    assert.notDeepStrictEqual(a.publicKey, b.publicKey);
    assert.notDeepStrictEqual(a.privateKey, b.privateKey);
  });
});

describe('canonicalize', () => {
  it('orders fields deterministically', () => {
    const rec = { action: 'deploy', actor: 'ai-1', id: 'abc', timestamp: 't', target: 'prod' };
    const c1 = canonicalize(rec);
    const c2 = canonicalize(rec);
    assert.strictEqual(c1, c2);
    assert.ok(c1.indexOf('id') < c1.indexOf('timestamp'));
    assert.ok(c1.indexOf('timestamp') < c1.indexOf('actor'));
  });

  it('omits undefined optional fields', () => {
    const rec = { id: 'a', timestamp: 't', actor: 'x', action: 'y', target: 'z' };
    const c = canonicalize(rec);
    assert.ok(!c.includes('reason'));
    assert.ok(!c.includes('payloadHash'));
    assert.ok(!c.includes('prevHash'));
  });

  it('includes optional fields when present', () => {
    const rec = {
      id: 'a', timestamp: 't', actor: 'x', action: 'y', target: 'z',
      reason: 'ticket-123', payloadHash: 'h', prevHash: 'p',
    };
    const c = canonicalize(rec);
    assert.ok(c.includes('reason'));
    assert.ok(c.includes('payloadHash'));
    assert.ok(c.includes('prevHash'));
  });
});

describe('hashCanonical', () => {
  it('produces consistent hashes', () => {
    const h1 = hashCanonical('test');
    const h2 = hashCanonical('test');
    assert.strictEqual(h1, h2);
  });

  it('produces different hashes for different inputs', () => {
    const h1 = hashCanonical('a');
    const h2 = hashCanonical('b');
    assert.notStrictEqual(h1, h2);
  });
});

describe('signRecord + verifyRecord', () => {
  it('round-trips a signed record', () => {
    const { publicKey, privateKey } = generateKeyPair();
    const record = createRecord({ actor: 'ai-1', action: 'deploy', target: 'cluster-1' });
    const signed = signRecord(record, privateKey, publicKey);
    assert.ok(signed.signature);
    assert.ok(signed.publicKey);
    assert.strictEqual(verifyRecord(signed), true);
  });

  it('detects tampered record', () => {
    const { publicKey, privateKey } = generateKeyPair();
    const record = createRecord({ actor: 'ai-1', action: 'deploy', target: 'cluster-1' });
    const signed = signRecord(record, privateKey, publicKey);
    signed.action = 'destroy';
    assert.strictEqual(verifyRecord(signed), false);
  });

  it('detects tampered signature', () => {
    const { publicKey, privateKey } = generateKeyPair();
    const record = createRecord({ actor: 'ai-1', action: 'deploy', target: 'cluster-1' });
    const signed = signRecord(record, privateKey, publicKey);
    signed.signature = 'a'.repeat(64);
    assert.strictEqual(verifyRecord(signed), false);
  });

  it('detects wrong public key', () => {
    const { publicKey, privateKey } = generateKeyPair();
    const other = generateKeyPair();
    const record = createRecord({ actor: 'ai-1', action: 'deploy', target: 'cluster-1' });
    const signed = signRecord(record, privateKey, publicKey);
    signed.publicKey = other.publicKey.toString('base64');
    assert.strictEqual(verifyRecord(signed), false);
  });

  it('verifies record with payload and reason', () => {
    const { publicKey, privateKey } = generateKeyPair();
    const record = createRecord({
      actor: 'ai-1',
      action: 'approve',
      target: 'trade-42',
      reason: 'SRE-oncall',
      payload: { amount: 100 },
    });
    const signed = signRecord(record, privateKey, publicKey);
    assert.strictEqual(verifyRecord(signed), true);
    assert.ok(signed.payloadHash);
  });

  it('verifies record with prevHash', () => {
    const { publicKey, privateKey } = generateKeyPair();
    const record = createRecord({
      actor: 'ai-1',
      action: 'deploy',
      target: 'cluster-1',
      prevHash: 'abc123',
    });
    const signed = signRecord(record, privateKey, publicKey);
    assert.strictEqual(verifyRecord(signed), true);
  });
});

describe('createRecord', () => {
  it('creates a record with required fields', () => {
    const r = createRecord({ actor: 'ai-1', action: 'deploy', target: 'cluster-1' });
    assert.ok(r.id);
    assert.ok(r.timestamp);
    assert.strictEqual(r.actor, 'ai-1');
    assert.strictEqual(r.action, 'deploy');
    assert.strictEqual(r.target, 'cluster-1');
  });

  it('throws when actor missing', () => {
    assert.throws(() => createRecord({ action: 'deploy', target: 'x' }), /actor, action, and target are required/);
  });

  it('throws when action missing', () => {
    assert.throws(() => createRecord({ actor: 'x', target: 'y' }), /actor, action, and target are required/);
  });

  it('throws when target missing', () => {
    assert.throws(() => createRecord({ actor: 'x', action: 'y' }), /actor, action, and target are required/);
  });

  it('throws when all missing', () => {
    assert.throws(() => createRecord({}), /actor, action, and target are required/);
  });

  it('uses custom now', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const r = createRecord({ actor: 'x', action: 'y', target: 'z', now });
    assert.strictEqual(r.timestamp, '2026-01-01T00:00:00.000Z');
  });

  it('computes payload hash when payload provided', () => {
    const r = createRecord({ actor: 'x', action: 'y', target: 'z', payload: { a: 1 } });
    assert.ok(r.payloadHash);
    assert.strictEqual(typeof r.payloadHash, 'string');
  });

  it('includes prevHash when provided', () => {
    const r = createRecord({ actor: 'x', action: 'y', target: 'z', prevHash: 'prev' });
    assert.strictEqual(r.prevHash, 'prev');
  });
});
