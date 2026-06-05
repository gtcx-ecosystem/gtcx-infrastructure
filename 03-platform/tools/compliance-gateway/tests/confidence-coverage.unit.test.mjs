/**
 * @fileoverview Coverage-focused tests for confidence branches not
 * exercised by the main test file.
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import { computeConfidence } from '../03-platform/src/confidence.mjs';

describe('computeConfidence — edge cases', () => {
  it('handles null/undefined llmResult gracefully', () => {
    const r1 = computeConfidence(null, 'simple');
    assert.strictEqual(r1.signals.stepsUsed, 0);
    assert.strictEqual(r1.signals.caveatMatches, 0);
    assert.strictEqual(r1.score, 1);

    const r2 = computeConfidence(undefined, 'medium');
    assert.strictEqual(r2.signals.stepsUsed, 0);
    assert.strictEqual(r2.score, 1);
  });

  it('handles non-array steps and non-string text', () => {
    const r = computeConfidence({ text: 123, steps: 'not-array' }, 'simple');
    assert.strictEqual(r.signals.stepsUsed, 0);
    assert.strictEqual(r.signals.caveatMatches, 0);
    assert.strictEqual(r.score, 1);
  });

  it('counts empty object {} as an empty tool result', () => {
    const r = computeConfidence(
      {
        text: 'Done.',
        steps: [
          { toolCalls: [{ toolName: 'a' }], toolResults: [{ result: {} }] },
        ],
      },
      'simple'
    );
    assert.strictEqual(r.signals.emptyToolResults, 1);
    assert.ok(r.score < 1, 'empty object result must reduce score');
  });

  it('counts undefined result as an empty tool result', () => {
    const r = computeConfidence(
      {
        text: 'Done.',
        steps: [
          { toolCalls: [{ toolName: 'a' }], toolResults: [{ result: undefined }] },
        ],
      },
      'simple'
    );
    assert.strictEqual(r.signals.emptyToolResults, 1);
  });

  it('counts empty array [] as an empty tool result', () => {
    const r = computeConfidence(
      {
        text: 'Done.',
        steps: [
          { toolCalls: [{ toolName: 'a' }], toolResults: [{ result: [] }] },
        ],
      },
      'simple'
    );
    assert.strictEqual(r.signals.emptyToolResults, 1);
  });

  it('does not penalize populated arrays or objects', () => {
    const r = computeConfidence(
      {
        text: 'Done.',
        steps: [
          { toolCalls: [{ toolName: 'a' }], toolResults: [{ result: [1] }, { result: { ok: true } }] },
        ],
      },
      'simple'
    );
    assert.strictEqual(r.signals.emptyToolResults, 0);
    assert.strictEqual(r.score, 1);
  });
});
