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
import { brotliCompressSync, gzipSync } from 'node:zlib';

import { generateText } from 'ai';

import { startAdaptiveScheduler, defaultThresholds } from './adaptive-policy.mjs';
import { createTradePassResolver, createMockResolver } from './audit-bundles/did-resolver.mjs';
import { processBundle as processAuditBundle } from './audit-bundles/handler.mjs';
import { processQuery as processAuditQuery } from './audit-query/handler.mjs';
import { NdjsonQueryStore } from './audit-query/ndjson-store.mjs';
import { InMemoryQueryStore } from './audit-query/store.mjs';
import { sanitizeAuditTarget } from './audit-target.mjs';
import {
  initAuditSigner,
  signAuditEvent,
  getChainState,
  verifyAuditBody,
  getSignerHealth,
  buildEvidenceBundle,
  getExceptions,
} from './audit.mjs';
import {
  clearAuthFailures,
  isAuthThrottled,
  recordAndCheckAuthFailure,
  sourceIpFromRequest,
} from './auth-failure-throttle.mjs';
import {
  authenticateHeaders,
  buildAccessProfile,
  loadAuthState,
  parseApprovalContext,
} from './auth.mjs';
import { checkBudget, recordSpend, getSpend } from './budget.mjs';
import { computeConfidence } from './confidence.mjs';
import { EVIDENCE_HTML_CSP, renderEvidenceHtml } from './evidence-renderer.mjs';
import { incrementCounter, setGauge, renderMetrics } from './metrics.mjs';
import { createNonceStore } from './nonce-store/redis.mjs';
import { buildRuntimePolicyPrompt } from './policy.mjs';
import {
  selectProvider as defaultSelectProvider,
  getFallbackChain as defaultGetFallbackChain,
  getProviders,
  providerCount,
  classifyComplexity,
} from './providers.mjs';
import { validateQueryBody, buildUserMessage } from './schemas.mjs';
import { systemPrompt } from './system-prompt.mjs';
import { createToolRegistry, listToolsForAccess, toolCount } from './tools.mjs';

// In-flight /v1/query count, exposed to the HPA via the
// compliance_gateway_inflight_requests metric (autoscaling.v2 Pods target).
// Initialized to 0 at module load so /metrics always exposes the series
// (Prometheus expects long-running gauges to be present even when zero).
let inflightQueries = 0;
setGauge('compliance_gateway_inflight_requests', undefined, 0);

/** Prefer baseline-os cost-router when built; legacy providers.mjs as fallback. */
async function selectProviderWithBaseline(query) {
  try {
    const { selectProviderViaBaseline } = await import('./cost-router-shim.mjs');
    const via = await selectProviderViaBaseline(query, {
      getProviders,
      selectProvider: defaultSelectProvider,
    });
    if (via) return via;
  } catch {
    // baseline-os dist not built or BASELINE_COST_ROUTER=0
  }
  return defaultSelectProvider(query);
}

const defaultRoutingDeps = {
  selectProvider: selectProviderWithBaseline,
  getFallbackChain: defaultGetFallbackChain,
};

const PORT = Number(process.env.PORT ?? 8500);
const authState = loadAuthState(process.env);
const auditInit = initAuditSigner(process.env);

// Fail-closed: in production, the gateway must not run without a signing
// key. Tamper-evident audit is a stated contract; refuse to serve without it.
if (process.env.NODE_ENV === 'production' && !auditInit.initialized) {
  console.error(
    JSON.stringify({
      level: 'fatal',
      type: 'audit.signer.startupRefused',
      message:
        'Compliance Gateway refusing to start: audit signing key not configured in production.',
      error: auditInit.error,
    })
  );

  process.exit(78); // EX_CONFIG
}

// ---------------------------------------------------------------------------
// Runtime policy (from ConfigMap — adjustable without code changes)
// ---------------------------------------------------------------------------

const runtimePolicyConfig = {
  degradationMode: process.env.GTCX_DEGRADATION_MODE || 'auto',
  lbwStripFields: (process.env.GTCX_LBW_STRIP_FIELDS || 'authz,usage,toolResults')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
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
const tradePassIdentityPathPrefix =
  process.env.TRADEPASS_IDENTITY_PATH_PREFIX || '/identity';

// Until gtcx-protocols #60 lands a real TradePass deployment behind a
// stable URL (tracked on #55), no real DID resolver is wired and any
// request to /audit/bundles is rejected with 503. Tests inject a
// mockable resolver directly into processBundle; production wiring
// happens when TRADEPASS_BASE_URL is set in the staging environment.
const tradePassAuthToken =
  process.env.TRADEPASS_API_KEY?.trim() || process.env.GTCX_API_KEY?.trim() || '';
const auditBundlesResolver = tradePassBaseUrl
  ? createTradePassResolver({
      baseUrl: tradePassBaseUrl,
      identityPathPrefix: tradePassIdentityPathPrefix,
      authToken: tradePassAuthToken || undefined,
    })
  : null;

const auditBundlesNonceGate = createNonceStore({ tenantId: 'audit-bundles' });
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
 * Token validator for /audit/query. Looks up the bearer against the
 * configured gateway tokens, enforces the `audit:read` permission, and
 * returns the token-bound tenantId. The handler uses the returned
 * tenantId to bind the query — preventing a tenant-a token from
 * reading tenant-b records by setting X-GTCX-Tenant-Id: tenant-b.
 *
 * @param {string} token
 * @returns {{ ok: true, tenantId: string, subject: string } | { ok: false, error: string }}
 */
function validateAuditQueryToken(token) {
  if (authState.configurationError) {
    return { ok: false, error: authState.configurationError };
  }
  for (const entry of authState.tokens) {
    // Constant-time compare is unnecessary here because matchPrincipal
    // already covers it on the /v1/query path; the audit-query handler
    // is rate-limited by checkBudget and the token search space is
    // small (operator-configured token list). The lookup is O(n) on a
    // bounded n.
    if (entry.token === token) {
      if (!entry.permissions.includes('audit:read')) {
        return { ok: false, error: 'Missing required permission: audit:read' };
      }
      return {
        ok: true,
        tenantId: entry.tenantId ?? 'default',
        subject: entry.subject,
      };
    }
  }
  return { ok: false, error: 'Invalid bearer token' };
}

/**
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {string} requiredPermission
 */
function requirePermission(req, res, requiredPermission) {
  const target = sanitizeAuditTarget(req.url);
  const sourceIp = sourceIpFromRequest(req);

  // Throttle gate BEFORE auth. If this IP has crossed the failure
  // threshold, refuse without signing — otherwise bearer brute-force
  // becomes an audit-DoS amplifier (Ed25519 sign + chain append per
  // attempt). The counter increment happens via the metric, not the
  // audit chain, so dashboards still see the abuse.
  const throttle = isAuthThrottled(sourceIp);
  if (throttle.throttled) {
    incrementCounter('compliance_gateway_auth_throttled_total', { sourceIp });
    res.setHeader?.('Retry-After', String(throttle.retryAfterSeconds ?? 60));
    sendJson(
      res,
      429,
      {
        error: 'Too many authentication failures from this source',
        retryAfterSeconds: throttle.retryAfterSeconds,
      },
      req
    );
    return null;
  }

  const auth = authenticateHeaders(req.headers, authState, requiredPermission);
  if (!auth.ok) {
    const update = recordAndCheckAuthFailure(sourceIp);
    incrementCounter('compliance_gateway_auth_failures_total', {
      reason: auth.status === 401 ? 'invalid-token' : 'missing-permission',
      throttled: update.throttled ? 'true' : 'false',
    });
    // Once throttled, skip the signing to break the amplifier. Pre-
    // throttle failures still sign so the regulator-facing trail
    // captures the early abuse signal.
    if (update.shouldSign) {
      // Tag auth failures with the synthetic `platform` tenant. The
      // attacker's intended tenant is unknown — and even if known via
      // a guessable header, leaking it to that tenant's `/v1/exceptions`
      // feed would itself be an enumeration oracle. Routing all auth
      // failures to a `platform` tenant means a security principal
      // holding a `platform`-scoped token sees them; regular tenant
      // tokens do not.
      signAuditEvent({
        actor: 'unknown',
        action: `auth:failure`,
        target,
        reason: `${requiredPermission}: ${auth.error}`,
        tenantId: 'platform',
        payload: { tenantId: 'platform', sourceIp, failuresInWindow: update.count },
      });
    }
    sendJson(res, auth.status, { error: auth.error }, req);
    return null;
  }

  // Successful auth wipes the failure counter for this IP — humans
  // who fat-fingered once shouldn't carry that into the next session.
  clearAuthFailures(sourceIp);

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

async function handleQuery(
  req,
  res,
  deps = {
    generateText,
    ...defaultRoutingDeps,
  }
) {
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
    return sendJson(
      res,
      validation.status,
      {
        error: validation.error,
        fieldErrors: validation.fieldErrors,
      },
      req
    );
  }
  const { query, jurisdiction, context } = validation.data;

  // Bound blast radius: a single principal cannot exceed its QPS or
  // its daily LLM spend. The check is intentionally before the LLM
  // call so abuse does not produce provider invocations.
  const budgetCheck = await checkBudget(principal.subject, principal.tenantId);
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
    return sendJson(
      res,
      budgetCheck.status,
      {
        error:
          budgetCheck.reason === 'qps'
            ? 'Rate limit exceeded for this principal'
            : 'Daily LLM budget exceeded for this principal',
        retryAfterSeconds: budgetCheck.retryAfterSeconds,
        limits: budgetCheck.limits,
        spentUsd: budgetCheck.spentUsd,
      },
      req
    );
  }

  const userMessage = buildUserMessage({ query, jurisdiction, context });

  const complexity = classifyComplexity(query);
  const primary = await Promise.resolve(deps.selectProvider(query));

  if (!primary) {
    signAuditEvent({
      actor: principal.subject,
      action: 'query:failure',
      target: query.substring(0, 200),
      payload: { tenantId: principal.tenantId, reason: 'no-providers-configured', status: 503 },
    });
    return sendJson(
      res,
      503,
      {
        error: 'No LLM providers configured',
        hint: 'Set at least one of: GOOGLE_API_KEY, GROQ_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY, DEEPSEEK_API_KEY',
      },
      req
    );
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
        await recordSpend(principal.subject, estimatedCost.totalCostUSD, principal.tenantId);
        incrementCounter(
          'compliance_gateway_cost_usd_total',
          {
            provider: provider.name,
            tier: provider.tier,
            principal: principal.subject,
            tenantId: principal.tenantId,
          },
          estimatedCost.totalCostUSD
        );
      }
      incrementCounter('compliance_gateway_requests_total', {
        route: '/v1/query',
        status: '200',
        tenantId: principal.tenantId,
      });
      setGauge(
        'compliance_gateway_query_latency_ms',
        { provider: provider.name, tenantId: principal.tenantId },
        latencyMs
      );
      // Heuristic confidence score. Surfaced to callers so agent
      // clients can adopt their own thresholds (AI-native Pattern
      // #5: Progressive Confidence). Tool-execution gating on
      // confidence is a follow-up; for now we surface the signal.
      const confidence = computeConfidence(result, complexity);
      setGauge(
        'compliance_gateway_query_confidence',
        { provider: provider.name, tenantId: principal.tenantId, band: confidence.band },
        confidence.score
      );
      signAuditEvent({
        actor: principal.subject,
        action: 'query:success',
        target: query.substring(0, 200),
        // Tag low-confidence responses so the exception-only operator
        // view (AI-native Pattern #3) surfaces them for human review.
        exceptionKind: confidence.band === 'low' ? 'low-confidence' : undefined,
        payload: {
          tenantId: principal.tenantId,
          provider: provider.name,
          complexity,
          latencyMs,
          status: 200,
          estimatedCostUSD: estimatedCost?.totalCostUSD ?? 0,
          confidenceScore: confidence.score,
          confidenceBand: confidence.band,
        },
      });
      return sendJson(
        res,
        200,
        {
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
          confidence,
          usage: result.usage,
        },
        req
      );
    } catch (err) {
      errors.push({ provider: provider.name, error: err?.message });
      console.error(
        JSON.stringify({
          level: 'warn',
          type: 'compliance-gateway.provider.failed',
          provider: provider.name,
          error: err?.message,
          fallbacksRemaining: chain.length - errors.length - 1,
        })
      );
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
  sendJson(
    res,
    502,
    {
      error: 'All LLM providers failed',
      attempts: errors,
      query: query.substring(0, 200),
    },
    req
  );
}

// ---------------------------------------------------------------------------
// Morning-brief narrative builder
// ---------------------------------------------------------------------------

function buildBriefNarrative({ chainState, spend, signing }) {
  const lines = [];
  if (!signing) {
    lines.push('⚠ Audit signing is DISABLED. Investigate before consequential traffic.');
  } else {
    lines.push(
      `Audit chain is healthy: ${chainState.totalRecords} records, head ${chainState.lastHash.slice(0, 12)}…`
    );
  }
  if (spend.spentUsd > 0) {
    const pct = Math.min(100, Math.round((spend.spentUsd / spend.limits.dailyUsd) * 100));
    lines.push(
      `Today: $${spend.spentUsd.toFixed(4)} / $${spend.limits.dailyUsd} (${pct}% of daily budget).`
    );
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
  console.log(
    JSON.stringify({
      type: 'resilience.degradation',
      level,
      endpoint: req?.url,
      mode: runtimePolicyConfig.degradationMode,
      timestamp: new Date().toISOString(),
    })
  );
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
      } catch (err) {
        // Defensive: brotli can throw for invalid inputs or resource constraints.
        // We intentionally fall back to identity/gzip but still surface the failure.
        console.error(JSON.stringify({ level: 'warn', message: 'brotli-compress-failed', error: err?.message }));
      }
    }
    if (!encoding && acceptEncoding.includes('gzip')) {
      data = gzipSync(data);
      encoding = 'gzip';
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': isLowBandwidth
      ? `max-age=${runtimePolicyConfig.lbwCacheSeconds}, public`
      : 'no-cache',
    'X-Low-Bandwidth': isLowBandwidth ? 'true' : 'false',
    'X-Degradation-Mode': runtimePolicyConfig.degradationMode,
  };

  if (encoding) {
    headers['Content-Encoding'] = encoding;
  }

  res.writeHead(status, headers);
  res.end(data);
}

function recordRouteRequest(route, status, tenantId = 'unknown') {
  incrementCounter('compliance_gateway_requests_total', {
    route,
    status: String(status),
    tenantId,
  });
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
        return sendJson(
          res,
          503,
          {
            error: 'tradepass-resolver-unconfigured',
            acceptedIds: [],
          },
          req
        );
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
        nonceGate: await auditBundlesNonceGate,
        checkBudget,
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
        checkBudget,
        signAuditEvent,
        incrementCounter,
        validateToken: validateAuditQueryToken,
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
        recordRouteRequest('/v1/audit/evidence-bundle', res.statusCode || 500);
        return;
      }
      const sinceParam =
        new URL(req.url ?? '/', 'http://localhost').searchParams.get('since') ?? undefined;
      const bundle = buildEvidenceBundle({
        tenantId: principal.tenantId,
        since: sinceParam,
      });
      // Content negotiation: HTML when the caller's Accept header
      // prefers text/html OR when ?format=html is set. Regulators
      // open a browser; agents prefer JSON. Both surfaces are the
      // same underlying bundle.
      const acceptsHtml = (req.headers.accept ?? '').includes('text/html');
      const wantsHtml =
        acceptsHtml ||
        new URL(req.url ?? '/', 'http://localhost').searchParams.get('format') === 'html';
      const format = wantsHtml ? 'html' : 'json';
      recordRouteRequest('/v1/audit/evidence-bundle', 200, principal.tenantId);
      incrementCounter(
        'compliance_gateway_evidence_bundle_records_total',
        { format, tenantId: principal.tenantId },
        bundle.recordCount
      );
      if (wantsHtml) {
        const html = renderEvidenceHtml(bundle);
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `inline; filename="evidence-${principal.tenantId}-${new Date().toISOString().slice(0, 10)}.html"`,
          'Content-Security-Policy': EVIDENCE_HTML_CSP,
          'Cache-Control': 'no-cache',
        });
        res.end(html);
        return;
      }
      sendJson(res, 200, bundle, req);
    } else if (url === '/v1/exceptions') {
      // AI-native Pattern #3 (Exception-Based Workflow): surface only
      // events that require human judgment — auth failures, query
      // failures, throttles, degraded resilience, low-confidence LLM
      // outputs. The 95%+ routine events stay in the audit chain for
      // the regulator trail but never reach the operator's screen.
      const principal = requirePermission(req, res, 'audit:read');
      if (!principal) {
        recordRouteRequest('/v1/exceptions', res.statusCode || 500);
        return;
      }
      const params = new URL(req.url ?? '/', 'http://localhost').searchParams;
      const sinceParam = params.get('since') ?? undefined;
      const kindsParam = params.get('kinds');
      const limitParam = params.get('limit');
      const exceptions = getExceptions({
        tenantId: principal.tenantId,
        since: sinceParam,
        kinds: kindsParam
          ? kindsParam
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
        limit: limitParam ? Math.min(1000, Math.max(1, Number(limitParam))) : 200,
      });
      recordRouteRequest('/v1/exceptions', 200, principal.tenantId);
      incrementCounter(
        'compliance_gateway_exceptions_served_total',
        { tenantId: principal.tenantId, truncated: String(exceptions.truncated) },
        exceptions.exceptions.length
      );
      sendJson(res, 200, exceptions, req);
    } else if (url === '/v1/brief') {
      const principal = requirePermission(req, res, 'query:read');
      if (!principal) {
        return;
      }
      const sinceParam =
        new URL(req.url ?? '/', 'http://localhost').searchParams.get('since') ?? undefined;
      const chainState = getChainState();
      const spend = await getSpend(principal.subject, principal.tenantId);
      sendJson(
        res,
        200,
        {
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
        },
        req
      );
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
      const productionUnsigned = process.env.NODE_ENV === 'production' && !signerHealth.signing;
      const unhealthy = authState.configurationError || productionUnsigned;
      sendJson(
        res,
        unhealthy ? 503 : 200,
        {
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
        },
        req
      );
    } else if (url === '/v1/tools') {
      const principal = requirePermission(req, res, 'tools:read');
      if (!principal) {
        return;
      }
      const accessProfile = buildAccessProfile(principal, parseApprovalContext(req.headers));
      sendJson(
        res,
        200,
        {
          availableCount: listToolsForAccess(accessProfile).length,
          count: toolCount,
          mutatingToolsEnabled: accessProfile.canMutate,
          tools: listToolsForAccess(accessProfile),
        },
        req
      );
    } else if (url === '/metrics') {
      // Reflect live audit posture into gauges so /metrics is self-consistent.
      const sh = getSignerHealth();
      setGauge('compliance_gateway_audit_signing', undefined, sh.signing ? 1 : 0);
      setGauge(
        'compliance_gateway_audit_sink_connected',
        { mode: sh.sink?.mode },
        sh.sink?.natsConnected ? 1 : 0
      );
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
      sendJson(res, 200, await getSpend(principal.subject, principal.tenantId), req);
    } else if (url === '/v1/providers') {
      const principal = requirePermission(req, res, 'providers:read');
      if (!principal) {
        return;
      }
      sendJson(
        res,
        200,
        {
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
        },
        req
      );
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
    console.warn(
      JSON.stringify({
        level: 'warn',
        message:
          'Compliance Gateway is using the default development read-only token. Configure COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON before any shared use.',
      })
    );
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
  console.log(
    JSON.stringify({
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
    })
  );
});

export { server, handleQuery, estimateCost, stripForLowBandwidth, sendJson };
