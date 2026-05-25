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
import { validateQueryBody, buildUserMessage } from './schemas.mjs';
import { checkBudget, recordSpend, getSpend } from './budget.mjs';
import { incrementCounter, setGauge, renderMetrics } from './metrics.mjs';
import { sanitizeAuditTarget } from './audit-target.mjs';
import { startAdaptiveScheduler, defaultThresholds } from './adaptive-policy.mjs';
import { processBundle as processAuditBundle } from './audit-bundles/handler.mjs';
import { createTradePassResolver, createMockResolver } from './audit-bundles/did-resolver.mjs';
import { NonceGate } from './audit-bundles/nonce-gate.mjs';
import { processQuery as processAuditQuery } from './audit-query/handler.mjs';
import { InMemoryQueryStore } from './audit-query/store.mjs';
import { NdjsonQueryStore } from './audit-query/ndjson-store.mjs';

// In-flight /v1/query count, exposed to the HPA via the
// compliance_gateway_inflight_requests metric (autoscaling.v2 Pods target).
// Initialized to 0 at module load so /metrics always exposes the series
// (Prometheus expects long-running gauges to be present even when zero).
let inflightQueries = 0;
setGauge('compliance_gateway_inflight_requests', undefined, 0);
import {
  initAuditSigner,
  signAuditEvent,
  getChainState,
  verifyAuditBody,
  getSignerHealth,
  buildEvidenceBundle,
} from './audit.mjs';
import { systemPrompt } from './system-prompt.mjs';
import { createToolRegistry, listToolsForAccess, toolCount } from './tools.mjs';
import {
  selectProvider as defaultSelectProvider,
  getFallbackChain as defaultGetFallbackChain,
  getProviders,
  providerCount,
  classifyComplexity,
} from './providers.mjs';

const PORT = Number(process.env.PORT ?? 8500);
const authState = loadAuthState(process.env);
const auditInit = initAuditSigner(process.env);

// Fail-closed: in production, the gateway must not run without a signing
// key. Tamper-evident audit is a stated contract; refuse to serve without it.
if (process.env.NODE_ENV === 'production' && !auditInit.initialized) {
  console.error(JSON.stringify({
    level: 'fatal',
    type: 'audit.signer.startupRefused',
    message: 'Compliance Gateway refusing to start: audit signing key not configured in production.',
    error: auditInit.error,
  }));
  // eslint-disable-next-line no-process-exit
  process.exit(78); // EX_CONFIG
}

// ---------------------------------------------------------------------------
// Runtime policy (from ConfigMap — adjustable without code changes)
// ---------------------------------------------------------------------------

const runtimePolicyConfig = {
  degradationMode: process.env.GTCX_DEGRADATION_MODE || 'auto',
  lbwStripFields: (process.env.GTCX_LBW_STRIP_FIELDS || 'authz,usage,toolResults').split(',').map((s) => s.trim()).filter(Boolean),
  lbwCompression: process.env.GTCX_LBW_COMPRESSION || 'br',
  lbwCacheSeconds: Number(process.env.GTCX_LBW_CACHE_SECONDS || '300'),
  featureSignedAudit: process.env.GTCX_FEATURE_SIGNED_AUDIT === 'true',
  featureFeedbackLoop: process.env.GTCX_FEATURE_FEEDBACK_LOOP === 'true',
};

// ---------------------------------------------------------------------------
// /audit/bundles wiring (feature-flagged for the stub branch)
// ---------------------------------------------------------------------------

const auditBundlesEnabled = process.env.AUDIT_BUNDLES_ENABLED === '1';
const auditBundlesExpectedAudience =
  process.env.AUDIT_BUNDLES_AUDIENCE || 'https://geotag.staging.gtcx.trade';
const tradePassBaseUrl = process.env.TRADEPASS_BASE_URL;

// Until gtcx-protocols #60 lands a real TradePass deployment behind a
// stable URL (tracked on #55), no real DID resolver is wired and any
// request to /audit/bundles is rejected with 503. Tests inject a
// mockable resolver directly into processBundle; production wiring
// happens when TRADEPASS_BASE_URL is set in the staging environment.
const auditBundlesResolver = tradePassBaseUrl
  ? createTradePassResolver({ baseUrl: tradePassBaseUrl })
  : null;

const auditBundlesNonceGate = new NonceGate();
// Silence linter for the mock resolver helper — it's imported so test
// fixtures and the eventual integration test can inject one.
void createMockResolver;

// /audit/query wiring (feature-flagged)
// ---------------------------------------------------------------------------

const auditQueryEnabled = process.env.AUDIT_QUERY_ENABLED === '1';

// Store selection by env var:
// - AUDIT_QUERY_NDJSON_DIR=/path → NDJSON-file-backed (durable, staging-ready)
// - unset                       → in-memory (dev / tests)
// Production swaps for a WORM-backed store reading the same NDJSON
// batches audit-flush writes; that requires AWS credentials and lands
// when the audit-bundles ingestion path is live (gated on EXT-003).
const auditQueryStore = process.env.AUDIT_QUERY_NDJSON_DIR
  ? new NdjsonQueryStore({ rootDir: process.env.AUDIT_QUERY_NDJSON_DIR, fileExistenceMode: 'lazy' })
  : new InMemoryQueryStore();

/**
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {string} requiredPermission
 */
function requirePermission(req, res, requiredPermission) {
  const target = sanitizeAuditTarget(req.url);
  const auth = authenticateHeaders(req.headers, authState, requiredPermission);
  if (!auth.ok) {
    signAuditEvent({
      actor: 'unknown',
      action: `auth:failure`,
      target,
      reason: `${requiredPermission}: ${auth.error}`,
      payload: { tenantId: 'unknown' },
    });
    sendJson(res, auth.status, { error: auth.error }, req);
    return null;
  }
  signAuditEvent({
    actor: auth.principal.subject,
    action: `auth:success`,
    target,
    payload: {
      permission: requiredPermission,
      permissions: auth.principal.permissions,
      tenantId: auth.principal.tenantId,
    },
  });
  return auth.principal;
}

// ---------------------------------------------------------------------------
// Query handler with fallback chain
// ---------------------------------------------------------------------------

async function handleQuery(req, res, deps = {
  generateText,
  selectProvider: defaultSelectProvider,
  getFallbackChain: defaultGetFallbackChain,
}) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' }, req);
  }
  inflightQueries += 1;
  setGauge('compliance_gateway_inflight_requests', undefined, inflightQueries);
  try {
    return await handleQueryInner(req, res, deps);
  } finally {
    inflightQueries = Math.max(0, inflightQueries - 1);
    setGauge('compliance_gateway_inflight_requests', undefined, inflightQueries);
  }
}

async function handleQueryInner(req, res, deps) {
  const principal = requirePermission(req, res, 'query:read');
  if (!principal) {
    return;
  }

  const approval = parseApprovalContext(req.headers);
  const accessProfile = buildAccessProfile(principal, approval);
  const body = await readBody(req);
  let rawParsed;
  try {
    rawParsed = JSON.parse(body);
  } catch {
    return sendJson(res, 400, { error: 'Invalid JSON' }, req);
  }

  const validation = validateQueryBody(rawParsed);
  if (!validation.ok) {
    return sendJson(res, validation.status, {
      error: validation.error,
      fieldErrors: validation.fieldErrors,
    }, req);
  }
  const { query, jurisdiction, context } = validation.data;

  // Bound blast radius: a single principal cannot exceed its QPS or
  // its daily LLM spend. The check is intentionally before the LLM
  // call so abuse does not produce provider invocations.
  const budgetCheck = checkBudget(principal.subject, principal.tenantId);
  if (!budgetCheck.ok) {
    signAuditEvent({
      actor: principal.subject,
      action: 'query:throttled',
      target: query.substring(0, 200),
      reason: budgetCheck.reason,
      payload: {
        tenantId: principal.tenantId,
        limits: budgetCheck.limits,
        spentUsd: budgetCheck.spentUsd,
      },
    });
    incrementCounter('compliance_gateway_throttle_total', {
      reason: budgetCheck.reason,
      tenantId: principal.tenantId,
    });
    res.setHeader?.('Retry-After', String(budgetCheck.retryAfterSeconds ?? 1));
    return sendJson(res, budgetCheck.status, {
      error: budgetCheck.reason === 'qps'
        ? 'Rate limit exceeded for this principal'
        : 'Daily LLM budget exceeded for this principal',
      retryAfterSeconds: budgetCheck.retryAfterSeconds,
      limits: budgetCheck.limits,
      spentUsd: budgetCheck.spentUsd,
    }, req);
  }

  const userMessage = buildUserMessage({ query, jurisdiction, context });

  const complexity = classifyComplexity(query);
  const primary = deps.selectProvider(query);

  if (!primary) {
    signAuditEvent({
      actor: principal.subject,
      action: 'query:failure',
      target: query.substring(0, 200),
      payload: { tenantId: principal.tenantId, reason: 'no-providers-configured', status: 503 },
    });
    return sendJson(res, 503, {
      error: 'No LLM providers configured',
      hint: 'Set at least one of: GOOGLE_API_KEY, GROQ_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY, DEEPSEEK_API_KEY',
    }, req);
  }

  const fallbacks = deps.getFallbackChain(primary);
  const chain = [primary, ...fallbacks];
  const errors = [];
  const tools = createToolRegistry(accessProfile);
  const runtimePolicyPrompt = buildRuntimePolicyPrompt(accessProfile);

  for (const provider of chain) {
    try {
      const start = Date.now();
      const result = await deps.generateText({
        model: provider.createModel(),
        system: `${systemPrompt}\n\n${runtimePolicyPrompt}`,
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

      const estimatedCost = estimateCost(provider, result.usage);
      if (estimatedCost?.totalCostUSD) {
        recordSpend(principal.subject, estimatedCost.totalCostUSD);
        incrementCounter('compliance_gateway_cost_usd_total', {
          provider: provider.name,
          tier: provider.tier,
          principal: principal.subject,
          tenantId: principal.tenantId,
        }, estimatedCost.totalCostUSD);
      }
      incrementCounter('compliance_gateway_requests_total', {
        route: '/v1/query',
        status: '200',
        tenantId: principal.tenantId,
      });
      setGauge('compliance_gateway_query_latency_ms', { provider: provider.name, tenantId: principal.tenantId }, latencyMs);
      signAuditEvent({
        actor: principal.subject,
        action: 'query:success',
        target: query.substring(0, 200),
        payload: {
          tenantId: principal.tenantId,
          provider: provider.name,
          complexity,
          latencyMs,
          status: 200,
          estimatedCostUSD: estimatedCost?.totalCostUSD ?? 0,
        },
      });
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
          estimatedCost,
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
  signAuditEvent({
    actor: principal.subject,
    action: 'query:failure',
    target: query.substring(0, 200),
    payload: {
      tenantId: principal.tenantId,
      errors: errors.map((e) => ({ provider: e.provider, error: e.error })),
      status: 502,
    },
  });
  sendJson(res, 502, {
    error: 'All LLM providers failed',
    attempts: errors,
    query: query.substring(0, 200),
  }, req);
}

// ---------------------------------------------------------------------------
// Morning-brief narrative builder
// ---------------------------------------------------------------------------

function buildBriefNarrative({ chainState, spend, signing }) {
  const lines = [];
  if (!signing) {
    lines.push('⚠ Audit signing is DISABLED. Investigate before consequential traffic.');
  } else {
    lines.push(`Audit chain is healthy: ${chainState.totalRecords} records, head ${chainState.lastHash.slice(0, 12)}…`);
  }
  if (spend.spentUsd > 0) {
    const pct = Math.min(100, Math.round((spend.spentUsd / spend.limits.dailyUsd) * 100));
    lines.push(`Today: $${spend.spentUsd.toFixed(4)} / $${spend.limits.dailyUsd} (${pct}% of daily budget).`);
  } else {
    lines.push(`Today: no LLM spend yet.`);
  }
  return lines.join(' ');
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
  // Runtime policy override takes precedence
  if (runtimePolicyConfig.degradationMode === 'normal') return false;
  if (['reduced', 'minimal', 'offline'].includes(runtimePolicyConfig.degradationMode)) return true;

  // Auto-detection from client headers
  const saveData = req.headers['save-data'];
  if (saveData === 'on') return true;
  const lowBwParam = new URL(req.url ?? '/', 'http://localhost').searchParams.get('lowBandwidth');
  if (lowBwParam === 'true' || lowBwParam === '1') return true;
  // Detect slow connections via Downlink hint (if available)
  const downlink = parseFloat(req.headers['downlink'] || '10');
  if (downlink < 0.5) return true; // Less than 500 Kbps
  return false;
}

function getDegradationLevel(req) {
  if (runtimePolicyConfig.degradationMode !== 'auto') {
    return runtimePolicyConfig.degradationMode;
  }
  const downlink = parseFloat(req?.headers?.['downlink'] || '10');
  if (downlink < 0.5) return 'minimal';
  if (downlink < 2) return 'reduced';
  return 'normal';
}

function logDegradationEvent(req, level) {
  console.log(JSON.stringify({
    type: 'resilience.degradation',
    level,
    endpoint: req?.url,
    mode: runtimePolicyConfig.degradationMode,
    timestamp: new Date().toISOString(),
  }));
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
    const endpoint = req ? new URL(req.url ?? '/', 'http://localhost').pathname : undefined;
    payload = stripForLowBandwidth(body, endpoint);
    logDegradationEvent(req, getDegradationLevel(req));
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
    'Cache-Control': isLowBandwidth ? `max-age=${runtimePolicyConfig.lbwCacheSeconds}, public` : 'no-cache',
    'X-Low-Bandwidth': isLowBandwidth ? 'true' : 'false',
    'X-Degradation-Mode': runtimePolicyConfig.degradationMode,
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
    } else if (url === '/audit/bundles') {
      if (!auditBundlesEnabled) {
        return sendJson(res, 404, { error: 'Not found' }, req);
      }
      if (req.method !== 'POST') {
        return sendJson(res, 405, { error: 'Method not allowed' }, req);
      }
      if (!auditBundlesResolver) {
        return sendJson(res, 503, {
          error: 'tradepass-resolver-unconfigured',
          acceptedIds: [],
        }, req);
      }
      const body = await readBody(req);
      const headersLower = {};
      for (const [k, v] of Object.entries(req.headers)) {
        if (typeof v === 'string') headersLower[k.toLowerCase()] = v;
      }
      const result = await processAuditBundle({
        method: req.method,
        url: `https://${req.headers.host ?? 'localhost'}${req.url ?? '/audit/bundles'}`,
        body,
        headers: headersLower,
        expectedAudience: auditBundlesExpectedAudience,
        resolver: auditBundlesResolver,
        nonceGate: auditBundlesNonceGate,
        signAuditEvent,
      });
      return sendJson(res, result.status, result.body, req);
    } else if (url === '/audit/query') {
      if (!auditQueryEnabled) {
        return sendJson(res, 404, { error: 'Not found' }, req);
      }
      const body = await readBody(req);
      const headersLower = {};
      for (const [k, v] of Object.entries(req.headers)) {
        if (typeof v === 'string') headersLower[k.toLowerCase()] = v;
      }
      const result = await processAuditQuery({
        method: req.method,
        body,
        headers: headersLower,
        store: auditQueryStore,
        signAuditEvent,
        incrementCounter,
      });
      return sendJson(res, result.status, result.body, req);
    } else if (url === '/v1/audit/chain') {
      const principal = requirePermission(req, res, 'audit:read');
      if (!principal) {
        return;
      }
      sendJson(res, 200, getChainState(), req);
    } else if (url === '/v1/audit/evidence-bundle') {
      const principal = requirePermission(req, res, 'audit:read');
      if (!principal) {
        return;
      }
      const sinceParam = new URL(req.url ?? '/', 'http://localhost').searchParams.get('since') ?? undefined;
      sendJson(res, 200, buildEvidenceBundle({
        tenantId: principal.tenantId,
        since: sinceParam,
      }), req);
    } else if (url === '/v1/brief') {
      const principal = requirePermission(req, res, 'query:read');
      if (!principal) {
        return;
      }
      const sinceParam = new URL(req.url ?? '/', 'http://localhost').searchParams.get('since') ?? undefined;
      const chainState = getChainState();
      const spend = getSpend(principal.subject, principal.tenantId);
      sendJson(res, 200, {
        tenantId: principal.tenantId,
        since: sinceParam,
        producedAt: new Date().toISOString(),
        chainHead: chainState.lastHash,
        recordCount: chainState.recordCount,
        totalRecords: chainState.totalRecords,
        spend,
        signing: getSignerHealth().signing,
        narrative: buildBriefNarrative({
          chainState,
          spend,
          signing: getSignerHealth().signing,
        }),
      }, req);
    } else if (url === '/v1/audit/verify') {
      const principal = requirePermission(req, res, 'audit:read');
      if (!principal) {
        return;
      }
      if (req.method !== 'POST') {
        return sendJson(res, 405, { error: 'Method not allowed' }, req);
      }
      const body = await readBody(req);
      const result = verifyAuditBody(body);
      sendJson(res, 200, result, req);
    } else if (url === '/health') {
      const signerHealth = getSignerHealth();
      const productionUnsigned =
        process.env.NODE_ENV === 'production' && !signerHealth.signing;
      const unhealthy = authState.configurationError || productionUnsigned;
      sendJson(res, unhealthy ? 503 : 200, {
        authConfigured: !authState.configurationError,
        authMode: authState.defaulted ? 'dev-default-readonly' : 'configured',
        audit: {
          signing: signerHealth.signing,
          ephemeral: signerHealth.ephemeral,
          maxInMemoryRecords: signerHealth.maxInMemoryRecords,
          ...getChainState(),
        },
        status: unhealthy ? 'unhealthy' : 'healthy',
        tools: toolCount,
        providers: providerCount,
        availableProviders: getProviders().map((p) => p.name),
        ...(authState.configurationError ? { error: authState.configurationError } : {}),
        ...(productionUnsigned ? { error: 'audit signing not configured in production' } : {}),
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
    } else if (url === '/metrics') {
      // Reflect live audit posture into gauges so /metrics is self-consistent.
      const sh = getSignerHealth();
      setGauge('compliance_gateway_audit_signing', undefined, sh.signing ? 1 : 0);
      setGauge('compliance_gateway_audit_sink_connected', { mode: sh.sink?.mode }, sh.sink?.natsConnected ? 1 : 0);
      const chainState = getChainState();
      setGauge('compliance_gateway_audit_chain_in_memory', undefined, chainState.recordCount);
      setGauge('compliance_gateway_audit_chain_total', undefined, chainState.totalRecords);
      res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' });
      res.end(renderMetrics());
      return;
    } else if (url === '/v1/budget') {
      const principal = requirePermission(req, res, 'query:read');
      if (!principal) {
        return;
      }
      sendJson(res, 200, getSpend(principal.subject, principal.tenantId), req);
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
  const adaptiveThresholds = defaultThresholds();
  if (adaptiveThresholds.enabled) {
    startAdaptiveScheduler({
      sampleLatencyP95Ms: () => runtimePolicyConfig.observedLatencyP95Ms ?? 0,
      sampleErrorRate: () => runtimePolicyConfig.observedErrorRate ?? 0,
      getCurrentMode: () => runtimePolicyConfig.degradationMode,
      onChange: (next, reason) => {
        const previous = runtimePolicyConfig.degradationMode;
        runtimePolicyConfig.degradationMode = next;
        signAuditEvent({
          actor: 'compliance-gateway',
          action: 'resilience.policy.adaptation',
          target: 'runtimePolicyConfig.degradationMode',
          reason,
          payload: { previous, next, reason },
        });
      },
      thresholds: adaptiveThresholds,
    });
  }
  console.log(JSON.stringify({
    authConfigured: !authState.configurationError,
    auditInitialized: auditInit.initialized,
    auditEphemeral: auditInit.ephemeral,
    adaptivePolicy: adaptiveThresholds.enabled ? 'enabled' : 'disabled',
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

export { server, handleQuery, estimateCost, stripForLowBandwidth, sendJson };
