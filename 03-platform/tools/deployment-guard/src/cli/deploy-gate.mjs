#!/usr/bin/env node
/**
 * CLI wrapper for deployment gating decisions.
 *
 * Used by 04-ship/03-platform/scripts/deploy.sh to delegate safety-critical decisions to
 * typed, tested modules.
 */

import { validateDeploymentGate, validateRollbackGate } from '../gate.mjs';

/**
 * @returns {never}
 */
function printUsage() {
  console.error(`Usage: deploy-gate.mjs --environment=<env> [--approval-ticket=GTCX-XXX] [--rollback] [--dry-run] [--has-kubeconfig]`);
  process.exit(2);
}

const args = process.argv.slice(2);
if (args.length === 0) printUsage();

/** @type {Map<string, string | boolean>} */
const flags = new Map();
for (const arg of args) {
  if (arg === '--rollback') {
    flags.set('rollback', true);
  } else if (arg === '--dry-run') {
    flags.set('dry-run', true);
  } else if (arg === '--has-kubeconfig') {
    flags.set('has-kubeconfig', true);
  } else if (arg.startsWith('--') && arg.includes('=')) {
    const [key, value] = arg.slice(2).split(/=(.*)/s, 2);
    flags.set(key, value ?? '');
  } else if (arg.startsWith('--')) {
    flags.set(arg.slice(2), true);
  }
}

const environmentFlag = flags.get('environment');
if (typeof environmentFlag !== 'string' || !environmentFlag) {
  console.error('Missing required --environment');
  printUsage();
}
const environment = environmentFlag;

const rollback = flags.get('rollback') === true;
const dryRun = flags.get('dry-run') === true;
const hasKubeconfig = flags.get('has-kubeconfig') === true;
const approvalTicket = flags.get('approval-ticket');

const result = rollback
  ? validateRollbackGate({ environment, hasKubeconfig })
  : validateDeploymentGate({
      environment,
      hasKubeconfig,
      rollback,
      dryRun,
      approvalTicket: typeof approvalTicket === 'string' ? approvalTicket : undefined,
    });

if (!result.allowed) {
  console.error(`DEPLOY_GATE_BLOCKED: ${result.reason}`);
  process.exit(1);
}

console.error('DEPLOY_GATE_ALLOWED');
process.exit(0);
