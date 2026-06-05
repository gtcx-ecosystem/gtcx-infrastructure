/**
 * @fileoverview Redis Nonce Store
 *
 * Production-grade nonce storage using Redis SET with NX (set if not exists)
 * and PX (millisecond expiry). This gives atomic check-and-set semantics.
 *
 * Requires:
 *   - Redis >= 6.0 (for PX option)
 *   - redis npm package (peer dependency)
 *
 * Principles: RESILIENT (P12), SECURE (P11)
 */

import { NonceStore } from './nonce-store.mjs';

export class RedisNonceStore extends NonceStore {
  /** @type {import('redis').RedisClientType | null} */
  #client = null;
  /** @type {string} */
  #keyPrefix;

  /**
   * @param {object} opts
   * @param {import('redis').RedisClientType} opts.client - Connected Redis client
   * @param {string} [opts.keyPrefix='replay:nonce'] - Redis key prefix
   */
  constructor(opts) {
    super();
    if (!opts.client) {
      throw new TypeError('RedisNonceStore requires opts.client');
    }
    this.#client = opts.client;
    this.#keyPrefix = opts.keyPrefix ?? 'replay:nonce';
  }

  /** @param {string} nonce @param {number} ttlMs @returns {Promise<boolean>} */
  async checkAndSet(nonce, ttlMs) {
    const key = this.#key(nonce);
    // SET key value NX PX ms  ->  returns "OK" on success, null on key exists
    const result = await this.#client?.set(key, '1', {
      NX: true,
      PX: Math.max(1, Math.floor(ttlMs)),
    });
    return result === 'OK';
  }

  /** @param {string} nonce @returns {Promise<boolean>} */
  async has(nonce) {
    const key = this.#key(nonce);
    const result = await this.#client?.exists(key);
    return result === 1;
  }

  /** @param {string} nonce @returns {Promise<void>} */
  async delete(nonce) {
    const key = this.#key(nonce);
    await this.#client?.del(key);
  }

  async health() {
    try {
      await this.#client?.ping();
      return true;
    } catch {
      return false;
    }
  }

  /** @param {string} nonce */
  #key(nonce) {
    return `${this.#keyPrefix}:${nonce}`;
  }
}
