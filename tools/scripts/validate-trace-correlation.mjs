#!/usr/bin/env node
/**
 * SIGNAL INF-007 gate — trace correlation pilot artifacts and agent:next-work traceId.
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PILOT = path.join(ROOT, 'docs/audit/evidence/signal-trace-pilot-latest.json');
const LOG = path.join(ROOT, 'docs/operations/coordination/cross-repo-agent-log.md');
const TOPOLOGY = path.join(ROOT, 'docs/architecture/agent-topology-2026-Q3.md');

let failed = 0;

function fail(msg) {
  console.error(`trace-correlation: FAIL — ${msg}`);
  failed += 1;
}

function pass(msg) {
  console.log(`trace-correlation: PASS — ${msg}`);
}

if (!existsSync(PILOT)) {
  fail(`missing ${path.relative(ROOT, PILOT)}`);
} else {
  const pilot = JSON.parse(readFileSync(PILOT, 'utf8'));
  for (const key of ['ok', 'trace_id', 'coordination_ref', 'span_marker']) {
    if (pilot[key] == null) fail(`pilot missing ${key}`);
  }
  if (pilot.ok === true) pass('pilot evidence ok:true');
}

const logText = readFileSync(LOG, 'utf8');
if (!/trace_id/i.test(logText)) {
  fail('cross-repo-agent-log missing trace_id in template');
} else {
  pass('coordination log documents trace_id');
}

if (!existsSync(TOPOLOGY)) {
  fail(`missing ${path.relative(ROOT, TOPOLOGY)}`);
} else {
  pass('agent topology doc present');
}

try {
  const out = execSync('node scripts/agent-next-work.mjs', {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const json = JSON.parse(out);
  if (!json.traceId) {
    fail('agent:next-work output missing traceId');
  } else {
    pass(`agent:next-work emits traceId (${json.traceId.slice(0, 8)}…)`);
  }
} catch (e) {
  fail(`agent:next-work failed: ${e instanceof Error ? e.message : 'unknown'}`);
}

if (failed > 0) {
  console.error(`trace-correlation: ${failed} check(s) failed`);
  process.exit(1);
}

console.log('trace-correlation: all checks passed');
process.exit(0);
