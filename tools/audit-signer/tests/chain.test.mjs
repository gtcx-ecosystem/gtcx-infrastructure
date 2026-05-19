import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  createChain,
  append,
  verifyChain,
  toNdjson,
  fromNdjson,
} from '../src/chain.mjs';
import { generateKeyPair, createRecord, signRecord } from '../src/signer.mjs';

describe('createChain', () => {
  it('starts empty', () => {
    const chain = createChain();
    assert.deepStrictEqual(chain.records, []);
    assert.strictEqual(chain.lastHash, '');
  });
});

describe('append', () => {
  it('adds a record and updates lastHash', () => {
    const { publicKey, privateKey } = generateKeyPair();
    const chain = createChain();
    const record = createRecord({ actor: 'ai-1', action: 'deploy', target: 'cluster-1' });
    const signed = append(chain, record, privateKey, publicKey);
    assert.strictEqual(chain.records.length, 1);
    assert.ok(chain.lastHash);
    assert.strictEqual(signed.signature, chain.records[0].signature);
  });

  it('links records with prevHash', () => {
    const { publicKey, privateKey } = generateKeyPair();
    const chain = createChain();
    const r1 = createRecord({ actor: 'ai-1', action: 'deploy', target: 'cluster-1' });
    append(chain, r1, privateKey, publicKey);
    const firstHash = chain.lastHash;
    const r2 = createRecord({ actor: 'ai-1', action: 'verify', target: 'cluster-1' });
    append(chain, r2, privateKey, publicKey);
    assert.strictEqual(chain.records[1].prevHash, firstHash);
    assert.notStrictEqual(chain.lastHash, firstHash);
  });

  it('returns the signed record', () => {
    const { publicKey, privateKey } = generateKeyPair();
    const chain = createChain();
    const record = createRecord({ actor: 'ai-1', action: 'deploy', target: 'cluster-1' });
    const signed = append(chain, record, privateKey, publicKey);
    assert.ok(signed.signature);
    assert.ok(signed.publicKey);
  });
});

describe('verifyChain', () => {
  it('validates an empty chain', () => {
    const result = verifyChain(createChain());
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.reason, 'empty chain');
  });

  it('validates a single-record chain', () => {
    const { publicKey, privateKey } = generateKeyPair();
    const chain = createChain();
    const record = createRecord({ actor: 'ai-1', action: 'deploy', target: 'cluster-1' });
    append(chain, record, privateKey, publicKey);
    const result = verifyChain(chain);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.firstInvalidIndex, -1);
  });

  it('validates a multi-record chain', () => {
    const { publicKey, privateKey } = generateKeyPair();
    const chain = createChain();
    append(chain, createRecord({ actor: 'ai-1', action: 'deploy', target: 'c1' }), privateKey, publicKey);
    append(chain, createRecord({ actor: 'ai-1', action: 'verify', target: 'c1' }), privateKey, publicKey);
    append(chain, createRecord({ actor: 'ai-1', action: 'rollback', target: 'c1' }), privateKey, publicKey);
    const result = verifyChain(chain);
    assert.strictEqual(result.valid, true);
  });

  it('detects tampered record', () => {
    const { publicKey, privateKey } = generateKeyPair();
    const chain = createChain();
    append(chain, createRecord({ actor: 'ai-1', action: 'deploy', target: 'c1' }), privateKey, publicKey);
    append(chain, createRecord({ actor: 'ai-1', action: 'verify', target: 'c1' }), privateKey, publicKey);
    chain.records[1].action = 'destroy';
    const result = verifyChain(chain);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.firstInvalidIndex, 1);
    assert.ok(result.reason.includes('signature'));
  });

  it('detects broken hash linkage', () => {
    const { publicKey, privateKey } = generateKeyPair();
    const chain = createChain();
    append(chain, createRecord({ actor: 'ai-1', action: 'deploy', target: 'c1' }), privateKey, publicKey);
    append(chain, createRecord({ actor: 'ai-1', action: 'verify', target: 'c1' }), privateKey, publicKey);
    // Tamper with prevHash AND re-sign so signature is still valid
    chain.records[1].prevHash = 'tampered';
    const { signature: _, publicKey: __, ...rest } = chain.records[1];
    const reSigned = signRecord(rest, privateKey, publicKey);
    chain.records[1] = reSigned;
    const result = verifyChain(chain);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.firstInvalidIndex, 1);
    assert.ok(result.reason.includes('prevHash'));
  });

  it('detects invalid signature on first record', () => {
    const { publicKey, privateKey } = generateKeyPair();
    const chain = createChain();
    append(chain, createRecord({ actor: 'ai-1', action: 'deploy', target: 'c1' }), privateKey, publicKey);
    chain.records[0].signature = 'bad';
    const result = verifyChain(chain);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.firstInvalidIndex, 0);
  });
});

describe('toNdjson + fromNdjson', () => {
  it('round-trips a chain', () => {
    const { publicKey, privateKey } = generateKeyPair();
    const chain = createChain();
    append(chain, createRecord({ actor: 'ai-1', action: 'deploy', target: 'c1' }), privateKey, publicKey);
    append(chain, createRecord({ actor: 'ai-1', action: 'verify', target: 'c1' }), privateKey, publicKey);
    const ndjson = toNdjson(chain);
    const restored = fromNdjson(ndjson);
    assert.strictEqual(restored.records.length, 2);
    assert.strictEqual(restored.lastHash, chain.lastHash);
    assert.strictEqual(verifyChain(restored).valid, true);
  });

  it('handles empty chain', () => {
    const chain = createChain();
    const ndjson = toNdjson(chain);
    const restored = fromNdjson(ndjson);
    assert.strictEqual(restored.records.length, 0);
    assert.strictEqual(restored.lastHash, '');
  });

  it('ignores empty lines', () => {
    const restored = fromNdjson('\n\n');
    assert.strictEqual(restored.records.length, 0);
  });
});
