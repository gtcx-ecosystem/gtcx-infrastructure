/**
 * POST /audit/bundles handler — pure function.
 *
 * Orchestrates the four checks in order, short-circuiting at the first
 * failure that maps to a non-200 response:
 *
 *   1. Envelope verification (signature, audience, timestamp, body hash,
 *      header presence) → 400 envelope-* reason on failure
 *   2. Nonce gate (5-min replay window) → 409 nonce-replayed on hit
 *   3. Zod parse of the bundle body → 400 bundle-malformed on failure
 *   4. Within-bundle chain validation → 200 with partial acceptedIds
 *
 * The handler is a pure function (no globals, all dependencies injected)
 * so the server.mjs integration is one call and the integration test
 * does not need to start an HTTP server.
 */

import { validateWithinBundleChain } from './chain-validator.mjs';
import { verifyEnvelope, EnvelopeVerificationError } from './envelope-verifier.mjs';
import { AuditBundleRequestSchema } from './schemas.mjs';

/**
 * @typedef {object} HandleArgs
 * @property {string} method
 * @property {string} url
 * @property {string} body                 - Raw body bytes as string
 * @property {Record<string, string>} headers
 * @property {string} expectedAudience
 * @property {import('./did-resolver.mjs').DidResolver} resolver
 * @property {import('./nonce-gate.mjs').NonceGate} nonceGate
 * @property {number} [nowMs]
 *
 * @typedef {object} HandleResult
 * @property {number} status
 * @property {object} body
 */

export async function processBundle(args) {
  // 1. Envelope verification
  let envelope;
  try {
    envelope = await verifyEnvelope({
      method: args.method,
      url: args.url,
      body: args.body,
      headers: args.headers,
      expectedAudience: args.expectedAudience,
      resolver: args.resolver,
      nowMs: args.nowMs,
    });
  } catch (err) {
    if (err instanceof EnvelopeVerificationError) {
      return {
        status: 400,
        body: { error: `envelope-${err.reason}`, acceptedIds: [] },
      };
    }
    return {
      status: 500,
      body: { error: 'envelope-unexpected-failure', acceptedIds: [] },
    };
  }

  // 2. Nonce gate (the canonical 409 path)
  const { accepted } = args.nonceGate.checkAndSet(envelope.nonce);
  if (!accepted) {
    return {
      status: 409,
      body: { error: 'nonce-replayed', acceptedIds: [] },
    };
  }

  // 3. Zod parse of the bundle body
  let parsed;
  try {
    const json = JSON.parse(args.body);
    parsed = AuditBundleRequestSchema.parse(json);
  } catch (err) {
    return {
      status: 400,
      body: {
        error: 'bundle-malformed',
        acceptedIds: [],
        detail: err?.issues ?? err?.message ?? 'parse error',
      },
    };
  }

  // 4. Within-bundle chain validation → partial accept
  const chain = validateWithinBundleChain(parsed.events);

  return {
    status: 200,
    body: {
      acceptedIds: chain.acceptedIds,
    },
  };
}
