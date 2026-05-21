#!/usr/bin/env node
/**
 * @fileoverview Compliance Gateway — Model Context Protocol server.
 *
 * Speaks JSON-RPC 2.0 over stdio per the Model Context Protocol spec.
 * Provides four discoverable tools for AI agents:
 *
 *   gtcx_compliance_query        — natural-language compliance question
 *   gtcx_audit_chain             — chain head + record count
 *   gtcx_audit_evidence_bundle   — verifiable evidence for an auditor
 *   gtcx_brief                   — morning-brief summary
 *
 * The MCP server is intentionally read-only. Mutating tools require an
 * approval ticket and live behind the HTTP gateway with explicit human
 * authorization — exposing them via an agent-discoverable surface
 * would erode the SIGNAL S1 mutating-tool gating claim.
 *
 * Configure via env:
 *   GATEWAY_URL  (default http://localhost:8500)
 *   GATEWAY_TOKEN (required; bearer token with at least query:read + audit:read)
 */

import { createInterface } from 'node:readline';

function gatewayUrl() { return process.env.GATEWAY_URL || 'http://localhost:8500'; }
function gatewayToken() { return process.env.GATEWAY_TOKEN; }

const TOOLS = [
  {
    name: 'gtcx_compliance_query',
    description: 'Ask a natural-language compliance question. The GTCX gateway routes it to the appropriate protocol tools and returns an answer + tool trace.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Plain-language compliance question' },
        jurisdiction: { type: 'string', description: 'Jurisdiction code (e.g. zimbabwe, kenya, south_africa)' },
        context: { type: 'object', description: 'Optional structured context (≤ 16KB total, flat)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'gtcx_audit_chain',
    description: 'Return the current audit chain state: head hash, in-memory record count, total records ever signed. Use this when an auditor or agent asks "what is the current evidence position?"',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'gtcx_audit_evidence_bundle',
    description: 'Return a signed, verifiable evidence bundle for the caller\'s tenant since an optional timestamp. The bundle includes NDJSON records and verification instructions; an external auditor can verify it offline with @gtcx/audit-signer.',
    inputSchema: {
      type: 'object',
      properties: {
        since: { type: 'string', description: 'ISO-8601 timestamp; only records on/after this time are bundled' },
      },
    },
  },
  {
    name: 'gtcx_brief',
    description: 'Return a one-paragraph morning brief: signing posture, chain head, today\'s LLM spend, headline numbers.',
    inputSchema: {
      type: 'object',
      properties: {
        since: { type: 'string', description: 'ISO-8601 timestamp; brief covers events on/after this time' },
      },
    },
  },
];

async function callGateway(path, opts = {}) {
  const token = gatewayToken();
  if (!token) {
    throw new Error('GATEWAY_TOKEN env var is required');
  }
  const res = await fetch(`${gatewayUrl()}${path}`, {
    method: opts.method || 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
}

export async function dispatchToolCall(name, args = {}) {
  switch (name) {
    case 'gtcx_compliance_query':
      return callGateway('/v1/query', { method: 'POST', body: args });
    case 'gtcx_audit_chain':
      return callGateway('/v1/audit/chain');
    case 'gtcx_audit_evidence_bundle': {
      const qs = args.since ? `?since=${encodeURIComponent(args.since)}` : '';
      return callGateway(`/v1/audit/evidence-bundle${qs}`);
    }
    case 'gtcx_brief': {
      const qs = args.since ? `?since=${encodeURIComponent(args.since)}` : '';
      return callGateway(`/v1/brief${qs}`);
    }
    default:
      return { status: 404, body: { error: `Unknown tool: ${name}` } };
  }
}

export function handleRpc(message) {
  if (message.method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'gtcx-compliance-gateway-mcp', version: '0.1.0' },
      },
    };
  }
  if (message.method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: { tools: TOOLS },
    };
  }
  if (message.method === 'tools/call') {
    return dispatchToolCall(message.params?.name, message.params?.arguments ?? {})
      .then(({ status, body }) => ({
        jsonrpc: '2.0',
        id: message.id,
        result: {
          isError: status >= 400,
          content: [{ type: 'text', text: typeof body === 'string' ? body : JSON.stringify(body, null, 2) }],
        },
      }))
      .catch((err) => ({
        jsonrpc: '2.0',
        id: message.id,
        error: { code: -32000, message: err.message },
      }));
  }
  return {
    jsonrpc: '2.0',
    id: message.id,
    error: { code: -32601, message: `Method not found: ${message.method}` },
  };
}

export { TOOLS };

if (import.meta.url === `file://${process.argv[1]}`) {
  const rl = createInterface({ input: process.stdin });
  rl.on('line', async (line) => {
    if (!line.trim()) return;
    try {
      const msg = JSON.parse(line);
      const result = await handleRpc(msg);
      process.stdout.write(`${JSON.stringify(result)}\n`);
    } catch (err) {
      process.stdout.write(`${JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: `Parse error: ${err.message}` },
      })}\n`);
    }
  });
  rl.on('close', () => process.exit(0));
}
