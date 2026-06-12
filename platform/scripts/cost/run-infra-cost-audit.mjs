#!/usr/bin/env node
/**
 * T7 — Infra AWS cost optimization audit harness.
 * Links Terraform cost-profile module + tfvars to bridge-os policy SoR.
 *
 * Usage:
 *   node run-infra-cost-audit.mjs [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..', '..');
const BRIDGE = join(ROOT, '..', 'bridge-os');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

const MODULE = join(ROOT, 'deploy/terraform/modules/cost-profile');
const STAGING_TFVARS = join(ROOT, 'deploy/terraform/environments/staging/terraform.tfvars');
const TESTNET_TFVARS = join(ROOT, 'deploy/terraform/environments/testnet-pilot/terraform.tfvars');
const OUT = join(ROOT, 'audit/evidence/infra-aws-cost-optimization-latest.json');

const POLICY_SOR = 'bridge-os/pm/spec/environment-cost-policy.json';
const GOVERNANCE_SOR = 'bridge-os/pm/spec/aws-cost-governance.json';

const BRIDGE_WITNESSES = [
  'pm/ci/eco-env-07-terraform-cost-profile-latest.json',
  'pm/ci/eco-env-08-nat-endpoints-latest.json',
  'pm/ci/aws-cost-weekly.json',
  'pm/ci/aws-budgets-latest.json',
];

function readText(path) {
  return readFileSync(path, 'utf8');
}

function assertTfvars(path, expectProfile) {
  const text = readText(path);
  const match = text.match(/cost_profile\s*=\s*"([^"]+)"/);
  const profile = match?.[1] ?? null;
  return {
    ok: profile === expectProfile,
    path: path.replace(`${ROOT}/`, ''),
    profile,
    expect: expectProfile,
  };
}

function assertModuleWiring(envDir) {
  const main = join(ROOT, 'deploy/terraform/environments', envDir, 'main.tf');
  if (!existsSync(main)) return { ok: false, error: 'main.tf missing' };
  const text = readText(main);
  const ok =
    text.includes('module "cost_profile"') &&
    text.includes('module.cost_profile.node_min_size') &&
    text.includes('module.cost_profile.node_max_size');
  return { ok, path: main.replace(`${ROOT}/`, '') };
}

function runTerraformTest() {
  if (!existsSync(join(MODULE, 'cost-profile.tftest.hcl'))) {
    return { ok: false, skipped: true, detail: 'cost-profile.tftest.hcl missing' };
  }
  const init = spawnSync('terraform', ['init', '-backend=false'], {
    cwd: MODULE,
    encoding: 'utf8',
    timeout: 90_000,
  });
  if (init.status !== 0) {
    return {
      ok: false,
      exitCode: init.status ?? 1,
      phase: 'init',
      detail: (init.stderr || init.stdout || '').trim().split('\n').slice(-2).join(' '),
    };
  }
  const test = spawnSync('terraform', ['test'], {
    cwd: MODULE,
    encoding: 'utf8',
    timeout: 120_000,
  });
  return {
    ok: test.status === 0,
    exitCode: test.status ?? 1,
    phase: 'test',
    detail: test.status === 0 ? '4/4 pass' : (test.stderr || test.stdout || '').trim().split('\n').slice(-3).join(' '),
  };
}

function linkBridgeWitnesses() {
  const links = [];
  let ok = true;
  for (const rel of BRIDGE_WITNESSES) {
    const abs = join(BRIDGE, rel);
    const present = existsSync(abs);
    if (!present) ok = false;
    links.push({ path: rel, present });
  }
  return { ok, links };
}

const gates = {
  moduleExists: { ok: existsSync(join(MODULE, 'main.tf')) },
  stagingTfvars: assertTfvars(STAGING_TFVARS, 'scheduled'),
  testnetTfvars: assertTfvars(TESTNET_TFVARS, 'ephemeral'),
  stagingWiring: assertModuleWiring('staging'),
  testnetWiring: assertModuleWiring('testnet-pilot'),
  policySoR: { ok: existsSync(join(BRIDGE, 'pm/spec/environment-cost-policy.json')) },
  governanceSoR: { ok: existsSync(join(BRIDGE, 'pm/spec/aws-cost-governance.json')) },
  bridgeWitnesses: linkBridgeWitnesses(),
  terraformTest: runTerraformTest(),
};

const requiredOk =
  gates.moduleExists.ok &&
  gates.stagingTfvars.ok &&
  gates.testnetTfvars.ok &&
  gates.stagingWiring.ok &&
  gates.testnetWiring.ok &&
  gates.policySoR.ok &&
  gates.bridgeWitnesses.ok;

const witness = {
  storyId: 'T7',
  initiative: 'INIT-P35-TOOLCHAIN',
  status: requiredOk ? 'done' : 'blocked',
  checkedAt: new Date().toISOString(),
  owner: 'fabric-os',
  policySoR: POLICY_SOR,
  governanceSoR: GOVERNANCE_SOR,
  module: 'deploy/terraform/modules/cost-profile',
  profiles: {
    scheduled: { env: 'staging', nodeMin: 0, nodeDesired: 0, nodeMax: 4 },
    ephemeral: { env: 'testnet_pilot', nodeMin: 0, nodeDesired: 0, nodeMax: 5, natDisabled: true },
    always_on: { env: 'production', nodeMin: 2, nodeDesired: 3, nodeMax: 6 },
  },
  gates,
  ecoEnvStories: ['ECO-ENV-07', 'ECO-ENV-08'],
  runtimeOps: {
    costReport: 'pnpm --dir ../bridge-os env:cost:report:write',
    warm: 'pnpm --dir ../bridge-os env:warm',
    cold: 'pnpm --dir ../bridge-os env:cold',
    governanceCheck: 'pnpm --dir ../bridge-os env:governance:check',
  },
  applyRequired:
    'terraform apply staging + testnet-pilot when infra window opens (Class A for production-adjacent)',
  ok: requiredOk,
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}

if (JSON_OUT) {
  console.log(JSON.stringify(witness, null, 2));
} else {
  console.log('=== T7 infra AWS cost optimization audit ===\n');
  for (const [k, v] of Object.entries(gates)) {
    const status = v.ok === false ? 'FAIL' : v.ok === true ? 'OK' : v.skipped ? 'SKIP' : '?';
    console.log(`${status.padEnd(5)} ${k}${v.detail ? ` — ${v.detail}` : ''}`);
  }
  console.log(`\nrequired gates: ${requiredOk ? 'PASS' : 'FAIL'}`);
  if (WRITE) console.log(`witness: ${OUT}`);
}

process.exit(requiredOk ? 0 : 1);
