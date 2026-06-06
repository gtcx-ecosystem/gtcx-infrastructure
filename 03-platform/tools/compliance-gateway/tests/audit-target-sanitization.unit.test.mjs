/**
 * @fileoverview Unit tests for sanitizeAuditTarget.
 *
 * sanitizeAuditTarget runs inside requirePermission on every signed
 * audit event (auth:success + auth:failure). Without it, an
 * unauthenticated attacker can poison the tamper-evident chain with
 * attacker-controlled query strings or oversized URL fragments.
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import { sanitizeAuditTarget } from '../src/audit-target.mjs';

describe('sanitizeAuditTarget', () => {
  it('returns empty string for non-string input', () => {
    assert.strictEqual(sanitizeAuditTarget(undefined), '');
    assert.strictEqual(sanitizeAuditTarget(null), '');
    assert.strictEqual(sanitizeAuditTarget(42), '');
    assert.strictEqual(sanitizeAuditTarget({}), '');
  });

  it('passes through a clean path unchanged', () => {
    assert.strictEqual(sanitizeAuditTarget('/v1/tools'), '/v1/tools');
    assert.strictEqual(sanitizeAuditTarget('/health'), '/health');
  });

  it('strips the query string', () => {
    assert.strictEqual(
      sanitizeAuditTarget('/v1/tools?inject=<script>alert(1)</script>'),
      '/v1/tools',
    );
    assert.strictEqual(
      sanitizeAuditTarget('/v1/query?token=secret&foo=bar'),
      '/v1/query',
    );
  });

  it('strips URL fragments', () => {
    assert.strictEqual(
      sanitizeAuditTarget('/v1/tools#fragment-attack'),
      '/v1/tools',
    );
  });

  it('strips query string AND fragment together', () => {
    assert.strictEqual(
      sanitizeAuditTarget('/v1/tools?foo=bar#frag'),
      '/v1/tools',
    );
  });

  it('caps length at 200 chars', () => {
    const long = '/v1/' + 'a'.repeat(500);
    const result = sanitizeAuditTarget(long);
    assert.strictEqual(result.length, 200);
    assert.ok(result.startsWith('/v1/a'));
  });

  it('caps after stripping query string', () => {
    // Long path + long query: only the path counts toward the 200 cap.
    const longQuery = '/v1/x?' + 'q='.repeat(500);
    const result = sanitizeAuditTarget(longQuery);
    assert.strictEqual(result, '/v1/x');
  });
});
