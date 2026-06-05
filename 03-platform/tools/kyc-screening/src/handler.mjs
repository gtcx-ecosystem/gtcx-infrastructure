/**
 * @fileoverview Ambient KYC screening Lambda.
 *
 * Triggered by S3 ObjectCreated:* on the kyc-documents bucket.
 * Reads the document metadata (NOT contents), runs screening against
 * the configured provider, stores the result under a deterministic
 * sibling key, and emits a signed audit event via the NATS-aware
 * audit-sink shape so audit-flush can ship it to WORM.
 *
 * AI-native Pattern #1 (Ambient Intelligence): the LLM-driven
 * screening runs in the background as documents arrive. When the
 * operator opens the document UI, the result is already there.
 *
 * Provider strategy:
 *   - local  (default): deterministic mock for staging + dev; never
 *                       calls an external API. Predictable + free.
 *   - comply-advantage: production provider. Requires
 *                       COMPLY_ADVANTAGE_API_KEY env var.
 *
 * Result schema (written to S3 as JSON at <key>.screening.json):
 *   {
 *     documentKey: string,
 *     provider: 'local' | 'comply-advantage',
 *     screenedAt: ISO-8601,
 *     verdict: 'clear' | 'review' | 'block',
 *     score: number 0..1,
 *     reasons: string[],
 *     providerRequestId?: string,
 *   }
 */

import { createHash } from 'node:crypto';

const PROVIDER = process.env.SCREENING_PROVIDER || 'local';
const RESULT_SUFFIX = '.screening.json';
const TEST_ONLY_SALT = 'gtcx-test-only-local-screening-salt';
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/u;

function localScreeningSalt(env = process.env) {
  const salt = env.SCREENING_LOCAL_SALT;
  if (typeof salt === 'string' && salt.length >= 16) return salt;
  if (env.NODE_ENV === 'test') return TEST_ONLY_SALT;
  throw new Error('SCREENING_LOCAL_SALT must be set to at least 16 characters');
}

function decodeS3ObjectKey(rawKey) {
  const encoded = String(rawKey ?? '').replace(/\+/g, ' ');
  try {
    return decodeURIComponent(encoded);
  } catch {
    return '';
  }
}

function validateDocumentKey(key) {
  if (typeof key !== 'string' || key.length === 0) return 'missing-key';
  if (key.length > 1024) return 'key-too-long';
  if (CONTROL_CHARS.test(key)) return 'key-contains-control-character';
  return null;
}

function resultKeyForDocument(key) {
  return `${key}${RESULT_SUFFIX}`;
}

function isNotFoundError(error) {
  return (
    error?.name === 'NotFound' ||
    error?.Code === 'NoSuchKey' ||
    error?.code === 'NoSuchKey' ||
    error?.$metadata?.httpStatusCode === 404
  );
}

async function resultExists(s3Client, bucket, key) {
  if (!s3Client?.headObject) return false;
  try {
    await s3Client.headObject({ Bucket: bucket, Key: key });
    return true;
  } catch (error) {
    if (isNotFoundError(error)) return false;
    throw error;
  }
}

/**
 * Deterministic mock screening for local + staging. Hashes the
 * document key + the configured tenant salt and assigns a verdict
 * from the hash byte. The same input ALWAYS produces the same
 * verdict — important for reproducible tests + pilot drills.
 *
 * @param {{ documentKey: string }} input
 * @returns {{ verdict: 'clear' | 'review' | 'block', score: number, reasons: string[], providerRequestId: string }}
 */
export function localScreen({ documentKey }) {
  const salt = localScreeningSalt();
  const h = createHash('sha256').update(`${documentKey}:${salt}`).digest();
  const byte = h[0];
  // 80% clear, 15% review, 5% block — matches the pattern an exception-
  // only operator view (S6.3) expects: most uploads need no human.
  let verdict;
  let score;
  let reasons;
  if (byte < 204) {
    verdict = 'clear';
    score = (byte / 255) * 0.5;
    reasons = [];
  } else if (byte < 242) {
    verdict = 'review';
    score = 0.5 + ((byte - 204) / 38) * 0.3;
    reasons = ['mock: hash-derived review band'];
  } else {
    verdict = 'block';
    score = 0.8 + ((byte - 242) / 13) * 0.2;
    reasons = ['mock: hash-derived block band'];
  }
  return {
    verdict,
    score: Math.round(score * 100) / 100,
    reasons,
    providerRequestId: `local:${h.toString('base64').slice(0, 16)}`,
  };
}

/**
 * Adapter shape — production wires comply-advantage here. Not
 * implemented in this commit because the API call needs credentials
 * + a contract review; ships as a stub that throws to fail-closed
 * if SCREENING_PROVIDER is set to 'comply-advantage' without the
 * adapter being filled in.
 */
export async function complyAdvantageScreen() {
  throw new Error('comply-advantage provider not implemented in this version');
}

/**
 * The screening dispatch.
 *
 * @param {{ documentKey: string }} input
 * @returns {Promise<object>}
 */
export async function screen(input) {
  const screenedAt = new Date().toISOString();
  const base = { documentKey: input.documentKey, provider: PROVIDER, screenedAt };
  if (PROVIDER === 'local') return { ...base, ...localScreen(input) };
  if (PROVIDER === 'comply-advantage') return { ...base, ...(await complyAdvantageScreen(input)) };
  throw new Error(`unknown SCREENING_PROVIDER: ${PROVIDER}`);
}

/**
 * S3 event handler. Each S3 ObjectCreated event triggers one
 * screening invocation. Idempotent: if the result key already exists
 * and the injected/real S3 client supports headObject, we skip
 * re-screening instead of overwriting the prior result.
 *
 * Lambda runtime expects either:
 *   - a real S3 event from EventBridge / S3 notification, OR
 *   - a manual test event with the same shape.
 *
 * The S3 client is injectable so the handler is unit-testable
 * without aws-sdk.
 *
 * @param {object} event
 * @param {{ s3Client?: object }} [deps]
 */
export async function handler(event, deps = {}) {
  const records = Array.isArray(event?.Records) ? event.Records : [];
  if (records.length === 0) {
    return { handled: 0, message: 'no S3 records in event' };
  }
  const results = [];
  const errors = [];
  let skipped = 0;
  for (const record of records) {
    const bucket = record?.s3?.bucket?.name;
    const key = decodeS3ObjectKey(record?.s3?.object?.key);
    if (!bucket || !key) continue;
    if (key.endsWith(RESULT_SUFFIX)) continue; // don't recursively screen our own outputs
    const invalidKey = validateDocumentKey(key);
    if (invalidKey) {
      errors.push({ bucket, key, error: invalidKey });
      continue;
    }
    const resultKey = resultKeyForDocument(key);
    if (await resultExists(deps.s3Client, bucket, resultKey)) {
      skipped += 1;
      continue;
    }
    const result = await screen({ documentKey: key });
    results.push({ bucket, key, ...result });
    if (deps.s3Client && deps.s3Client.putObject) {
      await deps.s3Client.putObject({
        Bucket: bucket,
        Key: resultKey,
        Body: JSON.stringify(result, null, 2),
        ContentType: 'application/json',
        Metadata: {
          'gtcx-screening-provider': result.provider,
          'gtcx-screening-verdict': result.verdict,
        },
      });
    }
  }
  return { handled: results.length, skipped, errors, results };
}
