#!/usr/bin/env node
/**
 * TAAS — Tool-Adoption-as-a-Service execution runner for INIT-AGENT-TOOL-SCOUT.
 * Usage: node taas-tool-scout-run.mjs [--write] [--json]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const REGISTER = join(ROOT, 'pm/tool-adoption-register.json');
const BRIDGE_REGISTER = join(ROOT, '..', 'bridge-os', 'pm/tool-scout-register.json');
const OUT = join(ROOT, 'audit/evidence/tool-scout-fabric-execution-latest.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

const PHASE_B_WITNESSES = {
  'PILOT-NAPKIN-DIAGRAM-FLEET': '../canon-os/audit/evidence/tool-scout-napkin-fleet-pilot.json',
  'PILOT-ADV-PITCH-INTERNAL': '../markets-os/audit/evidence/tool-scout-adv-pitch-pilot.json',
  'PILOT-CODEOWNER-FLEET': 'audit/evidence/tool-scout-codeowner-fleet-pilot.json',
  'PILOT-FIGMA-MCP-EXR': '../ledger-ui/audit/evidence/tool-scout-figma-mcp-pilot.json',
};

function main() {
  const gates = {
    register: { ok: existsSync(REGISTER) },
    bridgeRegister: { ok: existsSync(BRIDGE_REGISTER) },
    ackDoc: {
      ok: existsSync(
        join(ROOT, 'docs/operations/coordination/from-fabric-os-xr-bridge-tool-scout-001-ack-2026-06-12.md'),
      ),
    },
    countryAgnostic: { ok: false },
    phaseBPilots: {},
  };

  let reg = { adoptions: [] };
  if (existsSync(REGISTER)) {
    reg = JSON.parse(readFileSync(REGISTER, 'utf8'));
    gates.countryAgnostic = { ok: reg.policy?.countryAgnostic === true };
  }

  for (const [pilotId, rel] of Object.entries(PHASE_B_WITNESSES)) {
    const path = join(ROOT, rel);
    const exists = existsSync(path);
    let complete = false;
    if (exists) {
      try {
        const w = JSON.parse(readFileSync(path, 'utf8'));
        complete = w.status === 'done' || w.successCriteria?.witnessComplete === true;
      } catch {
        complete = false;
      }
    }
    gates.phaseBPilots[pilotId] = { ok: exists, complete, path: rel };
  }

  const phaseBStarted = Object.values(gates.phaseBPilots).some((p) => p.ok);
  const structuralOk = gates.register.ok && gates.ackDoc.ok && gates.countryAgnostic.ok;

  const witness = {
    schema: 'gtcx://fabric-os/tool-scout-fabric-execution/v1',
    initiative: 'INIT-AGENT-TOOL-SCOUT',
    at: new Date().toISOString(),
    ok: structuralOk && phaseBStarted,
    gates,
    registerStatus: reg.status,
    phaseBComplete: Object.values(gates.phaseBPilots).every((p) => p.complete),
  };

  if (WRITE) {
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
  }

  if (JSON_OUT) console.log(JSON.stringify(witness, null, 2));
  else {
    for (const [k, v] of Object.entries(gates)) {
      if (k === 'phaseBPilots') continue;
      console.log(`${v.ok ? 'OK' : 'FAIL'} ${k}`);
    }
    for (const [id, p] of Object.entries(gates.phaseBPilots)) {
      console.log(`${p.complete ? 'DONE' : p.ok ? 'WIP' : 'MISS'} ${id}`);
    }
    console.log(`\n${witness.ok ? 'PASS' : 'FAIL'} — TAAS tool scout execution`);
    if (WRITE) console.log(`witness: ${OUT}`);
  }
  process.exit(structuralOk ? 0 : 1);
}

main();
