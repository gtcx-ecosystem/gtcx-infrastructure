/**
 * @fileoverview Asserts the published catalog matches its signature
 * AND that the verifier rejects any swap of the trust anchor.
 *
 * Runs as part of `pnpm test`. If a contributor edits
 * jurisdictions.json without re-signing, this test goes red — the
 * sidecar can never silently drift out of sync with the catalog.
 *
 * The verifier itself is a separate executable (scripts/verify-catalog.mjs)
 * so downstream consumers can run it independently of node:test.
 */

import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  PINNED_PUBLIC_KEY,
  verifyCatalog,
} from '../scripts/verify-catalog.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const VERIFIER = join(HERE, '..', 'scripts', 'verify-catalog.mjs');
const CATALOG_PATH = join(HERE, '..', 'jurisdictions.json');
const SIG_PATH = join(HERE, '..', 'jurisdictions.json.sig');

const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
const sig = JSON.parse(readFileSync(SIG_PATH, 'utf8'));

describe('compliance-data — signature CLI', () => {
  it('verify-catalog.mjs returns exit 0 against the committed sidecar', () => {
    const result = spawnSync('node', [VERIFIER], { encoding: 'utf8' });
    assert.strictEqual(
      result.status,
      0,
      `verify-catalog must exit 0; got ${result.status}\nstderr:\n${result.stderr}`
    );
    assert.match(result.stdout, /\[verify-catalog\] OK/);
  });

  it('CLI exits 1 with TRUST_ANCHOR_MISMATCH when EXPECTED_PUBLIC_KEY differs', () => {
    const result = spawnSync('node', [VERIFIER], {
      encoding: 'utf8',
      env: { ...process.env, EXPECTED_PUBLIC_KEY: 'WRONG' },
    });
    assert.strictEqual(result.status, 1);
    assert.match(result.stderr, /TRUST_ANCHOR_MISMATCH/);
  });

  it('CLI fails closed when EXPECTED_PUBLIC_KEY is set but empty', () => {
    const result = spawnSync('node', [VERIFIER], {
      encoding: 'utf8',
      env: { ...process.env, EXPECTED_PUBLIC_KEY: '' },
    });
    assert.strictEqual(result.status, 1);
    assert.match(result.stderr, /TRUST_ANCHOR_MISSING/);
  });
});

describe('compliance-data — verifyCatalog (pure)', () => {
  it('OK against the committed catalog + sig with the pinned key', () => {
    const r = verifyCatalog({ catalog, sig, expectedPublicKey: PINNED_PUBLIC_KEY });
    assert.equal(r.ok, true);
  });

  it('TRUST_ANCHOR_MISMATCH when sig.publicKey is swapped (the audit-flagged attack)', () => {
    const swapped = { ...sig, publicKey: 'DIFFERENT_KEY_BASE64' };
    const r = verifyCatalog({ catalog, sig: swapped, expectedPublicKey: PINNED_PUBLIC_KEY });
    assert.equal(r.ok, false);
    assert.equal(r.code, 'TRUST_ANCHOR_MISMATCH');
  });

  it('TRUST_ANCHOR_MISSING when expectedPublicKey is empty', () => {
    const r = verifyCatalog({ catalog, sig, expectedPublicKey: '' });
    assert.equal(r.ok, false);
    assert.equal(r.code, 'TRUST_ANCHOR_MISSING');
  });

  it('CATALOG_HASH_MISMATCH when catalog is mutated after signing', () => {
    const tampered = { ...catalog, _injected: 'evil' };
    const r = verifyCatalog({
      catalog: tampered,
      sig,
      expectedPublicKey: PINNED_PUBLIC_KEY,
    });
    assert.equal(r.ok, false);
    assert.equal(r.code, 'CATALOG_HASH_MISMATCH');
  });

  it('ALGORITHM_UNEXPECTED when sig.algorithm is unknown', () => {
    const wrongAlgo = { ...sig, algorithm: 'rsa+sha1' };
    const r = verifyCatalog({ catalog, sig: wrongAlgo, expectedPublicKey: PINNED_PUBLIC_KEY });
    assert.equal(r.ok, false);
    assert.equal(r.code, 'ALGORITHM_UNEXPECTED');
  });
});
