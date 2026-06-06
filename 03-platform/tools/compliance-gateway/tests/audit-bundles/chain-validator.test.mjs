import assert from 'node:assert';
import { describe, it } from 'node:test';

import { validateWithinBundleChain } from '../../src/audit-bundles/chain-validator.mjs';

function event(id, eventHash, previousHash) {
  return { id, eventHash, previousHash };
}

describe('validateWithinBundleChain — happy paths', () => {
  it('accepts a single event with null previousHash', () => {
    const result = validateWithinBundleChain([event('e1', 'h1', null)]);
    assert.deepStrictEqual(result.acceptedIds, ['e1']);
    assert.deepStrictEqual(result.rejectedIds, []);
    assert.strictEqual(result.firstBreakIndex, null);
  });

  it('accepts a single event with non-null previousHash (continuation from prior bundle)', () => {
    const result = validateWithinBundleChain([event('e1', 'h1', 'h0-from-prior-bundle')]);
    assert.deepStrictEqual(result.acceptedIds, ['e1']);
    assert.strictEqual(result.firstBreakIndex, null);
  });

  it('accepts a fully-linked chain of 5 events', () => {
    const events = [
      event('e1', 'h1', null),
      event('e2', 'h2', 'h1'),
      event('e3', 'h3', 'h2'),
      event('e4', 'h4', 'h3'),
      event('e5', 'h5', 'h4'),
    ];
    const result = validateWithinBundleChain(events);
    assert.deepStrictEqual(result.acceptedIds, ['e1', 'e2', 'e3', 'e4', 'e5']);
    assert.deepStrictEqual(result.rejectedIds, []);
    assert.strictEqual(result.firstBreakIndex, null);
  });
});

describe('validateWithinBundleChain — breaks', () => {
  it('rejects from the first break onward (chain mismatch)', () => {
    const events = [
      event('e1', 'h1', null),
      event('e2', 'h2', 'h1'),
      event('e3', 'h3', 'WRONG'), // break here
      event('e4', 'h4', 'h3'),
      event('e5', 'h5', 'h4'),
    ];
    const result = validateWithinBundleChain(events);
    assert.deepStrictEqual(result.acceptedIds, ['e1', 'e2']);
    assert.deepStrictEqual(result.rejectedIds, ['e3', 'e4', 'e5']);
    assert.strictEqual(result.firstBreakIndex, 2);
  });

  it('rejects when first event has malformed previousHash (not null nor string)', () => {
    const result = validateWithinBundleChain([event('e1', 'h1', 42)]);
    assert.deepStrictEqual(result.acceptedIds, []);
    assert.deepStrictEqual(result.rejectedIds, ['e1']);
    assert.strictEqual(result.firstBreakIndex, 0);
  });

  it('rejects when event has missing eventHash', () => {
    const events = [
      event('e1', 'h1', null),
      event('e2', '', 'h1'),
    ];
    const result = validateWithinBundleChain(events);
    assert.deepStrictEqual(result.acceptedIds, ['e1']);
    assert.deepStrictEqual(result.rejectedIds, ['e2']);
    assert.strictEqual(result.firstBreakIndex, 1);
  });

  it('rejects entire bundle if first event is invalid', () => {
    const events = [
      event('e1', '', null),
      event('e2', 'h2', 'h1'),
    ];
    const result = validateWithinBundleChain(events);
    assert.deepStrictEqual(result.acceptedIds, []);
    assert.deepStrictEqual(result.rejectedIds, ['e1', 'e2']);
    assert.strictEqual(result.firstBreakIndex, 0);
  });

  it('after a break, does not let later events back into accepted (even if they self-chain)', () => {
    const events = [
      event('e1', 'h1', null),
      event('e2', 'h2', 'WRONG'),
      event('e3', 'h3', 'h2'), // self-chains to e2 but e2 is rejected
    ];
    const result = validateWithinBundleChain(events);
    assert.deepStrictEqual(result.acceptedIds, ['e1']);
    assert.deepStrictEqual(result.rejectedIds, ['e2', 'e3']);
    assert.strictEqual(result.firstBreakIndex, 1);
  });
});

describe('validateWithinBundleChain — empty / edge', () => {
  it('returns empty result for an empty events array', () => {
    const result = validateWithinBundleChain([]);
    assert.deepStrictEqual(result.acceptedIds, []);
    assert.deepStrictEqual(result.rejectedIds, []);
    assert.strictEqual(result.firstBreakIndex, null);
  });
});
