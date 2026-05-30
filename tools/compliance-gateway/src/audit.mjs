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
} from '@gtcx/audit-signer';

import { getSink, getSinkInfo } from './audit-sink.mjs';
import { incrementCounter } from './metrics.mjs';

let keyPair = null;
const chain = createChain();
let initialized = false;
let checkpointHash = '';
let checkpointCount = 0;

// Per-record tenant tag for the in-memory window. The signed record's
// payload is hashed (not preserved) by @gtcx/audit-signer, so this
// sidecar map is the only place an in-memory bundle query can resolve
// tenant ownership. Cleared on checkpoint (records evicted from memory)
// and on resetChain. Durable per-tenant routing happens at the
// JetStream subject level (see audit-flush `tenantFromSubject`).
const recordTenants = new Map();

const MAX_IN_MEMORY_RECORDS = Number(process.env.AUDIT_CHAIN_MAX_RECORDS || '10000');

/**
 * Initialize the audit signer from environment.
 *
 * In production, this fails closed: if AUDIT_SIGNING_KEY_B64 is absent or
 * invalid, the returned `initialized` flag is false and the caller MUST
 * treat that as fatal (exit, refuse readiness). Non-production environments
 * generate an ephemeral key so developers can run the gateway locally.
 *
 * @param {NodeJS.ProcessEnv} [env=process.env]
 * @returns {{ initialized: boolean; ephemeral: boolean; error?: string }}
 */
export function initAuditSigner(env = process.env, force = false) {
  if (initialized && !force) {
    return { initialized: keyPair !== null, ephemeral: keyPair !== null && !env.AUDIT_SIGNING_KEY_B64 };
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

  console.error(JSON.stringify({
    level: 'error',
    type: 'audit.signer.noKey',
    message: 'AUDIT_SIGNING_KEY_B64 is required in production. Refusing to start without a signing key.',
  }));
  initialized = true;
  keyPair = null;
  return { initialized: false, ephemeral: false, error: 'AUDIT_SIGNING_KEY_B64 missing in production' };
}

/**
 * Sign an audit event and append it to the chain.
 *
 * `tenantId` is captured in the in-memory `recordTenants` sidecar map
 * for `buildEvidenceBundle` filtering. It is also pulled from
 * `payload.tenantId` for backward compatibility with existing call sites.
 *
 * @param {object} params
 * @param {string} params.actor
 * @param {string} params.action
 * @param {string} params.target
 * @param {string} [params.reason]
 * @param {string} [params.tenantId] - explicit tenant; falls back to payload.tenantId
 * @param {unknown} [params.payload]
 * @returns {import('../../audit-signer/src/signer.mjs').SignedAuditRecord | null}
 */
export function signAuditEvent({ actor, action, target, reason, tenantId, payload }) {
  if (!keyPair) {
    return null;
  }

  const record = createRecord({ actor, action, target, reason, payload });
  let signed;
  try {
    signed = append(chain, record, keyPair.privateKey, keyPair.publicKey);
  } catch (err) {
    incrementCounter('compliance_gateway_audit_sign_failures_total', { action });
    console.error(JSON.stringify({
      level: 'error',
      type: 'audit.signer.signFailed',
      action,
      error: err.message,
    }));
    return null;
  }

  const effectiveTenant =
    typeof tenantId === 'string' && tenantId.length > 0
      ? tenantId
      : typeof payload?.tenantId === 'string' && payload.tenantId.length > 0
        ? payload.tenantId
        : null;
  if (effectiveTenant) {
    recordTenants.set(signed.id, effectiveTenant);
  }

  incrementCounter('compliance_gateway_audit_records_total', { action });
  getSink().emit(signed);

  // Bound in-memory chain. The full chain is durable in the sink (stdout
  // shipped to log aggregation, optionally NATS JetStream). The in-memory
  // copy is for fast verification on /v1/audit/chain and /v1/audit/verify.
  if (chain.records.length > MAX_IN_MEMORY_RECORDS) {
    checkpointHash = chain.lastHash;
    checkpointCount += chain.records.length;
    chain.records.length = 0;
    recordTenants.clear();
    console.log(JSON.stringify({
      type: 'audit.checkpoint',
      checkpointHash,
      totalRecords: checkpointCount,
      timestamp: new Date().toISOString(),
    }));
  }

  return signed;
}

/**
 * Get the current chain state (metadata only).
 *
 * `recordCount` is the in-memory window; `totalRecords` includes records
 * that have been checkpointed out of memory. The chain is still verifiable
 * from the durable sink via `verifyAuditBody(ndjson)`.
 *
 * @returns {{ lastHash: string; recordCount: number; totalRecords: number; checkpointHash: string; verified: boolean }}
 */
export function getChainState() {
  return {
    lastHash: chain.lastHash,
    recordCount: chain.records.length,
    totalRecords: checkpointCount + chain.records.length,
    checkpointHash,
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
 * Build a signed, verifiable evidence bundle for an external auditor.
 *
 * Includes the in-memory NDJSON (records since the last checkpoint),
 * the checkpoint hash from before that window, the public key needed
 * for verification, and an integrity statement that ties them together.
 *
 * A consumer with only this bundle can verify it offline using
 * @gtcx/audit-signer's verifyChain — no GTCX-side trust required.
 *
 * Tenant scoping is strict: records are filtered to those tagged with
 * `payload.tenantId === tenantId`. The literal value `'default'` is
 * a real tenant (the legacy single-tenant deployment slot and the
 * bare-subject default in audit-flush's `tenantFromSubject`) — it does
 * NOT grant cross-tenant access. Callers needing cross-tenant evidence
 * must invoke the endpoint once per tenant.
 *
 * @param {{ tenantId: string, since?: string }} opts - tenantId is required
 * @returns {{
 *   bundleVersion: '1',
 *   producedAt: string,
 *   tenantId: string,
 *   recordCount: number,
 *   chainHead: string,
 *   priorCheckpointHash: string,
 *   priorCheckpointCount: number,
 *   ndjson: string,
 *   verification: { algorithm: 'ed25519+sha256+jcs', instructions: string },
 * }}
 */
export function buildEvidenceBundle({ tenantId, since } = {}) {
  if (typeof tenantId !== 'string' || tenantId.length === 0) {
    throw new Error('buildEvidenceBundle: tenantId is required');
  }
  const records = chain.records.filter((r) => {
    if (!since) return true;
    return r.timestamp >= since;
  }).filter((r) => recordTenants.get(r.id) === tenantId);
  const ndjson = records.map((r) => JSON.stringify(r)).join('\n');
  return {
    bundleVersion: '1',
    producedAt: new Date().toISOString(),
    tenantId,
    recordCount: records.length,
    chainHead: chain.lastHash,
    priorCheckpointHash: checkpointHash,
    priorCheckpointCount: checkpointCount,
    ndjson,
    verification: {
      algorithm: 'ed25519+sha256+jcs',
      instructions:
        'npm install @gtcx/audit-signer; then verifyChain(fromNdjson(ndjson)) on Node ≥20. ' +
        'Every record carries its publicKey, so no key server is required.',
    },
  };
}

/**
 * Reset the chain (intended for tests only).
 */
export function resetChain() {
  chain.records.length = 0;
  chain.lastHash = '';
  checkpointHash = '';
  checkpointCount = 0;
  recordTenants.clear();
}

/**
 * Reset the audit signer state (intended for tests only).
 */
export function resetAuditSigner() {
  keyPair = null;
  initialized = false;
  resetChain();
}

/**
 * Indicates whether the gateway is producing signed audit evidence.
 * Used by /health to make the signing posture observable.
 *
 * @returns {{ signing: boolean; ephemeral: boolean; maxInMemoryRecords: number; sink: object }}
 */
export function getSignerHealth() {
  return {
    signing: keyPair !== null,
    ephemeral: keyPair !== null && !process.env.AUDIT_SIGNING_KEY_B64,
    maxInMemoryRecords: MAX_IN_MEMORY_RECORDS,
    sink: getSinkInfo(),
  };
}
