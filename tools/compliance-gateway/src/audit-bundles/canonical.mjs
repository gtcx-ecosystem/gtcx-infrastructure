/**
 * Canonical signing form for POST /audit/bundles.
 *
 * Pinned to gtcx-mobile/apps/mobile/gtcx/lib/auth-token.ts:166-215
 * (buildCanonicalRequestString + buildRequestAuthContext).
 *
 * NINE fields, newline-joined, in this exact order:
 *
 *   [method, path, query, bodyHash, timestamp, nonce, did, keyId, audience]
 *
 * Note: this is DIFFERENT from the existing gtcx-queue-envelope-v1 form
 * in @gtcx/replay-protection (which uses 10 fields including headersHash).
 * The audit-bundles scheme deliberately omits headersHash because mobile's
 * AuthContext does not include headers in its signing surface.
 *
 * Algorithm:
 *   envelopeHash = SHA-256(canonicalString)
 *   signature    = Ed25519.sign(envelopeHash, signingKey)
 */

import { createHash } from 'node:crypto';

/**
 * @typedef {object} CanonicalInput
 * @property {string} method     - Uppercased HTTP method
 * @property {string} path       - URL pathname (e.g. /audit/bundles)
 * @property {string} query      - URL search string (canonicalized: sorted, empty for none)
 * @property {string} bodyHash   - SHA-256 hex of the raw request body bytes
 * @property {string} timestamp  - ISO 8601 timestamp (X-GTCX-Timestamp)
 * @property {string} nonce      - Request nonce (X-GTCX-Nonce)
 * @property {string} did        - Signer DID (X-GTCX-DID)
 * @property {string} keyId      - Key identifier (X-GTCX-Key-Id)
 * @property {string} audience   - Audience (X-GTCX-Audience)
 */

/**
 * Build the 9-field canonical string.
 * @param {CanonicalInput} input
 * @returns {string}
 */
export function buildCanonicalString(input) {
  return [
    input.method,
    input.path,
    input.query,
    input.bodyHash,
    input.timestamp,
    input.nonce,
    input.did,
    input.keyId,
    input.audience,
  ].join('\n');
}

/**
 * Canonicalize a URL into the (path, query) pair the canonical string expects.
 * Path is the URL pathname with collapsed slashes; query is the search string
 * with sorted parameters and equal values, mirroring the canonicalization in
 * the existing replay-protection hash module so mobile + server pick the same
 * canonical form for any URL.
 *
 * @param {string|URL} rawUrl
 * @returns {{ path: string, query: string }}
 */
export function canonicalizeUrl(rawUrl) {
  const url = typeof rawUrl === 'string' ? new URL(rawUrl) : rawUrl;
  const path = url.pathname.replace(/\/{2,}/g, '/') || '/';
  const sorted = Array.from(url.searchParams.entries()).sort(([aKey, aValue], [bKey, bValue]) => {
    if (aKey === bKey) return aValue.localeCompare(bValue);
    return aKey.localeCompare(bKey);
  });
  const query = new URLSearchParams(sorted).toString();
  return { path, query };
}

/**
 * SHA-256 hex digest of a string.
 * @param {string} input
 * @returns {string}
 */
export function sha256Hex(input) {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * Compute the envelope hash (SHA-256 of the 9-field canonical string).
 * @param {CanonicalInput} input
 * @returns {string} hex digest
 */
export function computeEnvelopeHash(input) {
  return sha256Hex(buildCanonicalString(input));
}
