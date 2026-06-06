import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  encode,
  decode,
  encodeMinimalBinary,
  decodeMinimalBinary,
} from '../src/encoder.mjs';

describe('encode / decode — json', () => {
  it('round-trips an object', () => {
    const obj = { a: 1, b: 'two' };
    const enc = encode(obj, 'json');
    assert.strictEqual(typeof enc, 'string');
    assert.deepStrictEqual(decode(enc, 'json'), obj);
  });
});

describe('encode / decode — compact-json', () => {
  it('round-trips an object without whitespace', () => {
    const obj = { x: [1, 2, 3] };
    const enc = encode(obj, 'compact-json');
    assert.ok(!enc.includes('\n'));
    assert.deepStrictEqual(decode(enc, 'compact-json'), obj);
  });
});

describe('encode / decode — none', () => {
  it('returns empty buffer', () => {
    const enc = encode({ a: 1 }, 'none');
    assert.strictEqual(enc.length, 0);
    assert.deepStrictEqual(decode(enc, 'none'), null);
  });
});

describe('encode / decode — default fallback', () => {
  it('defaults to json for unknown encoding', () => {
    const obj = { test: true };
    const enc = encode(obj, 'unknown');
    assert.deepStrictEqual(decode(enc, 'unknown'), obj);
  });
});

describe('encodeMinimalBinary / decodeMinimalBinary', () => {
  it('round-trips null', () => {
    const buf = encodeMinimalBinary(null);
    assert.deepStrictEqual(decodeMinimalBinary(buf), null);
  });

  it('round-trips undefined as null', () => {
    const buf = encodeMinimalBinary(undefined);
    assert.deepStrictEqual(decodeMinimalBinary(buf), null);
  });

  it('round-trips booleans', () => {
    const t = encodeMinimalBinary({ a: true, b: false });
    assert.deepStrictEqual(decodeMinimalBinary(t), { a: true, b: false });
  });

  it('round-trips uint8', () => {
    const buf = encodeMinimalBinary({ n: 200 });
    assert.deepStrictEqual(decodeMinimalBinary(buf), { n: 200 });
  });

  it('round-trips uint16', () => {
    const buf = encodeMinimalBinary({ n: 500 });
    assert.deepStrictEqual(decodeMinimalBinary(buf), { n: 500 });
  });

  it('round-trips uint32', () => {
    const buf = encodeMinimalBinary({ n: 70000 });
    assert.deepStrictEqual(decodeMinimalBinary(buf), { n: 70000 });
  });

  it('round-trips int32 negative', () => {
    const buf = encodeMinimalBinary({ n: -42 });
    assert.deepStrictEqual(decodeMinimalBinary(buf), { n: -42 });
  });

  it('round-trips int32 positive large', () => {
    const buf = encodeMinimalBinary({ n: 50000 });
    assert.deepStrictEqual(decodeMinimalBinary(buf), { n: 50000 });
  });

  it('round-trips float64', () => {
    const buf = encodeMinimalBinary({ pi: 3.14159 });
    assert.deepStrictEqual(decodeMinimalBinary(buf), { pi: 3.14159 });
  });

  it('round-trips string', () => {
    const buf = encodeMinimalBinary({ s: 'hello' });
    assert.deepStrictEqual(decodeMinimalBinary(buf), { s: 'hello' });
  });

  it('round-trips empty string', () => {
    const buf = encodeMinimalBinary({ s: '' });
    assert.deepStrictEqual(decodeMinimalBinary(buf), { s: '' });
  });

  it('round-trips multi-field object', () => {
    const obj = {
      id: 42,
      name: 'test',
      active: true,
      score: 98.6,
      count: 1000,
    };
    const buf = encodeMinimalBinary(obj);
    assert.deepStrictEqual(decodeMinimalBinary(buf), obj);
  });

  it('round-trips an array via JSON fallback', () => {
    const arr = [1, 2, 3];
    const buf = encodeMinimalBinary(arr);
    assert.deepStrictEqual(decodeMinimalBinary(buf), arr);
  });

  it('round-trips a primitive via JSON fallback', () => {
    const buf = encodeMinimalBinary(42);
    assert.deepStrictEqual(decodeMinimalBinary(buf), 42);
  });

  it('throws on unsupported version', () => {
    const buf = Buffer.from([0x02, 0x00]);
    assert.throws(() => decodeMinimalBinary(buf), /Unsupported minimal binary version/);
  });

  it('throws on too short buffer', () => {
    const buf = Buffer.from([0x01]);
    assert.throws(() => decodeMinimalBinary(buf), /too short/);
  });

  it('throws on truncated key length', () => {
    const buf = Buffer.from([0x01, 0x01]);
    assert.throws(() => decodeMinimalBinary(buf), /truncated key length/);
  });

  it('throws on truncated key', () => {
    const buf = Buffer.from([0x01, 0x01, 0x05]);
    assert.throws(() => decodeMinimalBinary(buf), /truncated key/);
  });

  it('throws on truncated type tag', () => {
    const buf = Buffer.from([0x01, 0x01, 0x01, 0x61]);
    assert.throws(() => decodeMinimalBinary(buf), /truncated type tag/);
  });

  it('throws on truncated uint8', () => {
    const buf = Buffer.from([0x01, 0x01, 0x01, 0x61, 0x03]);
    assert.throws(() => decodeMinimalBinary(buf), /Truncated uint8/);
  });

  it('throws on truncated uint16', () => {
    const buf = Buffer.from([0x01, 0x01, 0x01, 0x61, 0x04, 0x00]);
    assert.throws(() => decodeMinimalBinary(buf), /Truncated uint16/);
  });

  it('throws on truncated uint32', () => {
    const buf = Buffer.from([0x01, 0x01, 0x01, 0x61, 0x05, 0x00, 0x00, 0x00]);
    assert.throws(() => decodeMinimalBinary(buf), /Truncated uint32/);
  });

  it('throws on truncated int32', () => {
    const buf = Buffer.from([0x01, 0x01, 0x01, 0x61, 0x06, 0x00, 0x00, 0x00]);
    assert.throws(() => decodeMinimalBinary(buf), /Truncated int32/);
  });

  it('throws on truncated float64', () => {
    const buf = Buffer.from([0x01, 0x01, 0x01, 0x61, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    assert.throws(() => decodeMinimalBinary(buf), /Truncated float64/);
  });

  it('throws on truncated string length', () => {
    const buf = Buffer.from([0x01, 0x01, 0x01, 0x61, 0x08]);
    assert.throws(() => decodeMinimalBinary(buf), /Truncated string length/);
  });

  it('throws on truncated string', () => {
    const buf = Buffer.from([0x01, 0x01, 0x01, 0x61, 0x08, 0x00, 0x10]);
    assert.throws(() => decodeMinimalBinary(buf), /Truncated string/);
  });

  it('throws on unknown type tag', () => {
    const buf = Buffer.from([0x01, 0x01, 0x01, 0x61, 0xff]);
    assert.throws(() => decodeMinimalBinary(buf), /Unknown type tag/);
  });

  it('throws on key too long', () => {
    const key = 'a'.repeat(300);
    assert.throws(() => encodeMinimalBinary({ [key]: 1 }), /Key too long/);
  });

  it('encodes Infinity as string fallback', () => {
    const buf = encodeMinimalBinary({ inf: Infinity });
    const decoded = decodeMinimalBinary(buf);
    assert.strictEqual(decoded.inf, 'Infinity');
  });

  it('encodes -Infinity as string fallback', () => {
    const buf = encodeMinimalBinary({ inf: -Infinity });
    const decoded = decodeMinimalBinary(buf);
    assert.strictEqual(decoded.inf, '-Infinity');
  });

  it('encodes NaN as string fallback', () => {
    const buf = encodeMinimalBinary({ nan: NaN });
    const decoded = decodeMinimalBinary(buf);
    assert.strictEqual(decoded.nan, 'NaN');
  });
});
