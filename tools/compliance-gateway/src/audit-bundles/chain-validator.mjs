/**
 * Within-bundle chain validator.
 *
 * Mobile signs each event with a `previousHash` pointing at the prior
 * event's `eventHash`. The first event in a bundle may have
 * `previousHash: null` (genesis or post-rotation marker).
 *
 * Per the mobile team's guidance on issue #50:
 *
 *   "Per-event eventHash integrity failure" or
 *   "Per-event previousHash chain break within bundle"
 *   → events from the break onward omitted; 200 with partial accept
 *
 * Cross-bundle continuity (linking the first event's previousHash to
 * the last accepted event for that DID/tenant) is deliberately out of
 * scope for V1 — deferred to Sprint 22+ per the mobile team. Adding it
 * later doesn't break the wire shape, only the storage shape.
 *
 * This validator does NOT recompute the `eventHash` from event fields.
 * The hash is a client-controlled identifier — server-side recomputation
 * would either (a) require a canonical event-hashing spec from mobile
 * (which doesn't exist yet) or (b) cause false rejects on any benign
 * mobile-side format drift. The chain-pointer check is the load-bearing
 * integrity property; field re-hashing is a follow-up if Mobile commits
 * to a stable hash form.
 */

/**
 * @typedef {object} ChainValidationResult
 * @property {string[]} acceptedIds  - IDs of events the chain accepted
 * @property {string[]} rejectedIds  - IDs of events omitted from acceptance
 * @property {number|null} firstBreakIndex - Index of the first chain break, or null if clean
 */

/**
 * Validate the previousHash → eventHash chain within a single bundle.
 *
 * Rules:
 *   - First event: previousHash MUST be null or a string. (Mobile may
 *     send null for genesis or a real hash for continuation.)
 *   - Subsequent events: previousHash MUST equal the immediately
 *     preceding event's eventHash.
 *   - Each event MUST have a non-empty eventHash. (Schema enforces
 *     this, but the validator does defense-in-depth.)
 *
 * On break: every event from that index onward is rejected. The bundle
 * is still ingested with the partial accept (matching mobile's
 * "200 with partial acceptedIds" expectation).
 *
 * @param {Array<{ id: string, previousHash: string|null, eventHash: string }>} events
 * @returns {ChainValidationResult}
 */
export function validateWithinBundleChain(events) {
  const acceptedIds = [];
  const rejectedIds = [];
  let firstBreakIndex = null;
  let priorHash = null;

  for (let i = 0; i < events.length; i += 1) {
    const event = events[i];

    if (firstBreakIndex !== null) {
      rejectedIds.push(event.id);
      continue;
    }

    if (!event.eventHash || typeof event.eventHash !== 'string') {
      firstBreakIndex = i;
      rejectedIds.push(event.id);
      continue;
    }

    if (i === 0) {
      // First event: previousHash must be null or a string; no equality check
      if (event.previousHash !== null && typeof event.previousHash !== 'string') {
        firstBreakIndex = i;
        rejectedIds.push(event.id);
        continue;
      }
    } else if (event.previousHash !== priorHash) {
      firstBreakIndex = i;
      rejectedIds.push(event.id);
      continue;
    }

    acceptedIds.push(event.id);
    priorHash = event.eventHash;
  }

  return { acceptedIds, rejectedIds, firstBreakIndex };
}
