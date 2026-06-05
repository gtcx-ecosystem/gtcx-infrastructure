/**
 * Query store interface + in-memory implementation.
 *
 * Production wires a WORM-backed store that reads from the same
 * NDJSON batches the audit-flush sidecar writes. Until that ingestion
 * path is live (gated by EXT-003 + the feat/audit-bundles-verifier
 * PR), this in-memory store serves as the substitute.
 *
 * The handler depends only on the store's `query(filter)` method, so
 * swap is a one-file change in server.mjs.
 */

/**
 * @typedef {import('./schemas.mjs').AgentOutputEvent} AgentOutputEvent
 *
 * @typedef {object} QueryFilter
 * @property {string} [agentId]
 * @property {string} [actorDid]    - Matched against event.metadata.actorDid
 * @property {('continue'|'complete'|'escalate'|'failure')} [outcome]
 * @property {string} [from]        - ISO 8601 inclusive lower bound
 * @property {string} [to]          - ISO 8601 inclusive upper bound
 * @property {string} tenantId      - REQUIRED. Per-tenant isolation via ADR-015.
 */

/**
 * Apply a QueryFilter to a list of events. Pure function — sortable,
 * testable, no I/O.
 *
 * @param {AgentOutputEvent[]} events
 * @param {QueryFilter} filter
 * @returns {AgentOutputEvent[]}
 */
export function applyFilter(events, filter) {
  return events
    .filter((e) => {
      if (filter.agentId && e.agentId !== filter.agentId) return false;
      if (filter.actorDid && e?.metadata?.actorDid !== filter.actorDid) return false;
      if (filter.outcome && e.outcome !== filter.outcome) return false;
      if (filter.from && e.timestamp < filter.from) return false;
      if (filter.to && e.timestamp > filter.to) return false;
      return true;
    })
    .sort((a, b) => (b.timestamp < a.timestamp ? -1 : b.timestamp > a.timestamp ? 1 : 0));
}

/**
 * In-memory store. Tenants map to independent event arrays — same
 * structural isolation property as the per-tenant WORM prefix model.
 */
export class InMemoryQueryStore {
  /** @type {Map<string, AgentOutputEvent[]>} tenantId -> events */
  #byTenant = new Map();

  /**
   * Insert events for a tenant. Test/seed helper; the production store
   * populates itself from the audit-bundles ingestion path.
   * @param {string} tenantId
   * @param {AgentOutputEvent[]} events
   */
  seed(tenantId, events) {
    const existing = this.#byTenant.get(tenantId) ?? [];
    this.#byTenant.set(tenantId, existing.concat(events));
  }

  /**
   * Query events for the given filter. Tenant isolation is structural:
   * we only ever look at this.#byTenant[filter.tenantId], never across.
   *
   * Returns `min(matched, limit + 1)` items so the handler can detect
   * truncation without doing a separate count query (per the mobile
   * team's Q9 answer recorded on issue #52).
   *
   * @param {QueryFilter} filter
   * @returns {Promise<{ events: AgentOutputEvent[], hasMore: boolean }>}
   */
  async query(filter) {
    if (typeof filter.tenantId !== 'string' || filter.tenantId.length === 0) {
      throw new TypeError('query() requires a tenantId for tenant isolation');
    }
    const tenantEvents = this.#byTenant.get(filter.tenantId) ?? [];
    const filtered = applyFilter(tenantEvents, filter);
    const limit = filter.limit ?? 100;
    // Take limit + 1 so the caller can set truncated=true if we hit the cap
    const sliced = filtered.slice(0, limit + 1);
    const hasMore = sliced.length > limit;
    return {
      events: hasMore ? sliced.slice(0, limit) : sliced,
      hasMore,
    };
  }

  /**
   * Total tenant event count. Used by tests; never exposed via the
   * handler (per Q9 — `totalMatched` semantics use min(matched, limit+1)
   * not an exact count).
   * @param {string} tenantId
   * @returns {number}
   */
  sizeOf(tenantId) {
    return (this.#byTenant.get(tenantId) ?? []).length;
  }
}
