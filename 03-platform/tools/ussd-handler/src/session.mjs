/**
 * @fileoverview USSD Session State Management
 *
 * Redis-backed session store with memory fallback for tests and local dev.
 * Each session is a hash keyed by `ussd:session:<sessionId>` with TTL.
 */

import { config } from './config.mjs';

// ---------------------------------------------------------------------------
// Abstract interface
// ---------------------------------------------------------------------------

export class SessionStore {
  /**
   * @param {string} sessionId
   * @returns {Promise<Record<string, string> | null>}
   */
  async getSession(_sessionId) {
    throw new Error('Not implemented');
  }

  /**
   * @param {string} sessionId
   * @param {Record<string, string>} data
   * @returns {Promise<void>}
   */
  async setSession(_sessionId, _data) {
    throw new Error('Not implemented');
  }

  /**
   * @param {string} sessionId
   * @returns {Promise<void>}
   */
  async deleteSession(_sessionId) {
    throw new Error('Not implemented');
  }
}

// ---------------------------------------------------------------------------
// Memory implementation (tests + local dev)
// ---------------------------------------------------------------------------

export class MemorySessionStore extends SessionStore {
  constructor({ ttlSeconds = config.sessionTtlSeconds } = {}) {
    super();
    this.sessions = new Map();
    this.timers = new Map();
    this.ttlSeconds = ttlSeconds;
  }

  async getSession(sessionId) {
    const data = this.sessions.get(sessionId);
    if (!data) return null;
    // Refresh TTL on access
    this._refreshTimer(sessionId);
    return { ...data };
  }

  async setSession(sessionId, data) {
    this.sessions.set(sessionId, { ...data });
    this._refreshTimer(sessionId);
  }

  async deleteSession(sessionId) {
    this.sessions.delete(sessionId);
    const timer = this.timers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(sessionId);
    }
  }

  _refreshTimer(sessionId) {
    const existing = this.timers.get(sessionId);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      this.sessions.delete(sessionId);
      this.timers.delete(sessionId);
    }, this.ttlSeconds * 1000);
    this.timers.set(sessionId, timer);
  }

  /** @returns {number} */
  get size() {
    return this.sessions.size;
  }
}

// ---------------------------------------------------------------------------
// Redis implementation (production)
// ---------------------------------------------------------------------------

export class RedisSessionStore extends SessionStore {
  constructor({ redisUrl = config.redisUrl, ttlSeconds = config.sessionTtlSeconds } = {}) {
    super();
    if (!redisUrl) {
      throw new Error('REDIS_URL is required for RedisSessionStore');
    }
    this.redisUrl = redisUrl;
    this.ttlSeconds = ttlSeconds;
    this.client = null;
  }

  async connect() {
    if (this.client) return;
    // Dynamic import so ioredis is not required for tests using MemorySessionStore
    const { Redis } = await import('ioredis');
    this.client = new Redis(this.redisUrl);
  }

  async getSession(sessionId) {
    await this.connect();
    const result = await this.client.hgetall(`ussd:session:${sessionId}`);
    if (!result || Object.keys(result).length === 0) return null;
    return result;
  }

  async setSession(sessionId, data) {
    await this.connect();
    const key = `ussd:session:${sessionId}`;
    const pipeline = this.client.pipeline();
    pipeline.del(key);
    for (const [field, value] of Object.entries(data)) {
      pipeline.hset(key, field, String(value));
    }
    pipeline.expire(key, this.ttlSeconds);
    await pipeline.exec();
  }

  async deleteSession(sessionId) {
    await this.connect();
    await this.client.del(`ussd:session:${sessionId}`);
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createSessionStore() {
  if (config.redisUrl) {
    return new RedisSessionStore();
  }
  return new MemorySessionStore();
}
