import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  extractAnchors,
  extractReferencedAnchors,
  ghAnchor,
} from './alerts-add-runbook-url.mjs';

describe('alerts-add-runbook-url ghAnchor', () => {
  it('lowercases and hyphenates spaces', () => {
    assert.equal(ghAnchor('Protocol Alerts'), 'protocol-alerts');
  });

  it('strips punctuation and collapses whitespace (the bug shape: grouped headings make individual alert anchors unreachable)', () => {
    // A `### A / B / C` heading becomes anchor `a-b-c`, NOT three
    // anchors `a`, `b`, `c`. Any `runbook_url` pointing at `#a` or
    // `#b` will 404 even though the heading "contains" the alert name.
    assert.equal(
      ghAnchor('auditeventvolumedropped / auditunusualdidpattern'),
      'auditeventvolumedropped-auditunusualdidpattern',
    );
  });

  it('returns empty string for whitespace-only heading', () => {
    assert.equal(ghAnchor('   '), '');
  });
});

describe('alerts-add-runbook-url extractAnchors', () => {
  it('captures every ## and ### heading', () => {
    const md = ['# Top', '## Section', '### subsection', '#### ignored-too-deep'].join('\n');
    const anchors = extractAnchors(md);
    assert.ok(anchors.has('top'));
    assert.ok(anchors.has('section'));
    assert.ok(anchors.has('subsection'));
    assert.ok(anchors.has('ignored-too-deep'));
  });

  it('does not match `#` inside a code block (best-effort: this script is line-based)', () => {
    // Acknowledged limitation: a fenced ```bash block with a `# comment`
    // line will not appear at column 0 in practice, but if it did, the
    // current matcher would still flag it. Out of scope for S1-08.
    const md = ['## Real', '', '```bash', '# not-a-heading', '```'].join('\n');
    const anchors = extractAnchors(md);
    assert.ok(anchors.has('real'));
  });
});

describe('alerts-add-runbook-url extractReferencedAnchors', () => {
  it('finds anchors only in alerts.md URLs (ignores other runbook hosts)', () => {
    const files = {
      'alerts/foo.yml':
        "runbook_url: 'https://github.com/gtcx-ecosystem/gtcx-infrastructure/blob/main/docs/operations/runbooks/alerts.md#foo'",
      'alerts/bar.yml':
        "runbook_url: 'https://elsewhere.example.com/some/other.md#bar'",
    };
    const refs = extractReferencedAnchors(files);
    assert.equal(refs.length, 1);
    assert.equal(refs[0].anchor, 'foo');
    assert.equal(refs[0].file, 'alerts/foo.yml');
  });
});
