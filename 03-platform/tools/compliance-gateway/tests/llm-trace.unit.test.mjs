import assert from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'node:test';
import { recordLlmTrace } from '../03-platform/src/llm-trace.mjs';
import { resetMetrics, renderMetrics } from '../03-platform/src/metrics.mjs';

describe('llm-trace', () => {
  const env = { ...process.env };

  beforeEach(() => {
    resetMetrics();
  });

  afterEach(() => {
    process.env = { ...env };
  });

  it('returns none when tracing env absent', () => {
    delete process.env.LANGCHAIN_TRACING_V2;
    delete process.env.LANGCHAIN_API_KEY;
    delete process.env.HELICONE_API_KEY;
    const r = recordLlmTrace({ traceId: 'abc', provider: 'anthropic' });
    assert.strictEqual(r.backend, 'none');
  });

  it('records langsmith backend when configured', () => {
    process.env.LANGCHAIN_TRACING_V2 = 'true';
    process.env.LANGCHAIN_API_KEY = 'test-key';
    process.env.LANGCHAIN_PROJECT = 'compliance-gateway-staging';
    process.env.GTCX_TRACE_ID = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';
    const r = recordLlmTrace({ provider: 'anthropic' });
    assert.strictEqual(r.backend, 'langsmith');
    assert.match(r.traceUrl ?? '', /smith\.langchain\.com/);
    assert.match(renderMetrics(), /compliance_gateway_llm_traces_total/);
  });
});
