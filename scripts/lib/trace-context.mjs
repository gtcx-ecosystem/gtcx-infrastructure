/**
 * SIGNAL INF-007 — trace correlation helpers for agent + gateway paths.
 */
import { randomUUID } from 'node:crypto';

/**
 * @param {string | undefined} incoming
 * @returns {string}
 */
export function resolveTraceId(incoming) {
  if (incoming && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(incoming)) {
    return incoming;
  }
  return randomUUID();
}

/**
 * @param {{ traceId: string, service?: string, operation?: string }} ctx
 */
export function traceSpanMarker(ctx) {
  return {
    'gtcx.trace_id': ctx.traceId,
    'gtcx.service': ctx.service ?? 'gtcx-infrastructure',
    'gtcx.operation': ctx.operation ?? 'unknown',
    timestamp: new Date().toISOString(),
  };
}
