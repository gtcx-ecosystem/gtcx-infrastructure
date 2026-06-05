/**
 * Deployment gating logic.
 *
 * Encapsulates safety-critical decisions that were previously embedded in
 * 04-ship/03-platform/scripts/deploy.sh.  Shell should handle I/O; this module handles
 * policy decisions.
 */

/** @typedef {'development'|'staging'|'testnet-pilot'|'production'} Environment */

/** @type {Map<string, Environment>} */
const ALIASES = new Map([
  ['dev', 'development'],
  ['stg', 'staging'],
  ['testnet', 'testnet-pilot'],
  ['prod', 'production'],
]);

/** @type {Record<Environment, string>} */
const NAMESPACE_MAP = {
  development: 'gtcx-dev',
  staging: 'gtcx-staging',
  'testnet-pilot': 'gtcx-testnet',
  production: 'gtcx-production',
};

/**
 * @param {string} raw
 * @returns {{ environment: Environment; namespace: string; requiresApproval: boolean }}
 */
export function normalizeEnvironment(raw) {
  const normalized = ALIASES.get(raw) ?? raw;
  if (!isEnvironment(normalized)) {
    throw new Error(
      `Invalid environment: '${raw}'. Must be one of: development, staging, testnet-pilot, production`
    );
  }
  return {
    environment: normalized,
    namespace: NAMESPACE_MAP[normalized],
    requiresApproval: normalized === 'production',
  };
}

/**
 * @param {string} value
 * @returns {value is Environment}
 */
function isEnvironment(value) {
  return value === 'development' || value === 'staging' || value === 'testnet-pilot' || value === 'production';
}

/**
 * @typedef {Object} GateInput
 * @property {string} environment
 * @property {string} [approvalTicket]
 * @property {boolean} rollback
 * @property {boolean} dryRun
 * @property {boolean} hasKubeconfig
 */

/**
 * @typedef {Object} GateResult
 * @property {boolean} allowed
 * @property {string} [reason]
 */

/**
 * Validate whether a deployment is permitted under current policy.
 *
 * @param {GateInput} input
 * @returns {GateResult}
 */
export function validateDeploymentGate(input) {
  try {
    normalizeEnvironment(input.environment);
  } catch (err) {
    return { allowed: false, reason: err instanceof Error ? err.message : String(err) };
  }

  const { environment, requiresApproval } = normalizeEnvironment(input.environment);

  if (!input.hasKubeconfig && !input.dryRun) {
    return { allowed: false, reason: 'Cannot connect to Kubernetes cluster' };
  }

  if (environment === 'production' && !requiresApproval) {
    return { allowed: false, reason: 'Production deployment requires approval ticket' };
  }

  if (environment === 'production' && !input.approvalTicket && !input.rollback && !input.dryRun) {
    return { allowed: false, reason: 'Production deployment requires --approval-ticket=GTCX-XXX' };
  }

  if (input.approvalTicket && !/^GTCX-\d+$/u.test(input.approvalTicket)) {
    return { allowed: false, reason: 'Approval ticket must match GTCX-NNNN format' };
  }

  return { allowed: true };
}

/**
 * Validate a rollback request.
 *
 * @param {{ environment: string; hasKubeconfig: boolean }} input
 * @returns {GateResult}
 */
export function validateRollbackGate(input) {
  try {
    normalizeEnvironment(input.environment);
  } catch (err) {
    return { allowed: false, reason: err instanceof Error ? err.message : String(err) };
  }

  if (!input.hasKubeconfig) {
    return { allowed: false, reason: 'Cannot connect to Kubernetes cluster' };
  }

  return { allowed: true };
}
