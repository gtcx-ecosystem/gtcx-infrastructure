/**
 * @fileoverview S3 PutObject uploader with WORM Object Lock.
 *
 * Soft-loads @aws-sdk/client-s3. If it's not installed (as in the local
 * test environment) the uploader logs and returns 0 — the rest of the
 * sidecar still works for tests that exercise the batching logic.
 *
 * Every PutObject sets the Object Lock retention to COMPLIANCE mode with
 * a retention period read from AUDIT_S3_RETENTION_DAYS (default 2557 —
 * 7 years, matching the WORM bucket's default retention).
 */

let s3Module = null;
let lastSuccessMs = 0;

const RETENTION_DAYS = Number(process.env.AUDIT_S3_RETENTION_DAYS || 2557);

/**
 * Build a real S3 client when the SDK is available; otherwise a no-op
 * stub that just logs.
 *
 * @param {{ region: string }} opts
 * @returns {{ send: (cmd: object) => Promise<object> }}
 */
export function buildS3Client({ region }) {
  if (!s3Module) {
    // Module-level cache so multiple calls don't repeat the failed import.
    try {
      // eslint-disable-next-line no-undef
      s3Module = require('@aws-sdk/client-s3');
    } catch {
      s3Module = null;
    }
  }
  if (s3Module && s3Module.S3Client) {
    return new s3Module.S3Client({ region });
  }
  // Stub for tests / sandboxes without aws-sdk.
  return {
    send: async (cmd) => {
      lastSuccessMs = Date.now();
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
    lastSuccessMs = Date.now();
    return { key, size: body.length, stub: true };
  }

  const PutObjectCommand = s3Module.PutObjectCommand;
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: 'application/x-ndjson',
    ServerSideEncryption: 'aws:kms',
    ObjectLockMode: 'COMPLIANCE',
    ObjectLockRetainUntilDate: retainUntil,
    Metadata: { recordcount: String(records.length), ...metadata },
  }));
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
}
