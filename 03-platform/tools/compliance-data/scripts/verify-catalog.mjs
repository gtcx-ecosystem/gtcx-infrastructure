#!/usr/bin/env node
/**
 * @fileoverview Verify jurisdictions.json against jurisdictions.json.sig.
 *
 * Runs in CI on every commit and on `npm pack` as a publication
 * gate. Also intended as a copy-paste reference for downstream
 * consumers verifying the published catalog offline.
 */

import { createHash, createPublicKey, verify } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { canonicalizeValue } from '@gtcx/audit-signer';

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG = join(HERE, '..');
const CATALOG = join(PKG, 'jurisdictions.json');
const SIG = join(PKG, 'jurisdictions.json.sig');

// Pinned trust anchor — the published Ed25519 SPKI public key for the
// @gtcx/compliance-data catalog. Without this pin, the verifier
// trusted `sig.publicKey` as published in the signature file itself,
// which made signature swap + catalog re-sign trivially undetectable
// (self-vouching). To rotate the trust anchor: publish a new catalog
// version with the new key in BOTH this constant AND the .sig file
// in the same commit, and announce the rotation in CHANGELOG.md.
//
// Override (CI / canary / rotation drill only): set
// EXPECTED_PUBLIC_KEY env var. Refuses to start if env is set to an
// empty string — that would be silent fail-open.
export const PINNED_PUBLIC_KEY =
  'MCowBQYDK2VwAyEA+zeNXQRjNzP8vCq/vlzvfbcLDCKwMO5nFGD9IYpsk9w=';

/** @deprecated Use canonicalizeValue from @gtcx/audit-signer */
export const canonicalize = canonicalizeValue;

/**
 * Verify a parsed catalog against its parsed signature, anchored to a
 * pinned public key. Returns `{ ok: true }` on success, `{ ok: false,
 * code, reason }` on rejection. Pure function — no filesystem I/O.
 *
 * @param {{
 *   catalog: unknown,
 *   sig: { algorithm: string, version: string, catalogHash: string,
 *          signedAt: string, publicKey: string, signature: string },
 *   expectedPublicKey: string
 * }} args
 * @returns {{ ok: true, sig: object } | { ok: false, code: string, reason: string }}
 */
export function verifyCatalog({ catalog, sig, expectedPublicKey }) {
  if (typeof expectedPublicKey !== 'string' || expectedPublicKey.length === 0) {
    return {
      ok: false,
      code: 'TRUST_ANCHOR_MISSING',
      reason:
        'expectedPublicKey is empty — refusing to verify without a pinned trust anchor.',
    };
  }
  if (sig.algorithm !== 'ed25519+sha256+jcs') {
    return {
      ok: false,
      code: 'ALGORITHM_UNEXPECTED',
      reason: `unexpected algorithm: ${sig.algorithm}`,
    };
  }
  if (sig.publicKey !== expectedPublicKey) {
    return {
      ok: false,
      code: 'TRUST_ANCHOR_MISMATCH',
      reason:
        `signature was produced by a key (${sig.publicKey.slice(0, 16)}...) that does NOT match ` +
        `the pinned trust anchor (${expectedPublicKey.slice(0, 16)}...). ` +
        'This is the exact attack the pin exists to detect: an attacker that ' +
        'rewrites the catalog and re-signs with a new key would also update ' +
        '`sig.publicKey`, and a verifier without the pin would silently accept.',
    };
  }

  const canonical = canonicalizeValue(catalog);
  const computedHash = createHash('sha256').update(canonical, 'utf8').digest('base64');
  if (computedHash !== sig.catalogHash) {
    return {
      ok: false,
      code: 'CATALOG_HASH_MISMATCH',
      reason: `computed ${computedHash} != recorded ${sig.catalogHash}`,
    };
  }

  const publicKey = createPublicKey({
    key: Buffer.from(sig.publicKey, 'base64'),
    format: 'der',
    type: 'spki',
  });
  const sigOk = verify(
    null,
    Buffer.from(canonical, 'utf8'),
    publicKey,
    Buffer.from(sig.signature, 'base64')
  );
  if (!sigOk) {
    return {
      ok: false,
      code: 'SIGNATURE_INVALID',
      reason:
        'signature does not verify against the pinned public key — forged or corrupted.',
    };
  }

  return { ok: true, sig };
}

function main() {
  // Allow CI / rotation drills to override via env; the env value must
  // be non-empty (verifyCatalog refuses empty trust anchor explicitly).
  const expectedPublicKey =
    process.env.EXPECTED_PUBLIC_KEY === undefined
      ? PINNED_PUBLIC_KEY
      : process.env.EXPECTED_PUBLIC_KEY;

  let sig;
  try {
    sig = JSON.parse(readFileSync(SIG, 'utf8'));
  } catch (err) {
    console.error(
      `[verify-catalog] cannot read ${SIG.replace(`${PKG}/`, '')}: ${err.message}\n` +
        '  The package may have been published without a signature, or the\n' +
        '  sidecar was stripped after publication. Refuse to use.'
    );
    process.exit(1);
  }

  const catalogRaw = readFileSync(CATALOG, 'utf8');
  const catalog = JSON.parse(catalogRaw);

  const result = verifyCatalog({ catalog, sig, expectedPublicKey });
  if (!result.ok) {
    console.error(`[verify-catalog] ${result.code}: ${result.reason}`);
    process.exit(1);
  }

  console.log(
    `[verify-catalog] OK — v${sig.version} signed ${sig.signedAt}\n` +
      `  catalogHash:  ${sig.catalogHash}\n` +
      `  publicKey:    ${sig.publicKey.slice(0, 32)}... (matches pinned anchor)`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main();
