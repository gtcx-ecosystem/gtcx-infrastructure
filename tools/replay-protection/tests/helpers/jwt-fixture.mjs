/**
 * @fileoverview Signature Test Fixtures
 *
 * Generates key pairs, DID documents, and signed envelopes for tests.
 * Supports both gtcx-queue-envelope-v1 (Ed25519) and did-jwt-es256 (ES256 JWT).
 * Uses Node.js Web Crypto API — no external dependencies.
 */

import { generateEd25519KeyPair, signEd25519 } from '../../src/crypto/ed25519-verify.mjs';
import { generateEs256KeyPair, signJwt } from '../../src/crypto/jwt-verify.mjs';

/** @type {object | null} */
let cachedEs256KeyPair = null;

/** @type {object | null} */
let cachedEd25519KeyPair = null;

// ---------------------------------------------------------------------------
// Ed25519 (gtcx-queue-envelope-v1) — mobile's current scheme
// ---------------------------------------------------------------------------

/**
 * Get or create the singleton Ed25519 test key pair.
 *
 * @returns {Promise<{ privateKeyJwk: object, publicKeyJwk: object }>}
 */
export async function getEd25519KeyPair() {
  if (!cachedEd25519KeyPair) {
    cachedEd25519KeyPair = await generateEd25519KeyPair();
  }
  return cachedEd25519KeyPair;
}

/**
 * Sign a gtcx-queue-envelope-v1 payload.
 *
 * @param {string} envelopeHash
 * @returns {Promise<string>} Base64url-encoded Ed25519 signature
 */
export async function signEnvelopeV1(envelopeHash) {
  const { privateKeyJwk } = await getEd25519KeyPair();
  return signEd25519(envelopeHash, privateKeyJwk);
}

// ---------------------------------------------------------------------------
// ES256 JWT (did-jwt-es256) — forward-compatible scheme
// ---------------------------------------------------------------------------

/**
 * Get or create the singleton ES256 test key pair.
 *
 * @returns {Promise<{ privateKeyJwk: object, publicKeyJwk: object }>}
 */
export async function getEs256KeyPair() {
  if (!cachedEs256KeyPair) {
    cachedEs256KeyPair = await generateEs256KeyPair();
  }
  return cachedEs256KeyPair;
}

/**
 * Sign an ES256 JWT for the given envelope hash and audience.
 *
 * @param {string} envelopeHash
 * @param {string} audience
 * @param {string} [keyId]
 * @returns {Promise<string>} JWT
 */
export async function signTestJwt(envelopeHash, audience, keyId = 'key-1') {
  const { privateKeyJwk } = await getEs256KeyPair();
  const nowSec = Math.floor(Date.now() / 1000);
  return signJwt(
    {
      envelopeHash,
      aud: audience,
      iat: nowSec,
      exp: nowSec + 300,
      kid: keyId,
    },
    privateKeyJwk
  );
}

// ---------------------------------------------------------------------------
// DID document builder + mock fetch
// ---------------------------------------------------------------------------

/**
 * Build a DID document for the test key.
 *
 * @param {string} did
 * @param {string} keyId
 * @param {object} publicKeyJwk
 * @returns {object}
 */
export function buildDidDocument(did, keyId, publicKeyJwk) {
  const fullKeyId = keyId.includes('#') ? keyId : `${did}#${keyId}`;
  return {
    '@context': 'https://www.w3.org/ns/did/v1',
    id: did,
    verificationMethod: [
      {
        id: fullKeyId,
        type: 'JsonWebKey2020',
        controller: did,
        publicKeyJwk,
      },
    ],
    authentication: [fullKeyId],
    assertionMethod: [fullKeyId],
  };
}

/**
 * Install a mock fetch that resolves the test DIDs.
 * Supports both Ed25519 and ES256 keys.
 *
 * @returns {Promise<typeof global.fetch>} The original fetch
 */
export async function installMockFetch() {
  const original = global.fetch;
  const { publicKeyJwk: edPub } = await getEd25519KeyPair();
  const { publicKeyJwk: esPub } = await getEs256KeyPair();

  const docs = {
    'did:gtcx:device:test': buildDidDocument('did:gtcx:device:test', 'key-1', edPub),
    'did:gtcx:device:header-test': buildDidDocument('did:gtcx:device:header-test', 'key-1', edPub),
    'did:gtcx:device:abc123': buildDidDocument('did:gtcx:device:abc123', 'key-1', edPub),
    'did:gtcx:device:es256-test': buildDidDocument('did:gtcx:device:es256-test', 'key-1', esPub),
  };

  global.fetch = /** @type {typeof global.fetch} */ (async (url) => {
    const urlStr = typeof url === 'string' ? url : (url instanceof URL ? url.href : String(url));
    for (const [did, doc] of Object.entries(docs)) {
      if (urlStr.includes(encodeURIComponent(did))) {
        return { ok: true, status: 200, json: async () => doc };
      }
    }
    return original(url);
  });

  return original;
}

/**
 * Restore the original fetch.
 *
 * @param {typeof global.fetch} original
 */
export function uninstallMockFetch(original) {
  global.fetch = original;
}
