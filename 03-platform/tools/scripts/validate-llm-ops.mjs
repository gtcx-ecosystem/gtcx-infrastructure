#!/usr/bin/env node
/**
 * SIGNAL INF-002 / INF-008 — LLM ops dashboard + staging monitoring artifacts.
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const REQUIRED = [
  '04-ship/monitoring/dashboards/llm-ops.json',
  '04-ship/monitoring/alerts/llm-ops-alerts.yml',
  '04-ship/kubernetes/overlays/staging/monitoring/kustomization.yaml',
  '04-ship/kubernetes/overlays/staging/patches/compliance-gateway-metrics.yaml',
  '03-platform/tools/compliance-gateway/03-platform/src/llm-trace.mjs',
  '01-docs/04-ops/runbooks/staging-monitoring-apply.md',
];

let failed = 0;

for (const rel of REQUIRED) {
  const abs = path.join(ROOT, rel);
  if (!existsSync(abs)) {
    console.error(`llm-ops: FAIL — missing ${rel}`);
    failed += 1;
    continue;
  }
  console.log(`llm-ops: PASS — ${rel}`);
}

const dashboard = JSON.parse(
  readFileSync(path.join(ROOT, '04-ship/monitoring/dashboards/llm-ops.json'), 'utf8'),
);
const panelTitles = dashboard.dashboard?.panels?.map((p) => p.title) ?? [];
for (const title of ['LLM cost (USD / day)', 'Query latency p95 (ms)']) {
  if (!panelTitles.includes(title)) {
    console.error(`llm-ops: FAIL — dashboard missing panel "${title}"`);
    failed += 1;
  }
}

const alerts = readFileSync(
  path.join(ROOT, '04-ship/monitoring/alerts/llm-ops-alerts.yml'),
  'utf8',
);
if (!/runbook_url:/.test(alerts)) {
  console.error('llm-ops: FAIL — alerts missing runbook_url');
  failed += 1;
}

const patch = readFileSync(
  path.join(ROOT, '04-ship/kubernetes/overlays/staging/patches/compliance-gateway-metrics.yaml'),
  'utf8',
);
if (!/prometheus\.io\/scrape/.test(patch)) {
  console.error('llm-ops: FAIL — compliance-gateway metrics patch missing scrape annotation');
  failed += 1;
}

try {
  execSync('kubectl kustomize 04-ship/kubernetes/overlays/staging/monitoring/', {
    cwd: ROOT,
    stdio: 'pipe',
  });
  console.log('llm-ops: PASS — staging monitoring kustomize build');
} catch {
  console.error('llm-ops: FAIL — staging monitoring kustomize build');
  failed += 1;
}

if (failed > 0) {
  console.error(`llm-ops: ${failed} check(s) failed`);
  process.exit(1);
}

console.log('llm-ops: all checks passed');
process.exit(0);
