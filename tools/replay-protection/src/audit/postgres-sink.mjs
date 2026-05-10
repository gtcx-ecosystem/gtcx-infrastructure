/**
 * @fileoverview PostgreSQL Audit Sink
 *
 * Writes replay-protection audit events to the gtcx_audit.replay_events table.
 * Best-effort: failures are logged but do not block the verification hot path.
 *
 * Principles: AUDITABLE (P3)
 */

/**
 * @typedef {(sql: string, params: readonly unknown[]) => Promise<void>} PostgresQuery
 * @typedef {{ query(sql: string, params: readonly unknown[]): Promise<void>, release(): void }} PostgresPoolClient
 * @typedef {{ connect(): Promise<PostgresPoolClient> }} PostgresPool
 */

/**
 * @param {unknown} error
 * @returns {string}
 */
function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Create a PostgreSQL audit sink.
 *
 * @param {object} opts
 * @param {string} opts.connectionString - PostgreSQL connection string (e.g. from AUDIT_DATABASE_URL)
 * @param {PostgresQuery} [opts.query] - Async query function `(sql, params) => Promise<void>`.
 *   Defaults to a thin wrapper around `pg` if available. If `pg` is not installed,
 *   the sink degrades to a no-op with a warning.
 * @returns {import('./audit-capture.mjs').AuditSink}
 */
export function createPostgresSink(opts) {
  if (!opts?.connectionString) {
     
    console.warn(JSON.stringify({
      level: 'warn',
      type: 'audit.sink.postgres.misconfigured',
      message: 'Postgres sink created without connectionString; events will be dropped.',
    }));
    return async () => {};
  }

  const query = opts.query ?? defaultQuery(opts.connectionString);

  return async (/** @type {import('../types').AuditEvent} */ event) => {
    try {
      await query(
        `INSERT INTO gtcx_audit.replay_events
         (event_id, timestamp_ms, event_type, nonce, did, reason, code, region,
          request_id, device_id, clock_skew_ms, acceptance_window_ms, is_delayed_offline_replay)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (event_id) DO NOTHING`,
        [
          event.eventId,
          event.timestampMs,
          event.eventType,
          event.nonce ?? null,
          event.did ?? null,
          event.reason ?? null,
          event.code ?? null,
          event.region ?? null,
          event.requestId ?? null,
          event.deviceId ?? null,
          event.clockSkewMs ?? null,
          event.acceptanceWindowMs ?? null,
          event.isDelayedOfflineReplay ?? null,
        ]
      );
    } catch (err) {
      // Best-effort: do not block verification on audit write failure.
       
      console.error(JSON.stringify({
        level: 'error',
        type: 'audit.sink.postgres.write_failed',
        message: errorMessage(err),
        eventId: event.eventId,
      }));
    }
  };
}

/**
 * Default query implementation using `pg` if available.
 * Returns a no-op if `pg` is not installed (peer dependency).
 */
/** @param {string} connectionString */
function defaultQuery(connectionString) {
  /** @type {PostgresPool | null} */
  let pool = null;
  return async (
    /** @type {string} */ sql,
    /** @type {readonly unknown[]} */ params
  ) => {
    if (!pool) {
      try {
        // @ts-expect-error pg is an optional peer dependency
        const { Pool } = /** @type {{ Pool: new (opts: { connectionString: string, max: number }) => PostgresPool }} */ (await import('pg'));
        pool = new Pool({ connectionString, max: 5 });
      } catch {
         
        console.warn(JSON.stringify({
          level: 'warn',
          type: 'audit.sink.postgres.pg_missing',
          message: '`pg` module not found. Postgres audit sink is a no-op. Install `pg` to enable.',
        }));
        return;
      }
    }
    const client = await pool.connect();
    try {
      await client.query(sql, params);
    } finally {
      client.release();
    }
  };
}
