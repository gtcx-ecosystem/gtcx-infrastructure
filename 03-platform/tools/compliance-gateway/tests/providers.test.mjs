/**
 * @fileoverview Provider Routing Unit Tests
 *
 * Tests the LLM provider registry, complexity classification, and cost-optimized
 * routing without requiring real API keys. Uses dynamic imports with cache-busting
 * to test different provider configurations.
 */

import assert from 'node:assert';
import { describe, it, before, after } from 'node:test';

let classifyComplexity;

// Load the pure functions from a fresh module instance.
before(async () => {
  const mod = await import('../03-platform/src/providers.mjs?v=pure');
  classifyComplexity = mod.classifyComplexity;
});

after(() => {
  // Clean up any env vars set during tests
  delete process.env.PREFERRED_PROVIDER;
  delete process.env.GOOGLE_API_KEY;
  delete process.env.GROQ_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.DEEPSEEK_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
});

describe('classifyComplexity', () => {
  it('classifies settlement queries as complex', () => {
    assert.strictEqual(classifyComplexity('What is the settlement status?'), 'complex');
    assert.strictEqual(classifyComplexity('Cross-border escrow dispute'), 'complex');
    assert.strictEqual(classifyComplexity('Multi-party arbitration'), 'complex');
    assert.strictEqual(classifyComplexity('Full compliance attestation'), 'complex');
  });

  it('classifies simple lookup queries as simple', () => {
    assert.strictEqual(classifyComplexity('Check the status of shipment ABC'), 'simple');
    assert.strictEqual(classifyComplexity('What is the score for this operator?'), 'simple');
    assert.strictEqual(classifyComplexity('Look up trader T-123'), 'simple');
    assert.strictEqual(classifyComplexity('Verify this document'), 'simple');
  });

  it('classifies ambiguous queries as medium', () => {
    assert.strictEqual(classifyComplexity('Tell me about the trade'), 'medium');
    assert.strictEqual(classifyComplexity('Overview of compliance rules'), 'medium');
  });
});

describe('Provider registry with no API keys', () => {
  it('selectProvider returns null when registry is empty', async () => {
    const mod = await import('../03-platform/src/providers.mjs?v=empty');
    assert.strictEqual(mod.selectProvider('any query'), null);
  });

  it('getFallbackChain returns empty array when registry is empty', async () => {
    const mod = await import('../03-platform/src/providers.mjs?v=empty2');
    assert.deepStrictEqual(mod.getFallbackChain({ name: 'x', available: true }), []);
  });

  it('getProviders returns empty array when registry is empty', async () => {
    const mod = await import('../03-platform/src/providers.mjs?v=empty3');
    assert.deepStrictEqual(mod.getProviders(), []);
  });

  it('providerCount is zero when registry is empty', async () => {
    const mod = await import('../03-platform/src/providers.mjs?v=empty4');
    assert.strictEqual(mod.providerCount, 0);
  });
});

describe('Provider registry with Google API key', () => {
  it('registers Gemini providers when GOOGLE_API_KEY is set', async () => {
    process.env.GOOGLE_API_KEY = 'test-google-key';
    const mod = await import('../03-platform/src/providers.mjs?v=google');
    const providers = mod.getProviders();
    assert.ok(providers.length >= 2, 'should register at least 2 Gemini providers');
    const names = providers.map((p) => p.name);
    assert.ok(names.some((n) => n.includes('gemini')), 'should include gemini providers');
  });

  it('selectProvider picks cheapest available tier', async () => {
    process.env.GOOGLE_API_KEY = 'test-google-key';
    const mod = await import('../03-platform/src/providers.mjs?v=google2');
    const provider = mod.selectProvider('Look up status');
    assert.ok(provider, 'should return a provider');
    assert.ok(provider.tier === 'free' || provider.tier === 'cheap', 'simple query should route to free or cheap tier');
  });

  it('getFallbackChain excludes primary and sorts by cost', async () => {
    process.env.GOOGLE_API_KEY = 'test-google-key';
    const mod = await import('../03-platform/src/providers.mjs?v=google3');
    const primary = mod.getProviders()[0];
    const fallbacks = mod.getFallbackChain(primary);
    assert.ok(fallbacks.every((p) => p.name !== primary.name), 'fallbacks should exclude primary');
    // Should be sorted by ascending cost
    for (let i = 1; i < fallbacks.length; i++) {
      const prev = fallbacks[i - 1];
      const curr = fallbacks[i];
      assert.ok(
        (prev.inputCostPer1M + prev.outputCostPer1M) <= (curr.inputCostPer1M + curr.outputCostPer1M),
        'fallbacks should be sorted by cost'
      );
    }
  });
});

describe('PREFERRED_PROVIDER override', () => {
  it('forces a specific provider when PREFERRED_PROVIDER matches', async () => {
    process.env.GOOGLE_API_KEY = 'test-google-key';
    process.env.PREFERRED_PROVIDER = 'gemini-2.0-flash';
    const mod = await import('../03-platform/src/providers.mjs?v=override');
    const provider = mod.selectProvider('Any query');
    assert.strictEqual(provider?.name, 'gemini-2.0-flash');
  });

  it('falls through to normal routing when PREFERRED_PROVIDER does not match', async () => {
    process.env.GOOGLE_API_KEY = 'test-google-key';
    process.env.PREFERRED_PROVIDER = 'nonexistent-provider';
    const mod = await import('../03-platform/src/providers.mjs?v=override2');
    const provider = mod.selectProvider('Look up status');
    assert.ok(provider, 'should still return a provider when preferred is unmatched');
    assert.notStrictEqual(provider?.name, 'nonexistent-provider');
  });
});

describe('Provider registration — OpenAI', () => {
  it('registers OpenAI providers when OPENAI_API_KEY is set', async () => {
    process.env.OPENAI_API_KEY = 'test-openai-key';
    const mod = await import('../03-platform/src/providers.mjs?v=openai');
    const providers = mod.getProviders();
    const names = providers.map((p) => p.name);
    assert.ok(names.some((n) => n.includes('gpt')), 'should include gpt providers');
    for (const p of providers) {
      assert.ok(typeof p.createModel === 'function', `${p.name} should have createModel`);
      const model = p.createModel();
      assert.ok(model, `${p.name} createModel should return a model`);
    }
  });
});

describe('Provider registration — DeepSeek', () => {
  it('registers DeepSeek provider when DEEPSEEK_API_KEY is set', async () => {
    process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
    const mod = await import('../03-platform/src/providers.mjs?v=deepseek');
    const providers = mod.getProviders();
    const names = providers.map((p) => p.name);
    assert.ok(names.includes('deepseek-v3'), 'should include deepseek-v3');
    for (const p of providers) {
      const model = p.createModel();
      assert.ok(model, `${p.name} createModel should return a model`);
    }
  });
});

describe('Provider registration — Groq', () => {
  it('registers Groq provider when GROQ_API_KEY is set', async () => {
    process.env.GROQ_API_KEY = 'test-groq-key';
    const mod = await import('../03-platform/src/providers.mjs?v=groq');
    const providers = mod.getProviders();
    const names = providers.map((p) => p.name);
    assert.ok(names.includes('groq-llama-3.3-70b'), 'should include groq-llama');
    for (const p of providers) {
      const model = p.createModel();
      assert.ok(model, `${p.name} createModel should return a model`);
    }
  });
});

describe('Provider registration — OpenRouter', () => {
  it('registers OpenRouter provider when OPENROUTER_API_KEY is set', async () => {
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    const mod = await import('../03-platform/src/providers.mjs?v=openrouter');
    const providers = mod.getProviders();
    const names = providers.map((p) => p.name);
    assert.ok(names.includes('openrouter-auto'), 'should include openrouter-auto');
    for (const p of providers) {
      const model = p.createModel();
      assert.ok(model, `${p.name} createModel should return a model`);
    }
  });
});

describe('Complexity routing with multiple providers', () => {
  it('routes complex queries to frontier tier', async () => {
    process.env.GOOGLE_API_KEY = 'test-google-key';
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    const mod = await import('../03-platform/src/providers.mjs?v=multi');
    // With both keys, we should have frontier (claude-sonnet) and cheap (gemini)
    const provider = mod.selectProvider('Cross-border settlement dispute');
    assert.ok(provider, 'should return a provider');
    assert.strictEqual(provider.tier, 'frontier');
  });

  it('routes simple queries to free/cheap tier even when frontier is available', async () => {
    process.env.GOOGLE_API_KEY = 'test-google-key';
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    const mod = await import('../03-platform/src/providers.mjs?v=multi2');
    const provider = mod.selectProvider('Check status');
    assert.ok(provider, 'should return a provider');
    assert.ok(provider.tier === 'free' || provider.tier === 'cheap', 'simple query should not route to frontier');
  });
});
