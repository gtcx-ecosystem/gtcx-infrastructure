/**
 * @fileoverview AI Compliance Gateway Server
 *
 * Natural language interface to GTCX protocol handlers.
 * Routes compliance queries to the correct protocol endpoints
 * using cost-optimized multi-provider LLM routing.
 *
 * Endpoints:
 *   POST /v1/query      — natural language compliance query
 *   GET  /health        — liveness + provider status
 *   GET  /v1/tools      — list available protocol tools
 *   GET  /v1/providers  — list available LLM providers + routing config
 *
 * Provider priority (by query complexity):
 *   Simple  → Free tier (Gemini Flash, Groq Llama)
 *   Medium  → Cost-optimized (DeepSeek, Gemini, GPT-4.1-mini)
 *   Complex → Frontier (Claude Sonnet, GPT-4.1, Gemini Pro)
 *
 * Environment:
 *   ANTHROPIC_API_KEY, GOOGLE_API_KEY, OPENAI_API_KEY,
 *   DEEPSEEK_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY
 *   PROTOCOL_BASE_URL, PORT, PREFERRED_PROVIDER
 */

import { createServer } from 'node:http';
import { generateText } from 'ai';
import {
  authenticateHeaders,
  buildAccessProfile,
  loadAuthState,
  parseApprovalContext,
} from './auth.mjs';
import { buildRuntimePolicyPrompt } from './policy.mjs';
import { systemPrompt } from './system-prompt.mjs';
import { createToolRegistry, listToolsForAccess, toolCount } from './tools.mjs';
import {
  selectProvider,
  getFallbackChain,
  getProviders,
  providerCount,
  classifyComplexity,
} from './providers.mjs';

const PORT = Number(process.env.PORT ?? 8500);
const authState = loadAuthState(process.env);

/**
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {string} requiredPermission
 */
function requirePermission(req, res, requiredPermission) {
  const auth = authenticateHeaders(req.headers, authState, requiredPermission);
  if (!auth.ok) {
    sendJson(res, auth.status, { error: auth.error }, req);
    return null;
  }
  return auth.principal;
}

// ---------------------------------------------------------------------------
// Query handler with fallback chain
// ---------------------------------------------------------------------------

async function handleQuery(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' }, req);
  }

  const principal = requirePermission(req, res, 'query:read');
  if (!principal) {
    return;
  }

  const approval = parseApprovalContext(req.headers);
  const accessProfile = buildAccessProfile(principal, approval);
  const body = await readBody(req);
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    return sendJson(res, 400, { error: 'Invalid JSON' }, req);
  }

  const { query, jurisdiction, context } = parsed;
  if (!query || typeof query !== 'string') {
    return sendJson(res, 400, { error: 'Missing "query" field' }, req);
  }

  const userMessage = [
    query,
    jurisdiction ? `Jurisdiction: ${jurisdiction}` : '',
    context ? `Additional context: ${JSON.stringify(context)}` : '',
  ].filter(Boolean).join('\n');

  const complexity = classifyComplexity(query);
  const primary = selectProvider(query);

  if (!primary) {
    return sendJson(res, 503, {
      error: 'No LLM providers configured',
      hint: 'Set at least one of: GOOGLE_API_KEY, GROQ_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY, DEEPSEEK_API_KEY',
    }, req);
  }

  const fallbacks = getFallbackChain(primary);
  const chain = [primary, ...fallbacks];
  const errors = [];
  const tools = createToolRegistry(accessProfile);
  const runtimePolicy = buildRuntimePolicyPrompt(accessProfile);

  for (const provider of chain) {
    try {
      const start = Date.now();
      const result = await generateText({
        model: provider.createModel(),
        system: `${systemPrompt}\n\n${runtimePolicy}`,
        prompt: userMessage,
        tools,
        maxSteps: 5,
        temperature: 0,
      });
      const latencyMs = Date.now() - start;

      const toolCalls = result.steps
        .flatMap((step) => step.toolCalls || [])
        .map((call) => ({ tool: call.toolName, args: call.args }));

      const toolResults = result.steps
        .flatMap((step) => step.toolResults || [])
        .map((r) => ({ tool: r.toolName, result: r.result }));

      return sendJson(res, 200, {
        answer: result.text,
        toolCalls,
        toolResults,
        routing: {
          provider: provider.name,
          model: provider.model,
          tier: provider.tier,
          complexity,
          latencyMs,
          fallbacksAvailable: fallbacks.length,
          estimatedCost: estimateCost(provider, result.usage),
        },
        authz: {
          approvalTicket: approval.ticket,
          mutatingToolsEnabled: accessProfile.canMutate,
          permissions: accessProfile.permissions,
          subject: accessProfile.subject,
        },
        usage: result.usage,
      }, req);
    } catch (err) {
      errors.push({ provider: provider.name, error: err?.message });
      console.error(JSON.stringify({
        level: 'warn',
        type: 'compliance-gateway.provider.failed',
        provider: provider.name,
        error: err?.message,
        fallbacksRemaining: chain.length - errors.length - 1,
      }));
      // Continue to next provider in fallback chain
    }
  }

  // All providers failed
  sendJson(res, 502, {
    error: 'All LLM providers failed',
    attempts: errors,
    query: query.substring(0, 200),
  }, req);
}

// ---------------------------------------------------------------------------
// Cost estimation
// ---------------------------------------------------------------------------

function estimateCost(provider, usage) {
  if (!usage) return null;
  const inputCost = ((usage.promptTokens || 0) / 1_000_000) * provider.inputCostPer1M;
  const outputCost = ((usage.completionTokens || 0) / 1_000_000) * provider.outputCostPer1M;
  return {
    inputTokens: usage.promptTokens,
    outputTokens: usage.completionTokens,
    inputCostUSD: Math.round(inputCost * 10000) / 10000,
    outputCostUSD: Math.round(outputCost * 10000) / 10000,
    totalCostUSD: Math.round((inputCost + outputCost) * 10000) / 10000,
  };
}

// ---------------------------------------------------------------------------
// HTTP plumbing
// ---------------------------------------------------------------------------

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf-8');
}

// ---------------------------------------------------------------------------
// Adaptive Low-Bandwidth Mode (Global South Resilience)
// ---------------------------------------------------------------------------

function detectLowBandwidth(req) {
  const saveData = req.headers['save-data'];
  if (saveData === 'on') return true;
  const lowBwParam = new URL(req.url ?? '/', 'http://localhost').searchParams.get('lowBandwidth');
  if (lowBwParam === 'true' || lowBwParam === '1') return true;
  // Detect slow connections via Downlink hint (if available)
  const downlink = parseFloat(req.headers['downlink'] || '10');
  if (downlink < 0.5) return true; // Less than 500 Kbps
  return false;
}

function stripForLowBandwidth(body, endpoint) {
  if (!body || typeof body !== 'object') return body;
  const stripped = { ...body };

  if (endpoint === '/v1/query') {
    // Keep answer, toolCalls, routing.provider; strip detailed cost, authz, usage
    delete stripped.authz;
    delete stripped.usage;
    if (stripped.routing) {
      stripped.routing = {
        provider: stripped.routing.provider,
        latencyMs: stripped.routing.latencyMs,
      };
    }
    if (stripped.toolResults) {
      // Truncate tool results to first 200 chars
      stripped.toolResults = stripped.toolResults.map((r) => ({
        tool: r.tool,
        result: typeof r.result === 'string' ? r.result.substring(0, 200) : r.result,
      }));
    }
  }

  if (endpoint === '/v1/tools') {
    // Strip tool descriptions, keep only names and parameters
    if (stripped.tools) {
      stripped.tools = stripped.tools.map((t) => ({
        name: t.name,
        parameters: t.parameters,
      }));
    }
  }

  if (endpoint === '/v1/providers') {
    // Strip cost details, keep only names and tiers
    if (stripped.providers) {
      stripped.providers = stripped.providers.map((p) => ({
        name: p.name,
        tier: p.tier,
      }));
    }
  }

  // Add low-bandwidth indicator
  stripped._lowBandwidth = true;
  return stripped;
}

import { brotliCompressSync, gzipSync } from 'node:zlib';

function sendJson(res, status, body, req) {
  const isLowBandwidth = req ? detectLowBandwidth(req) : false;
  let payload = body;

  if (isLowBandwidth) {
    payload = stripForLowBandwidth(body, req?.url);
  }

  const json = JSON.stringify(payload);
  const acceptEncoding = req?.headers?.['accept-encoding'];

  let data = Buffer.from(json);
  let encoding = null;

  if (acceptEncoding) {
    if (acceptEncoding.includes('br')) {
      try {
        data = brotliCompressSync(data);
        encoding = 'br';
      } catch { /* fallback */ }
    }
    if (!encoding && acceptEncoding.includes('gzip')) {
      data = gzipSync(data);
      encoding = 'gzip';
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': isLowBandwidth ? 'max-age=300, public' : 'no-cache',
    'X-Low-Bandwidth': isLowBandwidth ? 'true' : 'false',
  };

  if (encoding) {
    headers['Content-Encoding'] = encoding;
  }

  res.writeHead(status, headers);
  res.end(data);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost').pathname;
    if (url === '/v1/query') {
      await handleQuery(req, res);
    } else if (url === '/health') {
      sendJson(res, authState.configurationError ? 503 : 200, {
        authConfigured: !authState.configurationError,
        authMode: authState.defaulted ? 'dev-default-readonly' : 'configured',
        status: authState.configurationError ? 'unhealthy' : 'healthy',
        tools: toolCount,
        providers: providerCount,
        availableProviders: getProviders().map((p) => p.name),
        ...(authState.configurationError ? { error: authState.configurationError } : {}),
      }, req);
    } else if (url === '/v1/tools') {
      const principal = requirePermission(req, res, 'tools:read');
      if (!principal) {
        return;
      }
      const accessProfile = buildAccessProfile(principal, parseApprovalContext(req.headers));
      sendJson(res, 200, {
        availableCount: listToolsForAccess(accessProfile).length,
        count: toolCount,
        mutatingToolsEnabled: accessProfile.canMutate,
        tools: listToolsForAccess(accessProfile),
      }, req);
    } else if (url === '/v1/providers') {
      const principal = requirePermission(req, res, 'providers:read');
      if (!principal) {
        return;
      }
      sendJson(res, 200, {
        count: providerCount,
        routing: {
          simple: 'Free tier (Gemini Flash, Groq Llama)',
          medium: 'Cost-optimized (DeepSeek, Gemini, GPT-4.1-mini)',
          complex: 'Frontier (Claude Sonnet, GPT-4.1, Gemini Pro)',
        },
        providers: getProviders().map((p) => ({
          name: p.name,
          model: p.model,
          tier: p.tier,
          inputCostPer1M: p.inputCostPer1M,
          outputCostPer1M: p.outputCostPer1M,
          maxTools: p.maxTools,
        })),
      }, req);
    } else {
      sendJson(res, 404, { error: 'Not found' }, req);
    }
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', message: err?.message }));
    sendJson(res, 500, { error: 'Internal server error' }, req);
  }
});

server.listen(PORT, () => {
  const providers = getProviders();
  if (authState.defaulted) {
    console.warn(JSON.stringify({
      level: 'warn',
      message: 'Compliance Gateway is using the default development read-only token. Configure COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON before any shared use.',
    }));
  }
  console.log(JSON.stringify({
    authConfigured: !authState.configurationError,
    level: 'info',
    message: 'Compliance Gateway listening',
    nodeEnv: authState.nodeEnv,
    port: PORT,
    tools: toolCount,
    providers: providers.length,
    providerNames: providers.map((p) => p.name),
    routing: 'cost-optimized (simple→free, medium→cheap, complex→frontier)',
  }));
});

export { server };
