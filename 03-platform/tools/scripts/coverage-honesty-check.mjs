#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');

const AGGREGATE_THRESHOLD = 90;
const PER_FILE_THRESHOLD = 80;
const METRIC = 'branches';

async function findSummaries() {
  const toolsDir = resolve(REPO_ROOT, 'tools');
  const entries = await readdir(toolsDir, { withFileTypes: true });
  const summaries = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const summaryPath = resolve(toolsDir, entry.name, 'coverage', 'coverage-summary.json');
    try {
      await readFile(summaryPath, 'utf-8');
      summaries.push({ pkgName: entry.name, path: summaryPath });
    } catch {
      // no summary -- skip
    }
  }
  return summaries;
}

function checkHonesty(summary) {
  const offenses = [];
  const total = summary.total?.[METRIC];
  if (!total) return offenses;
  const aggregatePct = total.pct ?? 0;
  if (aggregatePct <= AGGREGATE_THRESHOLD) return offenses;
  for (const [file, metrics] of Object.entries(summary)) {
    if (file === 'total') continue;
    const pct = metrics[METRIC]?.pct ?? 0;
    if (pct < PER_FILE_THRESHOLD) {
      offenses.push({ file, pct });
    }
  }
  return offenses;
}

async function main() {
  const summaries = await findSummaries();
  if (summaries.length === 0) {
    console.log('coverage-honesty: no coverage-summary.json files found -- skipping');
    process.exit(0);
  }
  let failed = false;
  for (const { pkgName, path: summaryPath } of summaries) {
    const raw = await readFile(summaryPath, 'utf-8');
    const summary = JSON.parse(raw);
    const offenses = checkHonesty(summary);
    const aggregatePct = summary.total?.[METRIC]?.pct ?? 0;
    if (offenses.length > 0) {
      failed = true;
      console.error('\n[coverage-honesty] FAIL  03-platform/tools/' + pkgName);
      console.error('  Aggregate ' + METRIC + ': ' + aggregatePct + '% (> ' + AGGREGATE_THRESHOLD + '%)');
      console.error('  Per-file gaps (< ' + PER_FILE_THRESHOLD + '%):');
      for (const o of offenses) {
        const shortFile = o.file.split('/').pop();
        console.error('    - ' + shortFile + ': ' + o.pct + '%');
      }
    } else {
      console.log('[coverage-honesty] PASS  03-platform/tools/' + pkgName + '  aggregate=' + aggregatePct + '%  no per-file gaps');
    }
  }
  if (failed) {
    console.error('\ncoverage-honesty: FAILED -- aggregate smoothing detected.');
    console.error('Add tests or lower the aggregate threshold to make the gap visible.');
    process.exit(1);
  }
  console.log('\ncoverage-honesty: all packages PASS');
}

main().catch((err) => {
  console.error('coverage-honesty: unexpected error', err);
  process.exit(1);
});
