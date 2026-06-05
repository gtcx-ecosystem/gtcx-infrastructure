/**
 * @fileoverview `failClosed(name, fn, options)` — a canonical wrapper
 * for "I am soft-loading a dependency or external resource, and if it
 * fails I must either crash, fall back to a documented stub, or log
 * loudly — but never silently degrade."
 *
 * Designed to replace the endemic `try { ... } catch { stub = null }`
 * pattern that hid the audit-flush S3 require()-in-ESM bug for weeks.
 * The pattern was: a swallowed catch + a no-op stub + a
 * `lastSuccess = Date.now()` lied to the readiness probe.
 *
 * Usage:
 *
 *   const sdk = await failClosed('audit-flush.s3.sdk', () => import('@aws-sdk/client-s3'), {
 *     onError: 'rethrow-in-production',
 *     // Optional: callback when the stub branch is taken.
 *     onStub: () => emitWarn('@aws-sdk/client-s3 unavailable; using stub'),
 *   });
 *
 * onError modes:
 *   - 'rethrow'                — always rethrow (default; safest)
 *   - 'rethrow-in-production'  — rethrow when NODE_ENV=production; return null otherwise
 *   - 'log-and-return-null'    — log loudly and return null in every env
 *
 * The function deliberately does NOT provide a "swallow silently" mode.
 */

/**
 * @typedef {object} FailClosedOptions
 * @property {'rethrow' | 'rethrow-in-production' | 'log-and-return-null'} [onError]
 * @property {() => void} [onStub] - called when onError returns null instead of throwing
 * @property {(payload: object) => void} [logger] - replaces console.error for the failure log
 * @property {string} [nodeEnv] - injectable for tests; defaults to process.env.NODE_ENV
 */

/**
 * Run `fn`; if it throws, emit a structured loud log line and either
 * rethrow or return null per the configured policy. Never silently
 * swallows.
 *
 * @template T
 * @param {string} name
 * @param {() => T | Promise<T>} fn
 * @param {FailClosedOptions} [options]
 * @returns {Promise<T | null>}
 */
export async function failClosed(name, fn, options = {}) {
  const mode = options.onError ?? 'rethrow';
  const env = options.nodeEnv ?? process.env.NODE_ENV ?? 'development';
  const logger = options.logger ?? defaultLogger;

  try {
    return await fn();
  } catch (err) {
    logger({
      level: 'error',
      type: 'failClosed.failure',
      name,
      error: err instanceof Error ? err.message : String(err),
      nodeEnv: env,
      mode,
    });

    // Throw on any mode except the two explicit "return null" forms.
    // An unknown mode (e.g. someone passing 'silent') is treated as
    // the safest default — rethrow — not as a silent swallow.
    const returnsNull =
      mode === 'log-and-return-null' ||
      (mode === 'rethrow-in-production' && env !== 'production');
    if (!returnsNull) {
      throw err;
    }

    if (typeof options.onStub === 'function') {
      try {
        options.onStub();
      } catch (stubErr) {
        // The onStub hook is meant for telemetry; if it itself throws,
        // surface that loudly too — it's a programming error, not a
        // runtime failure to be swallowed.
        logger({
          level: 'error',
          type: 'failClosed.onStub.failure',
          name,
          error: stubErr instanceof Error ? stubErr.message : String(stubErr),
        });
      }
    }
    return null;
  }
}

function defaultLogger(payload) {

  console.error(JSON.stringify(payload));
}
