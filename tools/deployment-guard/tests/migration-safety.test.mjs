import assert from 'node:assert/strict';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  computeChecksum,
  computeChecksumFromContent,
  isAlreadyApplied,
  validateMigrationFileName,
  planMigrations,
  buildMigrationTableSQL,
  buildMigrationInsertSQL,
} from '../src/migration-safety.mjs';

describe('computeChecksum', () => {
  it('computes stable sha256 for a file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'gtcx-mig-'));
    const file = join(dir, '001-test.sql');
    writeFileSync(file, 'SELECT 1;');

    const hash1 = computeChecksum(file);
    const hash2 = computeChecksum(file);
    assert.equal(hash1, hash2);
    assert.equal(hash1.length, 64);

    rmSync(dir, { recursive: true });
  });

  it('differs for different content', () => {
    const a = computeChecksumFromContent('A');
    const b = computeChecksumFromContent('B');
    assert.notEqual(a, b);
  });
});

describe('isAlreadyApplied', () => {
  it('returns true for applied files', () => {
    const set = new Map([['001.sql', { filename: '001.sql', checksum: 'abc', appliedAt: 'now', environment: 'dev' }]]);
    assert.equal(isAlreadyApplied('001.sql', set), true);
  });

  it('returns false for unapplied files', () => {
    const set = new Map();
    assert.equal(isAlreadyApplied('001.sql', set), false);
  });
});

describe('validateMigrationFileName', () => {
  it('accepts ordered sql files', () => {
    assert.deepEqual(validateMigrationFileName('001-create-users.sql'), { valid: true });
    assert.deepEqual(validateMigrationFileName('10_seed.sql'), { valid: true });
  });

  it('rejects non-sql files', () => {
    const result = validateMigrationFileName('001-create-users.txt');
    assert.equal(result.valid, false);
    assert.ok(result.reason?.includes('.sql'));
  });

  it('rejects unordered names', () => {
    const result = validateMigrationFileName('create-users.sql');
    assert.equal(result.valid, false);
    assert.ok(result.reason?.includes('numeric prefix'));
  });
});

describe('planMigrations', () => {
  it('plans all as apply when none are applied', () => {
    const dir = mkdtempSync(join(tmpdir(), 'gtcx-mig-'));
    const f1 = join(dir, '001-a.sql');
    const f2 = join(dir, '002-b.sql');
    writeFileSync(f1, 'SELECT 1;');
    writeFileSync(f2, 'SELECT 2;');

    const plan = planMigrations([f1, f2], new Map(), false);
    assert.equal(plan.pendingCount, 2);
    assert.equal(plan.skippedCount, 0);
    assert.equal(plan.entries[0].action, 'apply');
    assert.equal(plan.entries[1].action, 'apply');

    rmSync(dir, { recursive: true });
  });

  it('skips already-applied files', () => {
    const dir = mkdtempSync(join(tmpdir(), 'gtcx-mig-'));
    const f1 = join(dir, '001-a.sql');
    writeFileSync(f1, 'SELECT 1;');
    const checksum = computeChecksum(f1);

    const applied = new Map([
      ['001-a.sql', { filename: '001-a.sql', checksum, appliedAt: 'now', environment: 'dev' }],
    ]);

    const plan = planMigrations([f1], applied, false);
    assert.equal(plan.pendingCount, 0);
    assert.equal(plan.skippedCount, 1);
    assert.equal(plan.entries[0].action, 'skip');

    rmSync(dir, { recursive: true });
  });

  it('throws on checksum mismatch for applied migration', () => {
    const dir = mkdtempSync(join(tmpdir(), 'gtcx-mig-'));
    const f1 = join(dir, '001-a.sql');
    writeFileSync(f1, 'SELECT 1;');

    const applied = new Map([
      ['001-a.sql', { filename: '001-a.sql', checksum: 'deadbeef', appliedAt: 'now', environment: 'dev' }],
    ]);

    assert.throws(() => planMigrations([f1], applied, false), /Checksum mismatch/);

    rmSync(dir, { recursive: true });
  });

  it('marks pending as skip in dry-run mode', () => {
    const dir = mkdtempSync(join(tmpdir(), 'gtcx-mig-'));
    const f1 = join(dir, '001-a.sql');
    writeFileSync(f1, 'SELECT 1;');

    const plan = planMigrations([f1], new Map(), true);
    assert.equal(plan.pendingCount, 1);
    assert.equal(plan.entries[0].action, 'skip');
    assert.equal(plan.entries[0].reason, 'dry-run');

    rmSync(dir, { recursive: true });
  });

  it('throws on invalid file names', () => {
    const dir = mkdtempSync(join(tmpdir(), 'gtcx-mig-'));
    const f1 = join(dir, 'bad.sql');
    writeFileSync(f1, 'SELECT 1;');

    assert.throws(() => planMigrations([f1], new Map(), false), /Invalid migration file name/);

    rmSync(dir, { recursive: true });
  });
});

describe('buildMigrationTableSQL', () => {
  it('returns a CREATE TABLE statement', () => {
    const sql = buildMigrationTableSQL();
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS schema_migrations'));
    assert.ok(sql.includes('filename'));
    assert.ok(sql.includes('checksum'));
  });
});

describe('buildMigrationInsertSQL', () => {
  it('returns an INSERT with psql variable placeholders', () => {
    const sql = buildMigrationInsertSQL('001.sql', 'abc', 'development');
    assert.ok(sql.includes('INSERT INTO schema_migrations'));
    assert.ok(sql.includes(":'filename'"));
    assert.ok(sql.includes(":'checksum'"));
    assert.ok(sql.includes(":'environment'"));
  });
});
