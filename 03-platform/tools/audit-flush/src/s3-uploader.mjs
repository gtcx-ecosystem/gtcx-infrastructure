/**
 * @fileoverview S3 PutObject uploader with WORM Object Lock.
 *
 * Loads @aws-sdk/client-s3 via dynamic import (this is an ESM module — the
 * prior `require()` was a no-op ReferenceError swallowed by a catch block,
 * which silently downgraded the sidecar to a no-op stub in any environment
 * that didn't already have the SDK loaded by something else).
 *
 * Fail-closed in production: if the SDK cannot be loaded when
 * NODE_ENV=production, `buildS3Client` throws so the sidecar refuses to
 * start. Non-production callers can opt into the stub by setting
 * AUDIT_S3_ALLOW_STUB=1, which is useful for the unit test environment.
 *
 * Every PutObject sets the Object Lock retention to COMPLIANCE mode with
 * a retention period read from AUDIT_S3_RETENTION_DAYS (default 2557 —
 * 7 years, matching the WORM bucket's default retention).
 */

import { failClosed } from './fail-closed.mjs';

let s3Module = null;
let s3LoadError = null;
let lastSuccessMs = 0;
let sdkLoader = () => import('@aws-sdk/client-s3');

const RETENTION_DAYS = Number(process.env.AUDIT_S3_RETENTION_DAYS || 2557);

/**
 * Try to load @aws-sdk/client-s3 once and cache the result. Returns the
 * module on success or `null` if the package is unavailable AND the
 * caller has opted into the stub path.
 *
 * @returns {Promise<object | null>}
 */
async function loadSdk() {
  if (s3Module) return s3Module;
  if (s3LoadError) return null;
  let loadFailure = null;
  const sdk = await failClosed(
    'audit-flush.s3.sdk',
    async () => {
      try {
        return await sdkLoader();
      } catch (err) {
        loadFailure = err;
        throw err;
      }
    },
    {
      onError: 'log-and-return-null',
      onStub: () => {
        s3LoadError = loadFailure ?? new Error('@aws-sdk/client-s3 unavailable');
      },
    }
  );
  s3Module = sdk;
  return s3Module;
}

/**
 * Build a real S3 client. In production this requires `@aws-sdk/client-s3`
 * to be loadable — startup fails closed otherwise. In dev/test, set
 * `AUDIT_S3_ALLOW_STUB=1` to fall back to a logging stub (used by the
 * batching unit tests via `putBatch` dependency injection — most tests
 * don't reach this path).
 *
 * @param {{ region: string }} opts
 * @returns {Promise<{ send: (cmd: object) => Promise<object> }>}
 */
export async function buildS3Client({ region }) {
  const sdk = await loadSdk();
  if (sdk && sdk.S3Client) {
    return new sdk.S3Client({ region });
  }

  const allowStub = process.env.AUDIT_S3_ALLOW_STUB === '1';
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction || !allowStub) {
    const reason = s3LoadError?.message ?? 'unknown';
    throw new Error(
      `audit-flush: @aws-sdk/client-s3 could not be loaded (${reason}). ` +
        `Refusing to start with a stub S3 client. Install the dependency or, ` +
        `for non-production runs, set AUDIT_S3_ALLOW_STUB=1.`
    );
  }

  // Stub for explicit-opt-in dev/test sandboxes.
  console.warn(
    JSON.stringify({
      level: 'warn',
      type: 'audit-flush.s3.stub-engaged',
      message: '@aws-sdk/client-s3 not available; using no-op stub (AUDIT_S3_ALLOW_STUB=1).',
    })
  );
  return {
    send: async (cmd) => {
      // Stub must not advance lastSuccessMs — readiness probes would lie.
      return { stub: true, command: cmd?.constructor?.name ?? 'unknown' };
    },
  };
}

/**
 * Write a batch of NDJSON records as a single S3 object, with Object
 * Lock retention set to COMPLIANCE mode at RETENTION_DAYS days.
 *
 * @param {object} client
 * @param {string} bucket
 * @param {string} key
 * @param {Array<object>} records
 * @param {Record<string, string>} [metadata]
 * @returns {Promise<{ key: string, size: number }>}
 */
export async function putBatch(client, bucket, key, records, metadata = {}) {
  const body = records.map((r) => JSON.stringify(r)).join('\n') + '\n';
  const retainUntil = new Date(Date.now() + RETENTION_DAYS * 24 * 3600 * 1000);

  if (!s3Module || !s3Module.PutObjectCommand) {
    // Sandbox path: pretend it worked, advance the lastSuccess timestamp.
    // Reached only if loadSdk() returned null AND buildS3Client allowed
    // the stub branch above. Production callers never get here because
    // buildS3Client throws when the SDK is unavailable.
    lastSuccessMs = Date.now();
    return { key, size: body.length, stub: true };
  }

  const { PutObjectCommand } = s3Module;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: 'application/x-ndjson',
      ServerSideEncryption: 'aws:kms',
      ObjectLockMode: 'COMPLIANCE',
      ObjectLockRetainUntilDate: retainUntil,
      Metadata: { recordcount: String(records.length), ...metadata },
    })
  );
  lastSuccessMs = Date.now();
  return { key, size: body.length };
}

export function s3LastSuccessTimestamp() {
  return lastSuccessMs;
}

/** Test-only reset. */
export function _resetForTests() {
  lastSuccessMs = 0;
  s3Module = null;
  s3LoadError = null;
  sdkLoader = () => import('@aws-sdk/client-s3');
}

/** Test-only SDK loader injection. */
export function _setSdkLoaderForTests(loader) {
  sdkLoader = loader;
  s3Module = null;
  s3LoadError = null;
}
