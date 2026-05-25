import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  buildCanonicalString,
  canonicalizeUrl,
  computeEnvelopeHash,
  sha256Hex,
} from '../../src/audit-bundles/canonical.mjs';

const FIXTURE = {
  method: 'POST',
  path: '/audit/bundles',
  query: '',
  bodyHash: 'abc123',
  timestamp: '2026-05-24T12:00:00Z',
  nonce: 'n-001',
  did: 'did:gtcx:tp_zw_001',
  keyId: 'k-1',
  audience: 'https://geotag.staging.gtcx.trade',
};

describe('buildCanonicalString', () => {
  it('joins 9 fields with newlines in spec order', () => {
    const str = buildCanonicalString(FIXTURE);
    const expected = [
      'POST',
      '/audit/bundles',
      '',
      'abc123',
      '2026-05-24T12:00:00Z',
      'n-001',
      'did:gtcx:tp_zw_001',
      'k-1',
      'https://geotag.staging.gtcx.trade',
    ].join('\n');
    assert.strictEqual(str, expected);
  });

  it('produces deterministic output (no whitespace, no extra chars)', () => {
    assert.strictEqual(buildCanonicalString(FIXTURE), buildCanonicalString(FIXTURE));
  });

  it('changing any single field changes the string', () => {
    const base = buildCanonicalString(FIXTURE);
    for (const field of Object.keys(FIXTURE)) {
      const mutated = buildCanonicalString({ ...FIXTURE, [field]: 'CHANGED' });
      assert.notStrictEqual(mutated, base, `mutating ${field} did not change output`);
    }
  });
});

describe('canonicalizeUrl', () => {
  it('extracts pathname for a simple URL', () => {
    const { path, query } = canonicalizeUrl('https://example.com/audit/bundles');
    assert.strictEqual(path, '/audit/bundles');
    assert.strictEqual(query, '');
  });

  it('collapses double slashes in path', () => {
    const { path } = canonicalizeUrl('https://example.com//audit///bundles');
    assert.strictEqual(path, '/audit/bundles');
  });

  it('sorts query parameters deterministically', () => {
    const { query } = canonicalizeUrl('https://example.com/x?b=2&a=1&c=3');
    assert.strictEqual(query, 'a=1&b=2&c=3');
  });

  it('returns / for empty pathname', () => {
    const { path } = canonicalizeUrl('https://example.com');
    assert.strictEqual(path, '/');
  });
});

describe('computeEnvelopeHash', () => {
  it('returns a 64-char hex SHA-256 digest', () => {
    const hash = computeEnvelopeHash(FIXTURE);
    assert.strictEqual(hash.length, 64);
    assert.match(hash, /^[0-9a-f]+$/);
  });

  it('matches sha256Hex of buildCanonicalString', () => {
    assert.strictEqual(
      computeEnvelopeHash(FIXTURE),
      sha256Hex(buildCanonicalString(FIXTURE)),
    );
  });

  it('deterministic across calls', () => {
    assert.strictEqual(computeEnvelopeHash(FIXTURE), computeEnvelopeHash(FIXTURE));
  });

  it('any field change produces a different hash', () => {
    const base = computeEnvelopeHash(FIXTURE);
    assert.notStrictEqual(computeEnvelopeHash({ ...FIXTURE, nonce: 'n-002' }), base);
  });
});
