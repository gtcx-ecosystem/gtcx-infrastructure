#!/usr/bin/env node
/**
 * CLI wrapper for canary health evaluation.
 *
 * Consumes kubectl-friendly numeric inputs and emits a structured decision.
 */

import { evaluateCanaryHealth, shouldPromote } from '../canary.mjs';

function printUsage() {
  console.error(`Usage: canary-eval.mjs --not-ready=<n> --restarts=<n> [--max-restarts=<n>] [--elapsed=<s> --max-wait=<s>]`);
  process.exit(2);
}

const args = process.argv.slice(2);
if (args.length === 0) printUsage();

/** @type {Map<string, number>} */
const flags = new Map();
for (const arg of args) {
  if (arg.startsWith('--') && arg.includes('=')) {
    const [key, value] = arg.slice(2).split(/=(.*)/s, 2);
    flags.set(key, Number(value));
  }
}

const notReady = flags.get('not-ready') ?? 0;
const restarts = flags.get('restarts') ?? 0;
const maxRestarts = flags.get('max-restarts');

const health = evaluateCanaryHealth({
  notReadyCount: notReady,
  restartCount: restarts,
  maxRestarts: maxRestarts ?? undefined,
});

if (!health.healthy) {
  console.log(`CANARY_UNHEALTHY: ${health.reason}`);
} else {
  console.log('CANARY_HEALTHY');
}

const elapsed = flags.get('elapsed');
const maxWait = flags.get('max-wait');
if (elapsed !== undefined && maxWait !== undefined) {
  const promotion = shouldPromote({
    healthy: health.healthy,
    elapsedSeconds: elapsed,
    maxWaitSeconds: maxWait,
  });
  if (promotion.promote) {
    console.log('CANARY_PROMOTE');
  } else {
    console.log(`CANARY_HOLD: ${promotion.reason}`);
  }
}

process.exit(health.healthy ? 0 : 1);
