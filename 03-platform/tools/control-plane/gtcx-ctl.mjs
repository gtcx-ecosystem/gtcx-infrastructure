#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const infraScriptsDir = path.join(repoRoot, 'infra', 'scripts');
const controlPlaneDir = path.join(repoRoot, 'tools', 'control-plane');

const scriptMap = {
  deploy: path.join(infraScriptsDir, 'deploy.sh'),
  rollbackEvidence: path.join(infraScriptsDir, 'capture-rollback-evidence.sh'),
  workflow: path.join(infraScriptsDir, 'fine-tune-workflow.sh'),
  prepareEvidenceEnv: path.join(infraScriptsDir, 'prepare-intelligence-evidence-env.sh'),
  releaseEvidence: path.join(controlPlaneDir, 'generate-release-evidence.mjs'),
  runtimeSmokeEvidence: path.join(controlPlaneDir, 'capture-runtime-smoke-evidence.mjs'),
  wormUploadEvidence: path.join(controlPlaneDir, 'upload-release-evidence-to-worm.mjs'),
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

function runNodeScript(scriptPath, args) {
  requireScript(scriptPath);
  const result = spawnSync('node', [scriptPath, ...args], {
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
  gtcx-ctl evidence release-bundle --environment=<env> --version=<tag> --commit=<sha> [--build-only|--smoke-base-url=<url> --rollback-target=<target>] --image=<name>=<ref> [--sbom=<name>=<path>] [--scan=<name>=<status>] [--gate=<name>=<status>]
  gtcx-ctl evidence runtime-smoke --environment=<env> --base-url=<url> [--mode=public|bearer] [--bearer-token-env=<ENV_VAR>] [--endpoint=<name>=<path>] [--strict]
  gtcx-ctl evidence worm-upload --manifest=<path/to/worm-upload.json> [--dry-run] [--output-dir=<path>]
  gtcx-ctl validate --environment=<env> [--dry-run] [--ci]
  gtcx-ctl validate --ci [--environment=<env>]

Notes:
  - This is a bounded operator interface over 04-ship/scripts.
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

  if (action === 'release-bundle') {
    const required = ['environment', 'version', 'commit'];
    for (const key of required) {
      if (typeof flags.get(key) !== 'string') {
        fail(`release-bundle requires --${key}=...`);
      }
    }
    if (flags.get('build-only') !== true) {
      for (const key of ['smoke-base-url', 'rollback-target']) {
        if (typeof flags.get(key) !== 'string') {
          fail(`release-bundle requires --${key}=... unless --build-only is set`);
        }
      }
    }

    const commandArgs = required.map((key) => formatFlag(key, flags.get(key)));
    if (flags.get('build-only') === true) {
      commandArgs.push('--build-only');
    } else {
      commandArgs.push(formatFlag('smoke-base-url', flags.get('smoke-base-url')));
      commandArgs.push(formatFlag('rollback-target', flags.get('rollback-target')));
    }
    for (const key of ['approval-ticket', 'output-dir', 'worm-bucket', 'worm-key']) {
      if (typeof flags.get(key) === 'string') {
        commandArgs.push(formatFlag(key, flags.get(key)));
      }
    }

    for (const arg of args) {
      if (
        arg.startsWith('--image=') ||
        arg.startsWith('--sbom=') ||
        arg.startsWith('--scan=') ||
        arg.startsWith('--gate=') ||
        arg.startsWith('--evidence=')
      ) {
        commandArgs.push(arg);
      }
    }

    runNodeScript(scriptMap.releaseEvidence, commandArgs);
  }

  if (action === 'runtime-smoke') {
    for (const key of ['environment', 'base-url']) {
      if (typeof flags.get(key) !== 'string') {
        fail(`runtime-smoke requires --${key}=...`);
      }
    }

    const commandArgs = [
      formatFlag('environment', flags.get('environment')),
      formatFlag('base-url', flags.get('base-url')),
    ];
    if (flags.get('strict') === true) {
      commandArgs.push('--strict');
    }
    for (const key of ['mode', 'bearer-token-env', 'timeout-ms', 'output-dir']) {
      if (typeof flags.get(key) === 'string') {
        commandArgs.push(formatFlag(key, flags.get(key)));
      }
    }
    for (const arg of args) {
      if (arg.startsWith('--endpoint=')) {
        commandArgs.push(arg);
      }
    }

    runNodeScript(scriptMap.runtimeSmokeEvidence, commandArgs);
  }

  if (action === 'worm-upload') {
    if (typeof flags.get('manifest') !== 'string') {
      fail('worm-upload requires --manifest=<path/to/worm-upload.json>');
    }

    const commandArgs = [formatFlag('manifest', flags.get('manifest'))];
    if (flags.get('dry-run') === true) {
      commandArgs.push('--dry-run');
    }
    for (const key of ['output-dir', 'aws-bin', 'expected-mode', 'min-retention-days']) {
      if (typeof flags.get(key) === 'string') {
        commandArgs.push(formatFlag(key, flags.get(key)));
      }
    }

    runNodeScript(scriptMap.wormUploadEvidence, commandArgs);
  }

  fail(`Unknown evidence action: ${action}`);
}

if (area === 'validate') {
  const { flags } = parseFlags(args);
  const environment = flags.get('environment');
  const ci = flags.get('ci') === true;

  if (!ci && (!environment || typeof environment !== 'string')) {
    fail(
      'validate requires --environment=<development|staging|testnet-pilot|production> or --ci',
    );
  }

  const commandArgs = [];
  if (environment && typeof environment === 'string') {
    commandArgs.push(formatFlag('environment', environment));
  }
  if (ci) {
    commandArgs.push('--ci');
  }
  if (flags.get('dry-run') === true) {
    commandArgs.push('--dry-run');
  }

  runNodeScript(path.join(controlPlaneDir, 'validate-environment.mjs'), commandArgs);
}

fail(`Unknown area: ${area}`);
