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
 * @param {MiddlewareOptions} opts
 * @returns {(req: any, res: any, next: Function) => Promise<void>}
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
      scheme: req.headers['x-gtcx-auth-scheme'] ?? '',
      did: req.headers['x-gtcx-did'] ?? '',
      keyId: req.headers['x-gtcx-key-id'] ?? '',
      audience: req.headers['x-gtcx-audience'] ?? '',
      bodyHash: req.headers['x-gtcx-body-sha256'] ?? '',
      headersHash: req.headers['x-gtcx-headers-hash'] ?? '',
      timestamp: req.headers['x-gtcx-timestamp'] ?? '',
      nonce: String(nonce),
      signature: req.headers['x-gtcx-signature'] ?? '',
      envelopeHash: req.headers['x-gtcx-envelope-hash'] ?? '',
    };

    const requestData = {
      body: req.body ?? null,
      headers: req.headers ?? {},
      method: req.method ?? 'GET',
      url: `${req.protocol ?? 'http'}://${req.headers.host ?? 'localhost'}${req.originalUrl ?? req.url ?? '/'}`,
    };

    const context = {
      region: req.headers['x-gtcx-region'],
      requestId: req.headers['x-request-id'] ?? req.id,
      deviceId: req.headers['x-gtcx-device-id'],
      remoteAddress: req.ip ?? req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
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
