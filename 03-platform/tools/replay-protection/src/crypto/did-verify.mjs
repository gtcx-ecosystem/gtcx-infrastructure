/**
 * @fileoverview Signature Verification — Multi-Scheme
 *
 * Supports both:
 *   - gtcx-queue-envelope-v1  (Ed25519 raw signature over envelopeHash)
 *   - did-jwt-es256           (ES256 JWT with envelopeHash in payload)
 *
 * The mobile client currently emits gtcx-queue-envelope-v1.
 * did-jwt-es256 is retained for forward compatibility.
 *
 * Principles: SECURE (P11)
 */

import { verifyEd25519 } from './ed25519-verify.mjs';
import { resolveDid, extractPublicKeyJwk, verifyJwt } from './jwt-verify.mjs';

const HEX_RE = /^[0-9a-fA-F]+$/;
const NONCE_MIN_LEN = 16; // 8 bytes hex minimum

/**
 * @typedef {Record<string, unknown> & { envelopeHash?: string }} VerifiedJwtPayload
 */

/**
 * Verify a signature according to the scheme declared in the integrity payload.
 *
 * @param {import('../types').QueueIntegrity} integrity
 * @returns {Promise<boolean>}
 */
export async function verifyDidSignature(integrity) {
  // 1. Structural validation
  const required = /** @type {const} */ (['scheme', 'did', 'keyId', 'audience', 'timestamp', 'nonce', 'signature', 'envelopeHash']);
  for (const field of required) {
    const val = integrity[field];
    if (typeof val !== 'string' || val.length === 0) {
      return false;
    }
  }

  if (!HEX_RE.test(integrity.nonce) || integrity.nonce.length < NONCE_MIN_LEN) {
    return false;
  }

  const tsMs = Date.parse(integrity.timestamp);
  if (Number.isNaN(tsMs)) {
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

  // 2. Scheme-specific cryptographic verification
  try {
    const didDocument = await resolveDid(integrity.did);
    const publicKeyJwk = extractPublicKeyJwk(didDocument, integrity.keyId);
    if (!publicKeyJwk) {
      return false;
    }

    switch (integrity.scheme) {
      case 'gtcx-queue-envelope-v1': {
        // Ed25519 raw signature over the envelopeHash hex string
        return verifyEd25519(integrity.envelopeHash, integrity.signature, publicKeyJwk);
      }
      case 'did-jwt-es256': {
        // ES256 JWT; payload must contain matching envelopeHash
        const payload = /** @type {VerifiedJwtPayload} */ (await verifyJwt(integrity.signature, publicKeyJwk, {
          audience: integrity.audience,
        }));
        return payload.envelopeHash === integrity.envelopeHash;
      }
      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Bypass wrapper for integration tests and local development ONLY.
 * Logs a loud warning every time it is invoked.
 *
 * @deprecated Remove once all environments have DID resolver access.
 * @param {import('../types').QueueIntegrity} integrity
 * @returns {Promise<boolean>}
 */
export async function verifyDidSignatureStubBypass(integrity) {
  const required = /** @type {const} */ (['scheme', 'did', 'keyId', 'audience', 'timestamp', 'nonce', 'signature', 'envelopeHash']);
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
