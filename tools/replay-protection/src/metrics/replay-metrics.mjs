/** @typedef {import('../types').ReplayMetricsSnapshot} ReplayMetricsSnapshot */
/**
 * @fileoverview Replay Metrics
 *
 * Runtime counters for every replay-protection decision.
 * Exported as a snapshot suitable for Prometheus scraping or OTLP push.
 *
 * Exit gate: replay and stale-request rejection MUST be measurable
 * in runtime, not just present in code.
 *
 * Principles: OBSERVABLE (P15)
 */

const LABELS = Object.freeze([
  'accepted_total',
  'rejected_nonce_total',
  'rejected_stale_total',
  'rejected_future_total',
  'rejected_signature_total',
  'rejected_envelope_total',
]);

export class ReplayMetrics {
  /** @type {Map<string, number>} */
  #counters = new Map(LABELS.map((l) => [l, 0]));
  /** @type {boolean} */
  #enabled;

  /**
   * @param {object} [opts]
   * @param {boolean} [opts.enabled=true]
   */
  constructor(opts = {}) {
    this.#enabled = opts.enabled ?? true;
  }

  /**
   * Increment a counter.
   *
   * @param {'accepted_total'|'rejected_nonce_total'|'rejected_stale_total'|'rejected_future_total'|'rejected_signature_total'|'rejected_envelope_total'} label
   * @param {number} [delta=1]
   */
  inc(label, delta = 1) {
    if (!this.#enabled) return;
    const current = this.#counters.get(label) ?? 0;
    this.#counters.set(label, current + delta);
  }

  /**
   * Return a snapshot of all counters.
   *
   * @returns {import('../types').ReplayMetricsSnapshot}
   */
  snapshot() {
    return {
      acceptedTotal: this.#counters.get('accepted_total') ?? 0,
      rejectedNonceTotal: this.#counters.get('rejected_nonce_total') ?? 0,
      rejectedStaleTotal: this.#counters.get('rejected_stale_total') ?? 0,
      rejectedFutureTotal: this.#counters.get('rejected_future_total') ?? 0,
      rejectedSignatureTotal: this.#counters.get('rejected_signature_total') ?? 0,
      rejectedEnvelopeTotal: this.#counters.get('rejected_envelope_total') ?? 0,
    };
  }

  /**
   * Export in Prometheus exposition format.
   *
   * @returns {string}
   */
  prometheus() {
    const snap = this.snapshot();
    const lines = [
      '# HELP replay_protection_total Total replay-protection decisions',
      '# TYPE replay_protection_total counter',
      `replay_protection_total{code="REPLAY_OK"} ${snap.acceptedTotal}`,
      `replay_protection_total{code="REPLAY_NONCE"} ${snap.rejectedNonceTotal}`,
      `replay_protection_total{code="REPLAY_STALE"} ${snap.rejectedStaleTotal}`,
      `replay_protection_total{code="REPLAY_FUTURE"} ${snap.rejectedFutureTotal}`,
      `replay_protection_total{code="REPLAY_SIGNATURE"} ${snap.rejectedSignatureTotal}`,
      `replay_protection_total{code="REPLAY_ENVELOPE"} ${snap.rejectedEnvelopeTotal}`,
    ];
    return lines.join('\n') + '\n';
  }

  reset() {
    for (const label of LABELS) {
      this.#counters.set(label, 0);
    }
  }

  // --- Gauges (not counters) ---

  /** @type {number} */
  #redisConnected = 0;

  /**
   * Set Redis connectivity gauge.
   * @param {0 | 1} value
   */
  setRedisConnected(value) {
    this.#redisConnected = value ? 1 : 0;
  }

  /**
   * @returns {number}
   */
  redisConnected() {
    return this.#redisConnected;
  }

  // --- Histogram buckets for clock skew ---

  /** @type {number[]} */
  #skewBuckets = [];

  /**
   * Record a clock skew observation.
   * @param {number} skewMs
   */
  observeClockSkew(skewMs) {
    if (skewMs != null) {
      this.#skewBuckets.push(Math.abs(skewMs));
      // Keep last 10k samples to avoid unbounded growth
      if (this.#skewBuckets.length > 10000) {
        this.#skewBuckets = this.#skewBuckets.slice(-5000);
      }
    }
  }

  /**
   * Return clock skew histogram in Prometheus format.
   * @returns {string}
   */
  clockSkewHistogram() {
    const buckets = [0, 1000, 5000, 60000, 300000, 600000, 900000, 1800000, 3600000];
    const lines = [
      '# HELP replay_protection_clock_skew_ms Absolute clock skew of verified requests',
      '# TYPE replay_protection_clock_skew_ms histogram',
    ];
    for (const le of buckets) {
      const count = this.#skewBuckets.filter((v) => v <= le).length;
      lines.push(`replay_protection_clock_skew_ms_bucket{le="${le}"} ${count}`);
    }
    lines.push(`replay_protection_clock_skew_ms_bucket{le="+Inf"} ${this.#skewBuckets.length}`);
    lines.push(`replay_protection_clock_skew_ms_sum ${this.#skewBuckets.reduce((a, b) => a + b, 0)}`);
    lines.push(`replay_protection_clock_skew_ms_count ${this.#skewBuckets.length}`);
    return lines.join('\n') + '\n';
  }
}

/** Singleton for process-wide metrics. */
export const defaultMetrics = new ReplayMetrics();
