/**
 * DID resolver client for the audit-bundles verifier.
 *
 * Mobile signs with a keypair whose public key is published in a DID
 * document at:
 *
 *   ${baseUrl}${identityPathPrefix}/${did}
 *
 * Default prefix `/identity` matches mobile `api-config` resolve URLs.
 * Staging protocols exposes operator docs at `/v1/tradepass/:did` — set
 * `TRADEPASS_IDENTITY_PATH_PREFIX=/v1/tradepass` when wiring to gtcx-protocols.
 *
 * (per gtcx-mobile/apps/mobile/gtcx/lib/api-config.ts:192).
 *
 * The resolver is split into two layers:
 *
 *   1. A pure `extractPublicKey(didDocument, keyId)` function that pulls
 *      the public key bytes from a DID document by keyId. Unit-tested
 *      against fixture DID documents.
 *
 *   2. A `createTradePassResolver({ baseUrl, fetcher })` factory that
 *      HTTP-fetches the DID document and applies extractPublicKey. The
 *      `fetcher` is injectable so tests can short-circuit the network
 *      and so the eventual integration test (once gtcx-protocols #60
 *      lands) can wire to the real endpoint.
 *
 * Public keys are returned as raw Buffer (Ed25519 32-byte SPKI not
 * required — node:crypto's `verify()` accepts the raw key with
 * `format: 'jwk'`). We return the JWK form so node:crypto can ingest
 * it directly without further conversion.
 */

const DEFAULT_TIMEOUT_MS = 5000;

/**
 * @typedef {object} VerificationMethod
 * @property {string} id
 * @property {string} [type]
 * @property {object} [publicKeyJwk]
 *
 * @typedef {object} DidDocument
 * @property {string} [id]
 * @property {VerificationMethod[]} [verificationMethod]
 *
 * @typedef {object} ResolverConfig
 * @property {string} baseUrl
 * @property {string} [identityPathPrefix] - e.g. `/identity` (default) or `/v1/tradepass`
 * @property {string} [authToken] - Bearer token for authenticated TradePass (staging protocols)
 * @property {typeof fetch} [fetcher]
 * @property {number} [timeoutMs]
 *
 * @typedef {(did: string, keyId: string) => Promise<object>} DidResolver
 */

export class DidResolverError extends Error {
  constructor(reason, cause) {
    super(reason);
    this.name = 'DidResolverError';
    this.reason = reason;
    if (cause) this.cause = cause;
  }
}

/**
 * Extract the publicKeyJwk for the given keyId from a DID document.
 * Returns the JWK object on success; throws DidResolverError on failure.
 *
 * @param {DidDocument} didDocument
 * @param {string} keyId
 * @returns {object}
 */
import { ed25519MultibaseToJwk } from './multibase.mjs';

export function extractPublicKey(didDocument, keyId) {
  if (!didDocument || typeof didDocument !== 'object') {
    throw new DidResolverError('did-document-malformed');
  }
  const methods = Array.isArray(didDocument.verificationMethod)
    ? didDocument.verificationMethod
    : [];
  // Mobile may pass either the bare key fragment (e.g. "k-1") or the fully
  // qualified id ("did:gtcx:tp_zw_001#k-1"). Match on suffix to accept both.
  const match = methods.find(
    (m) => m?.id === keyId || (typeof m?.id === 'string' && m.id.endsWith(`#${keyId}`)),
  );
  if (!match) {
    throw new DidResolverError('key-id-not-found');
  }

  // Ed25519VerificationKey2020 uses publicKeyMultibase (base58btc, z-prefix).
  // Legacy/test fixtures may use publicKeyJwk. Support both.
  if (match.publicKeyJwk && typeof match.publicKeyJwk === 'object') {
    return match.publicKeyJwk;
  }
  if (typeof match.publicKeyMultibase === 'string') {
    try {
      return ed25519MultibaseToJwk(match.publicKeyMultibase);
    } catch (err) {
      throw new DidResolverError('public-key-multibase-invalid', err.message);
    }
  }

  throw new DidResolverError('public-key-jwk-missing');
}

/**
 * Build a resolver bound to a TradePass base URL.
 * Returned function: `(did, keyId) => Promise<publicKeyJwk>`.
 *
 * @param {ResolverConfig} config
 * @returns {DidResolver}
 */
export function createTradePassResolver(config) {
  if (!config || !config.baseUrl) {
    throw new TypeError('createTradePassResolver requires a baseUrl');
  }
  const baseUrl = config.baseUrl.replace(/\/$/, '');
  const identityPathPrefix = (config.identityPathPrefix ?? '/identity').replace(/\/$/, '');
  const fetcher = config.fetcher ?? globalThis.fetch;
  const authToken = config.authToken?.trim() || '';
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  if (typeof fetcher !== 'function') {
    throw new TypeError('createTradePassResolver requires a fetcher (or global fetch)');
  }
  return async function resolve(did, keyId) {
    if (typeof did !== 'string' || !did.startsWith('did:')) {
      throw new DidResolverError('did-malformed');
    }
    const url = `${baseUrl}${identityPathPrefix}/${encodeURIComponent(did)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
    try {
      const res = await fetcher(url, { signal: controller.signal, headers });
      if (!res.ok) {
        throw new DidResolverError(`http-${res.status}`);
      }
      const doc = await res.json();
      return extractPublicKey(doc, keyId);
    } catch (err) {
      if (err instanceof DidResolverError) throw err;
      if (err && err.name === 'AbortError') throw new DidResolverError('timeout');
      throw new DidResolverError('fetch-failed', err);
    } finally {
      clearTimeout(timer);
    }
  };
}

/**
 * In-memory resolver for tests. Constructed with `{ did: { keyId: jwk } }`
 * and resolves synchronously against that map. The mock the stub branch
 * uses until gtcx-protocols #60 lands at a stable URL.
 *
 * @param {Record<string, Record<string, object>>} mapping
 * @returns {DidResolver}
 */
export function createMockResolver(mapping) {
  return async function resolve(did, keyId) {
    const keys = mapping?.[did];
    if (!keys) throw new DidResolverError('did-not-found');
    const jwk = keys[keyId];
    if (!jwk) throw new DidResolverError('key-id-not-found');
    return jwk;
  };
}
