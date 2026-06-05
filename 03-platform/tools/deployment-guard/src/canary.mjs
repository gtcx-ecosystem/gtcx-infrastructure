/**
 * Canary health evaluation logic.
 *
 * Encapsulates the decision rules that determine whether a canary deployment
 * should be promoted, held, or rolled back.  Previously embedded in
 * 04-ship/03-platform/scripts/deploy.sh canary_deploy().
 */

/**
 * @typedef {Object} CanaryHealthInput
 * @property {number} notReadyCount
 * @property {number} restartCount
 * @property {number} [maxRestarts]
 */

/**
 * @typedef {Object} CanaryHealthResult
 * @property {boolean} healthy
 * @property {string} [reason]
 */

/**
 * Evaluate whether the canary is healthy enough to continue.
 *
 * @param {CanaryHealthInput} input
 * @returns {CanaryHealthResult}
 */
export function evaluateCanaryHealth(input) {
  const maxRestarts = input.maxRestarts ?? 2;

  if (input.notReadyCount > 0) {
    return { healthy: false, reason: `Canary has ${input.notReadyCount} not-ready pod(s)` };
  }

  if (input.restartCount > maxRestarts) {
    return {
      healthy: false,
      reason: `Canary restart count (${input.restartCount}) exceeds threshold (${maxRestarts})`,
    };
  }

  return { healthy: true };
}

/**
 * Determine whether the canary observation period has elapsed and the
 * deployment should be promoted.
 *
 * @param {{ healthy: boolean; elapsedSeconds: number; maxWaitSeconds: number }} input
 * @returns {{ promote: boolean; reason: string }}
 */
export function shouldPromote(input) {
  if (!input.healthy) {
    return { promote: false, reason: 'Canary is unhealthy' };
  }

  if (input.elapsedSeconds < input.maxWaitSeconds) {
    return {
      promote: false,
      reason: `Observation period incomplete (${input.elapsedSeconds}s / ${input.maxWaitSeconds}s)`,
    };
  }

  return { promote: true, reason: 'Canary healthy and observation period complete' };
}

/**
 * Compute the number of canary replicas for a target percentage.
 *
 * @param {{ totalReplicas: number; percentage: number }} input
 * @returns {number}
 */
export function computeCanaryReplicaCount(input) {
  if (input.percentage <= 0 || input.percentage > 100) {
    throw new Error('Canary percentage must be in (0, 100]');
  }
  if (input.totalReplicas <= 0) {
    throw new Error('Total replicas must be positive');
  }

  const raw = (input.totalReplicas * input.percentage) / 100;
  const count = Math.max(1, Math.round(raw));
  return Math.min(count, input.totalReplicas);
}
