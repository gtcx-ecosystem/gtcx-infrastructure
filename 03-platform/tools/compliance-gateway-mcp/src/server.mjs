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
 * Also exposes RESOURCES and PROMPTS that MCP clients read on connect,
 * implementing the AI-native "Persistent Context" pattern: the agent
 * has the compliance posture briefing BEFORE any user prompt arrives.
 *
 *   resources/gtcx://brief/morning  — live morning brief (signing posture,
 *                                     chain head, today's LLM spend)
 *   prompts/morning-brief           — drop-in prompt that asks the agent
 *                                     to surface the brief as 3 headline
 *                                     items the user should know today
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
  {
    name: 'gtcx_exceptions',
    description:
      'Return ONLY events requiring human judgment for the caller\'s tenant: auth failures, query failures, throttles, degraded resilience, low-confidence LLM outputs. The 95%+ routine events stay in the audit chain for the regulator trail but are hidden here. Use this as the primary operator surface instead of the raw audit feed.',
    inputSchema: {
      type: 'object',
      properties: {
        since: { type: 'string', description: 'ISO-8601 timestamp; only exceptions on/after this time' },
        kinds: {
          type: 'array',
          items: { type: 'string', enum: ['auth-failure', 'query-failure', 'query-throttled', 'resilience-degraded', 'low-confidence', 'integrity-violation'] },
          description: 'Subset of exception kinds to include; omitted = all',
        },
        limit: { type: 'integer', description: 'Max events returned (default 200, max 1000)' },
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

// ---------------------------------------------------------------------------
// Resources — agent reads on connect (AI-native Pattern #10: Persistent Context)
// ---------------------------------------------------------------------------

const RESOURCES = [
  {
    uri: 'gtcx://brief/morning',
    name: 'GTCX Morning Brief',
    description:
      'Live one-paragraph compliance briefing: audit signing posture, current chain head, today\'s LLM spend vs daily budget. Read on connect so the agent surfaces today\'s posture before the user asks.',
    mimeType: 'text/plain',
  },
  {
    uri: 'gtcx://exceptions/current',
    name: 'GTCX Exceptions (operator view)',
    description:
      'Only events requiring human judgment — failures, throttles, low-confidence LLM outputs, integrity violations. The agent reads this on connect so the operator sees today\'s exceptions before drilling into the routine audit feed.',
    mimeType: 'application/json',
  },
];

// ---------------------------------------------------------------------------
// Prompts — drop-in prompts the agent advertises so users can invoke
// the AI-native experience by name. Surface the brief in 3 headline items.
// ---------------------------------------------------------------------------

const PROMPTS = [
  {
    name: 'morning-brief',
    description:
      'Surface today\'s GTCX compliance posture as three headline items the user should know. Pulls live state from the gateway; the agent presents it without the user having to ask.',
    arguments: [],
  },
];

async function dispatchResourceRead(uri) {
  if (uri === 'gtcx://exceptions/current') {
    const { status, body } = await callGateway('/v1/exceptions?limit=50');
    if (status >= 400) {
      return {
        contents: [{
          uri,
          mimeType: 'text/plain',
          text: `Exceptions feed unavailable (status ${status}). Reason: ${typeof body === 'string' ? body : JSON.stringify(body)}`,
        }],
      };
    }
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(body, null, 2),
      }],
    };
  }
  if (uri === 'gtcx://brief/morning') {
    const { status, body } = await callGateway('/v1/brief');
    if (status >= 400) {
      return {
        contents: [
          {
            uri,
            mimeType: 'text/plain',
            text: `Compliance gateway brief unavailable (status ${status}). Reason: ${typeof body === 'string' ? body : JSON.stringify(body)}`,
          },
        ],
      };
    }
    // Render the JSON brief into a single paragraph the agent can
    // narrate directly. The narrative field is human-readable; the
    // raw signing/spend/chain fields are also returned so the agent
    // can drill in without an extra fetch.
    const narrative = body?.narrative ?? 'No narrative produced by gateway.';
    const metaLines = [
      `chainHead=${body?.chainHead ?? 'unknown'}`,
      `signing=${body?.signing ?? 'unknown'}`,
      `spendUsd=${body?.spend?.spentUsd ?? 0}`,
      `dailyBudgetUsd=${body?.spend?.limits?.dailyUsd ?? 'unknown'}`,
      `tenantId=${body?.tenantId ?? 'unknown'}`,
      `producedAt=${body?.producedAt ?? new Date().toISOString()}`,
    ];
    return {
      contents: [
        {
          uri,
          mimeType: 'text/plain',
          text: `${narrative}\n\n${metaLines.join('\n')}`,
        },
      ],
    };
  }
  return { contents: [], isError: true };
}

async function dispatchPromptGet(name) {
  if (name === 'morning-brief') {
    const { status, body } = await callGateway('/v1/brief');
    const briefText = status >= 400
      ? `(brief unavailable — status ${status})`
      : body?.narrative ?? '(no narrative)';
    return {
      description:
        'Surface today\'s GTCX compliance posture as three headline items the user should know.',
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Here is today's GTCX compliance brief from the gateway:\n\n` +
              `${briefText}\n\n` +
              `Surface this to me as exactly THREE short headline items, in this order:\n` +
              `  1. Audit signing posture (one line; flag if not SIGNING)\n` +
              `  2. Spend vs daily LLM budget (one line; flag if >75%)\n` +
              `  3. Chain head + record count (one line; flag if chain not verified)\n\n` +
              `Use plain language. Lead with the headline, not the metric.`,
          },
        },
      ],
    };
  }
  throw new Error(`Unknown prompt: ${name}`);
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
    case 'gtcx_exceptions': {
      const params = new URLSearchParams();
      if (args.since) params.set('since', String(args.since));
      if (Array.isArray(args.kinds) && args.kinds.length > 0) {
        params.set('kinds', args.kinds.join(','));
      }
      if (args.limit) params.set('limit', String(args.limit));
      const qs = params.toString();
      return callGateway(`/v1/exceptions${qs ? `?${qs}` : ''}`);
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
        // Advertise resources + prompts so MCP clients fetch them on
        // connect — the agent has the compliance brief in context
        // BEFORE the first user prompt arrives.
        capabilities: { tools: {}, resources: {}, prompts: {} },
        serverInfo: { name: 'gtcx-compliance-gateway-mcp', version: '0.2.0' },
      },
    };
  }
  if (message.method === '03-platform/tools/list') {
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: { tools: TOOLS },
    };
  }
  if (message.method === 'resources/list') {
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: { resources: RESOURCES },
    };
  }
  if (message.method === 'resources/read') {
    return dispatchResourceRead(message.params?.uri)
      .then((result) => ({
        jsonrpc: '2.0',
        id: message.id,
        result,
      }))
      .catch((err) => ({
        jsonrpc: '2.0',
        id: message.id,
        error: { code: -32000, message: err.message },
      }));
  }
  if (message.method === 'prompts/list') {
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: { prompts: PROMPTS },
    };
  }
  if (message.method === 'prompts/get') {
    return dispatchPromptGet(message.params?.name)
      .then((result) => ({
        jsonrpc: '2.0',
        id: message.id,
        result,
      }))
      .catch((err) => ({
        jsonrpc: '2.0',
        id: message.id,
        error: { code: -32000, message: err.message },
      }));
  }
  if (message.method === '03-platform/tools/call') {
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

export { TOOLS, RESOURCES, PROMPTS };

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
