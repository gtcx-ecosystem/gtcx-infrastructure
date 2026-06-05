/**
 * Audit immutability verification logic.
 *
 * Encapsulates SQL generation and result parsing for audit-database privilege
 * checks.  Previously embedded in 04-ship/03-platform/scripts/migrate.sh setup_audit_constraints().
 */

/**
 * Build the privilege-check SQL for a given audit role.
 *
 * Verifies that the role lacks UPDATE and DELETE on all non-system tables,
 * that PUBLIC lacks UPDATE and DELETE, and that the role retains INSERT.
 *
 * @param {string} role
 * @param {string[]} [schemaExclusions]
 * @returns {string}
 */
export function buildPrivilegeCheckSQL(role, schemaExclusions = ['pg_catalog', 'information_schema']) {
  const excluded = schemaExclusions.map((s) => `'${s}'`).join(', ');

  return `DO $$
DECLARE
    tbl RECORD;
    fq_table text;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${role}') THEN
        RAISE EXCEPTION '${role} role is missing';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE schemaname NOT IN (${excluded})
    ) THEN
        RAISE EXCEPTION 'No non-system tables found in audit database';
    END IF;

    FOR tbl IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname NOT IN (${excluded})
        ORDER BY schemaname, tablename
    LOOP
        fq_table := format('%I.%I', tbl.schemaname, tbl.tablename);

        IF has_table_privilege('${role}', fq_table, 'UPDATE') THEN
            RAISE EXCEPTION '${role} unexpectedly has UPDATE on %', fq_table;
        END IF;

        IF has_table_privilege('${role}', fq_table, 'DELETE') THEN
            RAISE EXCEPTION '${role} unexpectedly has DELETE on %', fq_table;
        END IF;

        IF EXISTS (
            SELECT 1
            FROM information_schema.role_table_grants
            WHERE grantee = 'PUBLIC'
              AND table_schema = tbl.schemaname
              AND table_name = tbl.tablename
              AND privilege_type = 'UPDATE'
        ) THEN
            RAISE EXCEPTION 'PUBLIC unexpectedly has UPDATE on %', fq_table;
        END IF;

        IF EXISTS (
            SELECT 1
            FROM information_schema.role_table_grants
            WHERE grantee = 'PUBLIC'
              AND table_schema = tbl.schemaname
              AND table_name = tbl.tablename
              AND privilege_type = 'DELETE'
        ) THEN
            RAISE EXCEPTION 'PUBLIC unexpectedly has DELETE on %', fq_table;
        END IF;

        IF NOT has_table_privilege('${role}', fq_table, 'INSERT') THEN
            RAISE EXCEPTION '${role} is missing INSERT on %', fq_table;
        END IF;
    END LOOP;
END
$$;`;
}

/**
 * Build the live negative DML probe SQL.
 *
 * Attempts UPDATE and DELETE with FALSE WHERE clauses as the audit writer;
 * success indicates insufficient privilege restriction.
 *
 * @param {string[]} [schemaExclusions]
 * @returns {string}
 */
export function buildNegativeDMLProbeSQL(schemaExclusions = ['pg_catalog', 'information_schema']) {
  const excluded = schemaExclusions.map((s) => `'${s}'`).join(', ');

  return `DO $$
DECLARE
    tbl RECORD;
    first_column text;
BEGIN
    FOR tbl IN
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname NOT IN (${excluded})
        ORDER BY schemaname, tablename
    LOOP
        SELECT a.attname
          INTO first_column
         FROM pg_attribute a
         WHERE a.attrelid = format('%I.%I', tbl.schemaname, tbl.tablename)::regclass
           AND a.attnum > 0
           AND NOT a.attisdropped
           AND COALESCE(a.attidentity, '') = ''
           AND COALESCE(a.attgenerated, '') = ''
         ORDER BY a.attnum
         LIMIT 1;

        IF first_column IS NULL THEN
            CONTINUE;
        END IF;

        BEGIN
            EXECUTE format(
                'UPDATE %I.%I SET %I = %I WHERE false',
                tbl.schemaname,
                tbl.tablename,
                first_column,
                first_column
            );
            RAISE EXCEPTION 'Live UPDATE probe unexpectedly succeeded on %.%', tbl.schemaname, tbl.tablename;
        EXCEPTION
            WHEN insufficient_privilege THEN
                NULL;
        END;

        BEGIN
            EXECUTE format(
                'DELETE FROM %I.%I WHERE false',
                tbl.schemaname,
                tbl.tablename
            );
            RAISE EXCEPTION 'Live DELETE probe unexpectedly succeeded on %.%', tbl.schemaname, tbl.tablename;
        EXCEPTION
            WHEN insufficient_privilege THEN
                NULL;
        END;
    END LOOP;
END
$$;`;
}

/**
 * @typedef {Object} PrivilegeParseResult
 * @property {boolean} passed
 * @property {string[]} violations
 */

/**
 * Parse the result of a privilege check.
 *
 * @param {{ stdout?: string; stderr?: string; exitCode: number }} result
 * @returns {PrivilegeParseResult}
 */
export function parsePrivilegeResult(result) {
  /** @type {string[]} */
  const violations = [];

  if (result.exitCode !== 0) {
    const diagnostic = result.stderr ?? result.stdout ?? 'unknown error';
    violations.push(diagnostic.trim());
    return { passed: false, violations };
  }

  return { passed: true, violations };
}

/**
 * Determine whether audit immutability verification should run for an
 * environment.
 *
 * @param {{ environment: string; auditAdminUrl?: string; auditWriterUrl?: string }} input
 * @returns {{ shouldRun: boolean; required: boolean; reason?: string }}
 */
export function auditVerificationPolicy(input) {
  if (input.environment === 'development') {
    return { shouldRun: false, required: false, reason: 'Skipped in development' };
  }

  if (!input.auditAdminUrl) {
    return {
      shouldRun: false,
      required: true,
      reason: 'AUDIT_DATABASE_URL is required to verify audit immutability',
    };
  }

  return { shouldRun: true, required: true };
}
