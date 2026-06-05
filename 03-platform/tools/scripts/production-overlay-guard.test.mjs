import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { TAG_LINE_RX, classifyTag } from './production-overlay-guard.mjs';

describe('production-overlay-guard TAG_LINE_RX', () => {
  it('matches `newTag: PLACEHOLDER-RUN-DEPLOY-SH` (no quotes)', () => {
    const m = '    newTag: PLACEHOLDER-RUN-DEPLOY-SH'.match(TAG_LINE_RX);
    assert.ok(m);
    assert.equal(m[1], 'PLACEHOLDER-RUN-DEPLOY-SH');
  });

  it('matches `newTag: "v1.0.0"` (double-quoted decorative tag — the bug)', () => {
    const m = '    newTag: "v1.0.0"'.match(TAG_LINE_RX);
    assert.ok(m);
    assert.equal(m[1], 'v1.0.0');
  });

  it('matches `newTag: \'1.2.3\'` (single-quoted)', () => {
    const m = "    newTag: '1.2.3'".match(TAG_LINE_RX);
    assert.ok(m);
    assert.equal(m[1], '1.2.3');
  });

  it('matches 40-char SHA tag', () => {
    const m = '    newTag: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'.match(TAG_LINE_RX);
    assert.ok(m);
    assert.equal(m[1].length, 40);
  });
});

describe('production-overlay-guard classifyTag', () => {
  it('PLACEHOLDER-RUN-DEPLOY-SH → placeholder', () => {
    assert.equal(classifyTag('PLACEHOLDER-RUN-DEPLOY-SH'), 'placeholder');
  });

  it('40-char lowercase hex → sha', () => {
    assert.equal(classifyTag('a'.repeat(40)), 'sha');
  });

  it('v1.0.0 → disallowed (the original audit-flagged decorative tag)', () => {
    assert.equal(classifyTag('v1.0.0'), 'disallowed');
  });

  it('1.2.3 → disallowed (semver-shaped)', () => {
    assert.equal(classifyTag('1.2.3'), 'disallowed');
  });

  it('latest → disallowed', () => {
    assert.equal(classifyTag('latest'), 'disallowed');
  });

  it('main → disallowed (branch ref)', () => {
    assert.equal(classifyTag('main'), 'disallowed');
  });

  it('UPPERCASE hex → disallowed (not lowercase)', () => {
    assert.equal(classifyTag('A'.repeat(40)), 'disallowed');
  });

  it('39-char hex → disallowed (not full SHA length)', () => {
    assert.equal(classifyTag('a'.repeat(39)), 'disallowed');
  });
});
