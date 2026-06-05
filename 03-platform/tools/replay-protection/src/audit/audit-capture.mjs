/**
 * @fileoverview Audit Capture for Replay Protection
 *
 * Captures structured audit events for offline-replayed field operations.
 * Events are emitted to a configurable sink (console, file, webhook, or event bus).
 *
 * Principles: AUDITABLE (P3), SOVEREIGN (P6)
 */

import { randomUUID } from 'node:crypto';

/**
 * @typedef {Function} AuditSink
 * @param {import('../types').AuditEvent} event
 * @returns {Promise<void> | void}
 */

export class AuditCapture {
  /** @type {AuditSink[]} */
  #sinks = [];
  /** @type {boolean} */
  #enabled;

  /**
   * @param {object} [opts]
   * @param {boolean} [opts.enabled=true]
   * @param {AuditSink[]} [opts.sinks=[]]
   */
  constructor(opts = {}) {
    this.#enabled = opts.enabled ?? true;
    if (opts.sinks) {
      this.#sinks = [...opts.sinks];
    }
  }

  /**
   * Register a sink.
   *
   * @param {AuditSink} sink
   */
  addSink(sink) {
    this.#sinks.push(sink);
  }

  /**
   * Capture an audit event.
   *
   * @param {object} params
   * @param {string} params.eventType - "replay.accepted" | "replay.rejected"
   * @param {string} [params.nonce]
   * @param {string} [params.did]
   * @param {string} [params.reason]
   * @param {string} [params.code]
   * @param {string} [params.region]
   * @param {string} [params.requestId]
   * @param {string} [params.deviceId]
   * @param {number} [params.clockSkewMs]
   * @param {number} [params.acceptanceWindowMs]
   * @param {boolean} [params.isDelayedOfflineReplay]
   * @returns {Promise<import('../types').AuditEvent>}
   */
  async capture(params) {
    /** @type {import('../types').AuditEvent} */
    const event = {
      eventId: randomUUID(),
      timestampMs: Date.now(),
      eventType: params.eventType,
      nonce: params.nonce,
      did: params.did,
      reason: params.reason,
      code: params.code,
      region: params.region,
      requestId: params.requestId,
      deviceId: params.deviceId,
      clockSkewMs: params.clockSkewMs,
      acceptanceWindowMs: params.acceptanceWindowMs,
      isDelayedOfflineReplay: params.isDelayedOfflineReplay,
    };

    if (!this.#enabled) {
      return event;
    }

    // Fire-and-forget to all sinks; don't let a slow sink block the hot path.
    for (const sink of this.#sinks) {
      try {
        await Promise.resolve(sink(event));
      } catch {
        // Sinks are best-effort. A failing sink must not break verification.
      }
    }

    return event;
  }
}

/** Default console sink for local dev and bootstrap. @param {import('../types').AuditEvent} event */
export const consoleSink = (event) => {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ type: 'audit.replay', ...event }));
};

/** Singleton for process-wide capture. */
export const defaultAuditCapture = new AuditCapture({ sinks: [consoleSink] });
