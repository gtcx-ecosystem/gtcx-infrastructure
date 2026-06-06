import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { canonicalizeValue } from '../audit-signer/src/index.mjs';
import { verifyCatalog, PINNED_PUBLIC_KEY } from '../compliance-data/03-platform/scripts/verify-catalog.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('audit-signer + compliance-data contract', () => {
  it('verify-catalog accepts the published catalog via shared canonicalizeValue', () => {
    const catalog = JSON.parse(
      readFileSync(join(ROOT, 'compliance-data', 'jurisdictions.json'), 'utf8')
    );
    const sig = JSON.parse(
      readFileSync(join(ROOT, 'compliance-data', 'jurisdictions.json.sig'), 'utf8')
    );
    const result = verifyCatalog({ catalog, sig, expectedPublicKey: PINNED_PUBLIC_KEY });
    assert.equal(result.ok, true);
    assert.equal(typeof canonicalizeValue(catalog), 'string');
  });
});
