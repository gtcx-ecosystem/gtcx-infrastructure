/**
 * @fileoverview Smoke tests for the jurisdiction data package.
 *
 * The package is a static JSON catalog consumed by the gateway, the
 * compliance-db Terraform module, and downstream platform services.
 * If any of these invariants break, downstream callers will silently
 * apply the wrong retention/regulator/data-protection law.
 */

import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(__dirname, '../jurisdictions.json'), 'utf-8'));

const REQUIRED_FIELDS = [
  'regulator',
  'regulator_full',
  'data_protection_law',
  'kyc_retention_days',
  'audit_retention_days',
];

describe('jurisdictions.json', () => {
  it('has the top-level jurisdictions map', () => {
    assert.ok(data.jurisdictions, 'expected top-level jurisdictions key');
    assert.ok(typeof data.jurisdictions === 'object');
  });

  it('contains at least 10 jurisdictions', () => {
    const count = Object.keys(data.jurisdictions).length;
    assert.ok(count >= 10, `expected ≥10 jurisdictions, got ${count}`);
  });

  it('every jurisdiction has all required fields', () => {
    const missing = [];
    for (const [code, j] of Object.entries(data.jurisdictions)) {
      for (const f of REQUIRED_FIELDS) {
        if (j[f] === undefined || j[f] === null || j[f] === '') {
          missing.push(`${code}.${f}`);
        }
      }
    }
    assert.strictEqual(missing.length, 0, `missing fields: ${missing.join(', ')}`);
  });

  it('every retention value is a positive integer', () => {
    const violations = [];
    for (const [code, j] of Object.entries(data.jurisdictions)) {
      for (const f of ['kyc_retention_days', 'audit_retention_days']) {
        if (!Number.isInteger(j[f]) || j[f] <= 0) {
          violations.push(`${code}.${f} = ${j[f]}`);
        }
      }
    }
    assert.strictEqual(violations.length, 0, `bad retention values: ${violations.join(', ')}`);
  });

  it('every jurisdiction code is lowercase with hyphens or underscores', () => {
    // Underscores are permitted to preserve the terraform-aws-compliance-db
    // module's public schema (south_africa, etc.) without a breaking change.
    const bad = Object.keys(data.jurisdictions).filter((c) => !/^[a-z][a-z0-9_-]*$/.test(c));
    assert.deepStrictEqual(bad, [], `non-conforming codes: ${bad.join(', ')}`);
  });

  it('audit retention is at least as long as KYC retention (FATF safety floor)', () => {
    const violations = [];
    for (const [code, j] of Object.entries(data.jurisdictions)) {
      if (j.audit_retention_days < j.kyc_retention_days) {
        violations.push(`${code}: audit=${j.audit_retention_days} < kyc=${j.kyc_retention_days}`);
      }
    }
    assert.strictEqual(violations.length, 0, `audit < kyc retention in: ${violations.join('; ')}`);
  });
});
