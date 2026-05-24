/**
 * POST /audit/query handler — pure function.
 *
 * Orchestrates the four checks in order:
 *
 *   1. Bearer auth — `Authorization: Bearer <token>`. Staging accepts
 *      any non-empty token (per the acceptance criterion on #52);
 *      production validation is pass-through to gtcx-platforms.
 *   2. Tenant resolution — X-GTCX-Tenant-Id (lowercase ISO-2 country
 *      code) drives per-tenant audit-namespace scoping per ADR-015.
 *   3. Body parse — Zod against QueryAuditRequestSchema. Empty body
 *      is valid (means "all filters off").
 *   4. Store query — pure delegation to the injected store.
 *
 * Response semantics:
 *   - `totalMatched` = min(actualMatched, limit + 1) (per mobile Q9)
 *   - `truncated` = true when hasMore (i.e. more events exist beyond
 *     the limit; the client should refine the filter)
 *   - `events` are stored as-received from ingest (mobile's 4-state
 *     `outcome` enum, no translation per Q10)
 */

import { QueryAuditRequestSchema } from './schemas.mjs';

/**
 * @typedef {object} HandleArgs
 * @property {string} method                              - HTTP method
 * @property {string} body                                - Raw request body
 * @property {Record<string, string>} headers             - Lowercased header map
 * @property {{ query: (filter: object) => Promise<{ events: object[], hasMore: boolean }> }} store
 * @property {(token: string) => { ok: true, tenantId?: string } | { ok: false, error: string }} [validateToken]
 *   Optional token validator. If absent, any non-empty bearer is
 *   accepted (staging behavior). Production wires the real
 *   gateway-side validator.
 *
 * @typedef {object} HandleResult
 * @property {number} status
 * @property {object} body
 */

export async function processQuery(args) {
  // 1. Method
  if (args.method !== 'POST') {
    return { status: 405, body: { error: 'Method not allowed' } };
  }

  // 2. Bearer auth — extract token + validate
  const auth = args.headers['authorization'] ?? '';
  const bearerMatch = auth.match(/^Bearer\s+(.+)$/i);
  if (!bearerMatch) {
    return { status: 401, body: { error: 'Bearer token required' } };
  }
  const token = bearerMatch[1].trim();
  if (token.length === 0) {
    return { status: 401, body: { error: 'Bearer token required' } };
  }
  let tokenTenant;
  if (typeof args.validateToken === 'function') {
    const v = args.validateToken(token);
    if (!v.ok) {
      return { status: 401, body: { error: v.error } };
    }
    tokenTenant = v.tenantId;
  }
  // (else: staging mode — accept any non-empty bearer)

  // 3. Tenant resolution. Header takes precedence; falls back to
  // the token's tenant claim if the validator provided one.
  const headerTenant = args.headers['x-gtcx-tenant-id'];
  const tenantId = headerTenant ?? tokenTenant;
  if (typeof tenantId !== 'string' || tenantId.length === 0) {
    return {
      status: 400,
      body: { error: 'tenant-required', detail: 'X-GTCX-Tenant-Id header or token-bound tenant required' },
    };
  }
  if (!/^[a-z]{2}$/.test(tenantId)) {
    return {
      status: 400,
      body: { error: 'tenant-malformed', detail: 'X-GTCX-Tenant-Id must be lowercase ISO-2 country code' },
    };
  }

  // 4. Body parse
  let parsed;
  if (args.body && args.body.trim().length > 0) {
    let json;
    try {
      json = JSON.parse(args.body);
    } catch (err) {
      return {
        status: 400,
        body: { error: 'invalid-json', detail: err?.message ?? 'JSON parse error' },
      };
    }
    const result = QueryAuditRequestSchema.safeParse(json);
    if (!result.success) {
      return {
        status: 400,
        body: { error: 'query-malformed', detail: result.error.issues },
      };
    }
    parsed = result.data;
  } else {
    parsed = {};
  }

  // 5. Store query
  let storeResult;
  try {
    storeResult = await args.store.query({ ...parsed, tenantId });
  } catch (err) {
    return {
      status: 500,
      body: { error: 'store-failed', detail: err?.message ?? 'store error' },
    };
  }

  // 6. Response shaping per mobile Q9
  // totalMatched = events returned + 1 if more (= min(actual, limit + 1))
  const totalMatched = storeResult.events.length + (storeResult.hasMore ? 1 : 0);
  return {
    status: 200,
    body: {
      events: storeResult.events,
      totalMatched,
      truncated: storeResult.hasMore,
    },
  };
}
