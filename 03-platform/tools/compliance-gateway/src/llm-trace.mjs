/**
 * SIGNAL INF-004 — optional LLM trace correlation (LangSmith / Helicone).
 * No SDK dependency; records backend + redacted trace URL template in metrics.
 */
import { incrementCounter } from './metrics.mjs';

/**
 * @param {{ traceId?: string, provider?: string, operation?: string }} ctx
 * @returns {{ backend: string, traceUrl?: string, traceId?: string }}
 */
export function recordLlmTrace(ctx = {}) {
  const traceId = ctx.traceId ?? process.env.GTCX_TRACE_ID;
  const provider = ctx.provider ?? 'unknown';
  const operation = ctx.operation ?? 'inference';

  if (process.env.LANGCHAIN_TRACING_V2 === 'true' && process.env.LANGCHAIN_API_KEY) {
    const project = process.env.LANGCHAIN_PROJECT ?? 'compliance-gateway';
    const traceUrl = traceId
      ? `https://smith.langchain.com/o/default/projects/p/${encodeURIComponent(project)}/r/${traceId}`
      : undefined;
    incrementCounter('compliance_gateway_llm_traces_total', {
      backend: 'langsmith',
      provider,
      operation,
    });
    return { backend: 'langsmith', traceUrl, traceId };
  }

  if (process.env.HELICONE_API_KEY) {
    incrementCounter('compliance_gateway_llm_traces_total', {
      backend: 'helicone',
      provider,
      operation,
    });
    return {
      backend: 'helicone',
      traceUrl: traceId ? `https://helicone.ai/requests?requestId=${traceId}` : undefined,
      traceId,
    };
  }

  return { backend: 'none', traceId };
}
