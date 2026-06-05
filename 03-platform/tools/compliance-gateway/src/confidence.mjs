/**
 * @fileoverview Heuristic confidence scoring for LLM-driven query
 * responses.
 *
 * AI-native Pattern #5 (Progressive Confidence): "The interface
 * communicates the system's certainty level and adapts behavior
 * accordingly. High confidence → auto-execute. Low confidence →
 * surface for review."
 *
 * Vercel AI SDK's generateText doesn't return per-step confidence,
 * so we derive a heuristic score in [0, 1] from observable signals:
 *
 *   1. Step count vs. expected for complexity tier. The provider
 *      configured for a 'simple' query taking 5 steps signals the
 *      router under-tiered the question — drop confidence.
 *   2. Caveat language in the answer ("I'm not sure", "you may want
 *      to verify", "double-check", etc.). Even modern frontier
 *      models hedge when they should.
 *   3. Tool retry signal. The same tool called twice with mutated
 *      args usually means the model was correcting itself.
 *   4. Empty-result tool calls. A tool returning {} or [] often
 *      means the model picked the wrong tool for the question.
 *
 * The score is intentionally heuristic — we ship it as a surfaced
 * signal alongside the raw signals so caller agents can adopt their
 * own thresholds. We do NOT yet gate tool execution on it (that's
 * a follow-up in Sprint 4.5 once downstream consumers calibrate).
 */

const COMPLEXITY_EXPECTED_STEPS = {
  simple: 1,
  medium: 2,
  complex: 4,
};

const CAVEAT_PATTERNS = [
  /\bnot sure\b/i,
  /\bunclear\b/i,
  /\bdouble[- ]check\b/i,
  /\bverify (this|that|with)\b/i,
  /\bcannot (confirm|verify|determine)\b/i,
  /\binsufficient (data|information|context)\b/i,
  /\bmay need\b/i,
  /\bplease consult\b/i,
  /\bI don't (have|know|see)\b/i,
];

/**
 * @typedef {object} ConfidenceSignals
 * @property {number} stepsUsed
 * @property {number} stepsExpected
 * @property {number} stepRatio        - stepsUsed / stepsExpected
 * @property {number} caveatMatches    - count of caveat regex hits
 * @property {number} repeatedToolCalls
 * @property {number} emptyToolResults
 */

/**
 * @typedef {object} ConfidenceResult
 * @property {number} score            - in [0, 1]; higher = more confident
 * @property {ConfidenceSignals} signals
 * @property {string} band             - 'high' | 'medium' | 'low'
 */

/**
 * Compute a confidence score from the LLM result + the routing
 * complexity classification.
 *
 * Pure function — no side effects, deterministic given inputs. Easy
 * to unit-test and easy to swap for a model-calibrated score later.
 *
 * @param {{
 *   text?: string,
 *   steps?: Array<{ toolCalls?: Array<{ toolName: string, args?: object }>, toolResults?: Array<{ result: unknown }> }>,
 * }} llmResult
 * @param {'simple' | 'medium' | 'complex'} complexity
 * @returns {ConfidenceResult}
 */
export function computeConfidence(llmResult, complexity = 'medium') {
  const steps = Array.isArray(llmResult?.steps) ? llmResult.steps : [];
  const text = typeof llmResult?.text === 'string' ? llmResult.text : '';

  const stepsUsed = steps.length;
  const stepsExpected = COMPLEXITY_EXPECTED_STEPS[complexity] ?? 2;
  const stepRatio = stepsExpected === 0 ? 1 : stepsUsed / stepsExpected;

  // Count tool retries: same toolName called more than once across steps.
  const toolCallCounts = new Map();
  const allCalls = steps.flatMap((s) => s.toolCalls ?? []);
  for (const c of allCalls) {
    toolCallCounts.set(c.toolName, (toolCallCounts.get(c.toolName) ?? 0) + 1);
  }
  let repeatedToolCalls = 0;
  for (const count of toolCallCounts.values()) {
    if (count > 1) repeatedToolCalls += count - 1;
  }

  // Empty-result tool calls: result is null, undefined, [], or {} with no keys.
  let emptyToolResults = 0;
  const allResults = steps.flatMap((s) => s.toolResults ?? []);
  for (const r of allResults) {
    const v = r?.result;
    if (v === null || v === undefined) emptyToolResults += 1;
    else if (Array.isArray(v) && v.length === 0) emptyToolResults += 1;
    else if (typeof v === 'object' && v !== null && !Array.isArray(v) && Object.keys(v).length === 0) {
      emptyToolResults += 1;
    }
  }

  const caveatMatches = CAVEAT_PATTERNS.filter((rx) => rx.test(text)).length;

  // Aggregate into [0, 1]. Start at 1.0 and apply penalties.
  let score = 1.0;
  // Step overshoot penalty: 0.5 → 0.1 cap; under-shoot is neutral.
  if (stepRatio > 1) {
    score -= Math.min(0.4, (stepRatio - 1) * 0.15);
  }
  // Caveats: each one shaves 0.1, capped at 0.3.
  score -= Math.min(0.3, caveatMatches * 0.1);
  // Retried tools: each retry shaves 0.1, capped at 0.3.
  score -= Math.min(0.3, repeatedToolCalls * 0.1);
  // Empty results: each shaves 0.1, capped at 0.2.
  score -= Math.min(0.2, emptyToolResults * 0.1);

  score = Math.max(0, Math.min(1, score));

  const band = score >= 0.85 ? 'high' : score >= 0.55 ? 'medium' : 'low';

  return {
    score: Math.round(score * 100) / 100,
    band,
    signals: {
      stepsUsed,
      stepsExpected,
      stepRatio: Math.round(stepRatio * 100) / 100,
      caveatMatches,
      repeatedToolCalls,
      emptyToolResults,
    },
  };
}
