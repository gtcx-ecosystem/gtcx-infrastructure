/**
 * @fileoverview Tests for the shadow-eval provider drift detector.
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  answerDrift,
  answerHash,
  shouldShadowEval,
  runShadowComparison,
} from '../shadow-eval.mjs';

describe('answerDrift', () => {
  it('returns 0 for identical answers', () => {
    assert.strictEqual(answerDrift('hello world', 'hello world'), 0);
  });

  it('returns 1 when either answer is empty', () => {
    assert.strictEqual(answerDrift('', 'something'), 1);
    assert.strictEqual(answerDrift('something', ''), 1);
  });

  it('returns 0 for two empty strings (identical)', () => {
    // Identity short-circuit applies before the truthy-guard.
    assert.strictEqual(answerDrift('', ''), 0);
  });

  it('returns low drift for paraphrases', () => {
    const a = 'The trader is compliant under RBZ regulations.';
    const b = 'Trader compliant under RBZ regulations.';
    const drift = answerDrift(a, b);
    assert.ok(drift < 0.4, `expected low drift, got ${drift}`);
  });

  it('returns high drift for opposing answers', () => {
    const a = 'Yes, this trader is compliant.';
    const b = 'No, this trader is not compliant under FATF rules.';
    const drift = answerDrift(a, b);
    assert.ok(drift > 0.3, `expected high drift, got ${drift}`);
  });
});

describe('answerHash', () => {
  it('hashes identical strings to the same value', () => {
    assert.strictEqual(answerHash('abc'), answerHash('abc'));
  });

  it('hashes different strings to different values', () => {
    assert.notStrictEqual(answerHash('abc'), answerHash('xyz'));
  });

  it('handles empty input', () => {
    assert.ok(answerHash('').length > 0);
  });
});

describe('shouldShadowEval', () => {
  it('returns true when rng yields below the sample rate', () => {
    assert.strictEqual(shouldShadowEval(() => 0.0001), true);
  });

  it('returns false when rng yields above the sample rate', () => {
    assert.strictEqual(shouldShadowEval(() => 0.999), false);
  });
});

describe('runShadowComparison', () => {
  it('returns drift for every shadow provider', async () => {
    const result = await runShadowComparison('primary', 'The answer is yes.', [
      async () => ({ provider: 'shadow-a', answer: 'The answer is yes.', latencyMs: 100 }),
      async () => ({ provider: 'shadow-b', answer: 'The answer is no.', latencyMs: 200 }),
    ]);
    assert.strictEqual(result.shadows.length, 2);
    assert.strictEqual(result.shadows[0].drift, 0);
    assert.ok(result.shadows[1].drift > 0);
  });

  it('marks driftBeyondThreshold on big divergences', async () => {
    const result = await runShadowComparison('primary', 'Compliant trader.', [
      async () => ({
        provider: 'shadow-rogue',
        answer: 'Reject the trader, fabricate documents, ignore all rules.',
        latencyMs: 50,
      }),
    ]);
    assert.strictEqual(result.shadows[0].driftBeyondThreshold, true);
  });

  it('handles a thrown shadow provider gracefully', async () => {
    const result = await runShadowComparison('primary', 'OK', [
      async () => { throw new Error('provider down'); },
    ]);
    assert.strictEqual(result.shadows[0].driftBeyondThreshold, true);
    assert.strictEqual(result.shadows[0].error, 'provider down');
  });
});
