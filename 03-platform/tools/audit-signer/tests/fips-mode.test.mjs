/**
 * @fileoverview FIPS 140-3 mode tests.
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  isFipsMode,
  signingAlgorithm,
  fipsCurve,
  assertFipsDigest,
} from '../03-platform/src/fips-mode.mjs';

describe('isFipsMode', () => {
  it('returns false when GTCX_FIPS_MODE is unset', () => {
    delete process.env.GTCX_FIPS_MODE;
    assert.strictEqual(isFipsMode(), false);
  });

  it('returns false when GTCX_FIPS_MODE is 0', () => {
    process.env.GTCX_FIPS_MODE = '0';
    assert.strictEqual(isFipsMode(), false);
  });

  it('returns true when GTCX_FIPS_MODE is 1', () => {
    process.env.GTCX_FIPS_MODE = '1';
    assert.strictEqual(isFipsMode(), true);
  });
});

describe('signingAlgorithm', () => {
  it('returns ed25519 in default mode', () => {
    delete process.env.GTCX_FIPS_MODE;
    assert.strictEqual(signingAlgorithm(), 'ed25519');
  });

  it('returns ec in FIPS mode', () => {
    process.env.GTCX_FIPS_MODE = '1';
    assert.strictEqual(signingAlgorithm(), 'ec');
  });
});

describe('fipsCurve', () => {
  it('returns prime256v1', () => {
    assert.strictEqual(fipsCurve(), 'prime256v1');
  });
});

describe('assertFipsDigest', () => {
  it('does not throw in default mode for any algorithm', () => {
    delete process.env.GTCX_FIPS_MODE;
    assert.doesNotThrow(() => assertFipsDigest('md5'));
    assert.doesNotThrow(() => assertFipsDigest('sha256'));
  });

  it('does not throw in FIPS mode for approved algorithms', () => {
    process.env.GTCX_FIPS_MODE = '1';
    assert.doesNotThrow(() => assertFipsDigest('sha256'));
    assert.doesNotThrow(() => assertFipsDigest('sha384'));
    assert.doesNotThrow(() => assertFipsDigest('sha512'));
  });

  it('throws in FIPS mode for non-approved algorithms', () => {
    process.env.GTCX_FIPS_MODE = '1';
    assert.throws(() => assertFipsDigest('md5'), /FIPS mode/);
    assert.throws(() => assertFipsDigest('sha1'), /FIPS mode/);
    assert.throws(() => assertFipsDigest('blake2b'), /FIPS mode/);
  });
});
