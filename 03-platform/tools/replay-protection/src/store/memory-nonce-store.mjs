/**
 * @fileoverview In-Memory Nonce Store
 *
 * Suitable for dev, unit tests, and single-instance deployments.
 * NOT suitable for production clusters (nonces won't be shared across nodes).
 *
 * Uses a Map with lazy TTL eviction on read.
 */

import { NonceStore } from './nonce-store.mjs';

export class MemoryNonceStore extends NonceStore {
  /** @type {Map<string, number>} nonce -> expiration timestamp (epoch ms) */
  #store = new Map();
  /** @type {number} */
  #maxSize;

  /**
   * @param {object} [opts]
   * @param {number} [opts.maxSize=100_000] - Hard cap to prevent unbounded growth
   */
  constructor(opts = {}) {
    super();
    this.#maxSize = opts.maxSize ?? 100_000;
  }

  /** @param {string} nonce @param {number} ttlMs @returns {Promise<boolean>} */
  async checkAndSet(nonce, ttlMs) {
    this.#evictExpired();

    if (this.#store.has(nonce)) {
      return false;
    }

    // Hard cap: drop oldest 10% if at limit
    if (this.#store.size >= this.#maxSize) {
      const toDrop = Math.ceil(this.#maxSize * 0.1);
      const entries = Array.from(this.#store.entries()).sort((a, b) => a[1] - b[1]);
      for (let i = 0; i < toDrop; i++) {
        this.#store.delete(entries[i][0]);
      }
    }

    const expiresAt = Date.now() + ttlMs;
    this.#store.set(nonce, expiresAt);
    return true;
  }

  /** @param {string} nonce @returns {Promise<boolean>} */
  async has(nonce) {
    const expiresAt = this.#store.get(nonce);
    if (!expiresAt) return false;
    if (Date.now() > expiresAt) {
      this.#store.delete(nonce);
      return false;
    }
    return true;
  }

  /** @param {string} nonce @returns {Promise<void>} */
  async delete(nonce) {
    this.#store.delete(nonce);
  }

  async health() {
    return true;
  }

  /** @returns {number} */
  get size() {
    this.#evictExpired();
    return this.#store.size;
  }

  #evictExpired() {
    const now = Date.now();
    for (const [nonce, expiresAt] of this.#store) {
      if (now > expiresAt) {
        this.#store.delete(nonce);
      }
    }
  }
}
