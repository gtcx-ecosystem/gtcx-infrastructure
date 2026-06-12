#!/usr/bin/env node
/**
 * Fabric assurance runner stub — need-based triggers → contextBundle witness.
 * Spec: bridge-os/pm/spec/assurance-triggers.json
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const INFRA = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const BRIDGE = join(INFRA, '..', 'bridge-os');
const WRITE = !process.argv.includes('--check');
const WITNESS = join(INFRA, 'audit/evidence/fabric-assurance-latest.json');

function readJson(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

function buildContextBundle() {
  const baselineConfig = existsSync(join(INFRA, 'config/baseline/baseline.config.json'))
    ? 'config/baseline/baseline.config.json'
    : null;
  return {
    baselineConfig,
    persona: 'pm/spec/repo-persona-profiles.json',
    skills: 'bridge-os/pm/spec/skills-ecosystem-map.json',
    ragWitness: 'audit/evidence/rag-model-b-fabric-os-latest.json',
    triggers: 'bridge-os/pm/spec/assurance-triggers.json',
  };
}

function main() {
  const evaluate = spawnSync('pnpm', ['ecosystem:assurance:evaluate'], {
    cwd: BRIDGE,
    encoding: 'utf8',
    shell: false,
  });

  const witness = {
    schema: 'gtcx://fabric-os/fabric-assurance/v1',
    at: new Date().toISOString(),
    repo: 'fabric-os',
    initiative: 'INIT-GTCX-SERVICE-FABRIC',
    story: 'ECO-EE-09',
    ok: evaluate.status === 0,
    evaluateExitCode: evaluate.status ?? 1,
    contextBundle: buildContextBundle(),
    executionOwner: 'fabric-os',
    orchestrator: 'bridge-os',
    note: 'stub runner — delegates trigger evaluation to bridge-os; fabric executes assurance planes',
  };

  if (WRITE) {
    mkdirSync(join(INFRA, 'audit/evidence'), { recursive: true });
    writeFileSync(WITNESS, `${JSON.stringify(witness, null, 2)}\n`);
  }

  console.log(`fabric-assurance-run ${witness.ok ? 'OK' : 'FAIL'}`);
  if (WRITE) console.log(`witness: audit/evidence/fabric-assurance-latest.json`);
  process.exit(witness.ok ? 0 : 1);
}

main();
