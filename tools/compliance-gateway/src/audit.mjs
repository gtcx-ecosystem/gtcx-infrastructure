/**
 * @fileoverview Audit-signer integration for compliance-gateway.
 *
 * Cryptographically signs consequential events and maintains a
 * hash-linked chain. Events are flushed to stdout as NDJSON.
 */

import { createPrivateKey, createPublicKey } from 'node:crypto';
import {
  createRecord,
  createChain,
  append,
  verifyChain,
  toNdjson,
  fromNdjson,
  generateKeyPair,
} from '../../audit-signer/src/index.mjs';

let keyPair = null;
const chain = createChain();
let initialized = false;

/**
 * Initialize the audit signer from environment.
 *
 * @param {NodeJS.ProcessEnv} [env=process.env]
 * @returns {{ initialized: boolean; ephemeral: boolean; error?: string }}
 */
export function initAuditSigner(env = process.env, force = false) {
  if (initialized && !force) {
    return { initialized: true, ephemeral: keyPair === null };
  }

  const keyB64 = env.AUDIT_SIGNING_KEY_B64;
  if (keyB64) {
    try {
      const privateKey = createPrivateKey({
        key: Buffer.from(keyB64, 'base64'),
        format: 'der',
        type: 'pkcs8',
      });
      const publicKey = createPublicKey(privateKey);
      keyPair = { privateKey, publicKey };
      initialized = true;
      return { initialized: true, ephemeral: false };
    } catch (err) {
      console.error(JSON.stringify({
        level: 'error',
        type: 'audit.signer.keyLoadFailed',
        error: err.message,
      }));
      keyPair = null;
      initialized = true;
      return { initialized: false, ephemeral: false, error: err.message };
    }
  }

  const nodeEnv = env.NODE_ENV || 'development';
  if (nodeEnv !== 'production') {
    keyPair = generateKeyPair();
    initialized = true;
    return { initialized: true, ephemeral: true };
  }

  console.warn(JSON.stringify({
    level: 'warn',
    type: 'audit.signer.noKey',
    message: 'AUDIT_SIGNING_KEY_B64 not set in production; audit records will not be signed',
  }));
  initialized = true;
  return { initialized: false, ephemeral: false };
}

/**
 * Sign an audit event and append it to the chain.
 *
 * @param {object} params
 * @param {string} params.actor
 * @param {string} params.action
 * @param {string} params.target
 * @param {string} [params.reason]
 * @param {unknown} [params.payload]
 * @returns {import('../../audit-signer/src/signer.mjs').SignedAuditRecord | null}
 */
export function signAuditEvent({ actor, action, target, reason, payload }) {
  if (!keyPair) {
    return null;
  }

  const record = createRecord({ actor, action, target, reason, payload });
  const signed = append(chain, record, keyPair.privateKey, keyPair.publicKey);

  console.log(JSON.stringify({
    type: 'audit.signed',
    record: signed,
  }));

  return signed;
}

/**
 * Get the current chain state (metadata only).
 *
 * @returns {{ lastHash: string; recordCount: number; verified: boolean }}
 */
export function getChainState() {
  return {
    lastHash: chain.lastHash,
    recordCount: chain.records.length,
    verified: verifyChain(chain).valid,
  };
}

/**
 * Verify an NDJSON audit body.
 *
 * @param {string} ndjson
 * @returns {{ valid: boolean; firstInvalidIndex: number; reason: string }}
 */
export function verifyAuditBody(ndjson) {
  const imported = fromNdjson(ndjson);
  return verifyChain(imported);
}

/**
 * Export the full chain as NDJSON.
 *
 * @returns {string}
 */
export function exportChainNdjson() {
  return toNdjson(chain);
}

/**
 * Reset the chain (intended for tests only).
 */
export function resetChain() {
  chain.records.length = 0;
  chain.lastHash = '';
}

/**
 * Reset the audit signer state (intended for tests only).
 */
export function resetAuditSigner() {
  keyPair = null;
  initialized = false;
  resetChain();
}
