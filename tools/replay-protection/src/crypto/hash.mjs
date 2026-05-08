/**
 * @fileoverview Hash Utilities for Replay Protection
 *
 * Computes SHA-256 hashes for body, headers, and envelope verification.
 * Matches the canonical hashing algorithm used in gtcx-mobile's offline queue.
 *
 * Principles: SECURE (P11)
 */

import { createHash } from 'node:crypto';

/**
 * Compute SHA-256 hex digest of a string.
 *
 * @param {string} input
 * @returns {string}
 */
export function sha256Hex(input) {
  return createHash('sha256').update(input, 'utf-8').digest('hex');
}

/**
 * Normalize headers to a canonical string representation.
 * Lowercases keys, sorts entries, JSON stringifies.
 *
 * @param {Record<string, string>} headers
 * @returns {string}
 */
export function normalizeHeaders(headers) {
  const entries = Object.entries(headers)
    .map(([key, value]) => [key.toLowerCase(), value])
    .sort(([aKey, aValue], [bKey, bValue]) => {
      if (aKey === bKey) return aValue.localeCompare(bValue);
      return aKey.localeCompare(bKey);
    });
  return JSON.stringify(entries);
}

/**
 * Compute body hash from the serialized body string.
 * Matches the mobile contract exactly: mobile signs the exact bytes it sends on the wire.
 * Callers must supply the raw serialized body string; object normalization is intentionally
 * NOT performed here because JSON.stringify on a parsed object may differ from the
 * original bytes (whitespace, key order, numeric precision).
 *
 * @param {string} serializedBody - The exact UTF-8 body string mobile signed
 * @returns {string}
 */
export function computeBodyHash(serializedBody) {
  if (typeof serializedBody !== 'string') {
    throw new TypeError(
      `computeBodyHash expects a serialized string (the raw body bytes), got ${typeof serializedBody}. ` +
      'Pass the raw request body string, not a parsed object.'
    );
  }
  return sha256Hex(serializedBody);
}

/**
 * Compute headers hash from a header record.
 *
 * @param {Record<string, string>} headers
 * @returns {string}
 */
export function computeHeadersHash(headers) {
  return sha256Hex(normalizeHeaders(headers));
}

/**
 * Compute the canonical envelope hash.
 * Must match exactly the algorithm in gtcx-mobile's offline queue.
 *
 * @param {object} params
 * @param {string} params.method
 * @param {string} params.url
 * @param {string} params.bodyHash
 * @param {string} params.headersHash
 * @param {string} params.timestamp
 * @param {string} params.nonce
 * @param {string} params.did
 * @param {string} params.keyId
 * @param {string} params.audience
 * @returns {string}
 */
export function computeEnvelopeHash(params) {
  const requestUrl = new URL(params.url);
  const query = new URLSearchParams(
    Array.from(requestUrl.searchParams.entries()).sort(([aKey, aValue], [bKey, bValue]) => {
      if (aKey === bKey) return aValue.localeCompare(bValue);
      return aKey.localeCompare(bKey);
    })
  ).toString();

  const canonicalEnvelope = [
    params.method.toUpperCase(),
    requestUrl.pathname.replace(/\/{2,}/g, '/') || '/',
    query,
    params.bodyHash,
    params.headersHash,
    params.timestamp,
    params.nonce,
    params.did,
    params.keyId,
    params.audience,
  ].join('\n');

  return sha256Hex(canonicalEnvelope);
}
