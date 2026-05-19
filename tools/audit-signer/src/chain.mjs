/**
 * Append-only signed audit chain for consequential AI flows.
 *
 * Maintains a hash-linked chain of signed records. Tampering with
 * any record breaks the chain, detectable during verification.
 */

import { createHash } from 'node:crypto';
import { signRecord, verifyRecord, createRecord, hashCanonical, canonicalize } from './signer.mjs';

/**
 * @typedef {object} AuditChain
 * @property {import('./signer.mjs').SignedAuditRecord[]} records
 * @property {string} lastHash
 */

/**
 * Create an empty audit chain.
 *
 * @returns {AuditChain}
 */
export function createChain() {
  return { records: [], lastHash: '' };
}

/**
 * Append a record to the chain.
 *
 * @param {AuditChain} chain
 * @param {Omit<import('./signer.mjs').SignedAuditRecord, 'signature' | 'publicKey'>} record
 * @param {Buffer} privateKey
 * @param {Buffer} publicKey
 * @returns {import('./signer.mjs').SignedAuditRecord}
 */
export function append(chain, record, privateKey, publicKey) {
  if (chain.lastHash) {
    record.prevHash = chain.lastHash;
  }
  const signed = signRecord(record, privateKey, publicKey);
  chain.records.push(signed);
  chain.lastHash = hashCanonical(canonicalize(record));
  return signed;
}

/**
 * Verify the integrity of the entire chain.
 *
 * @param {AuditChain} chain
 * @returns {{ valid: boolean; firstInvalidIndex: number; reason: string }}
 */
export function verifyChain(chain) {
  if (!chain.records || chain.records.length === 0) {
    return { valid: true, firstInvalidIndex: -1, reason: 'empty chain' };
  }

  let expectedPrevHash = '';

  for (let i = 0; i < chain.records.length; i++) {
    const record = chain.records[i];

    // Verify Ed25519 signature
    if (!verifyRecord(record)) {
      return { valid: false, firstInvalidIndex: i, reason: `record ${i} signature invalid` };
    }

    // Verify hash linkage
    if (expectedPrevHash && record.prevHash !== expectedPrevHash) {
      return {
        valid: false,
        firstInvalidIndex: i,
        reason: `record ${i} prevHash mismatch (expected ${expectedPrevHash}, got ${record.prevHash})`,
      };
    }

    // Compute this record's hash for next iteration
    const { signature, publicKey, ...rest } = record;
    expectedPrevHash = hashCanonical(canonicalize(rest));
  }

  return { valid: true, firstInvalidIndex: -1, reason: 'all records valid' };
}

/**
 * Export the chain as newline-delimited JSON (NDJSON).
 *
 * @param {AuditChain} chain
 * @returns {string}
 */
export function toNdjson(chain) {
  return chain.records.map((r) => JSON.stringify(r)).join('\n') + '\n';
}

/**
 * Import a chain from NDJSON.
 *
 * @param {string} ndjson
 * @returns {AuditChain}
 */
export function fromNdjson(ndjson) {
  const lines = ndjson.split('\n').filter((l) => l.trim());
  const records = lines.map((l) => JSON.parse(l));
  const lastHash = records.length > 0
    ? hashCanonical(
        canonicalize(
          (({ signature, publicKey, ...rest }) => rest)(records[records.length - 1])
        )
      )
    : '';
  return { records, lastHash };
}
