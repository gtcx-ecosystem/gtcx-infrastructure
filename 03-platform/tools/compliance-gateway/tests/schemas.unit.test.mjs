/**
 * @fileoverview Unit tests for /v1/query body schema + delimited prompt builder.
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import { validateQueryBody, buildUserMessage } from '../src/schemas.mjs';

describe('validateQueryBody', () => {
  it('accepts a minimal valid body', () => {
    const r = validateQueryBody({ query: 'Is this trader compliant?' });
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.data.query, 'Is this trader compliant?');
  });

  it('rejects missing query', () => {
    const r = validateQueryBody({});
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.status, 400);
    assert.match(r.error, /query/);
  });

  it('rejects an empty query', () => {
    const r = validateQueryBody({ query: '' });
    assert.strictEqual(r.ok, false);
    assert.match(r.error, /non-empty/);
  });

  it('rejects a query over 4096 chars', () => {
    const r = validateQueryBody({ query: 'a'.repeat(4097) });
    assert.strictEqual(r.ok, false);
    assert.match(r.error, /4096/);
  });

  it('rejects an unknown jurisdiction', () => {
    const r = validateQueryBody({ query: 'Q', jurisdiction: 'narnia' });
    assert.strictEqual(r.ok, false);
    assert.match(r.error, /jurisdiction/);
  });

  it('accepts a known jurisdiction', () => {
    const r = validateQueryBody({ query: 'Q', jurisdiction: 'zimbabwe' });
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.data.jurisdiction, 'zimbabwe');
  });

  it('rejects a context with too-long values', () => {
    const r = validateQueryBody({
      query: 'Q',
      context: { huge: 'x'.repeat(2049) },
    });
    assert.strictEqual(r.ok, false);
    assert.match(r.error, /context/);
  });

  it('rejects nested objects in context', () => {
    const r = validateQueryBody({
      query: 'Q',
      context: { nested: { not: 'allowed' } },
    });
    assert.strictEqual(r.ok, false);
  });

  it('rejects unknown top-level keys (strict)', () => {
    const r = validateQueryBody({ query: 'Q', extraKey: 'foo' });
    assert.strictEqual(r.ok, false);
  });

  it('rejects total context payload over 16KB', () => {
    // 100 keys × 250 chars (with structural overhead) > 16384
    const context = Object.fromEntries(
      Array.from({ length: 100 }, (_, i) => [`k${i}`, 'x'.repeat(250)]),
    );
    const r = validateQueryBody({ query: 'Q', context });
    assert.strictEqual(r.ok, false);
    assert.match(r.error, /16384|context/);
  });
});

describe('buildUserMessage', () => {
  it('returns query unchanged when no jurisdiction or context', () => {
    assert.strictEqual(buildUserMessage({ query: 'hello' }), 'hello');
  });

  it('appends a Jurisdiction line', () => {
    const m = buildUserMessage({ query: 'q', jurisdiction: 'zimbabwe' });
    assert.match(m, /Jurisdiction: zimbabwe/);
  });

  it('wraps context in delimiter markers', () => {
    const m = buildUserMessage({ query: 'q', context: { trader: 'did:zw:123' } });
    assert.match(m, /---BEGIN UNTRUSTED CONTEXT---/);
    assert.match(m, /---END UNTRUSTED CONTEXT---/);
    assert.match(m, /did:zw:123/);
  });

  it('does not emit delimiters for empty context', () => {
    const m = buildUserMessage({ query: 'q', context: {} });
    assert.doesNotMatch(m, /UNTRUSTED CONTEXT/);
  });

  it('puts the context block AFTER the query and jurisdiction', () => {
    const m = buildUserMessage({
      query: 'q',
      jurisdiction: 'kenya',
      context: { x: 'y' },
    });
    const queryIdx = m.indexOf('q');
    const jurIdx = m.indexOf('Jurisdiction:');
    const ctxIdx = m.indexOf('---BEGIN UNTRUSTED CONTEXT---');
    assert.ok(queryIdx < jurIdx);
    assert.ok(jurIdx < ctxIdx);
  });
});
