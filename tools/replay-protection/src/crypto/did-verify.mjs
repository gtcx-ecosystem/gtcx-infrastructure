/**
 * @fileoverview DID Signature Verification — Fail-Closed Stub
 *
 * STRICT: This function returns false for every structurally valid request
 * until a real DID resolver + JWT verifier is wired. Production must NEVER
 * rely on the structural stub as a security control.
 *
 * To run integration tests or local dev while the real verifier is missing,
 * set REPLAY_GUARD_ALLOW_STUB_SIGNATURE=true. This bypass is logged at
 * warn level and flagged in every audit event.
 *
 * TODO: Wire to @gtcx/crypto DID resolver once available.
 *
 * Principles: SECURE (P11)
 */

const HEX_RE = /^[0-9a-fA-F]+$/;
const NONCE_MIN_LEN = 16; // 8 bytes hex minimum

/**
 * Structural validation — rejects obviously malformed requests.
 * Returns false for well-formed requests because cryptographic verification
 * is not yet implemented.
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

  // FAIL-CLOSED: Cryptographic verification is not implemented.
  // A strict auditor would flag any system that returns true here.
  return false;
}

/**
 * Bypass wrapper for integration tests and local development ONLY.
 * Performs the same structural checks as verifyDidSignature but returns true
 * for well-formed requests. Logs a loud warning every time it is invoked.
 *
 * @param {import('../types').QueueIntegrity} integrity
 * @returns {Promise<boolean>}
 */
export async function verifyDidSignatureStubBypass(integrity) {
  const required = ['scheme', 'did', 'keyId', 'audience', 'timestamp', 'nonce', 'signature', 'envelopeHash'];
  for (const field of required) {
    const val = integrity[field];
    if (typeof val !== 'string' || val.length === 0) {
      return false;
    }
  }
  if (!HEX_RE.test(integrity.nonce) || integrity.nonce.length < NONCE_MIN_LEN) {
    return false;
  }
  if (Number.isNaN(Date.parse(integrity.timestamp))) {
    return false;
  }
  if (!integrity.did.startsWith('did:')) {
    return false;
  }
  if (integrity.signature.length < 4) {
    return false;
  }
  if (!HEX_RE.test(integrity.envelopeHash) || integrity.envelopeHash.length !== 64) {
    return false;
  }
  // eslint-disable-next-line no-console
  console.warn(JSON.stringify({
    level: 'warn',
    type: 'auth.replay.signature.bypass',
    message: 'Cryptographic signature verification is BYPASSED. This must not run in production.',
    did: integrity.did,
    nonce: integrity.nonce,
    envelopeHash: integrity.envelopeHash,
  }));
  return true;
}
