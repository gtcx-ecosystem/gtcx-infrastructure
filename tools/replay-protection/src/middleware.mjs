/**
 * @fileoverview Replay Guard Middleware
 *
 * Drop-in Express / Connect / Fastify middleware that parses X-GTCX-*
 * headers and rejects replayed, stale, or tampered requests before they
 * reach application handlers.
 *
 * Usage (Express):
 *   import { replayGuardMiddleware } from '@gtcx/replay-protection/middleware';
 *   app.use(replayGuardMiddleware({ nonceStore, verifySignature: myDidVerify }));
 *
 * Usage (Fastify):
 *   import { replayGuardMiddleware } from '@gtcx/replay-protection/middleware';
 *   fastify.addHook('onRequest', replayGuardMiddleware({ ... }));
 *
 * Principles: SECURE (P11), RESILIENT (P12)
 */

import { defaultAuditCapture } from './audit/audit-capture.mjs';
import { defaultMetrics } from './metrics/replay-metrics.mjs';
import { ReplayVerifier } from './verifier.mjs';

/**
 * @typedef {object} MiddlewareOptions
 * @property {import('./store/nonce-store.mjs').NonceStore} nonceStore
 * @property {Function} [verifySignature]
 * @property {import('./metrics/replay-metrics.mjs').ReplayMetrics} [metrics]
 * @property {import('./audit/audit-capture.mjs').AuditCapture} [auditCapture]
 * @property {number} [nonceTtlMs]
 * @property {import('./policy/clock-skew.mjs').ClockSkewPolicy} [clockSkewPolicy]
 * @property {boolean} [logFailures]
 * @property {string[]} [exemptPaths] - Regex strings or exact paths to skip (e.g. ["/health", "/metrics"])
 * @property {boolean} [skipHashVerification] - For bootstrap / migration only
 */

/**
 * @typedef {{
 *   body?: unknown,
 *   gtcxReplayAudit?: import('./types').AuditEvent,
 *   headers: Record<string, string | string[] | undefined>,
 *   id?: string,
 *   ip?: string,
 *   method?: string,
 *   originalUrl?: string,
 *   path?: string,
 *   protocol?: string,
 *   socket?: { remoteAddress?: string },
 *   url?: string,
 * }} ReplayMiddlewareRequest
 *
 * @typedef {{
 *   end(body: string): void,
 *   setHeader(name: string, value: string): void,
 *   statusCode: number,
 * }} ReplayMiddlewareResponse
 *
 * @typedef {() => void} ReplayMiddlewareNext
 */

/**
 * @param {Record<string, string | string[] | undefined>} headers
 * @returns {Record<string, string>}
 */
function normalizeRequestHeaders(headers) {
  return Object.fromEntries(
    Object.entries(headers)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return [key, value[0] ?? ''];
        }
        return [key, value ?? ''];
      })
  );
}

/**
 * @param {Record<string, string | string[] | undefined>} headers
 * @param {string} name
 * @returns {string}
 */
function readHeader(headers, name) {
  const value = headers[name];
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

/**
 * @param {MiddlewareOptions} opts
 * @returns {(req: ReplayMiddlewareRequest, res: ReplayMiddlewareResponse, next: ReplayMiddlewareNext) => Promise<void>}
 */
export function replayGuardMiddleware(opts) {
  const verifier = new ReplayVerifier({
    nonceStore: opts.nonceStore,
    verifySignature: opts.verifySignature ?? undefined,
    metrics: opts.metrics ?? defaultMetrics,
    auditCapture: opts.auditCapture ?? defaultAuditCapture,
    nonceTtlMs: opts.nonceTtlMs,
    clockSkewPolicy: opts.clockSkewPolicy,
    logFailures: opts.logFailures,
    skipHashVerification: opts.skipHashVerification ?? false,
  });

  const exempt = new Set(opts.exemptPaths ?? ['/health', '/metrics', '/_next']);

  return async (req, res, next) => {
    const path = req.url ?? req.originalUrl ?? req.path ?? '/';
    if (exempt.has(path)) {
      next();
      return;
    }

    // Only protect authenticated routes that carry mobile headers
    const nonce = req.headers['x-gtcx-nonce'];
    if (!nonce) {
      next();
      return;
    }

    /** @type {import('./types').QueueIntegrity} */
    const integrity = {
      scheme: readHeader(req.headers, 'x-gtcx-auth-scheme'),
      did: readHeader(req.headers, 'x-gtcx-did'),
      keyId: readHeader(req.headers, 'x-gtcx-key-id'),
      audience: readHeader(req.headers, 'x-gtcx-audience'),
      bodyHash: readHeader(req.headers, 'x-gtcx-body-sha256'),
      headersHash: readHeader(req.headers, 'x-gtcx-headers-hash'),
      timestamp: readHeader(req.headers, 'x-gtcx-timestamp'),
      nonce: String(nonce),
      signature: readHeader(req.headers, 'x-gtcx-signature'),
      envelopeHash: readHeader(req.headers, 'x-gtcx-envelope-hash'),
    };

    const requestData = {
      body: req.body ?? null,
      headers: normalizeRequestHeaders(req.headers ?? {}),
      method: req.method ?? 'GET',
      url: `${req.protocol ?? 'http'}://${req.headers.host ?? 'localhost'}${req.originalUrl ?? req.url ?? '/'}`,
    };

    const context = {
      region: readHeader(req.headers, 'x-gtcx-region') || undefined,
      requestId: readHeader(req.headers, 'x-request-id') || req.id,
      deviceId: readHeader(req.headers, 'x-gtcx-device-id') || undefined,
      remoteAddress: req.ip ?? req.socket?.remoteAddress,
      userAgent: readHeader(req.headers, 'user-agent') || undefined,
    };

    const result = await verifier.verify(integrity, requestData, context);

    if (!result.allowed) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'Replay protection rejection',
        code: result.code,
        reason: result.reason,
        auditEventId: result.auditEvent?.eventId,
      }));
      return;
    }

    // Attach audit event to request for downstream handlers
    req.gtcxReplayAudit = result.auditEvent;
    next();
  };
}
