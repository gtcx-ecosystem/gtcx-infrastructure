/**
 * @fileoverview Multi-Provider LLM Router
 *
 * Cost-optimized routing across multiple LLM providers.
 * Supports fallback chains, query complexity classification,
 * and provider health tracking.
 *
 * Routing strategy:
 *   Simple queries (1 tool)   → Free tier (Gemini Flash, Groq)
 *   Medium queries (2-3 tools) → Cost-optimized (DeepSeek, Gemini Pro)
 *   Complex queries (4+ tools) → Frontier (Claude Sonnet, GPT-4.1)
 *
 * Environment variables (all optional — gateway works with any subset):
 *   ANTHROPIC_API_KEY    — Claude (Sonnet, Haiku)
 *   GOOGLE_API_KEY       — Gemini (2.5 Pro, 2.5 Flash, 2.0 Flash)
 *   OPENAI_API_KEY       — GPT-4.1, GPT-4.1-mini
 *   DEEPSEEK_API_KEY     — DeepSeek V3
 *   GROQ_API_KEY         — Llama 3.3 70B (free tier)
 *   OPENROUTER_API_KEY   — Any model via OpenRouter
 *   PREFERRED_PROVIDER   — Override: force a specific provider
 */

// ---------------------------------------------------------------------------
// Provider registry
// ---------------------------------------------------------------------------

/**
 * @typedef {object} ProviderConfig
 * @property {string} name
 * @property {string} model
 * @property {number} inputCostPer1M - USD per 1M input tokens
 * @property {number} outputCostPer1M - USD per 1M output tokens
 * @property {string} tier - 'free' | 'cheap' | 'mid' | 'frontier'
 * @property {number} maxTools - max tools in single request
 * @property {boolean} available - has API key configured
 * @property {Function} createModel - returns AI SDK model instance
 */

const registry = [];

// --- Anthropic ---
if (process.env.ANTHROPIC_API_KEY) {
  const { createAnthropic } = await import('@ai-sdk/anthropic');
  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  registry.push({
    name: 'claude-sonnet',
    model: 'claude-sonnet-4-20250514',
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
    tier: 'frontier',
    maxTools: 128,
    available: true,
    createModel: () => anthropic('claude-sonnet-4-20250514'),
  });

  registry.push({
    name: 'claude-haiku',
    model: 'claude-haiku-4-5-20251001',
    inputCostPer1M: 0.80,
    outputCostPer1M: 4.0,
    tier: 'mid',
    maxTools: 128,
    available: true,
    createModel: () => anthropic('claude-haiku-4-5-20251001'),
  });
}

// --- Google Gemini ---
if (process.env.GOOGLE_API_KEY) {
  const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
  const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_API_KEY });

  registry.push({
    name: 'gemini-2.5-flash',
    model: 'gemini-2.5-flash-preview-04-17',
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
    tier: 'cheap',
    maxTools: 128,
    available: true,
    createModel: () => google('gemini-2.5-flash-preview-04-17'),
  });

  registry.push({
    name: 'gemini-2.0-flash',
    model: 'gemini-2.0-flash',
    inputCostPer1M: 0.10,
    outputCostPer1M: 0.40,
    tier: 'free',
    maxTools: 128,
    available: true,
    createModel: () => google('gemini-2.0-flash'),
  });

  registry.push({
    name: 'gemini-2.5-pro',
    model: 'gemini-2.5-pro-preview-05-06',
    inputCostPer1M: 1.25,
    outputCostPer1M: 10.0,
    tier: 'frontier',
    maxTools: 128,
    available: true,
    createModel: () => google('gemini-2.5-pro-preview-05-06'),
  });
}

// --- OpenAI ---
if (process.env.OPENAI_API_KEY) {
  const { createOpenAI } = await import('@ai-sdk/openai');
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

  registry.push({
    name: 'gpt-4.1-mini',
    model: 'gpt-4.1-mini',
    inputCostPer1M: 0.40,
    outputCostPer1M: 1.60,
    tier: 'cheap',
    maxTools: 128,
    available: true,
    createModel: () => openai('gpt-4.1-mini'),
  });

  registry.push({
    name: 'gpt-4.1',
    model: 'gpt-4.1',
    inputCostPer1M: 2.0,
    outputCostPer1M: 8.0,
    tier: 'frontier',
    maxTools: 128,
    available: true,
    createModel: () => openai('gpt-4.1'),
  });

  registry.push({
    name: 'gpt-4.1-nano',
    model: 'gpt-4.1-nano',
    inputCostPer1M: 0.10,
    outputCostPer1M: 0.40,
    tier: 'free',
    maxTools: 128,
    available: true,
    createModel: () => openai('gpt-4.1-nano'),
  });
}

// --- DeepSeek ---
if (process.env.DEEPSEEK_API_KEY) {
  const { createOpenAI } = await import('@ai-sdk/openai');
  const deepseek = createOpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com/v1',
  });

  registry.push({
    name: 'deepseek-v3',
    model: 'deepseek-chat',
    inputCostPer1M: 0.27,
    outputCostPer1M: 1.10,
    tier: 'cheap',
    maxTools: 64,
    available: true,
    createModel: () => deepseek('deepseek-chat'),
  });
}

// --- Groq (free tier) ---
if (process.env.GROQ_API_KEY) {
  const { createOpenAI } = await import('@ai-sdk/openai');
  const groq = createOpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });

  registry.push({
    name: 'groq-llama-3.3-70b',
    model: 'llama-3.3-70b-versatile',
    inputCostPer1M: 0.0,
    outputCostPer1M: 0.0,
    tier: 'free',
    maxTools: 64,
    available: true,
    createModel: () => groq('llama-3.3-70b-versatile'),
  });
}

// --- OpenRouter (any model) ---
if (process.env.OPENROUTER_API_KEY) {
  const { createOpenAI } = await import('@ai-sdk/openai');
  const openrouter = createOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
  });

  registry.push({
    name: 'openrouter-auto',
    model: 'openrouter/auto',
    inputCostPer1M: 0.50,
    outputCostPer1M: 2.0,
    tier: 'mid',
    maxTools: 128,
    available: true,
    createModel: () => openrouter('openrouter/auto'),
  });
}

// ---------------------------------------------------------------------------
// Query complexity classifier
// ---------------------------------------------------------------------------

/**
 * Classify query complexity to determine which tier to route to.
 * Simple heuristic — can be replaced with a classifier model later.
 *
 * @param {string} query
 * @returns {'simple' | 'medium' | 'complex'}
 */
export function classifyComplexity(query) {
  const lower = query.toLowerCase();

  // Complex: cross-border, settlement, dispute, consensus, multi-party
  const complexSignals = [
    'cross-border', 'settlement', 'dispute', 'consensus', 'multi-party',
    'escrow', 'arbitration', 'appeal', 'attestation', 'all documents',
    'full compliance', 'end to end', 'complete verification',
  ];
  if (complexSignals.some((s) => lower.includes(s))) return 'complex';

  // Simple: single entity lookup, health check, status
  const simpleSignals = [
    'check', 'verify', 'look up', 'find', 'status', 'score',
    'what is', 'who is', 'is this', 'does this',
  ];
  if (simpleSignals.some((s) => lower.includes(s))) return 'simple';

  return 'medium';
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

const tierPriority = {
  simple: ['free', 'cheap', 'mid', 'frontier'],
  medium: ['cheap', 'mid', 'frontier', 'free'],
  complex: ['frontier', 'mid', 'cheap', 'free'],
};

/**
 * Select the best available provider for a query.
 *
 * @param {string} query
 * @returns {ProviderConfig | null}
 */
export function selectProvider(query) {
  // Override: force a specific provider
  const preferred = process.env.PREFERRED_PROVIDER;
  if (preferred) {
    const match = registry.find((p) => p.name === preferred);
    if (match) return match;
  }

  const complexity = classifyComplexity(query);
  const priority = tierPriority[complexity];

  for (const tier of priority) {
    const candidates = registry.filter((p) => p.tier === tier && p.available);
    if (candidates.length > 0) {
      // Pick cheapest in tier
      return candidates.sort((a, b) =>
        (a.inputCostPer1M + a.outputCostPer1M) - (b.inputCostPer1M + b.outputCostPer1M)
      )[0];
    }
  }

  return registry[0] || null;
}

/**
 * Get fallback chain for a provider (next cheapest available).
 *
 * @param {ProviderConfig} primary
 * @returns {ProviderConfig[]}
 */
export function getFallbackChain(primary) {
  return registry
    .filter((p) => p.name !== primary.name && p.available)
    .sort((a, b) =>
      (a.inputCostPer1M + a.outputCostPer1M) - (b.inputCostPer1M + b.outputCostPer1M)
    );
}

/**
 * Get all available providers.
 * @returns {ProviderConfig[]}
 */
export function getProviders() {
  return registry;
}

export const providerCount = registry.length;
