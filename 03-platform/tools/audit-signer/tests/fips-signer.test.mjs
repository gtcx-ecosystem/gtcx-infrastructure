/**
 * @fileoverview Signer tests in FIPS 140-3 mode (ECDSA P-256).
 *
 * IMPORTANT: ES module imports are hoisted, so we must use dynamic
 * import() after setting GTCX_FIPS_MODE=1. In production, the env
 * var is set at process startup before any modules load.
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

// Set FIPS mode BEFORE dynamically importing the signer module.
process.env.GTCX_FIPS_MODE = '1';
const { generateKeyPair, signRecord, verifyRecord, createRecord } = await import('../03-platform/src/signer.mjs');

describe('FIPS mode signer — ECDSA P-256', () => {
  it('generates an ECDSA key pair', () => {
    const kp = generateKeyPair();
    assert.ok(kp.publicKey);
    assert.ok(kp.privateKey);
    // ECDSA P-256 keys are ~91 bytes in SPKI DER format; Ed25519 are ~44 bytes
    const pubDer = kp.publicKey.export({ type: 'spki', format: 'der' });
    assert.ok(pubDer.length > 80, `expected ECDSA P-256 SPKI > 80 bytes, got ${pubDer.length}`);
  });

  it('round-trips a signed record', () => {
    const kp = generateKeyPair();
    const record = createRecord({ actor: 'a', action: 'test', target: 't' });
    const signed = signRecord(record, kp.privateKey, kp.publicKey);
    assert.ok(signed.signature);
    assert.ok(signed.publicKey);
    assert.strictEqual(verifyRecord(signed), true);
  });

  it('detects tampered record in FIPS mode', () => {
    const kp = generateKeyPair();
    const record = createRecord({ actor: 'a', action: 'test', target: 't' });
    const signed = signRecord(record, kp.privateKey, kp.publicKey);
    signed.actor = 'evil';
    assert.strictEqual(verifyRecord(signed), false);
  });

  it('chains multiple records with prevHash', () => {
    const kp = generateKeyPair();
    const r1 = createRecord({ actor: 'a', action: 'open', target: 't' });
    const s1 = signRecord(r1, kp.privateKey, kp.publicKey);

    const r2 = createRecord({ actor: 'a', action: 'close', target: 't', prevHash: s1.signature });
    const s2 = signRecord(r2, kp.privateKey, kp.publicKey);

    assert.strictEqual(verifyRecord(s1), true);
    assert.strictEqual(verifyRecord(s2), true);
  });
});
