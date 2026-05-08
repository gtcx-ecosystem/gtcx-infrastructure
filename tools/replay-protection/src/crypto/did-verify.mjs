/**
 * @fileoverview DID Signature Verification Stub
 *
 * Production-quality placeholder for DID/JWT signature verification.
 * Currently validates payload structure and formatting; production must
 * replace this with a real DID resolver + JWT verifier.
 *
 * TODO: Wire to @gtcx/crypto DID resolver once available.
 *
 * Principles: SECURE (P11)
 */

const HEX_RE = /^[0-9a-fA-F]+$/;
const NONCE_MIN_LEN = 16; // 8 bytes hex minimum

/**
 * Validate that an integrity payload is structurally sound.
 * Returns false for obviously malformed requests (missing fields,
 * invalid nonce format, malformed timestamp).
 *
 * @param {import('../types').QueueIntegrity} integrity
 * @returns {Promise<boolean>}
 */
export async function verifyDidSignature(integrity) {
  // Required fields must be non-empty strings
  const required = ['scheme', 'did', 'keyId', 'audience', 'timestamp', 'nonce', 'signature', 'envelopeHash'];
  for (const field of required) {
    const val = integrity[field];
    if (typeof val !== 'string' || val.length === 0) {
      return false;
    }
  }

  // Nonce must be hex (mobile generates crypto-random bytes encoded as hex)
  if (!HEX_RE.test(integrity.nonce) || integrity.nonce.length < NONCE_MIN_LEN) {
    return false;
  }

  // Timestamp must be valid ISO-8601
  const tsMs = Date.parse(integrity.timestamp);
  if (Number.isNaN(tsMs)) {
    return false;
  }

  // DID must start with did: prefix
  if (!integrity.did.startsWith('did:')) {
    return false;
  }

  // Signature must be non-trivial base64-like string
  if (integrity.signature.length < 4) {
    return false;
  }

  // Envelope hash must be 64-char hex (SHA-256)
  if (!HEX_RE.test(integrity.envelopeHash) || integrity.envelopeHash.length !== 64) {
    return false;
  }

  // TODO: Replace with real JWT/DID verification:
  //   1. Resolve DID to DID document
  //   2. Extract public key matching keyId
  //   3. Verify JWT signature over envelopeHash
  //   4. Validate audience claim

  return true;
}
