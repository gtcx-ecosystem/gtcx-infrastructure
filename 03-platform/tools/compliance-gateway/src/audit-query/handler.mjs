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
 * @property {(token: string) => { ok: true, tenantId?: string, subject?: string } | { ok: false, error: string }} [validateToken]
 *   Optional token validator. If absent, any non-empty bearer is
 *   accepted (staging behavior). Production wires the real
 *   gateway-side validator. May surface `tenantId` (fallback when no
 *   X-GTCX-Tenant-Id header) and `subject` (actor for the audit-of-
 *   the-query record).
 * @property {(event: object) => void} [signAuditEvent] - Optional
 *   injectable audit-of-the-query signer. When provided, an
 *   `audit-query.served` record is signed into our own audit chain
 *   on every 200 response so reads against the audit corpus are
 *   themselves auditable (regulator who-asked-what trail). Handler
 *   tolerates the signer being absent (tests + staging).
 * @property {(metric: string, labels: object, value?: number) => void} [incrementCounter]
 *   Optional injectable Prometheus counter increment. When provided,
 *   the handler emits per-tenant request + outcome counters so
 *   operators can see query volume, error rates, and truncation rate
 *   on the audit-trust dashboard. Tolerates absent (tests + dev).
 * @property {(subject: string, tenantId?: string) => { ok: true } | { ok: false, status: number, reason: string, retryAfterSeconds?: number, limits?: object, spentUsd?: number } | Promise<{ ok: true } | { ok: false, status: number, reason: string, retryAfterSeconds?: number, limits?: object, spentUsd?: number }>} [checkBudget]
 *   Optional per-principal QPS/budget gate shared with `/v1/query`.
 *
 * @typedef {object} HandleResult
 * @property {number} status
 * @property {object} body
 */

export async function processQuery(args) {
  const inc = typeof args.incrementCounter === 'function' ? args.incrementCounter : noopCounter;

  // 1. Method
  if (args.method !== 'POST') {
    inc('compliance_gateway_audit_query_requests_total', { status: '405', tenantId: 'unknown' });
    return { status: 405, body: { error: 'Method not allowed' } };
  }

  // 2. Bearer auth — extract token + validate
  const auth = args.headers['authorization'] ?? '';
  const bearerMatch = auth.match(/^Bearer\s+(.+)$/i);
  if (!bearerMatch) {
    inc('compliance_gateway_audit_query_requests_total', { status: '401', tenantId: 'unknown' });
    return { status: 401, body: { error: 'Bearer token required' } };
  }
  const token = bearerMatch[1].trim();
  if (token.length === 0) {
    inc('compliance_gateway_audit_query_requests_total', { status: '401', tenantId: 'unknown' });
    return { status: 401, body: { error: 'Bearer token required' } };
  }
  let tokenTenant;
  let tokenSubject;
  if (typeof args.validateToken === 'function') {
    const v = args.validateToken(token);
    if (!v.ok) {
      inc('compliance_gateway_audit_query_requests_total', { status: '401', tenantId: 'unknown' });
      return { status: 401, body: { error: v.error } };
    }
    tokenTenant = v.tenantId;
    tokenSubject = v.subject;
  }
  // (else: staging mode — accept any non-empty bearer)

  // 3. Tenant resolution.
  //
  // When the validator supplies a token-bound tenant, that binding wins:
  // a header-supplied tenant is permitted ONLY if it matches the token's
  // tenant. Any mismatch is a horizontal-privilege attempt → 403. This
  // closes the prior bypass where a header overrode the principal's
  // tenant binding (`tenantId = headerTenant ?? tokenTenant`).
  //
  // When the validator is absent (legacy/staging path), fall back to the
  // header so existing callers continue to work.
  const headerTenant = args.headers['x-gtcx-tenant-id'];
  let tenantId;
  if (tokenTenant) {
    if (headerTenant && headerTenant !== tokenTenant) {
      inc('compliance_gateway_audit_query_requests_total', {
        status: '403',
        tenantId: tokenTenant,
      });
      return {
        status: 403,
        body: {
          error: 'tenant-mismatch',
          detail: 'X-GTCX-Tenant-Id does not match token-bound tenant',
        },
      };
    }
    tenantId = tokenTenant;
  } else {
    tenantId = headerTenant;
  }
  if (typeof tenantId !== 'string' || tenantId.length === 0) {
    inc('compliance_gateway_audit_query_requests_total', { status: '400', tenantId: 'unknown' });
    return {
      status: 400,
      body: {
        error: 'tenant-required',
        detail: 'X-GTCX-Tenant-Id header or token-bound tenant required',
      },
    };
  }
  if (!/^[a-z]{2}$/.test(tenantId)) {
    inc('compliance_gateway_audit_query_requests_total', { status: '400', tenantId: 'unknown' });
    return {
      status: 400,
      body: {
        error: 'tenant-malformed',
        detail: 'X-GTCX-Tenant-Id must be lowercase ISO-2 country code',
      },
    };
  }

  const budgetSubject = tokenSubject ?? `audit-query:${tenantId}`;
  const budgetCheck =
    typeof args.checkBudget === 'function'
      ? await args.checkBudget(budgetSubject, tenantId)
      : { ok: true };
  if (!budgetCheck.ok) {
    inc('compliance_gateway_audit_query_requests_total', {
      status: String(budgetCheck.status ?? 429),
      tenantId,
    });
    return {
      status: budgetCheck.status ?? 429,
      body: {
        error:
          budgetCheck.reason === 'qps'
            ? 'Rate limit exceeded for this principal'
            : 'Daily audit query budget exceeded for this principal',
        retryAfterSeconds: budgetCheck.retryAfterSeconds,
        limits: budgetCheck.limits,
        spentUsd: budgetCheck.spentUsd,
      },
    };
  }

  // 4. Body parse
  let parsed;
  if (args.body && args.body.trim().length > 0) {
    let json;
    try {
      json = JSON.parse(args.body);
    } catch (err) {
      inc('compliance_gateway_audit_query_requests_total', { status: '400', tenantId });
      return {
        status: 400,
        body: { error: 'invalid-json', detail: err?.message ?? 'JSON parse error' },
      };
    }
    const result = QueryAuditRequestSchema.safeParse(json);
    if (!result.success) {
      inc('compliance_gateway_audit_query_requests_total', { status: '400', tenantId });
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
    inc('compliance_gateway_audit_query_requests_total', { status: '500', tenantId });
    return {
      status: 500,
      body: { error: 'store-failed', detail: err?.message ?? 'store error' },
    };
  }

  // 6. Response shaping per mobile Q9
  // totalMatched = events returned + 1 if more (= min(actual, limit + 1))
  const totalMatched = storeResult.events.length + (storeResult.hasMore ? 1 : 0);

  // 7. Sign audit-of-the-query record so reads against the audit corpus
  // are themselves auditable (regulator who-asked-what trail). Closes
  // the consistency gap with /audit/bundles audit-bundle.received
  // signing. Tolerates the signer being absent for tests + staging.
  if (typeof args.signAuditEvent === 'function') {
    try {
      args.signAuditEvent({
        actor: tokenSubject ?? 'bearer-anon',
        action: 'audit-query.served',
        target: `/audit/query#tenant=${tenantId}`,
        payload: {
          tenantId,
          filter: {
            agentId: parsed.agentId ?? null,
            actorDid: parsed.actorDid ?? null,
            outcome: parsed.outcome ?? null,
            from: parsed.from ?? null,
            to: parsed.to ?? null,
            limit: parsed.limit ?? null,
          },
          eventsReturned: storeResult.events.length,
          truncated: storeResult.hasMore,
        },
      });
    } catch (err) {
      // Don't fail the request if audit signing fails; the response
      // to the caller is already determined. Log via stderr.
      console.error(
        JSON.stringify({
          level: 'error',
          type: 'audit-query.internalAuditSignFailed',
          tenantId,
          error: err?.message,
        })
      );
    }
  }

  inc('compliance_gateway_audit_query_requests_total', { status: '200', tenantId });
  inc(
    'compliance_gateway_audit_query_events_served_total',
    { tenantId },
    storeResult.events.length
  );
  if (storeResult.hasMore) {
    inc('compliance_gateway_audit_query_truncated_total', { tenantId });
  }

  return {
    status: 200,
    body: {
      events: storeResult.events,
      totalMatched,
      truncated: storeResult.hasMore,
    },
  };
}

function noopCounter() {
  // No-op when no Prometheus counter is wired (tests, dev).
}
