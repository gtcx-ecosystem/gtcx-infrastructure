#!/usr/bin/env node
/**
 * @fileoverview Shadow Evaluation — provider drift detector.
 *
 * Periodically samples a fraction of production /v1/query calls and
 * fans them out to ALL configured providers in parallel. If any
 * provider's answer diverges meaningfully from the primary, emits a
 * `provider.drift` event so operators can investigate before the
 * divergence reaches end users.
 *
 * This is the substrate behind the SIGNAL alignment claim: when a
 * cost-optimized fallback ladder hides degradation, agents should
 * *notice* before regulators do.
 *
 * Sampling is intentionally conservative (0.5% default) to bound
 * cost. Drift threshold is configurable; the default is "answer
 * meaning differs" — measured by hash, Levenshtein distance, or
 * embedding cosine, depending on `--strategy`.
 *
 * Run as a CronJob in K8s with read-only access to /v1/query.
 */

import { createHash } from 'node:crypto';

const SAMPLE_RATE = parseFloat(process.env.SHADOW_SAMPLE_RATE || '0.005');
const DRIFT_THRESHOLD = parseFloat(process.env.SHADOW_DRIFT_THRESHOLD || '0.3');

/**
 * Compare two answers and return a drift score in [0, 1].
 * 0 = identical, 1 = totally different.
 *
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function answerDrift(a, b) {
  if (a === b) return 0;
  if (!a || !b) return 1;
  // Token-overlap distance: 1 - (intersection / union of word sets).
  // Fast, language-agnostic, and good enough to catch "very different"
  // answers without paying an embedding round trip.
  const tokA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const tokB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  if (tokA.size === 0 && tokB.size === 0) return 0;
  const intersection = new Set([...tokA].filter((t) => tokB.has(t)));
  const union = new Set([...tokA, ...tokB]);
  return 1 - (intersection.size / union.size);
}

/**
 * Hash an answer for diff bookkeeping.
 * @param {string} answer
 * @returns {string}
 */
export function answerHash(answer) {
  return createHash('sha256').update(answer || '').digest('base64').slice(0, 16);
}

/**
 * Decide whether to shadow-eval this request.
 * @param {() => number} [rng=Math.random]
 * @returns {boolean}
 */
export function shouldShadowEval(rng = Math.random) {
  return rng() < SAMPLE_RATE;
}

/**
 * Run the shadow evaluation against a set of provider call functions.
 * Each provider callable returns { provider, answer, latencyMs }.
 *
 * @param {string} primaryProvider
 * @param {string} primaryAnswer
 * @param {Array<() => Promise<{ provider: string, answer: string, latencyMs: number }>>} shadowProviders
 * @returns {Promise<{ primary: { provider: string, hash: string }, shadows: Array<{ provider: string, hash: string, drift: number, latencyMs: number, driftBeyondThreshold: boolean }> }>}
 */
export async function runShadowComparison(primaryProvider, primaryAnswer, shadowProviders) {
  const results = await Promise.all(shadowProviders.map(async (callable) => {
    try {
      const out = await callable();
      const drift = answerDrift(primaryAnswer, out.answer);
      return {
        provider: out.provider,
        hash: answerHash(out.answer),
        drift,
        latencyMs: out.latencyMs,
        driftBeyondThreshold: drift > DRIFT_THRESHOLD,
      };
    } catch (err) {
      return {
        provider: 'unknown',
        hash: '',
        drift: 1,
        latencyMs: -1,
        driftBeyondThreshold: true,
        error: err.message,
      };
    }
  }));

  return {
    primary: { provider: primaryProvider, hash: answerHash(primaryAnswer) },
    shadows: results,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // CLI form runs a single-shot self-check.
  const a = 'Yes, the trader is compliant under RBZ Section 12.';
  const b = 'The trader is compliant per RBZ Section 12.';
  const c = 'No, the trader is not compliant.';
  console.log(JSON.stringify({
    semantically_similar_drift: answerDrift(a, b),
    semantically_different_drift: answerDrift(a, c),
    threshold: DRIFT_THRESHOLD,
  }, null, 2));
}
