import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildPrivilegeCheckSQL,
  buildNegativeDMLProbeSQL,
  parsePrivilegeResult,
  auditVerificationPolicy,
} from '../03-platform/src/audit-verifier.mjs';

describe('buildPrivilegeCheckSQL', () => {
  it('includes the role name', () => {
    const sql = buildPrivilegeCheckSQL('gtcx_audit_writer');
    assert.ok(sql.includes("rolname = 'gtcx_audit_writer'"));
    assert.ok(sql.includes("has_table_privilege('gtcx_audit_writer'"));
  });

  it('excludes system schemas by default', () => {
    const sql = buildPrivilegeCheckSQL('test_role');
    assert.ok(sql.includes("'pg_catalog'"));
    assert.ok(sql.includes("'information_schema'"));
  });

  it('allows custom schema exclusions', () => {
    const sql = buildPrivilegeCheckSQL('test_role', ['pg_catalog']);
    assert.ok(sql.includes("'pg_catalog'"));
    assert.ok(!sql.includes("'information_schema'"));
  });

  it('checks UPDATE, DELETE, and INSERT privileges', () => {
    const sql = buildPrivilegeCheckSQL('test_role');
    assert.ok(sql.includes("'UPDATE'"));
    assert.ok(sql.includes("'DELETE'"));
    assert.ok(sql.includes("'INSERT'"));
  });
});

describe('buildNegativeDMLProbeSQL', () => {
  it('generates a DO block', () => {
    const sql = buildNegativeDMLProbeSQL();
    assert.ok(sql.startsWith('DO $$'));
    assert.ok(sql.includes('insufficient_privilege'));
  });

  it('includes UPDATE and DELETE probes', () => {
    const sql = buildNegativeDMLProbeSQL();
    assert.ok(sql.includes('UPDATE'));
    assert.ok(sql.includes('DELETE'));
  });

  it('excludes system schemas by default', () => {
    const sql = buildNegativeDMLProbeSQL();
    assert.ok(sql.includes("'pg_catalog'"));
    assert.ok(sql.includes("'information_schema'"));
  });
});

describe('parsePrivilegeResult', () => {
  it('passes on exit code 0', () => {
    const result = parsePrivilegeResult({ exitCode: 0, stdout: 'ok', stderr: '' });
    assert.equal(result.passed, true);
    assert.equal(result.violations.length, 0);
  });

  it('fails on non-zero exit code', () => {
    const result = parsePrivilegeResult({ exitCode: 1, stdout: '', stderr: 'insufficient_privilege' });
    assert.equal(result.passed, false);
    assert.equal(result.violations.length, 1);
    assert.ok(result.violations[0].includes('insufficient_privilege'));
  });

  it('falls back to stdout when stderr is absent', () => {
    const result = parsePrivilegeResult({ exitCode: 1, stdout: 'ERROR: role missing', stderr: undefined });
    assert.equal(result.passed, false);
    assert.ok(result.violations[0].includes('role missing'));
  });
});

describe('auditVerificationPolicy', () => {
  it('skips in development', () => {
    const policy = auditVerificationPolicy({ environment: 'development' });
    assert.equal(policy.shouldRun, false);
    assert.equal(policy.required, false);
  });

  it('requires audit admin url in production', () => {
    const policy = auditVerificationPolicy({ environment: 'production' });
    assert.equal(policy.shouldRun, false);
    assert.equal(policy.required, true);
    assert.ok(policy.reason?.includes('AUDIT_DATABASE_URL'));
  });

  it('allows when audit admin url is present in production', () => {
    const policy = auditVerificationPolicy({ environment: 'production', auditAdminUrl: 'postgres://admin@localhost/audit' });
    assert.equal(policy.shouldRun, true);
    assert.equal(policy.required, true);
  });

  it('allows when audit admin url is present in staging', () => {
    const policy = auditVerificationPolicy({ environment: 'staging', auditAdminUrl: 'postgres://admin@localhost/audit' });
    assert.equal(policy.shouldRun, true);
    assert.equal(policy.required, true);
  });
});
