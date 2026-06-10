#!/usr/bin/env node
/**
 * Generate audit/product-management/execution-roadmap.md from DaaS SoR JSON.
 * Sources: pm/daas-roadmap.json, pm/friction-register.json, pm/daas-stories.json
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, 'audit/product-management/execution-roadmap.md');
const ROADMAP_JSON = join(ROOT, 'pm/daas-roadmap.json');
const FRICTION_JSON = join(ROOT, 'pm/friction-register.json');
const STORIES_JSON = join(ROOT, 'pm/daas-stories.json');
const FLEET_EVIDENCE = join(
  ROOT,
  'audit/evidence/cross-repo-health/cross-repo-health-probe-latest.json',
);
const FRICTION_EVIDENCE = join(ROOT, 'audit/evidence/daas-friction-check-latest.json');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function checkbox(done) {
  return done ? 'x' : ' ';
}

function renderStory(story) {
  const lines = [];
  lines.push(`### ${story.id}: ${story.title}`);
  lines.push('');
  lines.push(`**Files:** ${story.files.join(story.files.length > 1 ? ', ' : '')}`);
  lines.push('');
  lines.push('**Acceptance**');
  lines.push('');
  lines.push('```bash');
  for (const cmd of story.acceptance) lines.push(cmd);
  lines.push('```');
  lines.push('');
  lines.push('**UAT / QA**');
  lines.push('');
  for (const item of story.uat) {
    const note = item.note ? ` (${item.note})` : '';
    lines.push(`- [${checkbox(item.done)}] ${item.text}${note}`);
  }
  lines.push('');
  lines.push(`**Blockers:** ${story.blockers ?? 'none'}`);
  lines.push('');
  return lines.join('\n');
}

function frictionRoadmapStatus(item, stories) {
  const linked = stories.find((s) => s.frictionIds?.includes(item.id));
  if (linked) return linked.status;
  if (item.executionStatus) return item.executionStatus;
  return item.status === 'open' ? 'pending' : item.status;
}

function main() {
  for (const path of [ROADMAP_JSON, FRICTION_JSON, STORIES_JSON]) {
    if (!existsSync(path)) {
      console.error(`missing SoR: ${path}`);
      process.exit(1);
    }
  }

  const roadmap = readJson(ROADMAP_JSON);
  const friction = readJson(FRICTION_JSON);
  const storiesDoc = readJson(STORIES_JSON);
  const stories = storiesDoc.stories ?? [];
  const activeSprint = roadmap.sprints[0];
  const activeStories = stories.filter((s) => s.sprint === activeSprint?.id);

  const fleetHint = existsSync(FLEET_EVIDENCE)
    ? readJson(FLEET_EVIDENCE)
    : null;
  const agxStatus = fleetHint?.services?.find((s) => s.name === 'agx-api')?.status;

  const now = new Date().toISOString();
  const lines = [];
  lines.push('---');
  lines.push('title: Execution roadmap — DevOps-as-a-Service');
  lines.push('status: current');
  lines.push(`date: ${now.slice(0, 10)}`);
  lines.push(`last_reconciled: ${now}`);
  lines.push('owner: gtcx-infrastructure');
  lines.push(`program: ${roadmap.initiative}`);
  lines.push('generated: true');
  lines.push('generated_by: platform/scripts/generate-execution-roadmap.mjs');
  lines.push('sources:');
  lines.push('  - pm/daas-roadmap.json');
  lines.push('  - pm/friction-register.json');
  lines.push('  - pm/daas-stories.json');
  if (existsSync(FRICTION_EVIDENCE)) lines.push('  - audit/evidence/daas-friction-check-latest.json');
  if (existsSync(FLEET_EVIDENCE)) {
    lines.push('  - audit/evidence/cross-repo-health/cross-repo-health-probe-latest.json');
  }
  lines.push('---');
  lines.push('');
  lines.push('# gtcx-infrastructure execution roadmap');
  lines.push('');
  lines.push('> **Generated file.** Edit `pm/daas-stories.json`, `pm/friction-register.json`, or');
  lines.push('> `pm/daas-roadmap.json`, then run `pnpm generate:roadmap`.');
  lines.push('');
  lines.push('**Primary program:** DevOps-as-a-Service (DaaS) — not product ECO sprints.');
  lines.push('');
  lines.push(`## Active Phase: ${activeSprint?.id ?? 'DAAS-S1'} — ${activeSprint?.name ?? 'DaaS'}`);
  lines.push('');
  lines.push(`**Status:** \`${activeSprint?.status ?? 'blocked'}\``);
  lines.push('');
  if (agxStatus) {
    lines.push(
      `**Live probe:** AGX \`api/health\` → **${agxStatus}** (fleet witness ${fleetHint?.timestamp?.slice(0, 10) ?? 'n/a'}).`,
    );
    lines.push('');
  }
  lines.push('| Story | Title | Priority | Status | Owner |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const story of activeStories) {
    lines.push(
      `| ${story.id} | ${story.title} | ${story.priority} | ${story.status} | ${story.owner} |`,
    );
  }
  lines.push('');
  for (const story of activeStories) lines.push(renderStory(story));

  lines.push('## Future Phases');
  lines.push('');
  lines.push('| Sprint | Goal | Status | Owner | Stories / Friction |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const sprint of roadmap.sprints.slice(1)) {
    lines.push(
      `| ${sprint.id} | ${sprint.name} | ${sprint.status} | gtcx-infrastructure | ${(sprint.items ?? []).map((id) => `\`${id}\``).join(', ')} |`,
    );
  }
  lines.push('');
  lines.push('## Issue Reconciliation');
  lines.push('');
  lines.push('| Issue | Source | Roadmap Mapping | Status |');
  lines.push('| --- | --- | --- | --- |');
  for (const item of friction.items ?? []) {
    const mapping =
      stories.find((s) => s.frictionIds?.includes(item.id))?.id ??
      roadmap.sprints.find((s) => s.items?.includes(item.id))?.id ??
      '—';
    lines.push(
      `| \`${item.id}\` | \`pm/friction-register.json\` | ${mapping} | ${frictionRoadmapStatus(item, stories)} |`,
    );
  }
  lines.push('| P41 hub protocol publication | `pm/_tasks` | deferred to `gtcx-docs` owner | blocked-sibling |');
  lines.push('');
  lines.push('## Unblock Order');
  lines.push('');
  lines.push('1. `gtcx-os/platforms`: publish corrected `gtcx-agx:staging` image.');
  lines.push('2. `gtcx-infrastructure`: roll out digest, verify health `200`, confirm authority ingress.');
  lines.push('3. `gtcx-markets`: run `authority:trace:capture` and return `7/7` evidence.');
  lines.push('');

  writeFileSync(OUT, `${lines.join('\n')}\n`);
  console.log(`Wrote ${OUT}`);
  console.log(`Stories: ${activeStories.length} · Friction items: ${friction.items?.length ?? 0}`);
}

main();
