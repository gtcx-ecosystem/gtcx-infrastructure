#!/usr/bin/env node
/**
 * XR-MKT-011 / S39-01 — staging authority decision stub for markets trace capture.
 * Pilot-only: returns structurally valid decision JSON per operation.
 * Source mirror: platform/tools/markets-authority-stub/server.mjs
 */
import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';

const PORT = Number(process.env.PORT ?? 8510);
const API_KEY = process.env.GTX_MARKETS_AUTHORITY_API_KEY?.trim() ?? '';

/** @type {Record<string, string[]>} */
const SYSTEMS_BY_PATH = {
  '/orders': ['tradepass', 'gci', 'veritas'],
  '/escrow-deposit': ['vaultmark'],
  '/escrow-release': ['vaultmark'],
  '/settle-init': ['pvp', 'panx', 'vaultmark'],
  '/settle-final': ['pvp', 'panx', 'vaultmark'],
  '/cc-issue': ['tradepass', 'gci'],
  '/cc-pay': ['tradepass', 'gci'],
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function authorize(req) {
  if (!API_KEY) return { ok: false, status: 503, error: 'GTX_MARKETS_AUTHORITY_API_KEY not configured' };
  const header = req.headers.authorization ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return { ok: false, status: 401, error: 'Authentication required' };
  const token = match[1].trim();
  const a = Buffer.from(token);
  const b = Buffer.from(API_KEY);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, status: 401, error: 'Invalid bearer token' };
  }
  return { ok: true };
}

function buildDecision(systems) {
  const checkedAt = new Date().toISOString();
  return {
    allowed: true,
    status: 200,
    evidence: systems.map((system) => ({
      system,
      reference: `staging-stub-${system}-${checkedAt.slice(0, 10)}`,
      status: 'derived',
      checkedAt,
    })),
  };
}

const server = createServer(async (req, res) => {
  const path = new URL(req.url ?? '/', 'http://localhost').pathname;
  if (path === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'markets-authority-stub' }));
    return;
  }
  const systems = SYSTEMS_BY_PATH[path];
  if (!systems || req.method !== 'POST') {
    res.writeHead(systems ? 405 : 404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: systems ? 'Method not allowed' : 'Not found' }));
    return;
  }
  const auth = authorize(req);
  if (!auth.ok) {
    res.writeHead(auth.status, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: auth.error }));
    return;
  }
  await readBody(req);
  const decision = buildDecision(systems);
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify(decision));
});

server.listen(PORT, () => {
  console.log(JSON.stringify({ level: 'info', service: 'markets-authority-stub', port: PORT }));
});
