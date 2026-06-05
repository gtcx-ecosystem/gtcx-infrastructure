/**
 * @fileoverview JWT Verification — ES256 (zero dependencies)
 *
 * Uses Node.js Web Crypto API (globalThis.crypto.subtle) to verify
 * ECDSA P-256 signatures with SHA-256. Compatible with gtcx-mobile's
 * did-jwt-es256 signing scheme.
 *
 * Principles: SECURE (P11)
 */

const DID_RESOLVER_URL = process.env.DID_RESOLVER_URL || 'https://did.gtcxprotocol.org/1.0/identifiers';
const DID_RESOLVER_TIMEOUT_MS = Number(process.env.DID_RESOLVER_TIMEOUT_MS || 5000);

/**
 * @typedef {{ verificationMethod?: Array<{ id: string, publicKeyJwk?: object }>, id?: string }} DidDocument
 */

/**
 * @param {unknown} value
 * @returns {DidDocument}
 */
function normalizeDidDocument(value) {
  if (!value || typeof value !== 'object') {
    throw new Error('DID resolver returned a non-object response');
  }
  if ('didDocument' in value && value.didDocument && typeof value.didDocument === 'object') {
    return /** @type {DidDocument} */ (value.didDocument);
  }
  return /** @type {DidDocument} */ (value);
}

/**
 * Resolve a DID to a DID document via HTTP.
 *
 * @param {string} did
 * @returns {Promise<DidDocument>}
 */
export async function resolveDid(did) {
  const url = `${DID_RESOLVER_URL}/${encodeURIComponent(did)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DID_RESOLVER_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`DID resolver returned ${res.status}`);
    }
    const doc = await res.json();
    return normalizeDidDocument(doc);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Extract a publicKeyJwk from a DID document by keyId.
 *
 * @param {DidDocument} didDocument
 * @param {string} keyId
 * @returns {object | null}
 */
export function extractPublicKeyJwk(didDocument, keyId) {
  const methods = didDocument.verificationMethod ?? [];
  const fullKeyId = keyId.includes('#') ? keyId : `${didDocument.id}#${keyId}`;
  const method = methods.find((vm) => vm.id === keyId || vm.id === fullKeyId);
  return method?.publicKeyJwk ?? null;
}

/**
 * Verify an ES256 JWT.
 *
 * @param {string} jwt - Base64url-encoded JWT (header.payload.signature)
 * @param {object} publicKeyJwk - JWK with kty: 'EC', crv: 'P-256'
 * @param {object} options
 * @param {string} [options.audience]
 * @param {number} [options.clockToleranceSeconds=30]
 * @returns {Promise<object>} Decoded JWT payload
 * @throws {Error} If verification fails
 */
export async function verifyJwt(jwt, publicKeyJwk, options = {}) {
  const parts = jwt.split('.');
  if (parts.length !== 3) {
    throw new Error('JWT must have 3 parts');
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  const headerBytes = base64urlDecode(headerB64);
  const payloadBytes = base64urlDecode(payloadB64);
  const signatureBytes = base64urlDecode(signatureB64);

  const header = JSON.parse(new TextDecoder().decode(headerBytes));
  const payload = JSON.parse(new TextDecoder().decode(payloadBytes));

  if (header.alg !== 'ES256') {
    throw new Error(`Unsupported algorithm: ${header.alg}`);
  }
  if (header.typ !== 'JWT') {
    throw new Error(`Unsupported type: ${header.typ}`);
  }

  const publicKey = await crypto.subtle.importKey(
    'jwk',
    publicKeyJwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['verify']
  );

  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const valid = await crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    publicKey,
    signatureBytes,
    data
  );
  if (!valid) {
    throw new Error('JWT signature verification failed');
  }

  if (options.audience && payload.aud !== options.audience) {
    throw new Error('JWT audience mismatch');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const tolerance = options.clockToleranceSeconds ?? 30;
  if (payload.exp !== undefined && nowSec > payload.exp + tolerance) {
    throw new Error('JWT expired');
  }
  if (payload.iat !== undefined && nowSec < payload.iat - tolerance) {
    throw new Error('JWT issued in the future');
  }

  return payload;
}

/**
 * Sign an ES256 JWT (test helper only).
 *
 * @param {object} payload
 * @param {object} privateKeyJwk
 * @param {object} [headerOverrides]
 * @returns {Promise<string>}
 */
export async function signJwt(payload, privateKeyJwk, headerOverrides = {}) {
  const header = { typ: 'JWT', alg: 'ES256', ...headerOverrides };
  const headerB64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));

  const privateKey = await crypto.subtle.importKey(
    'jwk',
    privateKeyJwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign']
  );

  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    data
  );

  const signatureB64 = base64urlEncode(new Uint8Array(signature));
  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

/**
 * Generate an ES256 test key pair (test helper only).
 *
 * @returns {Promise<{ privateKeyJwk: object, publicKeyJwk: object }>}
 */
export async function generateEs256KeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );
  const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
  const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  return { privateKeyJwk, publicKeyJwk };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** @param {Uint8Array} bytes @returns {string} */
function base64urlEncode(bytes) {
  return Buffer.from(bytes).toString('base64url');
}

/** @param {string} str @returns {Uint8Array} */
function base64urlDecode(str) {
  return new Uint8Array(Buffer.from(str, 'base64url'));
}
