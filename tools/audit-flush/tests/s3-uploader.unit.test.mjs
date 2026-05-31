/**
 * @fileoverview Unit tests for the S3 uploader fail-closed contract.
 *
 * Regression for the prior bug: `require('@aws-sdk/client-s3')` in an
 * ESM `.mjs` threw a swallowed ReferenceError, which silently downgraded
 * the sidecar to a no-op stub in production. The fix is:
 *   - dynamic `import()` instead of `require()`
 *   - fail-closed in production: throws if the SDK can't be loaded
 *   - stub is only available behind explicit AUDIT_S3_ALLOW_STUB=1
 *
 * These tests don't need a real S3 endpoint — they exercise the load
 * path and the fail-closed branch.
 */

import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
  _resetForTests,
  _setSdkLoaderForTests,
  buildS3Client,
  s3LastSuccessTimestamp,
} from '../src/s3-uploader.mjs';

describe('s3-uploader — fail-closed in production', () => {
  let priorNodeEnv;
  let priorAllowStub;

  beforeEach(() => {
    priorNodeEnv = process.env.NODE_ENV;
    priorAllowStub = process.env.AUDIT_S3_ALLOW_STUB;
    _resetForTests();
  });

  afterEach(() => {
    process.env.NODE_ENV = priorNodeEnv;
    if (priorAllowStub === undefined) {
      delete process.env.AUDIT_S3_ALLOW_STUB;
    } else {
      process.env.AUDIT_S3_ALLOW_STUB = priorAllowStub;
    }
    _resetForTests();
  });

  it('returns a real S3 client when @aws-sdk/client-s3 is installed', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.AUDIT_S3_ALLOW_STUB;
    const client = await buildS3Client({ region: 'af-south-1' });
    // The real S3Client exposes a `send` function and a `config` property
    // sourced from the SDK; the stub also exposes `send` but lacks
    // `config`. Distinguish them by checking the constructor name.
    assert.strictEqual(typeof client.send, 'function');
    assert.notStrictEqual(client.constructor?.name, 'Object');
  });

  it('throws when the SDK is missing and NODE_ENV=production', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.AUDIT_S3_ALLOW_STUB;
    _setSdkLoaderForTests(async () => {
      throw new Error('missing-sdk');
    });
    await assert.rejects(
      () => buildS3Client({ region: 'af-south-1' }),
      /@aws-sdk\/client-s3 could not be loaded \(missing-sdk\)/
    );
  });

  it('stub send does not advance lastSuccessMs', async () => {
    process.env.NODE_ENV = 'test';
    process.env.AUDIT_S3_ALLOW_STUB = '1';
    _setSdkLoaderForTests(async () => {
      throw new Error('missing-sdk');
    });
    const before = s3LastSuccessTimestamp();
    const client = await buildS3Client({ region: 'af-south-1' });
    await client.send({ constructor: { name: 'PutObjectCommand' } });
    assert.equal(s3LastSuccessTimestamp(), before);
  });

  it('returns the no-op stub when AUDIT_S3_ALLOW_STUB=1 and SDK is missing', async () => {
    process.env.NODE_ENV = 'test';
    process.env.AUDIT_S3_ALLOW_STUB = '1';
    _setSdkLoaderForTests(async () => {
      throw new Error('missing-sdk');
    });
    const client = await buildS3Client({ region: 'af-south-1' });
    assert.strictEqual(typeof client.send, 'function');
    assert.deepStrictEqual(await client.send({ constructor: { name: 'PutObjectCommand' } }), {
      stub: true,
      command: 'PutObjectCommand',
    });
  });
});
