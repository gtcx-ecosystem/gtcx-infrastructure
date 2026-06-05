/** @typedef {import('../types').ClockSkewPolicy} ClockSkewPolicy */
/**
 * @fileoverview Clock-Skew Policy
 *
 * Configurable timestamp acceptance windows with extra tolerance for
 * low-connectivity regions (e.g., Global South, rural mesh networks).
 *
 * Principles: RESILIENT (P12), SOVEREIGN (P6)
 */

/** @type {import('../types').ClockSkewPolicy} */
export const DEFAULT_POLICY = Object.freeze({
  windowMs: 5 * 60 * 1000,               // 5 minutes
  lowConnectivityBufferMs: 10 * 60 * 1000, // +10 minutes
  maxFutureMs: 2 * 60 * 1000,            // reject timestamps >2 min in the future
  lowConnectivityRegions: Object.freeze([
    'global-south',
    'rural',
    'mesh',
    'satellite',
  ]),
});

/**
 * Resolve the effective acceptance window for a given region.
 *
 * @param {string} [region]
 * @param {Partial<import('../types').ClockSkewPolicy>} [overrides]
 * @returns {{ windowMs: number, maxFutureMs: number }}
 */
export function resolveWindow(region, overrides = {}) {
  const policy = { ...DEFAULT_POLICY, ...overrides };
  const isLowConnectivity = region && policy.lowConnectivityRegions.includes(region);

  const windowMs = isLowConnectivity
    ? policy.windowMs + policy.lowConnectivityBufferMs
    : policy.windowMs;

  return {
    windowMs,
    maxFutureMs: policy.maxFutureMs,
  };
}

/**
 * Evaluate a timestamp against the policy.
 *
 * @param {string} timestamp - ISO-8601 string
 * @param {string} [region]
 * @param {Partial<import('../types').ClockSkewPolicy>} [overrides]
 * @param {number} [nowMs] - Override current time for testing
 * @returns {{ valid: boolean; code?: string; reason?: string; skewMs: number; windowMs: number }}
 */
export function evaluateTimestamp(timestamp, region, overrides = {}, nowMs = Date.now()) {
  const tsMs = Date.parse(timestamp);
  if (Number.isNaN(tsMs)) {
    return { valid: false, code: 'REPLAY_STALE', reason: 'Malformed timestamp', skewMs: NaN, windowMs: 0 };
  }

  const { windowMs, maxFutureMs } = resolveWindow(region, overrides);
  const skewMs = nowMs - tsMs;

  // Future-dated (clock ahead on device)
  if (skewMs < -maxFutureMs) {
    return {
      valid: false,
      code: 'REPLAY_FUTURE',
      reason: `Timestamp is ${Math.abs(skewMs)}ms in the future (max allowed: ${maxFutureMs}ms)`,
      skewMs,
      windowMs,
    };
  }

  // Too old (replay or stale request)
  if (skewMs > windowMs) {
    return {
      valid: false,
      code: 'REPLAY_STALE',
      reason: `Timestamp is ${skewMs}ms old (window: ${windowMs}ms)`,
      skewMs,
      windowMs,
    };
  }

  return { valid: true, skewMs, windowMs };
}
