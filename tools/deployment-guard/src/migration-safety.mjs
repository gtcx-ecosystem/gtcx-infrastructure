/**
 * Migration safety logic.
 *
 * Encapsulates checksum computation, idempotency checks, and dry-run planning
 * for database migrations.  Previously embedded in infra/scripts/migrate.sh.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

/**
 * Compute a SHA-256 checksum for a migration file.
 *
 * @param {string} filePath
 * @returns {string}
 */
export function computeChecksum(filePath) {
  const data = readFileSync(filePath, 'utf8');
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Compute a SHA-256 checksum from raw content.
 *
 * @param {string} content
 * @returns {string}
 */
export function computeChecksumFromContent(content) {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * @typedef {Object} MigrationRecord
 * @property {string} filename
 * @property {string} checksum
 * @property {string} appliedAt
 * @property {string} environment
 */

/**
 * Determine whether a migration has already been applied.
 *
 * @param {string} filename
 * @param {Map<string, MigrationRecord>} appliedSet
 * @returns {boolean}
 */
export function isAlreadyApplied(filename, appliedSet) {
  return appliedSet.has(filename);
}

/**
 * Validate a migration file name follows the expected convention.
 *
 * @param {string} filename
 * @returns {{ valid: boolean; reason?: string }}
 */
export function validateMigrationFileName(filename) {
  if (!filename.endsWith('.sql')) {
    return { valid: false, reason: 'Migration file must have .sql extension' };
  }

  // Expect leading numeric prefix for ordering: 001-, 002-, etc.
  if (!/^\d{2,}[-_]/u.test(filename)) {
    return { valid: false, reason: 'Migration file must start with an ordered numeric prefix (e.g., 001-)' };
  }

  return { valid: true };
}

/**
 * @typedef {Object} MigrationPlanEntry
 * @property {string} filename
 * @property {string} checksum
 * @property {'apply'|'skip'} action
 * @property {string} [reason]
 */

/**
 * @typedef {Object} MigrationPlan
 * @property {MigrationPlanEntry[]} entries
 * @property {number} pendingCount
 * @property {number} skippedCount
 */

/**
 * Plan which migrations need to be applied.
 *
 * @param {string[]} files Sorted list of absolute file paths.
 * @param {Map<string, MigrationRecord>} appliedSet
 * @param {boolean} dryRun
 * @returns {MigrationPlan}
 */
export function planMigrations(files, appliedSet, dryRun) {
  /** @type {MigrationPlanEntry[]} */
  const entries = [];
  let pendingCount = 0;
  let skippedCount = 0;

  for (const filePath of files) {
    const filename = filePath.split('/').pop() ?? filePath;
    const checksum = computeChecksum(filePath);

    const nameValidation = validateMigrationFileName(filename);
    if (!nameValidation.valid) {
      throw new Error(`Invalid migration file name '${filename}': ${nameValidation.reason}`);
    }

    if (isAlreadyApplied(filename, appliedSet)) {
      const record = appliedSet.get(filename);
      if (record && record.checksum !== checksum) {
        throw new Error(
          `Checksum mismatch for already-applied migration '${filename}'. ` +
            `Expected ${record.checksum}, got ${checksum}. ` +
            `Do not modify applied migrations.`
        );
      }
      entries.push({ filename, checksum, action: 'skip', reason: 'already applied' });
      skippedCount += 1;
      continue;
    }

    entries.push({
      filename,
      checksum,
      action: dryRun ? 'skip' : 'apply',
      reason: dryRun ? 'dry-run' : 'pending',
    });
    pendingCount += 1;
  }

  return { entries, pendingCount, skippedCount };
}

/**
 * Build a migration tracking table SQL string.
 *
 * @returns {string}
 */
export function buildMigrationTableSQL() {
  return `CREATE TABLE IF NOT EXISTS schema_migrations (
  id          SERIAL PRIMARY KEY,
  filename    VARCHAR(256) NOT NULL UNIQUE,
  checksum    VARCHAR(64)  NOT NULL,
  applied_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  environment VARCHAR(32)  NOT NULL
);`;
}

/**
 * Build the INSERT statement for recording an applied migration.
 *
 * @param {string} filename
 * @param {string} checksum
 * @param {string} environment
 * @returns {string}
 */
export function buildMigrationInsertSQL(_filename, _checksum, _environment) {
  // Caller is responsible for parameterized query execution;
  // this returns a template for use with psql variables.
  return `INSERT INTO schema_migrations (filename, checksum, environment)
VALUES (:'filename', :'checksum', :'environment')
ON CONFLICT (filename) DO NOTHING;`;
}
