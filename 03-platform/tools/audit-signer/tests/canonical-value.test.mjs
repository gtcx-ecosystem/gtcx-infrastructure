import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import { canonicalizeValue } from '../src/canonical.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

describe('canonicalizeValue', () => {
  it('matches the pinned jurisdictions catalog hash', () => {
    const catalog = JSON.parse(
      readFileSync(join(ROOT, 'compliance-data', 'jurisdictions.json'), 'utf8')
    );
    const sig = JSON.parse(
      readFileSync(join(ROOT, 'compliance-data', 'jurisdictions.json.sig'), 'utf8')
    );
    const canonical = canonicalizeValue(catalog);
    const computed = createHash('sha256').update(canonical, 'utf8').digest('base64');
    assert.equal(computed, sig.catalogHash);
  });
});
