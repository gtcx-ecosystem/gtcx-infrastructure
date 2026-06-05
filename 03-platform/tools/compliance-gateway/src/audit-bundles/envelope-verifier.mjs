/**
 * Envelope verifier for POST /audit/bundles.
 *
 * Orchestrates the three checks every inbound bundle must pass:
 *
 *   1. Header presence + structural validity
 *   2. Timestamp freshness (within MAX_AGE_MS) + audience-against-origin
 *   3. Ed25519 signature verification over the 9-field envelope hash
 *
 * The replay-protection layer (nonce-gate.mjs) is intentionally NOT
 * part of this module — keeping signature verification and replay
 * detection in separate modules means each is independently testable
 * and the handler can short-circuit early on a stale timestamp without
 * touching the nonce store.
 *
 * Failure modes carry a stable `reason` string the handler maps to a
 * 400 response code per the table in #50's capacity comment.
 */

import { canonicalizeUrl, computeEnvelopeHash, sha256Hex } from './canonical.mjs';
import { verifyEd25519 } from './ed25519.mjs';

/**
 * 5 minutes — 2-min client window per
 * gtcx-mobile/apps/mobile/gtcx/lib/api-config.ts:27 MAX_SIGNING_CONTEXT_AGE_MS
 * + 3-min server-side clock-skew buffer.
 */
export const MAX_TIMESTAMP_AGE_MS = 5 * 60 * 1000;

/**
 * Headers the verifier reads from the inbound request. Case-insensitive
 * lookup; the handler normalizes to lowercase before passing.
 */
export const REQUIRED_HEADERS = Object.freeze([
  'x-gtcx-did',
  'x-gtcx-key-id',
  'x-gtcx-timestamp',
  'x-gtcx-nonce',
  'x-gtcx-audience',
  'x-gtcx-body-sha256',
  'x-gtcx-signature',
]);

export class EnvelopeVerificationError extends Error {
  constructor(reason, detail) {
    super(`envelope-verification-failed: ${reason}`);
    this.name = 'EnvelopeVerificationError';
    this.reason = reason;
    if (detail) this.detail = detail;
  }
}

/**
 * @typedef {object} VerifyArgs
 * @property {string} method - HTTP method (will be uppercased)
 * @property {string} url    - Full request URL (absolute)
 * @property {string} body   - Raw request body, exactly as bytes received
 * @property {Record<string, string>} headers - Lowercased header map
 * @property {string} expectedAudience - The origin to compare X-GTCX-Audience against
 * @property {import('./did-resolver.mjs').DidResolver} resolver
 * @property {number} [nowMs] - Override for tests; defaults to Date.now()
 * @property {number} [maxAgeMs] - Override for tests; defaults to MAX_TIMESTAMP_AGE_MS
 *
 * @typedef {object} VerifyResult
 * @property {true} valid
 * @property {string} did
 * @property {string} keyId
 * @property {string} nonce
 * @property {string} timestamp
 */

/**
 * Verify the envelope around an inbound /audit/bundles request.
 * Throws EnvelopeVerificationError on any failure.
 *
 * @param {VerifyArgs} args
 * @returns {Promise<VerifyResult>}
 */
export async function verifyEnvelope(args) {
  const { method, url, body, headers, expectedAudience, resolver } = args;
  const nowMs = args.nowMs ?? Date.now();
  const maxAgeMs = args.maxAgeMs ?? MAX_TIMESTAMP_AGE_MS;

  // 1. Header presence
  for (const h of REQUIRED_HEADERS) {
    if (typeof headers[h] !== 'string' || headers[h].length === 0) {
      throw new EnvelopeVerificationError('header-missing', { header: h });
    }
  }

  const did = headers['x-gtcx-did'];
  const keyId = headers['x-gtcx-key-id'];
  const timestamp = headers['x-gtcx-timestamp'];
  const nonce = headers['x-gtcx-nonce'];
  const audience = headers['x-gtcx-audience'];
  const bodyHashHeader = headers['x-gtcx-body-sha256'];
  const signature = headers['x-gtcx-signature'];

  // 2. Audience matches the request's expected origin
  if (audience !== expectedAudience) {
    throw new EnvelopeVerificationError('audience-mismatch', {
      expected: expectedAudience,
      received: audience,
    });
  }

  // 3. Body hash declared in the header matches the body we received
  // This catches body modification in transit; the signature itself
  // covers the body via the canonical string, but checking the header
  // explicitly gives a cleaner error than a signature failure later.
  const computedBodyHash = sha256Hex(body);
  if (bodyHashHeader !== computedBodyHash) {
    throw new EnvelopeVerificationError('body-hash-mismatch', {
      headerSays: bodyHashHeader,
      computed: computedBodyHash,
    });
  }

  // 4. Timestamp freshness
  const tsMs = Date.parse(timestamp);
  if (Number.isNaN(tsMs)) {
    throw new EnvelopeVerificationError('timestamp-unparseable');
  }
  const age = nowMs - tsMs;
  if (age > maxAgeMs) {
    throw new EnvelopeVerificationError('timestamp-stale', { ageMs: age, maxAgeMs });
  }
  if (age < -maxAgeMs) {
    throw new EnvelopeVerificationError('timestamp-future', { ageMs: age, maxAgeMs });
  }

  // 5. Compute envelope hash from the 9-field canonical form
  const { path, query } = canonicalizeUrl(url);
  const envelopeHash = computeEnvelopeHash({
    method: method.toUpperCase(),
    path,
    query,
    bodyHash: computedBodyHash,
    timestamp,
    nonce,
    did,
    keyId,
    audience,
  });

  // 6. Resolve DID → public key, then verify Ed25519
  let publicKeyJwk;
  try {
    publicKeyJwk = await resolver(did, keyId);
  } catch (err) {
    throw new EnvelopeVerificationError(`did-resolve-${err.reason ?? 'failed'}`);
  }

  let signatureValid;
  try {
    signatureValid = await verifyEd25519(envelopeHash, signature, publicKeyJwk);
  } catch {
    throw new EnvelopeVerificationError('signature-malformed');
  }

  if (!signatureValid) {
    throw new EnvelopeVerificationError('signature-invalid');
  }

  return { valid: true, did, keyId, nonce, timestamp };
}
