#!/usr/bin/env node
/**
 * @fileoverview Sign jurisdictions.json with the catalog signing key
 * and emit a sidecar .sig file.
 *
 * The signed catalog is the moat. A published @gtcx/compliance-data
 * that any consumer can cryptographically verify against the known
 * public key turns "trust me" into "trust the math": a regulator who
 * cites this catalog in their reference architecture is citing a
 * tamper-evident artifact, not a snapshot at a moment.
 *
 * Usage:
 *
 *   COMPLIANCE_DATA_SIGNING_KEY_B64=... node 03-platform/scripts/sign-catalog.mjs
 *
 * Output:
 *
 *   jurisdictions.json        — unchanged
 *   jurisdictions.json.sig    — JSON:
 *     {
 *       "algorithm": "ed25519+sha256+jcs",
 *       "version": "<package.json version>",
 *       "catalogHash": "<sha256 base64>",
 *       "signedAt": "<ISO 8601>",
 *       "publicKey": "<spki base64>",
 *       "signature": "<base64>"
 *     }
 *
 * Verifying:
 *
 *   node 03-platform/scripts/verify-catalog.mjs            # round-trip check
 *
 * The signature covers the canonicalized catalog JSON via
 * @gtcx/audit-signer (the same Ed25519 + SHA-256 + JCS primitives
 * used by the audit chain). Consumers can verify offline with:
 *
 *   import { verifyRecord } from '@gtcx/audit-signer';
 *   // see verify-catalog.mjs for the full sequence
 */

import { createHash, createPrivateKey, createPublicKey, sign } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { canonicalizeValue } from '@gtcx/audit-signer';

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG = join(HERE, '..');
const CATALOG = join(PKG, 'jurisdictions.json');
const SIG = join(PKG, 'jurisdictions.json.sig');

function main() {
  const keyB64 = process.env.COMPLIANCE_DATA_SIGNING_KEY_B64;
  if (!keyB64) {
    console.error(
      '[sign-catalog] COMPLIANCE_DATA_SIGNING_KEY_B64 is required.\n' +
        '  Generate a fresh keypair:\n' +
        '    node -e "const {generateKeyPairSync}=require(\'node:crypto\'); ' +
        'const {privateKey,publicKey}=generateKeyPairSync(\'ed25519\'); ' +
        'console.log(\'private (set as env):\', privateKey.export({type:\'pkcs8\',format:\'der\'}).toString(\'base64\')); ' +
        'console.log(\'public (publish):  \', publicKey.export({type:\'spki\',format:\'der\'}).toString(\'base64\'));"\n'
    );
    process.exit(1);
  }

  const catalogRaw = readFileSync(CATALOG, 'utf8');
  const catalog = JSON.parse(catalogRaw);
  const pkg = JSON.parse(readFileSync(join(PKG, 'package.json'), 'utf8'));
  const canonical = canonicalizeValue(catalog);
  const catalogHash = createHash('sha256').update(canonical, 'utf8').digest('base64');

  const privateKey = createPrivateKey({
    key: Buffer.from(keyB64, 'base64'),
    format: 'der',
    type: 'pkcs8',
  });
  const publicKey = createPublicKey(privateKey);
  const publicKeyB64 = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');

  const signature = sign(null, Buffer.from(canonical, 'utf8'), privateKey).toString('base64');

  const sig = {
    algorithm: 'ed25519+sha256+jcs',
    version: pkg.version,
    catalogHash,
    signedAt: new Date().toISOString(),
    publicKey: publicKeyB64,
    signature,
  };

  writeFileSync(SIG, `${JSON.stringify(sig, null, 2)}\n`);
  console.log(
    `[sign-catalog] signed v${pkg.version}; sidecar written to ${SIG.replace(`${PKG}/`, '')}`
  );
}

main();
