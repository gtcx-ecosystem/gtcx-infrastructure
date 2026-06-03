/**
 * @fileoverview USSD Handler HTTP Server
 *
 * Endpoints:
 *   POST /ussd        — MNO webhook for USSD requests
 *   GET  /health      — liveness + readiness
 *   GET  /metrics     — basic Prometheus exposition
 *
 * Environment:
 *   USSD_PORT         — default 8600
 *   REDIS_URL         — optional; memory store if absent
 *   NODE_ENV          — 'production' enables stricter validation
 */

import { createServer } from 'node:http';

import { config } from './config.mjs';
import { processUssdRequest, buildSessionId, parseUssdString } from './handler.mjs';
import { createSessionStore } from './session.mjs';

const store = createSessionStore();

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf-8');
}

function sendJson(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  });
  res.end(data);
}

function sendText(res, status, text) {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(text, 'utf-8'),
  });
  res.end(text);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost').pathname;

    if (url === '/ussd' && req.method === 'POST') {
      const body = await readBody(req);
      let payload;
      try {
        payload = JSON.parse(body);
      } catch {
        return sendJson(res, 400, { error: 'Invalid JSON' });
      }

      const { phoneNumber, text, networkCode, countryCode } = payload;
      if (!phoneNumber || typeof phoneNumber !== 'string') {
        return sendJson(res, 400, { error: 'Missing phoneNumber' });
      }

      // Support two input formats:
      // 1. Structured: { phoneNumber, text: "*384*1*1#" }
      // 2. Simple: { phoneNumber, input: "1" }
      const rawInput = text ?? payload.input ?? '';
      const isFullUssd = rawInput.startsWith('*384');
      const { inputs } = isFullUssd ? parseUssdString(rawInput) : { inputs: [rawInput] };
      const input = inputs[inputs.length - 1] ?? '';
      const sessionId = buildSessionId(phoneNumber, inputs);

      const result = await processUssdRequest({
        sessionId,
        phoneNumber,
        input,
        networkCode,
        countryCode: countryCode ?? 'ZW',
      }, store);

      return sendJson(res, 200, {
        text: result.text,
        end: result.end,
        sessionId,
      });
    }

    if (url === '/health' && req.method === 'GET') {
      return sendJson(res, 200, {
        status: 'healthy',
        store: config.redisUrl ? 'redis' : 'memory',
        uptime: process.uptime(),
      });
    }

    if (url === '/metrics' && req.method === 'GET') {
      const metrics = [
        '# HELP ussd_sessions_active Active USSD sessions',
        '# TYPE ussd_sessions_active gauge',
        `ussd_sessions_active ${store.size ?? -1}`,
        '# HELP ussd_handler_uptime_seconds Process uptime',
        '# TYPE ussd_handler_uptime_seconds gauge',
        `ussd_handler_uptime_seconds ${process.uptime()}`,
      ].join('\n');
      return sendText(res, 200, metrics);
    }

    return sendJson(res, 404, { error: 'Not found' });
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', message: err?.message, stack: err?.stack }));
    sendJson(res, 500, { error: 'Internal server error' });
  }
});

server.listen(config.port, () => {
  console.log(JSON.stringify({
    level: 'info',
    message: 'USSD Handler listening',
    port: config.port,
    store: config.redisUrl ? 'redis' : 'memory',
    nodeEnv: config.nodeEnv,
  }));
});

export { server };
