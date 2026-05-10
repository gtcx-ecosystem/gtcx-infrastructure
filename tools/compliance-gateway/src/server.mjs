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
    sendJson(res, auth.status, { error: auth.error });
    return null;
  }
  return auth.principal;
}

// ---------------------------------------------------------------------------
// Query handler with fallback chain
// ---------------------------------------------------------------------------

async function handleQuery(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
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
    return sendJson(res, 400, { error: 'Invalid JSON' });
  }

  const { query, jurisdiction, context } = parsed;
  if (!query || typeof query !== 'string') {
    return sendJson(res, 400, { error: 'Missing "query" field' });
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
    });
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
      });
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
  });
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

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

const server = createServer(async (req, res) => {
  try {
    const url = req.url ?? '/';
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
      });
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
      });
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
      });
    } else {
      sendJson(res, 404, { error: 'Not found' });
    }
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', message: err?.message }));
    sendJson(res, 500, { error: 'Internal server error' });
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
