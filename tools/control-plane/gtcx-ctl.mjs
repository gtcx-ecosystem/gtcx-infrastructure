#!/usr/bin/env node

import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const infraScriptsDir = path.join(repoRoot, 'infra', 'scripts');

const scriptMap = {
  deploy: path.join(infraScriptsDir, 'deploy.sh'),
  rollbackEvidence: path.join(infraScriptsDir, 'capture-rollback-evidence.sh'),
  workflow: path.join(infraScriptsDir, 'fine-tune-workflow.sh'),
  prepareEvidenceEnv: path.join(infraScriptsDir, 'prepare-intelligence-evidence-env.sh'),
};

function fail(message) {
  console.error(`gtcx-ctl error: ${message}`);
  process.exit(1);
}

function requireScript(scriptPath) {
  if (!existsSync(scriptPath)) {
    fail(`Required script not found: ${scriptPath}`);
  }
}

function shiftArg(args, name) {
  if (args.length === 0) {
    fail(`${name} is required`);
  }
  return args.shift();
}

function parseFlags(args) {
  const flags = new Map();
  const passthrough = [];

  for (const arg of args) {
    if (arg.startsWith('--') && arg.includes('=')) {
      const [key, value] = arg.slice(2).split(/=(.*)/s, 2);
      flags.set(key, value);
    } else if (arg.startsWith('--')) {
      flags.set(arg.slice(2), true);
    } else {
      passthrough.push(arg);
    }
  }

  return { flags, passthrough };
}

function formatFlag(key, value) {
  return value === true ? `--${key}` : `--${key}=${value}`;
}

function runScript(scriptPath, args) {
  requireScript(scriptPath);
  const result = spawnSync('bash', [scriptPath, ...args], {
    cwd: repoRoot,
    stdio: 'inherit',
  });

  if (result.error) {
    fail(result.error.message);
  }

  process.exit(result.status ?? 1);
}

function showHelp() {
  console.log(`Usage:
  gtcx-ctl deploy plan --environment=<env> [--version=<tag>] [--canary=<n>]
  gtcx-ctl deploy apply --environment=<env> [--version=<tag>] [--approval-ticket=<id>] [--canary=<n>]
  gtcx-ctl deploy rollback --environment=<env>
  gtcx-ctl workflow <status|trigger|suspend|resume> [workflow flags...]
  gtcx-ctl evidence rollback-capture --environment=<env> [--reason=<text>] [--smoke-base-url=<url>]
  gtcx-ctl evidence prepare-intelligence-env --terraform-output-file=<path> [--mode=<value>] [--failure-target=<value>]

Notes:
  - This is a bounded operator interface over infra/scripts.
  - It validates command shape before dispatching to the underlying script.
  - Use --help with the underlying scripts for full low-level flags.`);
}

const args = process.argv.slice(2);
if (args.length === 0 || ['--help', '-h', 'help'].includes(args[0])) {
  showHelp();
  process.exit(0);
}

const area = shiftArg(args, 'area');

if (area === 'deploy') {
  const action = shiftArg(args, 'deploy action');
  const { flags } = parseFlags(args);
  const environment = flags.get('environment');

  if (!environment || typeof environment !== 'string') {
    fail('deploy requires --environment=<development|staging|testnet-pilot|production>');
  }

  const commandArgs = [environment];
  if (typeof flags.get('version') === 'string') {
    commandArgs.push(formatFlag('version', flags.get('version')));
  }
  if (typeof flags.get('approval-ticket') === 'string') {
    commandArgs.push(formatFlag('approval-ticket', flags.get('approval-ticket')));
  }
  if (typeof flags.get('canary') === 'string') {
    commandArgs.push(formatFlag('canary', flags.get('canary')));
  }

  if (action === 'plan') {
    commandArgs.push('--dry-run');
    runScript(scriptMap.deploy, commandArgs);
  }

  if (action === 'apply') {
    runScript(scriptMap.deploy, commandArgs);
  }

  if (action === 'rollback') {
    commandArgs.push('--rollback');
    runScript(scriptMap.deploy, commandArgs);
  }

  fail(`Unknown deploy action: ${action}`);
}

if (area === 'workflow') {
  const action = shiftArg(args, 'workflow action');
  const allowed = new Set(['status', 'trigger', 'suspend', 'resume']);
  if (!allowed.has(action)) {
    fail(`Unknown workflow action: ${action}`);
  }

  runScript(scriptMap.workflow, [action, ...args]);
}

if (area === 'evidence') {
  const action = shiftArg(args, 'evidence action');
  const { flags } = parseFlags(args);

  if (action === 'rollback-capture') {
    const environment = flags.get('environment');
    if (!environment || typeof environment !== 'string') {
      fail('rollback-capture requires --environment=<env>');
    }

    const commandArgs = [environment];
    for (const key of ['reason', 'smoke-base-url', 'output-dir']) {
      if (typeof flags.get(key) === 'string') {
        commandArgs.push(formatFlag(key, flags.get(key)));
      }
    }
    runScript(scriptMap.rollbackEvidence, commandArgs);
  }

  if (action === 'prepare-intelligence-env') {
    const terraformOutputFile = flags.get('terraform-output-file');
    if (!terraformOutputFile || typeof terraformOutputFile !== 'string') {
      fail('prepare-intelligence-env requires --terraform-output-file=<path>');
    }

    const commandArgs = [formatFlag('terraform-output-file', terraformOutputFile)];
    for (const key of ['mode', 'failure-target', 'format', 'write-env-file', 'aws-region']) {
      if (typeof flags.get(key) === 'string') {
        commandArgs.push(formatFlag(key, flags.get(key)));
      }
    }
    runScript(scriptMap.prepareEvidenceEnv, commandArgs);
  }

  fail(`Unknown evidence action: ${action}`);
}

fail(`Unknown area: ${area}`);
