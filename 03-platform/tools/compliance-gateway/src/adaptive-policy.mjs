/**
 * @fileoverview Adaptive Policy Tuner — feedback-driven degradation mode.
 *
 * Watches the gateway's own metrics and adjusts the runtime degradation
 * mode without operator intervention. The policy resolution order is:
 *
 *   1. If GTCX_ADAPTIVE_POLICY_ENABLED ≠ 'true', do nothing. The
 *      static GTCX_DEGRADATION_MODE from the runtime-policies ConfigMap
 *      remains authoritative.
 *
 *   2. If the provider error rate exceeds GTCX_ADAPTIVE_ERROR_THRESHOLD
 *      (default 10%) for two consecutive observation windows, switch to
 *      `minimal`.
 *
 *   3. Else, if the provider p95 latency exceeds
 *      GTCX_ADAPTIVE_LATENCY_THRESHOLD_MS (default 5000) for three
 *      consecutive observation windows, switch to `reduced`.
 *
 *   4. If neither condition holds for five consecutive recovery windows,
 *      switch back to `auto`.
 *
 * Every mode transition emits a signed audit record
 * (action: 'resilience.policy.adaptation') so the change is durable
 * evidence rather than a forgotten log line.
 */

const DEFAULT_LATENCY_THRESHOLD_MS = 5000;
const DEFAULT_ERROR_THRESHOLD = 0.10;
const DEFAULT_LATENCY_BREACH_WINDOWS = 3;
const DEFAULT_ERROR_BREACH_WINDOWS = 2;
const DEFAULT_RECOVERY_WINDOWS = 5;

function bool(envVar, fallback) {
  const v = process.env[envVar];
  if (v === 'true' || v === '1') return true;
  if (v === 'false' || v === '0') return false;
  return fallback;
}

function num(envVar, fallback) {
  const v = Number(process.env[envVar]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

export function defaultThresholds() {
  return {
    enabled: bool('GTCX_ADAPTIVE_POLICY_ENABLED', false),
    latencyMs: num('GTCX_ADAPTIVE_LATENCY_THRESHOLD_MS', DEFAULT_LATENCY_THRESHOLD_MS),
    errorRate: (() => {
      const v = Number(process.env.GTCX_ADAPTIVE_ERROR_THRESHOLD);
      return Number.isFinite(v) && v > 0 && v < 1 ? v : DEFAULT_ERROR_THRESHOLD;
    })(),
    latencyBreachWindows: num('GTCX_ADAPTIVE_LATENCY_BREACH_WINDOWS', DEFAULT_LATENCY_BREACH_WINDOWS),
    errorBreachWindows: num('GTCX_ADAPTIVE_ERROR_BREACH_WINDOWS', DEFAULT_ERROR_BREACH_WINDOWS),
    recoveryWindows: num('GTCX_ADAPTIVE_RECOVERY_WINDOWS', DEFAULT_RECOVERY_WINDOWS),
  };
}

/**
 * Compute the next adaptive mode given the current observation and history.
 *
 * Pure function — no IO, no side effects — so it tests cleanly. The caller
 * is responsible for emitting an audit event when the mode changes.
 *
 * @param {{
 *   currentMode: 'auto'|'normal'|'reduced'|'minimal'|'offline',
 *   latencyP95Ms: number,
 *   errorRate: number,
 *   consecutiveLatencyBreaches: number,
 *   consecutiveErrorBreaches: number,
 *   consecutiveRecoveryWindows: number,
 * }} state
 * @param {ReturnType<typeof defaultThresholds>} [t=defaultThresholds()]
 * @returns {{
 *   nextMode: string,
 *   consecutiveLatencyBreaches: number,
 *   consecutiveErrorBreaches: number,
 *   consecutiveRecoveryWindows: number,
 *   changed: boolean,
 *   reason: string|null,
 * }}
 */
export function evaluatePolicy(state, t = defaultThresholds()) {
  if (!t.enabled) {
    return {
      nextMode: state.currentMode,
      consecutiveLatencyBreaches: 0,
      consecutiveErrorBreaches: 0,
      consecutiveRecoveryWindows: 0,
      changed: false,
      reason: null,
    };
  }

  const latencyBreached = state.latencyP95Ms > t.latencyMs;
  const errorBreached = state.errorRate > t.errorRate;

  let nextLatencyBreaches = latencyBreached ? state.consecutiveLatencyBreaches + 1 : 0;
  let nextErrorBreaches = errorBreached ? state.consecutiveErrorBreaches + 1 : 0;
  const nextRecoveryWindows = (!latencyBreached && !errorBreached)
    ? state.consecutiveRecoveryWindows + 1
    : 0;

  let nextMode = state.currentMode;
  let reason = null;

  // Error rate is more severe than latency — check it first.
  if (nextErrorBreaches >= t.errorBreachWindows && nextMode !== 'minimal') {
    nextMode = 'minimal';
    reason = `error_rate>${t.errorRate} for ${nextErrorBreaches} windows`;
  } else if (nextLatencyBreaches >= t.latencyBreachWindows && nextMode === 'auto') {
    nextMode = 'reduced';
    reason = `latencyP95Ms>${t.latencyMs} for ${nextLatencyBreaches} windows`;
  } else if (nextRecoveryWindows >= t.recoveryWindows && nextMode !== 'auto') {
    nextMode = 'auto';
    reason = `recovered for ${nextRecoveryWindows} windows`;
    nextLatencyBreaches = 0;
    nextErrorBreaches = 0;
  }

  return {
    nextMode,
    consecutiveLatencyBreaches: nextLatencyBreaches,
    consecutiveErrorBreaches: nextErrorBreaches,
    consecutiveRecoveryWindows: nextRecoveryWindows,
    changed: nextMode !== state.currentMode,
    reason,
  };
}

/**
 * Long-running scheduler. Polls the metrics module at a fixed interval,
 * computes the next mode, and calls the provided `onChange` callback
 * when a transition happens (so the caller can emit a signed audit
 * event and update the live `runtimePolicyConfig.degradationMode`).
 *
 * Designed for the gateway's own process — for K8s deployments, this
 * runs alongside the HTTP server in the same Node process.
 *
 * @param {{
 *   sampleLatencyP95Ms: () => number,
 *   sampleErrorRate: () => number,
 *   getCurrentMode: () => string,
 *   onChange: (next: string, reason: string) => void,
 *   intervalMs?: number,
 *   thresholds?: ReturnType<typeof defaultThresholds>,
 * }} deps
 * @returns {{ stop: () => void }}
 */
export function startAdaptiveScheduler(deps) {
  const t = deps.thresholds ?? defaultThresholds();
  if (!t.enabled) {
    return { stop: () => {} };
  }
  const intervalMs = deps.intervalMs ?? num('GTCX_ADAPTIVE_WINDOW_MS', 30_000);
  let history = {
    consecutiveLatencyBreaches: 0,
    consecutiveErrorBreaches: 0,
    consecutiveRecoveryWindows: 0,
  };
  const handle = setInterval(() => {
    try {
      const r = evaluatePolicy({
        currentMode: deps.getCurrentMode(),
        latencyP95Ms: deps.sampleLatencyP95Ms(),
        errorRate: deps.sampleErrorRate(),
        ...history,
      }, t);
      history = {
        consecutiveLatencyBreaches: r.consecutiveLatencyBreaches,
        consecutiveErrorBreaches: r.consecutiveErrorBreaches,
        consecutiveRecoveryWindows: r.consecutiveRecoveryWindows,
      };
      if (r.changed) {
        deps.onChange(r.nextMode, r.reason);
      }
    } catch (err) {
      console.error(JSON.stringify({
        level: 'error',
        type: 'adaptive-policy.evaluate.failed',
        error: err.message,
      }));
    }
  }, intervalMs);
  handle.unref?.();
  return { stop: () => clearInterval(handle) };
}
