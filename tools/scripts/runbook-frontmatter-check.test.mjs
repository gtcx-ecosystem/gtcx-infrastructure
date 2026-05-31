import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  detectDuplicate,
  mergeBlocks,
  parseBlock,
  tierRank,
  wouldDowngradeTierIfSecondWins,
} from './runbook-frontmatter-check.mjs';

describe('runbook-frontmatter-check detectDuplicate', () => {
  it('flags two `---` blocks separated by blank lines (the gitbook corruption shape)', () => {
    const text = [
      '---',
      "title: 'Quickstart'",
      "tier: 'standard'",
      '---',
      '',
      '---',
      "title: 'Quickstart'",
      "tier: 'informational'",
      '---',
      '',
      '# Quickstart',
    ].join('\n');
    const result = detectDuplicate(text);
    assert.equal(result.hasDuplicate, true);
    assert.ok(result.firstBlock.includes('standard'));
    assert.ok(result.secondBlock.includes('informational'));
  });

  it('single frontmatter block is not flagged', () => {
    const text = ['---', "title: 'X'", '---', '', '# X'].join('\n');
    const result = detectDuplicate(text);
    assert.equal(result.hasDuplicate, false);
  });

  it('no frontmatter at all is not flagged', () => {
    assert.equal(detectDuplicate('# Plain markdown\n').hasDuplicate, false);
  });

  it('does not match a second `---` inside the body (horizontal rule)', () => {
    // A genuine horizontal rule isn't an opening of a new YAML block —
    // it lacks the closing `---`.
    const text = ['---', "title: 'X'", '---', '', '# X', '', '---', '', 'body'].join('\n');
    const result = detectDuplicate(text);
    assert.equal(result.hasDuplicate, false);
  });
});

describe('runbook-frontmatter-check parseBlock', () => {
  it('parses top-level scalars', () => {
    const block = ["title: 'X'", "status: 'current'", 'tier: critical'].join('\n');
    const m = parseBlock(block);
    assert.equal(m.get('title'), "'X'");
    assert.equal(m.get('status'), "'current'");
    assert.equal(m.get('tier'), 'critical');
  });

  it('skips comments and blank lines', () => {
    const block = ['# leading comment', '', 'title: X', '# trailing'].join('\n');
    const m = parseBlock(block);
    assert.equal(m.size, 1);
    assert.equal(m.get('title'), 'X');
  });
});

describe('runbook-frontmatter-check tier guard', () => {
  it('ranks critical above informational', () => {
    assert.ok(tierRank('critical') > tierRank('informational'));
    assert.ok(tierRank("'critical'") > tierRank('informational'));
  });

  it('detects legacy merge that would downgrade tier', () => {
    const first = parseBlock(["title: 'Rollback'", "tier: 'critical'"].join('\n'));
    const second = parseBlock(["title: 'Rollback'", "tier: 'informational'"].join('\n'));
    assert.equal(wouldDowngradeTierIfSecondWins(first, second), true);
  });

  it('mergeBlocks keeps the higher tier when blocks disagree', () => {
    const first = parseBlock(["title: 'Rollback'", "tier: 'critical'"].join('\n'));
    const second = parseBlock(["title: 'Rollback'", "tier: 'informational'"].join('\n'));
    const lines = mergeBlocks(first, second);
    const merged = parseBlock(lines.join('\n'));
    assert.equal(normalizeTierFromMap(merged), 'critical');
  });

  it('mergeBlocks does not downgrade when prepended block is informational', () => {
    const prepended = parseBlock(["title: 'DR'", "tier: 'informational'"].join('\n'));
    const original = parseBlock(["title: 'DR'", "tier: 'critical'"].join('\n'));
    const lines = mergeBlocks(prepended, original);
    const merged = parseBlock(lines.join('\n'));
    assert.equal(normalizeTierFromMap(merged), 'critical');
  });
});

function normalizeTierFromMap(map) {
  const raw = map.get('tier') ?? '';
  return raw.replace(/^['"]/, '').replace(/['"]$/, '').trim().toLowerCase();
}
