/**
 * @fileoverview Hash Utilities Tests — Branch Coverage
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  sha256Hex,
  normalizeHeaders,
  computeBodyHash,
  computeHeadersHash,
  computeEnvelopeHash,
} from '../03-platform/src/crypto/hash.mjs';

describe('sha256Hex', () => {
  it('produces consistent hex output', () => {
    const h1 = sha256Hex('hello');
    const h2 = sha256Hex('hello');
    assert.strictEqual(h1, h2);
    assert.strictEqual(h1.length, 64);
  });
});

describe('normalizeHeaders', () => {
  it('sorts keys alphabetically', () => {
    const h = normalizeHeaders({ Z: '1', A: '2', M: '3' });
    assert.ok(h.includes('["a","2"]'));
    assert.ok(h.indexOf('["a"') < h.indexOf('["m"'));
    assert.ok(h.indexOf('["m"') < h.indexOf('["z"'));
  });

  it('lowercases keys', () => {
    const h = normalizeHeaders({ 'X-Custom': 'v' });
    assert.ok(h.includes('["x-custom","v"]'));
  });

  it('sorts by value when keys are equal', () => {
    const h = normalizeHeaders({ 'X-Same': 'b', 'x-same': 'a' });
    assert.ok(h.indexOf('["x-same","a"]') < h.indexOf('["x-same","b"]'));
  });
});

describe('computeBodyHash', () => {
  it('computes SHA-256 of string', () => {
    const h = computeBodyHash('{"foo":"bar"}');
    assert.strictEqual(h.length, 64);
  });

  it('throws for non-string input', () => {
    assert.throws(() => computeBodyHash({}), /serialized string/);
    assert.throws(() => computeBodyHash(123), /serialized string/);
  });
});

describe('computeHeadersHash', () => {
  it('hashes normalized headers', () => {
    const h = computeHeadersHash({ 'Content-Type': 'application/json' });
    assert.strictEqual(h.length, 64);
  });
});

describe('computeEnvelopeHash', () => {
  it('produces deterministic hash', () => {
    const params = {
      method: 'POST',
      url: 'https://api.gtcxprotocol.org/v1/transfer',
      bodyHash: 'a'.repeat(64),
      headersHash: 'b'.repeat(64),
      timestamp: '2026-05-17T12:00:00Z',
      nonce: 'deadbeef',
      did: 'did:gtcx:device:test',
      keyId: 'key-1',
      audience: 'gtcx-api',
    };
    const h1 = computeEnvelopeHash(params);
    const h2 = computeEnvelopeHash(params);
    assert.strictEqual(h1, h2);
    assert.strictEqual(h1.length, 64);
  });

  it('normalizes double slashes in path', () => {
    const p1 = {
      method: 'GET',
      url: 'https://api.gtcxprotocol.org//v1//status',
      bodyHash: 'a'.repeat(64),
      headersHash: 'b'.repeat(64),
      timestamp: '2026-05-17T12:00:00Z',
      nonce: 'n1',
      did: 'did:gtcx:device:test',
      keyId: 'key-1',
      audience: 'gtcx-api',
    };
    const h1 = computeEnvelopeHash(p1);
    const p2 = { ...p1, url: 'https://api.gtcxprotocol.org/v1/status' };
    const h2 = computeEnvelopeHash(p2);
    assert.strictEqual(h1, h2);
  });

  it('sorts query parameters', () => {
    const p1 = {
      method: 'GET',
      url: 'https://api.gtcxprotocol.org/v1/status?z=1&a=2',
      bodyHash: 'a'.repeat(64),
      headersHash: 'b'.repeat(64),
      timestamp: '2026-05-17T12:00:00Z',
      nonce: 'n1',
      did: 'did:gtcx:device:test',
      keyId: 'key-1',
      audience: 'gtcx-api',
    };
    const p2 = { ...p1, url: 'https://api.gtcxprotocol.org/v1/status?a=2&z=1' };
    const h1 = computeEnvelopeHash(p1);
    const h2 = computeEnvelopeHash(p2);
    assert.strictEqual(h1, h2);
  });

  it('sorts duplicate query parameters by value', () => {
    const p1 = {
      method: 'GET',
      url: 'https://api.gtcxprotocol.org/v1/status?a=2&a=1',
      bodyHash: 'a'.repeat(64),
      headersHash: 'b'.repeat(64),
      timestamp: '2026-05-17T12:00:00Z',
      nonce: 'n1',
      did: 'did:gtcx:device:test',
      keyId: 'key-1',
      audience: 'gtcx-api',
    };
    const p2 = { ...p1, url: 'https://api.gtcxprotocol.org/v1/status?a=1&a=2' };
    assert.strictEqual(computeEnvelopeHash(p1), computeEnvelopeHash(p2));
  });
});
