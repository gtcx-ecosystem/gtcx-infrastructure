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

import { posix as pathPosix } from 'node:path';

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
 * @property {string[]} [exemptPaths] - Exact paths or path prefixes to skip
 *   (e.g. ["/health", "/metrics", "/_next/"]). Matched as either exact
 *   equality OR prefix when the entry ends with `/`.
 * @property {boolean} [skipHashVerification] - For bootstrap / migration only
 * @property {boolean} [requireNonce] - When true (default), non-exempt
 *   paths without an X-GTCX-Nonce header are rejected with 401. The
 *   prior fail-open behavior (passthrough on missing nonce) is available
 *   by passing `false` and is intended ONLY for incremental rollouts
 *   where a downstream layer independently verifies replay protection.
 * @property {boolean} [requireSignature] - When true, the middleware
 *   refuses to construct without an explicit `verifySignature`. Defaults
 *   to true so a missing verifier is a config error, not a silent
 *   signature-bypass. Legacy/test code can opt out with `false`.
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
    Object.entries(headers).map(([key, value]) => {
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
 * @param {string} rawPath
 * @returns {boolean}
 */
function hasParentTraversal(rawPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    return true;
  }
  return /(?:^|[\\/])\.\.(?:[\\/]|$)/.test(decoded);
}

/**
 * Normalize a request path for exemption matching. Returns null when the
 * caller supplied a traversal-shaped path; those requests must go through
 * replay enforcement instead of exemption prefix matching.
 *
 * @param {string} rawPath
 * @returns {string | null}
 */
function pathForExemption(rawPath) {
  if (hasParentTraversal(rawPath)) return null;

  // `new URL(...).pathname` preserves percent-encoding of the path portion.
  // If decodeURIComponent(rawPath) succeeded above, the pathname (a subset
  // of rawPath with query/fragment stripped) will decode too — the inner
  // catch that used to live here was unreachable defensive code.
  const pathname = new URL(rawPath, 'http://localhost').pathname;
  const decodedPathname = decodeURIComponent(pathname);

  const normalized = pathPosix.normalize(decodedPathname.replace(/\\/g, '/'));
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

/**
 * @param {MiddlewareOptions} opts
 * @returns {(req: ReplayMiddlewareRequest, res: ReplayMiddlewareResponse, next: ReplayMiddlewareNext) => Promise<void>}
 */
export function replayGuardMiddleware(opts) {
  const requireSignature = opts.requireSignature ?? true;
  if (requireSignature && typeof opts.verifySignature !== 'function') {
    throw new TypeError(
      'replayGuardMiddleware: verifySignature is required (or pass requireSignature: false to opt out). ' +
        'Refusing to construct a middleware that silently skips signature verification.'
    );
  }

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

  const exemptList = opts.exemptPaths ?? ['/health', '/metrics', '/_next/'];
  const requireNonce = opts.requireNonce ?? true;

  // Path-match supports either exact equality OR prefix match for entries
  // ending in `/`. Set.has against the raw path was a bug — `/_next` did
  // not match `/_next/static/foo`.
  /**
   * @param {string} path
   * @returns {boolean}
   */
  function isExempt(path) {
    for (const entry of exemptList) {
      if (entry.endsWith('/')) {
        if (path === entry.slice(0, -1) || path.startsWith(entry)) return true;
      } else if (path === entry) {
        return true;
      }
    }
    return false;
  }

  return async (req, res, next) => {
    const path = pathForExemption(req.url ?? req.originalUrl ?? req.path ?? '/');
    if (path !== null && isExempt(path)) {
      next();
      return;
    }

    const nonce = req.headers['x-gtcx-nonce'];
    if (!nonce) {
      if (requireNonce) {
        // Fail-closed: previously this passthrough was the silent bypass
        // that let any non-exempt request skip every replay check.
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error: 'Replay protection rejection',
            code: 'REPLAY_NONCE_REQUIRED',
            reason: 'X-GTCX-Nonce header is required on this path',
          })
        );
        return;
      }
      // Legacy fail-open path — kept for incremental rollouts; requires
      // explicit opt-in via `requireNonce: false`.
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
      res.end(
        JSON.stringify({
          error: 'Replay protection rejection',
          code: result.code,
          reason: result.reason,
          auditEventId: result.auditEvent?.eventId,
        })
      );
      return;
    }

    // Attach audit event to request for downstream handlers
    req.gtcxReplayAudit = result.auditEvent;
    next();
  };
}
