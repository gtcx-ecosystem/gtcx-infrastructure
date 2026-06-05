/**
 * @fileoverview Replay Guard HTTP Service
 *
 * Standalone sidecar / service that verifies mobile signed-request contracts.
 * Endpoints:
 *   POST /v1/replay/verify  — verify a QueueIntegrity payload against request data
 *   GET  /health            — liveness + readiness
 *   GET  /metrics           — Prometheus exposition format
 *
 * Environment:
 *   REDIS_URL               — redis://host:port (required in production)
 *   NONCE_TTL_MS            — default 900000 (15 min)
 *   CLOCK_SKEW_WINDOW_MS    — default 300000 (5 min)
 *   LOW_CONN_BUFFER_MS      — default 600000 (10 min)
 *   MAX_FUTURE_MS           — default 120000 (2 min)
 *   OTLP_ENDPOINT           — http://host:port/v1/metrics (optional)
 *   OTLP_PUSH_INTERVAL_MS   — default 30000 (30 sec)
 *   PORT                    — default 8400
 *   HOST                    — optional listen host (default: all interfaces)
 *   NODE_ENV                — 'production' enables Redis default
 *
 * Principles: SECURE (P11), OBSERVABLE (P15), RESILIENT (P12)
 */

import { createServer, request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';

import { AuditCapture, consoleSink } from './audit/audit-capture.mjs';
import { verifyDidSignature, verifyDidSignatureStubBypass } from './crypto/did-verify.mjs';
import { ReplayMetrics } from './metrics/replay-metrics.mjs';
import { getTrafficBlockReason } from './runtime-policy.mjs';
import { MemoryNonceStore } from './store/memory-nonce-store.mjs';
import { RedisNonceStore } from './store/redis-nonce-store.mjs';
import { ReplayVerifier } from './verifier.mjs';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PORT = Number(process.env.PORT ?? 8400);
const HOST = process.env.HOST;
const NONCE_TTL_MS = Number(process.env.NONCE_TTL_MS ?? 15 * 60 * 1000);
const CLOCK_SKEW_WINDOW_MS = Number(process.env.CLOCK_SKEW_WINDOW_MS ?? 5 * 60 * 1000);
const LOW_CONN_BUFFER_MS = Number(process.env.LOW_CONN_BUFFER_MS ?? 10 * 60 * 1000);
const MAX_FUTURE_MS = Number(process.env.MAX_FUTURE_MS ?? 2 * 60 * 1000);
const OTLP_ENDPOINT = process.env.OTLP_ENDPOINT ?? '';
const OTLP_PUSH_INTERVAL_MS = Number(process.env.OTLP_PUSH_INTERVAL_MS ?? 30 * 1000);
const NODE_ENV = process.env.NODE_ENV ?? 'development';

// ---------------------------------------------------------------------------
// Store bootstrap — Redis is default in production, memory in dev/test
// ---------------------------------------------------------------------------

/** @type {import('./store/nonce-store.mjs').NonceStore} */
let nonceStore = new MemoryNonceStore();
/** @type {string | null} */
let trafficBlockReason = null;

/**
 * @param {unknown} error
 * @returns {string}
 */
function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

async function initRedis() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    trafficBlockReason = getTrafficBlockReason({
      nodeEnv: NODE_ENV,
      redisConfigured: false,
      redisConnected: false,
    });
    if (trafficBlockReason) {
      console.error(
        JSON.stringify({
          level: 'error',
          message: trafficBlockReason,
        })
      );
    }
    metrics.setRedisConnected(0);
    return false;
  }

  try {
    const { createClient } = await import('redis');
    const client = createClient({ url: redisUrl });
    await client.connect();
    nonceStore = new RedisNonceStore({ client, keyPrefix: 'replay:nonce' });
    trafficBlockReason = null;
    metrics.setRedisConnected(1);
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({ level: 'info', message: 'Redis nonce store connected', redisUrl })
    );
    return true;
  } catch (err) {
    metrics.setRedisConnected(0);
    trafficBlockReason = getTrafficBlockReason({
      nodeEnv: NODE_ENV,
      redisConfigured: true,
      redisConnected: false,
    });
    if (trafficBlockReason) {
      console.error(
        JSON.stringify({
          level: 'error',
          message: trafficBlockReason,
          error: errorMessage(err),
        })
      );
      return false;
    }

    console.error(
      JSON.stringify({
        level: 'warn',
        message: 'Redis unavailable, falling back to memory store',
        error: errorMessage(err),
      })
    );
    return false;
  }
}

// ---------------------------------------------------------------------------
// Verifier + Metrics + Audit
// ---------------------------------------------------------------------------

const metrics = new ReplayMetrics();
const auditCapture = new AuditCapture({ sinks: [consoleSink] });

const verifier = new ReplayVerifier({
  nonceStore,
  metrics,
  auditCapture,
  nonceTtlMs: NONCE_TTL_MS,
  clockSkewPolicy: {
    windowMs: CLOCK_SKEW_WINDOW_MS,
    lowConnectivityBufferMs: LOW_CONN_BUFFER_MS,
    maxFutureMs: MAX_FUTURE_MS,
    lowConnectivityRegions: ['global-south', 'rural', 'mesh', 'satellite'],
  },
  verifySignature: (() => {
    const allowStub = process.env.REPLAY_GUARD_ALLOW_STUB_SIGNATURE === 'true';
    if (allowStub && NODE_ENV === 'production') {
      console.error(
        JSON.stringify({
          level: 'error',
          type: 'auth.replay.signature.bypass.blocked',
          message:
            'REPLAY_GUARD_ALLOW_STUB_SIGNATURE=true is FORBIDDEN in production. Using real verification.',
        })
      );
      return verifyDidSignature;
    }
    return allowStub ? verifyDidSignatureStubBypass : verifyDidSignature;
  })(),
});

// ---------------------------------------------------------------------------
// OTLP Push
// ---------------------------------------------------------------------------

/** @type {ReturnType<typeof setInterval> | null} */
let otlpTimer = null;

function startOtlpPush() {
  if (!OTLP_ENDPOINT) return;

  otlpTimer = setInterval(async () => {
    const snap = metrics.snapshot();
    const payload = {
      resourceMetrics: [
        {
          resource: {
            attributes: [{ key: 'service.name', value: { stringValue: 'replay-guard' } }],
          },
          scopeMetrics: [
            {
              metrics: [
                {
                  name: 'replay_protection_total',
                  sum: {
                    dataPoints: [
                      {
                        asInt: snap.acceptedTotal,
                        attributes: [{ key: 'code', value: { stringValue: 'REPLAY_OK' } }],
                      },
                    ],
                  },
                },
                {
                  name: 'replay_protection_total',
                  sum: {
                    dataPoints: [
                      {
                        asInt: snap.rejectedNonceTotal,
                        attributes: [{ key: 'code', value: { stringValue: 'REPLAY_NONCE' } }],
                      },
                    ],
                  },
                },
                {
                  name: 'replay_protection_total',
                  sum: {
                    dataPoints: [
                      {
                        asInt: snap.rejectedStaleTotal,
                        attributes: [{ key: 'code', value: { stringValue: 'REPLAY_STALE' } }],
                      },
                    ],
                  },
                },
                {
                  name: 'replay_protection_total',
                  sum: {
                    dataPoints: [
                      {
                        asInt: snap.rejectedFutureTotal,
                        attributes: [{ key: 'code', value: { stringValue: 'REPLAY_FUTURE' } }],
                      },
                    ],
                  },
                },
                {
                  name: 'replay_protection_total',
                  sum: {
                    dataPoints: [
                      {
                        asInt: snap.rejectedSignatureTotal,
                        attributes: [{ key: 'code', value: { stringValue: 'REPLAY_SIGNATURE' } }],
                      },
                    ],
                  },
                },
                {
                  name: 'replay_protection_total',
                  sum: {
                    dataPoints: [
                      {
                        asInt: snap.rejectedEnvelopeTotal,
                        attributes: [{ key: 'code', value: { stringValue: 'REPLAY_ENVELOPE' } }],
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    try {
      const url = new URL(OTLP_ENDPOINT);
      const mod = url.protocol === 'https:' ? httpsRequest : httpRequest;
      const req = mod(
        url,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        (res) => {
          res.resume();
        }
      );
      req.on('error', () => {});
      req.write(JSON.stringify(payload));
      req.end();
    } catch (err) {
      // Best-effort push; don't crash the verifier on metrics failure.
      console.error(
        JSON.stringify({
          level: 'warn',
          message: 'OTLP metrics push skipped',
          error: errorMessage(err),
        })
      );
    }
  }, OTLP_PUSH_INTERVAL_MS);

  otlpTimer.unref?.();
}

function stopOtlpPush() {
  if (otlpTimer) {
    clearInterval(otlpTimer);
    otlpTimer = null;
  }
}

// ---------------------------------------------------------------------------
// HTTP Handlers
// ---------------------------------------------------------------------------

/** @param {import('node:http').IncomingMessage} req */
async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

/** @param {import('node:http').ServerResponse} res @param {number} status @param {unknown} body */
function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

/** @param {import('node:http').IncomingMessage} req @param {import('node:http').ServerResponse} res */
async function handleVerify(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  if (trafficBlockReason) {
    sendJson(res, 503, {
      allowed: false,
      code: 'REPLAY_STORE_UNAVAILABLE',
      reason: trafficBlockReason,
    });
    return;
  }

  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON' });
    return;
  }

  // Accept either full QueueIntegrity payload or X-GTCX-* header map
  /** @type {import('./types').QueueIntegrity} */
  const integrity = body.integrity ?? {
    scheme: body['x-gtcx-auth-scheme'] ?? body.scheme,
    did: body['x-gtcx-did'] ?? body.did,
    keyId: body['x-gtcx-key-id'] ?? body.keyId,
    audience: body['x-gtcx-audience'] ?? body.audience,
    bodyHash: body['x-gtcx-body-sha256'] ?? body.bodyHash,
    headersHash: body['x-gtcx-headers-hash'] ?? body.headersHash,
    timestamp: body['x-gtcx-timestamp'] ?? body.timestamp,
    nonce: body['x-gtcx-nonce'] ?? body.nonce,
    signature: body['x-gtcx-signature'] ?? body.signature,
    envelopeHash: body['x-gtcx-envelope-hash'] ?? body.envelopeHash,
  };

  // Build request data for hash verification
  const requestData = {
    body: body.body ?? null,
    headers: body.headers ?? {},
    method: body.method ?? 'POST',
    url: body.url ?? 'http://localhost/',
  };

  if (typeof requestData.body !== 'string') {
    sendJson(res, 400, { error: 'Request body must be a serialized string' });
    return;
  }

  const context = {
    region: body.region ?? req.headers['x-gtcx-region'],
    requestId: body.requestId ?? req.headers['x-request-id'],
    deviceId: body.deviceId ?? req.headers['x-gtcx-device-id'],
    remoteAddress: req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  };

  const result = await verifier.verify(integrity, requestData, context);

  sendJson(res, result.allowed ? 200 : 401, {
    allowed: result.allowed,
    code: result.code,
    reason: result.reason,
    auditEventId: result.auditEvent?.eventId,
  });
}

/** @param {import('node:http').IncomingMessage} _req @param {import('node:http').ServerResponse} res */
async function handleHealth(_req, res) {
  const storeHealthy = trafficBlockReason ? false : await nonceStore.health();
  const status = storeHealthy ? 200 : 503;
  const body = {
    status: storeHealthy ? 'healthy' : 'unhealthy',
    nonceStore: storeHealthy ? 'ok' : 'down',
    trafficAccepted: !trafficBlockReason,
    uptimeSeconds: Math.floor(process.uptime()),
    ...(trafficBlockReason ? { reason: trafficBlockReason } : {}),
  };
  sendJson(res, status, body);
}

/** @param {import('node:http').IncomingMessage} _req @param {import('node:http').ServerResponse} res */
async function handleMetrics(_req, res) {
  res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' });
  const lines = [
    verifier.metricsPrometheus(),
    `# HELP replay_guard_redis_connected Redis connectivity status (1=connected, 0=fallback)`,
    `# TYPE replay_guard_redis_connected gauge`,
    `replay_guard_redis_connected ${metrics.redisConnected()}`,
    metrics.clockSkewHistogram(),
  ];
  res.end(lines.join('\n'));
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = createServer(async (req, res) => {
  try {
    const url = req.url ?? '/';
    if (url === '/v1/replay/verify') {
      await handleVerify(req, res);
    } else if (url === '/health') {
      await handleHealth(req, res);
    } else if (url === '/metrics') {
      await handleMetrics(req, res);
    } else {
      sendJson(res, 404, { error: 'Not found' });
    }
  } catch (err) {
    console.error(
      JSON.stringify({
        level: 'error',
        message: 'Unhandled server error',
        error: errorMessage(err),
      })
    );
    sendJson(res, 500, { error: 'Internal server error' });
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  stopOtlpPush();
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  stopOtlpPush();
  server.close(() => {
    process.exit(0);
  });
});

// Bootstrap
await initRedis();
startOtlpPush();

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      level: 'info',
      message: 'Replay Guard listening',
      host: HOST ?? '0.0.0.0',
      port: PORT,
      nonceTtlMs: NONCE_TTL_MS,
      nodeEnv: NODE_ENV,
      redis: nonceStore.constructor.name,
    })
  );
});

export { server, verifier, nonceStore, metrics, auditCapture, trafficBlockReason };
