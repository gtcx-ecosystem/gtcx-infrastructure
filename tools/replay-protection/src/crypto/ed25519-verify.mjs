/**
 * @fileoverview Ed25519 Signature Verification
 *
 * Verifies raw Ed25519 signatures for the gtcx-queue-envelope-v1 scheme.
 * The mobile client signs the envelopeHash directly (not wrapped in a JWT).
 *
 * Principles: SECURE (P11)
 */

/**
 * Verify a raw Ed25519 signature.
 *
 * @param {string} message - The message that was signed (e.g. envelopeHash hex string)
 * @param {string} signatureBase64url - Base64url-encoded signature
 * @param {object} publicKeyJwk - JWK with kty: 'OKP', crv: 'Ed25519'
 * @returns {Promise<boolean>}
 */
export async function verifyEd25519(message, signatureBase64url, publicKeyJwk) {
  const publicKey = await crypto.subtle.importKey(
    'jwk',
    publicKeyJwk,
    { name: 'Ed25519' },
    true,
    ['verify']
  );

  const signature = base64urlDecode(signatureBase64url);
  const data = new TextEncoder().encode(message);

  return crypto.subtle.verify('Ed25519', publicKey, signature, data);
}

/**
 * Sign a message with Ed25519 (test helper only).
 *
 * @param {string} message
 * @param {object} privateKeyJwk
 * @returns {Promise<string>} Base64url-encoded signature
 */
export async function signEd25519(message, privateKeyJwk) {
  const privateKey = await crypto.subtle.importKey(
    'jwk',
    privateKeyJwk,
    { name: 'Ed25519' },
    true,
    ['sign']
  );

  const data = new TextEncoder().encode(message);
  const signature = await crypto.subtle.sign('Ed25519', privateKey, data);
  return base64urlEncode(new Uint8Array(signature));
}

/**
 * Generate an Ed25519 test key pair (test helper only).
 *
 * @returns {Promise<{ privateKeyJwk: object, publicKeyJwk: object }>}
 */
export async function generateEd25519KeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'Ed25519' },
    true,
    ['sign', 'verify']
  );
  const kp = /** @type {any} */ (keyPair);
  const privateKeyJwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
  const publicKeyJwk = await crypto.subtle.exportKey('jwk', kp.publicKey);
  return { privateKeyJwk, publicKeyJwk };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function base64urlEncode(bytes) {
  return Buffer.from(bytes).toString('base64url');
}

function base64urlDecode(str) {
  return new Uint8Array(Buffer.from(str, 'base64url'));
}
