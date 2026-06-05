/**
 * @fileoverview Audit target sanitization.
 *
 * The `target` field of every signed audit event ultimately ends up
 * in WORM storage with a 2557-day retention floor. An unsanitized
 * `req.url` lets an unauthenticated attacker poison the tamper-evident
 * chain with attacker-controlled query strings (XSS-shaped payloads,
 * stolen-secret leak attempts, oversized URL fragments).
 *
 * Sanitization rules:
 *   - strip query string (everything after the first `?`)
 *   - strip URL fragment (everything after the first `#`)
 *   - cap at 200 characters
 */

const MAX_TARGET_LENGTH = 200;

export function sanitizeAuditTarget(rawUrl) {
  if (typeof rawUrl !== 'string') return '';
  const path = rawUrl.split('?')[0].split('#')[0];
  return path.slice(0, MAX_TARGET_LENGTH);
}
