#!/usr/bin/env node
/**
 * Import baseline-os cost-stats JSON into 01-docs/05-audit/evidence (SIGNAL INF-002).
 * Usage: node 03-platform/scripts/ops/import-baseline-cost-stats.mjs [--input=path]
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..', '..');
const OUT = join(ROOT, '05-audit/evidence/baseline-cost-stats-latest.json');

const input =
  process.argv.find((a) => a.startsWith('--input='))?.slice(8) ??
  join(ROOT, '../baseline-os/cost-stats-export.json');

if (!existsSync(input)) {
  writeFileSync(
    OUT,
    `${JSON.stringify(
      {
        ok: false,
        reason: 'baseline cost-stats input missing — run: baseline cost-stats --json > ../baseline-os/cost-stats-export.json',
        checkedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
  );
  console.error(`import-baseline-cost-stats: placeholder written (input missing: ${input})`);
  process.exit(0);
}

mkdirSync(dirname(OUT), { recursive: true });
copyFileSync(input, OUT);
console.log(`import-baseline-cost-stats: wrote ${OUT}`);
