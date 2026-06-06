#!/usr/bin/env node
/**
 * SIGNAL INF-005 — injection-suite static witness → 05-audit/evidence/
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runStaticChecks } from '../../tools/eval-pipeline/injection-suite.mjs';
import { PROMPT_VERSION } from '../../tools/compliance-gateway/src/system-prompt.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const OUT = join(ROOT, '05-audit/evidence/injection-suite-latest.json');

const results = runStaticChecks();
const failures = results.filter(
  (r) => !r.schemaPassed || !r.hasDelimiter || !r.hasEndDelimiter,
);

const evidence = {
  ok: failures.length === 0,
  hub: 'SIGNAL-INF-005',
  checkedAt: new Date().toISOString(),
  mode: 'static',
  promptVersion: PROMPT_VERSION,
  total: results.length,
  failures: failures.length,
  results,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`injection-suite-witness: wrote ${OUT} ok=${evidence.ok}`);
process.exit(evidence.ok ? 0 : 1);
