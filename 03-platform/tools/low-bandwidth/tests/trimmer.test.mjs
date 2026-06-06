import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  trimObject,
  buildMinimalResponse,
  estimateReduction,
} from '../src/trimmer.mjs';

describe('trimObject', () => {
  it('passes through primitives', () => {
    assert.strictEqual(trimObject(42, ['x']), 42);
    assert.strictEqual(trimObject('hello', ['x']), 'hello');
    assert.strictEqual(trimObject(null, ['x']), null);
    assert.strictEqual(trimObject(true, ['x']), true);
  });

  it('filters object keys', () => {
    const input = { a: 1, b: 2, c: 3 };
    assert.deepStrictEqual(trimObject(input, ['a', 'c']), { a: 1, c: 3 });
  });

  it('handles Set for allowed', () => {
    const input = { a: 1, b: 2 };
    assert.deepStrictEqual(trimObject(input, new Set(['b'])), { b: 2 });
  });

  it('returns empty object when no keys match', () => {
    assert.deepStrictEqual(trimObject({ a: 1 }, ['z']), {});
  });

  it('recurses into nested objects', () => {
    const input = { user: { name: 'Ada', secret: 'x' }, meta: { id: 1 } };
    const allowed = ['user', 'meta'];
    const result = trimObject(input, allowed);
    assert.deepStrictEqual(result, {
      user: { name: 'Ada', secret: 'x' },
      meta: { id: 1 },
    });
  });

  it('recurses into arrays', () => {
    const input = [{ a: 1, b: 2 }, { a: 3, b: 4 }];
    assert.deepStrictEqual(trimObject(input, ['a']), [{ a: 1 }, { a: 3 }]);
  });

  it('handles empty arrays', () => {
    assert.deepStrictEqual(trimObject([], ['a']), []);
  });

  it('handles nested arrays', () => {
    const input = { items: [[{ x: 1, y: 2 }]] };
    assert.deepStrictEqual(trimObject(input, ['items']), {
      items: [[{ x: 1, y: 2 }]],
    });
  });
});

describe('buildMinimalResponse', () => {
  it('trims to essential fields', () => {
    const data = { id: 1, name: 'test', debug: 'verbose' };
    const result = buildMinimalResponse({
      data,
      essentialFields: ['id', 'name'],
    });
    assert.deepStrictEqual(result, { id: 1, name: 'test' });
  });

  it('returns fallback for null data', () => {
    assert.strictEqual(
      buildMinimalResponse({ data: null, essentialFields: ['a'], fallback: 'fb' }),
      'fb'
    );
  });

  it('returns fallback for undefined data', () => {
    assert.strictEqual(
      buildMinimalResponse({ data: undefined, essentialFields: ['a'] }),
      null
    );
  });

  it('returns primitive as-is', () => {
    assert.strictEqual(buildMinimalResponse({ data: 42, essentialFields: [] }), 42);
  });

  it('returns data unchanged when no essentialFields', () => {
    const data = { a: 1, b: 2 };
    assert.deepStrictEqual(buildMinimalResponse({ data, essentialFields: [] }), data);
  });

  it('handles empty essentialFields array', () => {
    const data = { a: 1 };
    assert.deepStrictEqual(buildMinimalResponse({ data, essentialFields: [] }), data);
  });
});

describe('estimateReduction', () => {
  it('calculates 0 for identical strings', () => {
    const result = estimateReduction({ fullJson: '{"a":1}', trimmedJson: '{"a":1}' });
    assert.strictEqual(result.reductionPercent, 0);
  });

  it('calculates positive reduction', () => {
    const result = estimateReduction({
      fullJson: '{"a":1,"b":2}',
      trimmedJson: '{"a":1}',
    });
    assert.ok(result.reductionPercent > 0);
    assert.strictEqual(result.originalBytes, Buffer.byteLength('{"a":1,"b":2}', 'utf8'));
    assert.strictEqual(result.trimmedBytes, Buffer.byteLength('{"a":1}', 'utf8'));
  });

  it('handles empty fullJson', () => {
    const result = estimateReduction({ fullJson: '', trimmedJson: '' });
    assert.strictEqual(result.reductionPercent, 0);
    assert.strictEqual(result.originalBytes, 0);
  });
});
