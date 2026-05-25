/**
 * NDJSON-file-backed query store.
 *
 * Reads NDJSON event files from a tenant-partitioned directory:
 *
 *   <root>/<tenantId>/*.ndjson
 *
 * Same shape audit-flush writes to WORM S3 — `<root>` is the local
 * stand-in for the WORM bucket. Per-file mtime is cached so we only
 * re-parse on change.
 *
 * Production swaps for a real WORM-backed store reading the same
 * NDJSON via S3 GetObject + range reads. Until that AWS integration
 * lands, this store gives staging a durable, restart-survivable
 * substitute for `InMemoryQueryStore`.
 *
 * Tenant isolation is structural — store.query() reads only from
 * `<root>/<tenantId>/`, never across tenant prefixes. Same property
 * as ADR-015's per-tenant WORM prefix model.
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { applyFilter } from './store.mjs';

/**
 * @typedef {import('./schemas.mjs').AgentOutputEvent} AgentOutputEvent
 * @typedef {import('./store.mjs').QueryFilter} QueryFilter
 *
 * @typedef {object} NdjsonStoreOptions
 * @property {string} rootDir   - Absolute path. Must exist or fileExistenceMode=lazy.
 * @property {'strict'|'lazy'} [fileExistenceMode='strict']
 *   strict: throw on missing root. lazy: treat as empty.
 * @property {(line: string, fp: string, lineNo: number) => void} [onParseError]
 *   Called per malformed line. Default: log to stderr. Override for tests.
 */

export class NdjsonQueryStore {
  #rootDir;
  #fileExistenceMode;
  #onParseError;
  /** @type {Map<string, { mtimeMs: number, events: AgentOutputEvent[] }>} */
  #fileCache = new Map();

  constructor(opts) {
    if (!opts?.rootDir) {
      throw new TypeError('NdjsonQueryStore requires opts.rootDir');
    }
    this.#rootDir = opts.rootDir;
    this.#fileExistenceMode = opts.fileExistenceMode ?? 'strict';
    this.#onParseError = opts.onParseError ?? defaultParseErrorLogger;

    if (this.#fileExistenceMode === 'strict' && !existsSync(this.#rootDir)) {
      throw new Error(`NdjsonQueryStore: rootDir does not exist: ${this.#rootDir}`);
    }
  }

  /**
   * Per the same contract as InMemoryQueryStore: returns
   * { events, hasMore } with min(matched, limit+1) semantics.
   *
   * @param {QueryFilter} filter
   * @returns {Promise<{ events: AgentOutputEvent[], hasMore: boolean }>}
   */
  async query(filter) {
    if (typeof filter.tenantId !== 'string' || filter.tenantId.length === 0) {
      throw new TypeError('query() requires a tenantId for tenant isolation');
    }
    const tenantEvents = this.#readTenantEvents(filter.tenantId);
    const filtered = applyFilter(tenantEvents, filter);
    const limit = filter.limit ?? 100;
    const sliced = filtered.slice(0, limit + 1);
    const hasMore = sliced.length > limit;
    return {
      events: hasMore ? sliced.slice(0, limit) : sliced,
      hasMore,
    };
  }

  /**
   * Read all events for a tenant. Caches per-file by mtime; re-parses
   * only on change.
   * @param {string} tenantId
   * @returns {AgentOutputEvent[]}
   */
  #readTenantEvents(tenantId) {
    const tenantDir = join(this.#rootDir, tenantId);
    if (!existsSync(tenantDir)) return [];

    const all = [];
    for (const name of readdirSync(tenantDir)) {
      if (!name.endsWith('.ndjson')) continue;
      const fp = join(tenantDir, name);
      const stat = statSync(fp);
      const cached = this.#fileCache.get(fp);
      if (cached && cached.mtimeMs === stat.mtimeMs) {
        all.push(...cached.events);
        continue;
      }
      const events = this.#parseFile(fp);
      this.#fileCache.set(fp, { mtimeMs: stat.mtimeMs, events });
      all.push(...events);
    }
    return all;
  }

  /**
   * Parse an NDJSON file — one JSON object per line.
   * Malformed lines are skipped (per-line error reported via onParseError);
   * the rest of the file still parses. WORM batches written by
   * audit-flush should never be malformed, but the staging stand-in
   * accepts hand-edited fixtures so we tolerate human error.
   * @param {string} fp
   * @returns {AgentOutputEvent[]}
   */
  #parseFile(fp) {
    const content = readFileSync(fp, 'utf8');
    const events = [];
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i].trim();
      if (line.length === 0) continue;
      try {
        events.push(JSON.parse(line));
      } catch {
        this.#onParseError(line, fp, i + 1);
      }
    }
    return events;
  }

  /**
   * Force-invalidate the file cache. Useful in tests after writing a
   * fixture file in the same millisecond as the previous read.
   */
  invalidate() {
    this.#fileCache.clear();
  }
}

function defaultParseErrorLogger(line, fp, lineNo) {
  console.error(JSON.stringify({
    level: 'warn',
    type: 'ndjson-store.parseError',
    file: fp,
    lineNo,
    linePreview: line.length > 80 ? `${line.slice(0, 80)}…` : line,
  }));
}
