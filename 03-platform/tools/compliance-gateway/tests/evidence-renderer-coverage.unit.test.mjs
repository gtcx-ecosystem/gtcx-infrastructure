/**
 * @fileoverview Coverage-focused tests for evidence-renderer branches
 * not exercised by the main test file.
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import { renderEvidenceHtml } from '../03-platform/src/evidence-renderer.mjs';

describe('renderEvidenceHtml — ndjson edge cases', () => {
  it('skips blank lines and trailing newlines in ndjson', () => {
    const html = renderEvidenceHtml({
      bundleVersion: '1',
      tenantId: 'zw',
      recordCount: 1,
      chainHead: 'head',
      ndjson: JSON.stringify({ id: 'r1', timestamp: '2026-01-01T00:00:00Z', action: 'a', actor: 'b', target: 'c', reason: 'd', signature: 's' }) + '\n\n\n',
    });
    assert.match(html, /a<\/td>/);
  });

  it('handles missing record fields with defaults', () => {
    const html = renderEvidenceHtml({
      bundleVersion: '1',
      tenantId: 'zw',
      recordCount: 1,
      chainHead: 'head',
      ndjson: JSON.stringify({ id: 'r1', timestamp: '2026-01-01T00:00:00Z' }),
    });
    assert.match(html, /r1/);
    // Default empty values should render without throwing
    assert.doesNotThrow(() => renderEvidenceHtml({
      bundleVersion: '1',
      tenantId: 'zw',
      recordCount: 1,
      chainHead: 'head',
      ndjson: JSON.stringify({}),
    }));
  });

  it('shows "no records" when all ndjson lines are empty or invalid', () => {
    const html = renderEvidenceHtml({
      bundleVersion: '1',
      tenantId: 'zw',
      recordCount: 0,
      chainHead: '',
      ndjson: '',
    });
    assert.match(html, /— no records —/);
  });

  it('handles missing recordCount in multi-tenant sections', () => {
    const html = renderEvidenceHtml({
      bundleVersion: '2-multi-tenant',
      tenantCount: 2,
      sections: [
        { tenantId: 'zw', recordCount: 2, ndjson: '{"id":"r1"}\n' },
        { tenantId: 'ke', ndjson: '' },
      ],
    });
    assert.match(html, /2 tenants: zw, ke/);
    assert.match(html, /Tenant: <code>ke<\/code>/);
    // Should not throw and total records should account for missing recordCount
    assert.match(html, /Total records<\/dt><dd>2/);
  });
});
