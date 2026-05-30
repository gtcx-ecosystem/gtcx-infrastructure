/**
 * @fileoverview Tests for the regulator-readable HTML renderer.
 *
 * The renderer is a pure function — given a bundle shape, return a
 * self-contained HTML document. Tests assert the structural
 * invariants regulators rely on: the chain head appears, the NDJSON
 * is embedded verbatim, every record gets a row, and HTML escaping
 * defends against payload-driven XSS in viewer-tab contexts.
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  buildEvidenceBundle,
  buildMultiTenantEvidenceBundle,
  initAuditSigner,
  resetAuditSigner,
  signAuditEvent,
} from '../src/audit.mjs';
import { renderEvidenceHtml } from '../src/evidence-renderer.mjs';

function silence(fn) {
  const out = console.log;
  const err = console.error;
  console.log = () => {};
  console.error = () => {};
  try { return fn(); } finally { console.log = out; console.error = err; }
}

describe('renderEvidenceHtml — single-tenant bundle', () => {
  it('produces a complete <html> document with the chain head visible', () => {
    resetAuditSigner();
    initAuditSigner({ NODE_ENV: 'test' }, true);
    silence(() => {
      signAuditEvent({ actor: 'a', action: 'auth:success', target: '/v1/query', tenantId: 'zw' });
      signAuditEvent({ actor: 'a', action: 'query:success', target: 'q1', tenantId: 'zw' });
    });
    const bundle = buildEvidenceBundle({ tenantId: 'zw' });
    const html = renderEvidenceHtml(bundle);

    assert.match(html, /<!doctype html>/i);
    assert.match(html, /<\/html>/);
    assert.match(html, /Tenant scope[\s\S]*zw/);
    assert.match(html, /Total records<\/dt><dd>2/);
    // chainHead is base64 — contains +, /, = which break RegExp; use includes.
    assert.ok(html.includes(bundle.chainHead), `chain head ${bundle.chainHead} missing from HTML`);
    // Embedded NDJSON for offline verification
    assert.match(html, /class="ndjson"/);
    // Per-record rows
    assert.match(html, /auth:success/);
    assert.match(html, /query:success/);

    resetAuditSigner();
  });

  it('escapes HTML-special chars in record fields', () => {
    resetAuditSigner();
    initAuditSigner({ NODE_ENV: 'test' }, true);
    silence(() => {
      signAuditEvent({
        actor: '<script>alert(1)</script>',
        action: 'query:success',
        target: 'normal',
        tenantId: 'zw',
      });
    });
    const bundle = buildEvidenceBundle({ tenantId: 'zw' });
    const html = renderEvidenceHtml(bundle);

    // The dangerous payload must appear escaped, never as live tags.
    assert.ok(!/<script>alert\(1\)<\/script>/.test(html), 'unescaped script tag must NOT appear');
    assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);

    resetAuditSigner();
  });
});

describe('renderEvidenceHtml — multi-tenant bundle (v2)', () => {
  it('renders one section per tenant', () => {
    resetAuditSigner();
    initAuditSigner({ NODE_ENV: 'test' }, true);
    silence(() => {
      signAuditEvent({ actor: 'a', action: 'auth:success', target: 't', tenantId: 'zw' });
      signAuditEvent({ actor: 'b', action: 'query:failure', target: 't', tenantId: 'ke' });
    });
    const bundle = buildMultiTenantEvidenceBundle({ tenantIds: ['zw', 'ke'] });
    const html = renderEvidenceHtml(bundle);

    assert.match(html, /2 tenants: zw, ke/);
    assert.match(html, /id="tenant-0"/);
    assert.match(html, /id="tenant-1"/);
    // Both tenants' events appear
    assert.match(html, /auth:success/);
    assert.match(html, /query:failure/);

    resetAuditSigner();
  });

  it('throws when tenantIds is missing or empty', () => {
    assert.throws(() => buildMultiTenantEvidenceBundle({}), /tenantIds\[\] is required/);
    assert.throws(() => buildMultiTenantEvidenceBundle({ tenantIds: [] }), /tenantIds\[\] is required/);
  });

  it('rejects non-string tenantIds', () => {
    assert.throws(
      () => buildMultiTenantEvidenceBundle({ tenantIds: ['zw', null] }),
      /every tenantId must be a non-empty string/,
    );
  });
});

describe('renderEvidenceHtml — defensive defaults', () => {
  it('handles an empty bundle gracefully', () => {
    const html = renderEvidenceHtml({});
    assert.match(html, /<!doctype html>/i);
    assert.match(html, /— no records —/);
  });

  it('handles a missing NDJSON section', () => {
    const html = renderEvidenceHtml({
      bundleVersion: '1',
      tenantId: 'zw',
      recordCount: 0,
      chainHead: '',
    });
    assert.match(html, /Tenant scope[\s\S]*zw/);
  });
});
