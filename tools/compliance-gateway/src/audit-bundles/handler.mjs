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
 * @property {(event: object) => void} [signAuditEvent] - Optional injectable
 *   internal audit-of-the-ingest signer. When provided, an
 *   `audit-bundle.received` record is signed into our own audit chain
 *   on every 200 response so the substrate's audit-of-the-ingest is
 *   itself verifiable. The handler tolerates the signer being absent
 *   (used in tests that don't care about the audit trail).
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

  // 5. Sign our own internal "audit-bundle.received" record so the
  // substrate's audit-of-the-ingest is itself verifiable (closes the
  // loop: mobile signs events → we verify → we sign acceptance → all
  // flows to WORM via the existing NATS+JetStream pipeline).
  // Tolerates the signer being absent for tests that don't exercise it.
  if (typeof args.signAuditEvent === 'function') {
    try {
      args.signAuditEvent({
        actor: envelope.did,
        action: 'audit-bundle.received',
        target: `/audit/bundles#${parsed.bundleId}`,
        payload: {
          bundleId: parsed.bundleId,
          tenantId: args.headers['x-gtcx-tenant-id'] ?? null,
          eventsReceived: parsed.events.length,
          eventsAccepted: chain.acceptedIds.length,
          eventsRejected: chain.rejectedIds.length,
          chainBreakIndex: chain.firstBreakIndex,
        },
      });
    } catch (err) {
      // Don't fail the request if our own audit signing fails; the
      // response to mobile is already determined. Log via stderr so
      // the operator sees it.
      console.error(JSON.stringify({
        level: 'error',
        type: 'audit-bundles.internalAuditSignFailed',
        bundleId: parsed.bundleId,
        error: err?.message,
      }));
    }
  }

  return {
    status: 200,
    body: {
      acceptedIds: chain.acceptedIds,
    },
  };
}
