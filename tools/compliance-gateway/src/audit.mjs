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

// Per-record exception classification for the in-memory window.
// Most exception kinds are derivable at read time from the preserved
// `action` field (auth:failure, query:failure, query:throttled,
// audit-bundle.received with rejectedIds > 0, etc.). The exception
// kinds we CANNOT derive from action alone are stashed here:
//
//   query:success → 'low-confidence' when confidence band is 'low'
//
// Keys are signed record IDs; values are { kind, severity } so the
// exception-only operator view can surface them as a single feed.
const recordExceptions = new Map();

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
 * `exceptionKind` is captured in the `recordExceptions` sidecar so the
 * `/v1/exceptions` operator view can surface confidence-class events
 * (the action field alone doesn't carry that signal — payload is
 * stripped by the signer).
 *
 * @param {object} params
 * @param {string} params.actor
 * @param {string} params.action
 * @param {string} params.target
 * @param {string} [params.reason]
 * @param {string} [params.tenantId] - explicit tenant; falls back to payload.tenantId
 * @param {string} [params.exceptionKind] - 'low-confidence' | 'integrity-violation' | ...; tagged in recordExceptions
 * @param {unknown} [params.payload]
 * @returns {import('../../audit-signer/src/signer.mjs').SignedAuditRecord | null}
 */
export function signAuditEvent({ actor, action, target, reason, tenantId, exceptionKind, payload }) {
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
  if (typeof exceptionKind === 'string' && exceptionKind.length > 0) {
    recordExceptions.set(signed.id, exceptionKind);
  }

  incrementCounter('compliance_gateway_audit_records_total', { action });
  getSink().emit(signed);

  // Bound in-memory chain. The full chain is durable in the sink (stdout
  // shipped to log aggregation, optionally NATS JetStream). The in-memory
  // copy is for fast verification on /v1/audit/chain and /v1/audit/verify.
  if (chain.records.length > MAX_IN_MEMORY_RECORDS) {
    // Verify BEFORE discard. The records about to be evicted were
    // shipped to the durable sink; if they're invalid here it means
    // either the chain was tampered in-memory OR we shipped tampered
    // records to the sink (much worse). Either way: don't silently
    // truncate. Emit an integrity violation and skip the truncation
    // so the bad records remain in memory for forensic inspection
    // until the next process restart.
    const preCheck = verifyChain(chain);
    if (!preCheck.valid) {
      incrementCounter('compliance_gateway_audit_chain_integrity_violations_total', {
        reason: preCheck.reason ?? 'unknown',
      });
      console.error(JSON.stringify({
        level: 'fatal',
        type: 'audit.chain.integrity_violation',
        firstInvalidIndex: preCheck.firstInvalidIndex,
        reason: preCheck.reason,
        checkpointCount,
        recordCount: chain.records.length,
        message:
          'Refusing to checkpoint a chain that does not verify. The in-memory ' +
          'window will continue to grow until the next process restart so the ' +
          'bad records are available for forensic inspection. Investigate ' +
          'audit.sink integrity immediately.',
      }));
      return signed;
    }
    checkpointHash = chain.lastHash;
    checkpointCount += chain.records.length;
    chain.records.length = 0;
    recordTenants.clear();
    recordExceptions.clear();
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
 * The `inMemoryVerified` flag covers ONLY the in-memory window (records
 * since the last checkpoint). Checkpointed-out records were verified
 * before discard; their integrity is asserted by `checkpointHash` and
 * preserved in the durable sink. The prior `verified` field name was
 * misleading because it suggested whole-chain coverage; consumers
 * relying on it for trust signals could be misled after the first
 * checkpoint.
 *
 * @returns {{ lastHash: string; recordCount: number; totalRecords: number; checkpointHash: string; inMemoryVerified: boolean; verifiedScope: string }}
 */
export function getChainState() {
  const inMemoryVerified = verifyChain(chain).valid;
  return {
    lastHash: chain.lastHash,
    recordCount: chain.records.length,
    totalRecords: checkpointCount + chain.records.length,
    checkpointHash,
    inMemoryVerified,
    verifiedScope:
      checkpointCount === 0
        ? 'full-chain'
        : `in-memory-window-since-checkpoint:${checkpointHash}`,
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
 * Build an evidence bundle covering MULTIPLE tenants in a single
 * verifiable artifact — the cross-jurisdictional bundle a regulator
 * cites when auditing trade compliance across borders. Each tenant
 * section is independently verifiable; combining them in one document
 * is a convenience, not a trust extension.
 *
 * Caller MUST have authority over every tenant in `tenantIds` — this
 * function does not check; the HTTP layer enforces the principal's
 * tenant binding.
 *
 * @param {{ tenantIds: string[], since?: string }} opts
 * @returns {{
 *   bundleVersion: '2-multi-tenant',
 *   producedAt: string,
 *   tenantCount: number,
 *   chainHead: string,
 *   priorCheckpointHash: string,
 *   priorCheckpointCount: number,
 *   sections: Array<{ tenantId: string, recordCount: number, ndjson: string }>,
 *   verification: { algorithm: string, instructions: string },
 * }}
 */
export function buildMultiTenantEvidenceBundle({ tenantIds, since } = {}) {
  if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
    throw new Error('buildMultiTenantEvidenceBundle: tenantIds[] is required');
  }
  const sections = tenantIds.map((tenantId) => {
    if (typeof tenantId !== 'string' || tenantId.length === 0) {
      throw new Error('buildMultiTenantEvidenceBundle: every tenantId must be a non-empty string');
    }
    const records = chain.records.filter((r) => {
      if (since && r.timestamp < since) return false;
      return recordTenants.get(r.id) === tenantId;
    });
    return {
      tenantId,
      recordCount: records.length,
      ndjson: records.map((r) => JSON.stringify(r)).join('\n'),
    };
  });
  return {
    bundleVersion: '2-multi-tenant',
    producedAt: new Date().toISOString(),
    tenantCount: sections.length,
    chainHead: chain.lastHash,
    priorCheckpointHash: checkpointHash,
    priorCheckpointCount: checkpointCount,
    sections,
    verification: {
      algorithm: 'ed25519+sha256+jcs',
      instructions:
        'For each section, run: npm install @gtcx/audit-signer; ' +
        'verifyChain(fromNdjson(section.ndjson)). Sections verify independently — ' +
        'a failed section does not invalidate the others. Every record carries its ' +
        'publicKey, so no key server is required.',
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
  recordExceptions.clear();
}

// ---------------------------------------------------------------------------
// Exception-only operator view (AI-native Pattern #3)
// ---------------------------------------------------------------------------

/**
 * Map a signed record's action + sidecar tags to an exception kind,
 * or null if it's a routine event the operator view should hide.
 *
 * Kinds:
 *   - 'auth-failure'           — auth:failure action
 *   - 'query-failure'          — query:failure (LLM chain exhausted, no providers, etc.)
 *   - 'query-throttled'        — query:throttled (budget gate)
 *   - 'resilience-degraded'    — resilience.policy.adaptation away from 'normal'
 *   - 'low-confidence'         — query:success tagged via recordExceptions
 *   - 'integrity-violation'    — chain verification failure (tagged sidecar)
 *
 * @param {object} record
 * @returns {string | null}
 */
function classifyException(record) {
  const tagged = recordExceptions.get(record.id);
  if (tagged) return tagged;
  if (record.action === 'auth:failure') return 'auth-failure';
  if (record.action === 'query:failure') return 'query-failure';
  if (record.action === 'query:throttled') return 'query-throttled';
  if (record.action === 'resilience.policy.adaptation') return 'resilience-degraded';
  return null;
}

/**
 * Return exception-class events from the in-memory chain, scoped to a
 * single tenant. The operator view's job is to surface only the events
 * that require human judgment — failures, throttles, degraded
 * resilience, and low-confidence LLM outputs.
 *
 * @param {{ tenantId: string, since?: string, kinds?: string[], limit?: number }} opts
 * @returns {{
 *   tenantId: string,
 *   producedAt: string,
 *   totalExceptions: number,
 *   truncated: boolean,
 *   exceptions: Array<{ id: string, timestamp: string, action: string, kind: string, actor: string, target: string, reason?: string }>,
 * }}
 */
export function getExceptions({ tenantId, since, kinds, limit = 200 } = {}) {
  if (typeof tenantId !== 'string' || tenantId.length === 0) {
    throw new Error('getExceptions: tenantId is required');
  }
  const kindFilter = Array.isArray(kinds) && kinds.length > 0 ? new Set(kinds) : null;
  const matches = [];
  for (const r of chain.records) {
    if (recordTenants.get(r.id) !== tenantId) continue;
    if (since && r.timestamp < since) continue;
    const kind = classifyException(r);
    if (!kind) continue;
    if (kindFilter && !kindFilter.has(kind)) continue;
    matches.push({
      id: r.id,
      timestamp: r.timestamp,
      action: r.action,
      kind,
      actor: r.actor,
      target: r.target,
      ...(r.reason ? { reason: r.reason } : {}),
    });
  }
  const truncated = matches.length > limit;
  return {
    tenantId,
    producedAt: new Date().toISOString(),
    totalExceptions: matches.length,
    truncated,
    exceptions: matches.slice(0, limit),
  };
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
