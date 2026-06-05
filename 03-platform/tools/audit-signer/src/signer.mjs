/**
 * Audit record signer for consequential AI flows.
 *
 * Algorithm: Ed25519 (default) or ECDSA P-256 (FIPS 140-3 mode).
 */

import { createHash, randomBytes, sign, verify, generateKeyPairSync, createPublicKey } from 'node:crypto';

import { signingAlgorithm, fipsCurve, assertFipsDigest } from './fips-mode.mjs';

/**
 * @typedef {object} SignedAuditRecord
 * @property {string} id
 * @property {string} timestamp
 * @property {string} actor
 * @property {string} action
 * @property {string} target
 * @property {string} [reason]
 * @property {string} [payloadHash]
 * @property {string} [prevHash]
 * @property {string} signature
 * @property {string} publicKey
 */

const ALGORITHM = signingAlgorithm();
const CURVE = fipsCurve();

/**
 * Generate a new key pair.
 * @returns {{ publicKey: import('node:crypto').KeyObject; privateKey: import('node:crypto').KeyObject }}
 */
export function generateKeyPair() {
  if (ALGORITHM === 'ec') {
    return generateKeyPairSync(ALGORITHM, { namedCurve: CURVE });
  }
  return generateKeyPairSync(ALGORITHM);
}

/**
 * Serialize a record into a deterministic string for signing.
 * @param {Omit<SignedAuditRecord, 'signature' | 'publicKey'>} record
 * @returns {string}
 */
export function canonicalize(record) {
  const ordered = {
    id: record.id,
    timestamp: record.timestamp,
    actor: record.actor,
    action: record.action,
    target: record.target,
  };
  if (record.reason !== undefined) ordered.reason = record.reason;
  if (record.payloadHash !== undefined) ordered.payloadHash = record.payloadHash;
  if (record.prevHash !== undefined) ordered.prevHash = record.prevHash;
  return JSON.stringify(ordered);
}

/**
 * Hash a canonicalized record.
 * @param {string} canonical
 * @returns {string}
 */
export function hashCanonical(canonical) {
  assertFipsDigest('sha256');
  return createHash('sha256').update(canonical).digest('base64');
}

/**
 * Sign an audit record.
 * @param {Omit<SignedAuditRecord, 'signature' | 'publicKey'>} record
 * @param {import('node:crypto').KeyObject} privateKey
 * @param {import('node:crypto').KeyObject} publicKey
 * @returns {SignedAuditRecord}
 */
export function signRecord(record, privateKey, publicKey) {
  const canonical = canonicalize(record);
  const sig = sign(ALGORITHM === 'ec' ? 'sha256' : null, Buffer.from(canonical, 'utf8'), privateKey);
  const pubDer = publicKey.export({ type: 'spki', format: 'der' });
  return {
    ...record,
    signature: sig.toString('base64'),
    publicKey: pubDer.toString('base64'),
  };
}

/**
 * Verify a signed audit record.
 * @param {SignedAuditRecord} record
 * @returns {boolean}
 */
export function verifyRecord(record) {
  try {
    const { signature, publicKey: pubB64, ...rest } = record;
    const canonical = canonicalize(rest);
    const pubKey = createPublicKey({
      key: Buffer.from(pubB64, 'base64'),
      format: 'der',
      type: 'spki',
    });
    return verify(
      ALGORITHM === 'ec' ? 'sha256' : null,
      Buffer.from(canonical, 'utf8'),
      pubKey,
      Buffer.from(signature, 'base64')
    );
  } catch {
    return false;
  }
}

/**
 * Create a new audit record with auto-generated ID and timestamp.
 * @param {object} params
 * @param {string} params.actor
 * @param {string} params.action
 * @param {string} params.target
 * @param {string} [params.reason]
 * @param {unknown} [params.payload]
 * @param {string} [params.prevHash]
 * @param {Date} [params.now]
 * @returns {Omit<SignedAuditRecord, 'signature' | 'publicKey'>}
 */
export function createRecord({
  actor,
  action,
  target,
  reason,
  payload,
  prevHash,
  now = new Date(),
}) {
  if (!actor || !action || !target) {
    throw new Error('actor, action, and target are required');
  }
  const id = randomBytes(16).toString('hex');
  const timestamp = now.toISOString();
  const record = {
    id,
    timestamp,
    actor,
    action,
    target,
  };
  if (reason !== undefined) record.reason = reason;
  if (payload !== undefined) {
    assertFipsDigest('sha256');
    record.payloadHash = createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('base64');
  }
  if (prevHash !== undefined) record.prevHash = prevHash;
  return record;
}
