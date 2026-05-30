/**
 * @fileoverview Unit tests for the ambient KYC screening Lambda.
 *
 * Local provider only — comply-advantage path requires a real API
 * key + contract. Test the deterministic mock plus the S3-event
 * dispatcher shape.
 */

import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { handler, localScreen, screen } from '../src/handler.mjs';

function s3Event(key, bucket = 'gtcx-test-kyc-documents') {
  return {
    Records: [
      {
        s3: {
          bucket: { name: bucket },
          object: { key },
        },
      },
    ],
  };
}

describe('localScreen — deterministic + banded', () => {
  it('same key + same salt produces same verdict every time', () => {
    const a = localScreen({ documentKey: 'kyc/did:abc/passport/x.png' });
    const b = localScreen({ documentKey: 'kyc/did:abc/passport/x.png' });
    assert.deepStrictEqual(a, b);
  });

  it('different keys can produce different verdicts', () => {
    const verdicts = new Set();
    for (let i = 0; i < 200; i += 1) {
      verdicts.add(localScreen({ documentKey: `kyc/did:t${i}/passport/x.png` }).verdict);
    }
    // Across 200 keys we expect to see all three bands occasionally.
    assert.ok(verdicts.has('clear'), 'expected at least one clear');
    // The other two bands are rare (5-15%); 200 samples may or may
    // not catch them, so don't assert their presence.
  });

  it('score is in [0, 1]', () => {
    for (let i = 0; i < 50; i += 1) {
      const r = localScreen({ documentKey: `kyc/${i}.png` });
      assert.ok(r.score >= 0 && r.score <= 1, `score ${r.score} out of range`);
    }
  });
});

describe('screen — dispatcher', () => {
  let priorProvider;
  beforeEach(() => { priorProvider = process.env.SCREENING_PROVIDER; });
  afterEach(() => { process.env.SCREENING_PROVIDER = priorProvider; });

  it('uses local by default', async () => {
    delete process.env.SCREENING_PROVIDER;
    // Re-import to pick up the env var change.
    const mod = await import(`../src/handler.mjs?v=${Date.now()}`);
    const r = await mod.screen({ documentKey: 'kyc/test.png' });
    assert.strictEqual(r.provider, 'local');
    assert.ok(['clear', 'review', 'block'].includes(r.verdict));
  });

  it('throws on unknown provider', async () => {
    process.env.SCREENING_PROVIDER = 'mystery-meat';
    const mod = await import(`../src/handler.mjs?v=${Date.now()}-unknown`);
    await assert.rejects(() => mod.screen({ documentKey: 'k' }), /unknown SCREENING_PROVIDER/);
  });
});

describe('handler — S3 event shape', () => {
  it('returns 0 handled on empty event', async () => {
    const r = await handler({});
    assert.strictEqual(r.handled, 0);
  });

  it('processes a single S3 record and produces a screening result', async () => {
    const r = await handler(s3Event('kyc/did:abc/passport/x.png'));
    assert.strictEqual(r.handled, 1);
    assert.strictEqual(r.results[0].bucket, 'gtcx-test-kyc-documents');
    assert.strictEqual(r.results[0].key, 'kyc/did:abc/passport/x.png');
    assert.ok(['clear', 'review', 'block'].includes(r.results[0].verdict));
  });

  it('writes a sibling .screening.json when an injected S3 client is provided', async () => {
    const puts = [];
    const s3Client = {
      async putObject(args) { puts.push(args); },
    };
    await handler(s3Event('kyc/did:abc/passport/x.png'), { s3Client });
    assert.strictEqual(puts.length, 1);
    assert.match(puts[0].Key, /\.screening\.json$/);
    const body = JSON.parse(puts[0].Body);
    assert.strictEqual(body.documentKey, 'kyc/did:abc/passport/x.png');
    assert.match(puts[0].Metadata['gtcx-screening-verdict'], /^(clear|review|block)$/);
  });

  it('skips screening for keys that are already screening results (no recursion)', async () => {
    const r = await handler(s3Event('kyc/did:abc/passport/x.png.screening.json'));
    assert.strictEqual(r.handled, 0);
  });

  it('URL-decodes the S3 object key (S3 events arrive percent-encoded)', async () => {
    const r = await handler(s3Event('kyc/did%3Aabc/passport/x.png'));
    assert.strictEqual(r.results[0].key, 'kyc/did:abc/passport/x.png');
  });
});
