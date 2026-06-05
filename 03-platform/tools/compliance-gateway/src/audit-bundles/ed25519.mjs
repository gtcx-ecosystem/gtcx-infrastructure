/**
 * Ed25519 primitives used by the envelope verifier.
 *
 * Kept local (rather than imported from @gtcx/replay-protection) so the
 * audit-bundles module is a single self-contained unit and so test
 * fixtures can sign without pulling in another workspace package.
 *
 * Node 20+ supports Ed25519 in the Web Crypto API natively; no
 * third-party dependencies required.
 */

/**
 * Verify a raw Ed25519 signature.
 *
 * @param {string} message - Message that was signed (e.g. envelopeHash hex)
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
    ['verify'],
  );
  const signature = Buffer.from(signatureBase64url, 'base64url');
  const data = new TextEncoder().encode(message);
  return crypto.subtle.verify('Ed25519', publicKey, signature, data);
}

/**
 * Sign a message with Ed25519. Test fixture helper only — production
 * signing happens on the mobile client.
 *
 * @param {string} message
 * @param {object} privateKeyJwk
 * @returns {Promise<string>} Base64url signature
 */
export async function signEd25519(message, privateKeyJwk) {
  const privateKey = await crypto.subtle.importKey(
    'jwk',
    privateKeyJwk,
    { name: 'Ed25519' },
    true,
    ['sign'],
  );
  const data = new TextEncoder().encode(message);
  const sig = await crypto.subtle.sign('Ed25519', privateKey, data);
  return Buffer.from(new Uint8Array(sig)).toString('base64url');
}

/**
 * Generate an Ed25519 keypair (JWK form). Test fixture helper only.
 *
 * @returns {Promise<{ publicKeyJwk: object, privateKeyJwk: object }>}
 */
export async function generateEd25519KeyPair() {
  const keyPair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  if (!('privateKey' in keyPair) || !('publicKey' in keyPair)) {
    throw new TypeError('Ed25519 key generation did not return a key pair');
  }
  const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
  const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  return { privateKeyJwk, publicKeyJwk };
}
