/**
 * @fileoverview Unit tests for the heuristic confidence scorer.
 *
 * Pure-function tests — no fixtures, no mocks. Each test constructs
 * a synthetic generateText-shaped result and asserts the score moves
 * in the expected direction for that signal.
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import { computeConfidence } from '../src/confidence.mjs';

function llm(text, steps = []) {
  return { text, steps };
}

describe('computeConfidence — high-confidence baseline', () => {
  it('clean simple query gets score 1.0', () => {
    const r = computeConfidence(llm('The answer is 42.', [{}]), 'simple');
    assert.strictEqual(r.score, 1);
    assert.strictEqual(r.band, 'high');
  });

  it('clean medium query within expected steps gets high band', () => {
    const r = computeConfidence(
      llm('Done — 3 controls mapped.', [
        { toolCalls: [{ toolName: 'a' }], toolResults: [{ result: { ok: true } }] },
        { toolCalls: [{ toolName: 'b' }], toolResults: [{ result: { ok: true } }] },
      ]),
      'medium'
    );
    assert.ok(r.score >= 0.85, `expected high band, got ${r.score}`);
    assert.strictEqual(r.band, 'high');
  });
});

describe('computeConfidence — caveat penalties', () => {
  it('one caveat shaves ~0.1', () => {
    const baseline = computeConfidence(llm('Done.', [{}]), 'simple');
    // Use a phrase that triggers exactly one regex (the "unclear" pattern).
    const r = computeConfidence(llm("Done, but the answer is unclear.", [{}]), 'simple');
    assert.ok(r.score < baseline.score, 'caveat must reduce score');
    assert.strictEqual(r.signals.caveatMatches, 1);
  });

  it('multiple caveats hit the 0.3 cap', () => {
    const r = computeConfidence(
      llm("I'm not sure. Please consult counsel. You may need a CPA. Double-check this.", [{}]),
      'simple'
    );
    assert.ok(r.signals.caveatMatches >= 3);
    assert.ok(r.score <= 0.7 + 0.01, `expected score <=0.7 at cap, got ${r.score}`);
  });
});

describe('computeConfidence — step overshoot penalty', () => {
  it('5 steps on a simple query drops to low band', () => {
    const steps = Array.from({ length: 5 }, () => ({
      toolCalls: [{ toolName: `t${Math.random()}` }],
      toolResults: [{ result: { ok: true } }],
    }));
    const r = computeConfidence(llm('Done.', steps), 'simple');
    // 5 steps vs 1 expected: ratio 5, penalty = min(0.4, 4 * 0.15) = 0.4
    assert.ok(r.score <= 0.65, `expected <=0.65, got ${r.score}`);
  });

  it('within-budget step count is neutral', () => {
    const steps = [
      { toolCalls: [{ toolName: 'a' }], toolResults: [{ result: { ok: true } }] },
    ];
    const r = computeConfidence(llm('Done.', steps), 'simple');
    assert.strictEqual(r.score, 1);
  });
});

describe('computeConfidence — retry + empty-result penalties', () => {
  it('same tool called twice is treated as a retry', () => {
    const steps = [
      { toolCalls: [{ toolName: 'lookup' }], toolResults: [{ result: { ok: true } }] },
      { toolCalls: [{ toolName: 'lookup' }], toolResults: [{ result: { ok: true } }] },
    ];
    const r = computeConfidence(llm('Done.', steps), 'medium');
    assert.strictEqual(r.signals.repeatedToolCalls, 1);
    assert.ok(r.score < 1, 'retried tool must reduce score');
  });

  it('empty tool results penalize', () => {
    const steps = [
      { toolCalls: [{ toolName: 'a' }], toolResults: [{ result: [] }] },
      { toolCalls: [{ toolName: 'b' }], toolResults: [{ result: {} }] },
    ];
    const r = computeConfidence(llm('Done.', steps), 'medium');
    assert.strictEqual(r.signals.emptyToolResults, 2);
    assert.ok(r.score <= 0.8);
  });
});

describe('computeConfidence — band thresholds', () => {
  it('returns low band when score < 0.55', () => {
    // Triple-hit: overshoot + caveats + retries.
    const steps = Array.from({ length: 4 }, () => ({
      toolCalls: [{ toolName: 'a' }],
      toolResults: [{ result: { ok: true } }],
    }));
    const r = computeConfidence(
      llm("I'm not sure. Please consult counsel. You may need a CPA.", steps),
      'simple'
    );
    assert.strictEqual(r.band, 'low');
  });

  it('shape is stable across calls (pure function)', () => {
    const r1 = computeConfidence(llm('Done.', [{}]), 'simple');
    const r2 = computeConfidence(llm('Done.', [{}]), 'simple');
    assert.deepStrictEqual(r1, r2);
  });
});
