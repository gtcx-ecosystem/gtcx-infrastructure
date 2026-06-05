import assert from 'node:assert';
import { describe, it } from 'node:test';

import { decode } from '../03-platform/src/encoder.mjs';
import { createTransform, createEventFromRequest } from '../03-platform/src/middleware.mjs';

describe('createTransform', () => {
  it('defaults to normal level', () => {
    const tx = createTransform({ url: '/', headers: {} });
    assert.strictEqual(tx.level, 'normal');
    assert.strictEqual(tx.encoding, 'json');
    assert.strictEqual(tx.replayWindow, 5);
  });

  it('detects reduced from Accept-Encoding', () => {
    const tx = createTransform({
      url: '/',
      headers: { 'accept-encoding': 'gtcx-lbw-v1' },
    });
    assert.strictEqual(tx.level, 'reduced');
    assert.strictEqual(tx.encoding, 'compact-json');
  });

  it('detects minimal from query param', () => {
    const tx = createTransform({
      url: '/api?mode=minimal',
      headers: {},
    });
    assert.strictEqual(tx.level, 'minimal');
    assert.strictEqual(tx.encoding, 'minimal-binary');
  });

  it('prefers query param over header', () => {
    const tx = createTransform({
      url: '/api?mode=offline',
      headers: { 'accept-encoding': 'gtcx-lbw-v1' },
    });
    assert.strictEqual(tx.level, 'offline');
  });

  it('transforms json in normal mode', () => {
    const tx = createTransform({ url: '/', headers: {} });
    const result = tx.transform({ id: 1, debug: 'verbose' });
    assert.strictEqual(typeof result.body, 'string');
    assert.ok(result.body.includes('debug'));
    assert.strictEqual(result.encoding, 'json');
    assert.strictEqual(result.metrics.level, 'normal');
    assert.strictEqual(result.metrics.replayWindow, 5);
  });

  it('trims fields in minimal mode with schema', () => {
    const tx = createTransform(
      { url: '/api?mode=minimal', headers: {} },
      { schemas: { user: ['id', 'name'] } }
    );
    const result = tx.transform(
      { id: 1, name: 'Ada', debug: 'verbose' },
      'user'
    );
    assert.strictEqual(Buffer.isBuffer(result.body), true);
    const decoded = decode(result.body, 'minimal-binary');
    assert.deepStrictEqual(decoded, { id: 1, name: 'Ada' });
    assert.ok(result.metrics.reductionPercent > 0);
  });

  it('does not trim without schema key', () => {
    const tx = createTransform(
      { url: '/api?mode=minimal', headers: {} },
      { schemas: { user: ['id'] } }
    );
    const result = tx.transform({ id: 1, name: 'Ada' });
    const decoded = decode(result.body, 'minimal-binary');
    assert.deepStrictEqual(decoded, { id: 1, name: 'Ada' });
  });

  it('does not trim in reduced mode', () => {
    const tx = createTransform(
      { url: '/', headers: { 'accept-encoding': 'gtcx-lbw-v1' } },
      { schemas: { user: ['id'] } }
    );
    const result = tx.transform({ id: 1, name: 'Ada' }, 'user');
    assert.strictEqual(typeof result.body, 'string');
    assert.ok(result.body.includes('name'));
  });

  it('reports correct original and output bytes', () => {
    const tx = createTransform({ url: '/', headers: {} });
    const result = tx.transform({ a: 1 });
    assert.ok(result.metrics.originalBytes > 0);
    assert.ok(result.metrics.outputBytes > 0);
  });

  it('handles null data gracefully', () => {
    const tx = createTransform({ url: '/', headers: {} });
    const result = tx.transform(null);
    assert.strictEqual(result.body, 'null');
  });

  it('handles undefined url', () => {
    const tx = createTransform({ url: undefined, headers: {} });
    assert.strictEqual(tx.level, 'normal');
  });

  it('uses serviceName in options', () => {
    const tx = createTransform(
      { url: '/', headers: {} },
      { serviceName: 'test-svc' }
    );
    assert.strictEqual(tx.level, 'normal');
  });

  it('handles no headers object', () => {
    const tx = createTransform({ url: '/' });
    assert.strictEqual(tx.level, 'normal');
  });

  it('handles requestLike as null', () => {
    const tx = createTransform(null);
    assert.strictEqual(tx.level, 'normal');
  });
});

describe('createEventFromRequest', () => {
  it('uses x-gtcx-region header', () => {
    const event = createEventFromRequest(
      { headers: { 'x-gtcx-region': 'zimbabwe-harare' } },
      { level: 'reduced' },
      { serviceName: 'gateway' }
    );
    assert.strictEqual(event.region, 'zimbabwe-harare');
    assert.strictEqual(event.level, 'reduced');
    assert.strictEqual(event.service, 'gateway');
  });

  it('falls back to defaultRegion option', () => {
    const event = createEventFromRequest(
      { headers: {} },
      { level: 'minimal' },
      { defaultRegion: 'default-region', serviceName: 'svc' }
    );
    assert.strictEqual(event.region, 'default-region');
  });

  it('falls back to unknown', () => {
    const event = createEventFromRequest(
      { headers: {} },
      { level: 'offline' }
    );
    assert.strictEqual(event.region, 'unknown');
  });

  it('handles undefined headers', () => {
    const event = createEventFromRequest(
      {},
      { level: 'normal' },
      { defaultRegion: 'fallback' }
    );
    assert.strictEqual(event.region, 'fallback');
  });

  it('handles null requestLike', () => {
    const event = createEventFromRequest(null, { level: 'normal' });
    assert.strictEqual(event.region, 'unknown');
  });
});
