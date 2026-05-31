import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { USES_RX } from './pin-actions-sha.mjs';

describe('pin-actions-sha USES_RX', () => {
  it('matches block form: `uses: owner/repo@v1`', () => {
    const m = '      uses: actions/checkout@v4'.match(USES_RX);
    assert.ok(m);
    assert.equal(m[2], 'actions/checkout');
    assert.equal(m[3], 'v4');
  });

  it('matches list-item form: `- uses: owner/repo@v1`', () => {
    const m = '      - uses: actions/checkout@v4'.match(USES_RX);
    assert.ok(m);
    assert.equal(m[2], 'actions/checkout');
    assert.equal(m[3], 'v4');
  });

  it('matches space-before-colon form: `uses : owner/repo@v1`', () => {
    const m = '      uses : actions/checkout@v4'.match(USES_RX);
    assert.ok(m, 'must not silently skip `uses :` form');
    assert.equal(m[2], 'actions/checkout');
    assert.equal(m[3], 'v4');
  });

  it('matches no-space-after-colon form: `uses:owner/repo@v1`', () => {
    const m = '      uses:actions/checkout@v4'.match(USES_RX);
    assert.ok(m, 'must not silently skip `uses:` (no space) form');
    assert.equal(m[2], 'actions/checkout');
    assert.equal(m[3], 'v4');
  });

  it('matches reusable workflow subpath: `uses: owner/repo/path/to/wf.yml@v1`', () => {
    const m = '      uses: actions/checkout/.github/workflows/foo.yml@v4'.match(USES_RX);
    assert.ok(m);
    assert.equal(m[2], 'actions/checkout/.github/workflows/foo.yml');
    assert.equal(m[3], 'v4');
  });

  it('matches SHA-pinned form (caller decides to skip via SHA_RX)', () => {
    const m =
      '      uses: actions/checkout@aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa # v4'.match(
        USES_RX,
      );
    assert.ok(m);
    assert.equal(m[3], 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  it('does NOT match unrelated yaml lines that happen to contain "uses"', () => {
    assert.equal('      # uses: see below'.match(USES_RX), null);
    assert.equal('      name: it uses owner/repo'.match(USES_RX), null);
  });
});
