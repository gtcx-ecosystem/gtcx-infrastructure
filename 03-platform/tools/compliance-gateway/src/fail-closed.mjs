/**
 * Runtime-local fail-closed wrapper.
 *
 * Kept inside 03-platform/src/ because the compliance-gateway Docker image copies only
 * this package's src directory into the runtime image.
 *
 * @template T
 * @param {string} name
 * @param {() => T | Promise<T>} fn
 * @param {object} [options]
 * @param {'rethrow' | 'rethrow-in-production' | 'log-and-return-null'} [options.onError]
 * @param {() => void} [options.onStub]
 * @param {(payload: object) => void} [options.logger]
 * @param {string} [options.nodeEnv]
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

    const returnsNull =
      mode === 'log-and-return-null' || (mode === 'rethrow-in-production' && env !== 'production');
    if (!returnsNull) {
      throw err;
    }

    if (typeof options.onStub === 'function') {
      try {
        options.onStub();
      } catch (stubErr) {
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

/**
 * Synchronous variant for hot-path parsers that cannot become async without
 * changing their public contract.
 *
 * @template T
 * @param {string} name
 * @param {() => T} fn
 * @param {object} [options]
 * @param {'rethrow' | 'rethrow-in-production' | 'log-and-return-null'} [options.onError]
 * @param {() => void} [options.onStub]
 * @param {(payload: object) => void} [options.logger]
 * @param {string} [options.nodeEnv]
 * @returns {T | null}
 */
export function failClosedSync(name, fn, options = {}) {
  const mode = options.onError ?? 'rethrow';
  const env = options.nodeEnv ?? process.env.NODE_ENV ?? 'development';
  const logger = options.logger ?? defaultLogger;

  try {
    return fn();
  } catch (err) {
    logger({
      level: 'error',
      type: 'failClosed.failure',
      name,
      error: err instanceof Error ? err.message : String(err),
      nodeEnv: env,
      mode,
    });

    const returnsNull =
      mode === 'log-and-return-null' || (mode === 'rethrow-in-production' && env !== 'production');
    if (!returnsNull) {
      throw err;
    }

    if (typeof options.onStub === 'function') {
      try {
        options.onStub();
      } catch (stubErr) {
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
