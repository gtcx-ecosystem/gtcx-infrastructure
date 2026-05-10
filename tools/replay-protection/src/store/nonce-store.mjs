/**
 * @fileoverview Nonce Store Interface
 *
 * Abstracts nonce storage so verifiers can run in-memory (dev/test),
 * Redis (production clustered), or another backend.
 *
 * Principles: RESILIENT (P12), SECURE (P11)
 */

/**
 * @abstract
 */
export class NonceStore {
  /**
   * Check whether a nonce has been seen before.
   * Must be atomic (check + set) in production implementations.
   *
   * @param {string} _nonce - Hex-encoded nonce
   * @param {number} _ttlMs - Time-to-live in milliseconds
   * @returns {Promise<boolean>} true if nonce is new and stored, false if already seen
   */
  async checkAndSet(_nonce, _ttlMs) {
    throw new Error('NonceStore#checkAndSet must be implemented');
  }

  /**
   * Peek without storing. Used for metrics / diagnostics only.
   *
   * @param {string} _nonce
   * @returns {Promise<boolean>} true if nonce already exists
   */
  async has(_nonce) {
    throw new Error('NonceStore#has must be implemented');
  }

  /**
   * Explicitly remove a nonce (useful for testing or emergency purge).
   *
   * @param {string} _nonce
   * @returns {Promise<void>}
   */
  async delete(_nonce) {
    throw new Error('NonceStore#delete must be implemented');
  }

  /**
   * Health check. Returns true if the store is reachable.
   *
   * @returns {Promise<boolean>}
   */
  async health() {
    return true;
  }
}
