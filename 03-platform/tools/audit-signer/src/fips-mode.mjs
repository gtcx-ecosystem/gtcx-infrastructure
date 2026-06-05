/**
 * @fileoverview FIPS 140-3 mode detection and enforcement.
 *
 * When GTCX_FIPS_MODE=1, the audit-signer switches from Ed25519 to
 * ECDSA P-256 (FIPS 186-5 approved) and validates that only FIPS-
 * approved digest algorithms (SHA-256) are used.
 *
 * This is a compile-time / startup-time switch. Once the module is
 * loaded, the mode is fixed for the process lifetime.
 */

/**
 * @returns {boolean}
 */
export function isFipsMode() {
  return process.env.GTCX_FIPS_MODE === '1';
}

/**
 * The signing algorithm to use based on FIPS mode.
 * @returns {'ed25519' | 'ec'}
 */
export function signingAlgorithm() {
  return isFipsMode() ? 'ec' : 'ed25519';
}

/**
 * The named curve for ECDSA when in FIPS mode.
 * @returns {'prime256v1'}
 */
export function fipsCurve() {
  return 'prime256v1';
}

/**
 * Validate that the given digest algorithm is FIPS-approved.
 * Throws when FIPS mode is on and a non-approved algorithm is used.
 *
 * @param {string} algorithm
 */
export function assertFipsDigest(algorithm) {
  if (!isFipsMode()) return;
  const approved = ['sha256', 'sha384', 'sha512'];
  if (!approved.includes(algorithm.toLowerCase())) {
    throw new Error(
      `FIPS mode: digest algorithm "${algorithm}" is not FIPS-approved. ` +
        `Use one of: ${approved.join(', ')}`
    );
  }
}
