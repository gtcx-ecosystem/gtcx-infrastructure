/**
 * @fileoverview Auth Failure Logger
 *
 * Structured JSON logging for every replay-protection rejection.
 * Integrates with existing GTCX logging conventions (ECS-compatible fields).
 *
 * Principles: AUDITABLE (P3), OBSERVABLE (P15)
 */

/**
 * @param {object} entry
 * @param {string} entry.level
 * @param {string} entry.type
 * @param {string} [entry.nonce]
 * @param {string} [entry.did]
 * @param {string} [entry.reason]
 * @param {string} [entry.code]
 * @param {string} [entry.remoteAddress]
 * @param {string} [entry.userAgent]
 * @param {string} [entry.requestId]
 * @param {string} [entry.region]
 * @param {object} [entry.extra]
 */
export function logAuthFailure(entry) {
  const logLine = JSON.stringify({
    '@timestamp': new Date().toISOString(),
    'log.level': entry.level,
    'event.type': entry.type,
    'event.category': 'authentication',
    'event.outcome': 'failure',
    'gtcx.replay.nonce': entry.nonce,
    'gtcx.replay.did': entry.did,
    'gtcx.replay.reason': entry.reason,
    'gtcx.replay.code': entry.code,
    'source.ip': entry.remoteAddress,
    'user_agent.original': entry.userAgent,
    'trace.id': entry.requestId,
    'gtcx.region': entry.region,
    ...entry.extra,
  });

   
  console.error(logLine);
}
