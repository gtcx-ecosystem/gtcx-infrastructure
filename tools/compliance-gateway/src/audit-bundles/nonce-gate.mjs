/**
 * Nonce gate for POST /audit/bundles.
 *
 * TTL: 5 minutes (2-min MAX_SIGNING_CONTEXT_AGE_MS from
 * gtcx-mobile/apps/mobile/gtcx/lib/api-config.ts:27 + 3-min server-side
 * clock-skew buffer per mobile team guidance on issue #51).
 *
 * Storage: in-memory Map with lazy TTL eviction. Sized for the W1
 * pilot (5 countries × 50 operators × 200 captures/day × 5-min
 * retention ≈ 17K entries × ~200 bytes ≈ 3.4 MB).
 *
 * Multi-pod scaling is deferred; if/when the gateway runs > 1 replica
 * the store swaps to Redis (same migration pattern as adaptive-policy-
 * store.mjs). The handler depends only on `checkAndSet`, so swap is
 * a one-file change.
 *
 * On replay: returns { accepted: false }. The handler maps this to a
 * 409 nonce-replayed response with acceptedIds: [] per the canonical
 * error code in gtcx-mobile/packages/agents/src/transport-contract.ts:14.
 */

export const NONCE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_MAX_SIZE = 200_000;

/**
 * @typedef {object} NonceGateOptions
 * @property {number} [ttlMs]      - Override TTL (default 5 min)
 * @property {number} [maxSize]    - Hard cap on stored nonces (default 200K)
 * @property {() => number} [now]  - Override clock for tests
 */

/**
 * @typedef {object} NonceCheckResult
 * @property {boolean} accepted   - true if the nonce was not previously seen
 * @property {boolean} alreadySeen - true if the nonce was a replay
 */

export class NonceGate {
  /** @type {Map<string, number>} nonce -> expiration epoch ms */
  #store = new Map();
  #ttlMs;
  #maxSize;
  #now;

  constructor(opts = {}) {
    this.#ttlMs = opts.ttlMs ?? NONCE_TTL_MS;
    this.#maxSize = opts.maxSize ?? DEFAULT_MAX_SIZE;
    this.#now = opts.now ?? (() => Date.now());
  }

  /**
   * Check whether the nonce is new; if so, record it and return accepted.
   *
   * @param {string} nonce
   * @returns {NonceCheckResult}
   */
  checkAndSet(nonce) {
    this.#evictExpired();

    const existing = this.#store.get(nonce);
    if (existing !== undefined && existing >= this.#now()) {
      return { accepted: false, alreadySeen: true };
    }

    if (this.#store.size >= this.#maxSize) {
      // At cap: drop the oldest 10% by expiration time
      const drop = Math.max(1, Math.ceil(this.#maxSize * 0.1));
      const sorted = Array.from(this.#store.entries()).sort((a, b) => a[1] - b[1]);
      for (let i = 0; i < drop; i += 1) this.#store.delete(sorted[i][0]);
    }

    this.#store.set(nonce, this.#now() + this.#ttlMs);
    return { accepted: true, alreadySeen: false };
  }

  /** @returns {number} */
  get size() {
    this.#evictExpired();
    return this.#store.size;
  }

  #evictExpired() {
    const t = this.#now();
    for (const [nonce, expiresAt] of this.#store) {
      if (expiresAt < t) this.#store.delete(nonce);
    }
  }
}
