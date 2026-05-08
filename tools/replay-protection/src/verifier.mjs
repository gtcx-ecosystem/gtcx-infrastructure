/**
 * @fileoverview Replay Protection Verifier
 *
 * Backend verifier for gtcx-mobile offline queue integrity metadata.
 * Enforces:
 *   1. Nonce uniqueness (replay protection)
 *   2. Timestamp window + clock-skew tolerance
 *   3. Envelope / body / header hash integrity
 *   4. Signature verification over the canonical envelope
 *
 * All rejections are logged, audited, and counted in runtime metrics.
 *
 * Principles: SECURE (P11), RESILIENT (P12), OBSERVABLE (P15), AUDITABLE (P3)
 */

import { defaultAuditCapture } from './audit/audit-capture.mjs';
import { computeBodyHash, computeHeadersHash, computeEnvelopeHash } from './crypto/hash.mjs';
import { logAuthFailure } from './logging/auth-failure-logger.mjs';
import { defaultMetrics } from './metrics/replay-metrics.mjs';
import { evaluateTimestamp, DEFAULT_POLICY } from './policy/clock-skew.mjs';

/**
 * @typedef {object} VerifierOptions
 * @property {import('./store/nonce-store.mjs').NonceStore} nonceStore
 * @property {import('./policy/clock-skew.mjs').ClockSkewPolicy} [clockSkewPolicy]
 * @property {import('./metrics/replay-metrics.mjs').ReplayMetrics} [metrics]
 * @property {import('./audit/audit-capture.mjs').AuditCapture} [auditCapture]
 * @property {Function} [verifySignature] - async (integrity) => boolean
 * @property {number} [nonceTtlMs=900000] - 15 minutes default
 * @property {boolean} [logFailures=true]
 * @property {boolean} [skipHashVerification=false] - For bootstrap / migration only
 */

export class ReplayVerifier {
  /** @type {import('./store/nonce-store.mjs').NonceStore} */
  #nonceStore;
  /** @type {import('./policy/clock-skew.mjs').ClockSkewPolicy} */
  #clockSkewPolicy;
  /** @type {import('./metrics/replay-metrics.mjs').ReplayMetrics} */
  #metrics;
  /** @type {import('./audit/audit-capture.mjs').AuditCapture} */
  #audit;
  /** @type {Function | null} */
  #verifySignature;
  /** @type {number} */
  #nonceTtlMs;
  /** @type {boolean} */
  #logFailures;
  /** @type {boolean} */
  #skipHashVerification;

  /**
   * @param {VerifierOptions} opts
   */
  constructor(opts) {
    if (!opts.nonceStore) {
      throw new TypeError('ReplayVerifier requires opts.nonceStore');
    }
    this.#nonceStore = opts.nonceStore;
    this.#clockSkewPolicy = opts.clockSkewPolicy ?? DEFAULT_POLICY;
    this.#metrics = opts.metrics ?? defaultMetrics;
    this.#audit = opts.auditCapture ?? defaultAuditCapture;
    this.#verifySignature = opts.verifySignature ?? null;
    this.#nonceTtlMs = opts.nonceTtlMs ?? 15 * 60 * 1000;
    this.#logFailures = opts.logFailures ?? true;
    this.#skipHashVerification = opts.skipHashVerification ?? false;
  }

  /**
   * Verify a QueueIntegrity payload against actual request data.
   *
   * @param {import('./types').QueueIntegrity} integrity
   * @param {object} request
   * @param {unknown} request.body - Actual request body (JSON serializable)
   * @param {Record<string, string>} request.headers - Actual request headers
   * @param {string} request.method - HTTP method
   * @param {string} request.url - Request URL
   * @param {import('./types').VerifyContext} [context]
   * @returns {Promise<import('./types').VerifyResult>}
   */
  async verify(integrity, request, context = {}) {
    const region = context.region;
    const requestId = context.requestId;
    const deviceId = context.deviceId;

    // --- 1. Timestamp window + clock skew ---
    const tsEval = evaluateTimestamp(integrity.timestamp, region ?? '', this.#clockSkewPolicy);
    if (!tsEval.valid) {
      this.#metrics.inc(tsEval.code === 'REPLAY_FUTURE' ? 'rejected_future_total' : 'rejected_stale_total');
      this.#metrics.observeClockSkew(tsEval.skewMs);
      const tsCode = /** @type {string} */ (tsEval.code);
      const tsReason = /** @type {string} */ (tsEval.reason);
      this.#maybeLog(integrity, tsCode, tsReason, context);
      const auditEvent = await this.#audit.capture({
        eventType: 'replay.rejected',
        nonce: integrity.nonce,
        did: integrity.did,
        reason: tsReason,
        code: tsCode,
        region,
        requestId,
        deviceId,
        clockSkewMs: tsEval.skewMs,
        acceptanceWindowMs: tsEval.windowMs,
      });
      return { allowed: false, code: tsCode, reason: tsReason, auditEvent };
    }

    // --- 2. Nonce uniqueness (atomic check-and-set) ---
    const nonceFresh = await this.#nonceStore.checkAndSet(integrity.nonce, this.#nonceTtlMs);
    if (!nonceFresh) {
      const reason = 'Nonce has already been consumed';
      this.#metrics.inc('rejected_nonce_total');
      this.#metrics.observeClockSkew(tsEval.skewMs);
      this.#maybeLog(integrity, 'REPLAY_NONCE', reason, context);
      const auditEvent = await this.#audit.capture({
        eventType: 'replay.rejected',
        nonce: integrity.nonce,
        did: integrity.did,
        reason,
        code: 'REPLAY_NONCE',
        region,
        requestId,
        deviceId,
        clockSkewMs: tsEval.skewMs,
        acceptanceWindowMs: tsEval.windowMs,
      });
      return { allowed: false, code: 'REPLAY_NONCE', reason, auditEvent };
    }

    // --- 3. Hash verification (body, headers, envelope) ---
    if (!this.#skipHashVerification) {
      const hashResult = this.#verifyHashes(integrity, /** @type {any} */ (request));
      if (!hashResult.valid) {
        this.#metrics.inc('rejected_envelope_total');
        this.#metrics.observeClockSkew(tsEval.skewMs);
        this.#maybeLog(integrity, 'REPLAY_ENVELOPE', /** @type {string} */ (hashResult.reason), context);
        // NONCE IS NOT DELETED — fail-safe semantics: once consumed, a nonce stays
        // consumed regardless of downstream verification outcome. This prevents
        // replay of rejected requests and forces attackers to mint fresh nonces.
        const auditEvent = await this.#audit.capture({
          eventType: 'replay.rejected',
          nonce: integrity.nonce,
          did: integrity.did,
          reason: hashResult.reason,
          code: 'REPLAY_ENVELOPE',
          region,
          requestId,
          deviceId,
          clockSkewMs: tsEval.skewMs,
          acceptanceWindowMs: tsEval.windowMs,
        });
        return { allowed: false, code: 'REPLAY_ENVELOPE', reason: hashResult.reason, auditEvent };
      }
    }

    // --- 4. Signature verification over the envelope ---
    if (this.#verifySignature) {
      const sigValid = await this.#verifySignature(integrity);
      if (!sigValid) {
        const reason = 'Signature verification failed';
        this.#metrics.inc('rejected_signature_total');
        this.#metrics.observeClockSkew(tsEval.skewMs);
        this.#maybeLog(integrity, 'REPLAY_SIGNATURE', reason, context);
        // NONCE IS NOT DELETED — fail-safe semantics: once consumed, a nonce stays
        // consumed regardless of downstream verification outcome.
        const auditEvent = await this.#audit.capture({
          eventType: 'replay.rejected',
          nonce: integrity.nonce,
          did: integrity.did,
          reason,
          code: 'REPLAY_SIGNATURE',
          region,
          requestId,
          deviceId,
          clockSkewMs: tsEval.skewMs,
          acceptanceWindowMs: tsEval.windowMs,
        });
        return { allowed: false, code: 'REPLAY_SIGNATURE', reason, auditEvent };
      }
    }

    // --- 5. Accept ---
    this.#metrics.inc('accepted_total');
    this.#metrics.observeClockSkew(tsEval.skewMs);
    const isDelayedOfflineReplay = tsEval.skewMs > 300000; // > 5 min skew = delayed offline replay
    const auditEvent = await this.#audit.capture({
      eventType: 'replay.accepted',
      nonce: integrity.nonce,
      did: integrity.did,
      code: 'REPLAY_OK',
      region,
      requestId,
      deviceId,
      clockSkewMs: tsEval.skewMs,
      acceptanceWindowMs: tsEval.windowMs,
      isDelayedOfflineReplay,
    });

    return { allowed: true, code: 'REPLAY_OK', auditEvent };
  }

  /**
   * @returns {import('./metrics/replay-metrics.mjs').ReplayMetricsSnapshot}
   */
  metricsSnapshot() {
    return this.#metrics.snapshot();
  }

  /**
   * @returns {string}
   */
  metricsPrometheus() {
    return this.#metrics.prometheus();
  }

  /**
   * @param {import('./types').QueueIntegrity} integrity
   * @param {{ body: unknown, headers: Record<string, string>, method: string, url: string }} request
   * @returns {{ valid: boolean; reason?: string }}
   */
  #verifyHashes(integrity, request) {
    // Body hash
    const computedBodyHash = computeBodyHash(/** @type {string} */ (request.body));
    if (computedBodyHash !== integrity.bodyHash) {
      return { valid: false, reason: 'bodyHash mismatch' };
    }

    // Headers hash
    const computedHeadersHash = computeHeadersHash(request.headers);
    if (computedHeadersHash !== integrity.headersHash) {
      return { valid: false, reason: 'headersHash mismatch' };
    }

    // Envelope hash
    const computedEnvelopeHash = computeEnvelopeHash({
      method: request.method,
      url: request.url,
      bodyHash: integrity.bodyHash,
      headersHash: integrity.headersHash,
      timestamp: integrity.timestamp,
      nonce: integrity.nonce,
      did: integrity.did,
      keyId: integrity.keyId,
      audience: integrity.audience,
    });
    if (computedEnvelopeHash !== integrity.envelopeHash) {
      return { valid: false, reason: 'envelopeHash mismatch' };
    }

    return { valid: true };
  }

  /**
   * @param {import('./types').QueueIntegrity} integrity
   * @param {string} code
   * @param {string} reason
   * @param {import('./types').VerifyContext} context
   */
  #maybeLog(integrity, code, reason, context) {
    if (!this.#logFailures) return;
    logAuthFailure({
      level: 'warn',
      type: 'auth.replay.rejected',
      nonce: integrity.nonce,
      did: integrity.did,
      reason,
      code,
      remoteAddress: context.remoteAddress,
      userAgent: context.userAgent,
      requestId: context.requestId,
      region: context.region,
    });
  }
}
