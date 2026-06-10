/**
 * product-management sync — local P22 state → ops/pm/backlog.json
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

export function repoRoot() {
  return process.cwd();
}

function readJson(rel) {
  const abs = join(repoRoot(), rel);
  if (!existsSync(abs)) return null;
  return JSON.parse(readFileSync(abs, 'utf8'));
}

function writeJson(rel, data) {
  const abs = join(repoRoot(), rel);
  writeFileSync(abs, `${JSON.stringify(data, null, 2)}\n`);
}

function resolveRoadmap(pmManifest) {
  const candidates = [
    pmManifest?.local?.executionRoadmap,
    'audit/product-management/execution-roadmap.md',
    'audit/execution-roadmap.md',
    'docs/strategy/execution-roadmap.md',
  ].filter(Boolean);
  for (const rel of candidates) {
    if (existsSync(join(repoRoot(), rel))) return rel;
  }
  return null;
}

function parseRoadmapStories(md) {
  const stories = [];
  const lines = md.split('\n');
  for (const line of lines) {
    if (!line.trim().startsWith('|')) continue;
    const cells = line
      .split('|')
      .map((c) => c.trim())
      .filter(Boolean);
    if (cells.length < 2) continue;
    const id = cells[0].replace(/\*\*/g, '').trim();
    if (
      !/^(S\d+-\d+|DAAS-S\d+|EAP-\d+|P22-\d+|ER-\d+-\d+|MA-\d+|PLAT-[A-Z0-9-]+|CORE-\d+)$/i.test(
        id,
      )
    ) {
      continue;
    }
    const statusIndex = cells.findIndex((cell, index) => {
      if (index === 0) return false;
      const normalized = cell
        .replace(/\*\*/g, '')
        .replace(/[✅🔄]/g, '')
        .trim()
        .toLowerCase();
      return /^(done|complete|completed|in.?progress|active|pending|todo|open|next|handoff|witness|blocked)$/.test(
        normalized,
      );
    });
    const statusRaw = (cells[statusIndex] ?? '').toLowerCase();
    let status = 'unknown';
    if (/done|✅|complete/.test(statusRaw)) status = 'done';
    else if (/in.?progress|🔄|active/.test(statusRaw)) status = 'in_progress';
    else if (/pending|todo|open|next/.test(statusRaw)) status = 'pending';
    else if (/handoff|witness|blocked/.test(statusRaw)) status = 'handoff';
    stories.push({
      id,
      status,
      title: cells[1] ?? null,
      owner: statusIndex >= 0 ? (cells[statusIndex + 1] ?? null) : null,
    });
  }
  return stories;
}

function runNextWork(scriptRel) {
  const abs = join(repoRoot(), scriptRel);
  if (!existsSync(abs)) return null;
  const r = spawnSync(process.execPath, [abs], {
    cwd: repoRoot(),
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  if (r.status !== 0) return null;
  try {
    return JSON.parse(r.stdout);
  } catch {
    return null;
  }
}

function loadCrossRepoRefs() {
  const rw = readJson('ops/coordination/remaining-work.json');
  if (!rw?.items?.length) return [];
  return rw.items.map((item) => ({
    id: item.id ?? item.storyId ?? null,
    ownerRepo: item.ownerRepo ?? item.repo ?? null,
    status: item.status ?? null,
    traceId: item.traceId ?? null,
  }));
}

export function syncProductManagement() {
  const pmManifest = readJson('pm/manifest.json');
  const rootManifest = readJson('workspace/manifest.json');
  const repo = rootManifest?.repo ?? pmManifest?.repo ?? 'unknown';

  const nextWorkScript = pmManifest?.local?.nextWorkScript ?? 'platform/scripts/agent-next-work.mjs';
  const nextJson = runNextWork(nextWorkScript);

  const roadmapPath = resolveRoadmap(pmManifest);
  let stories = [];
  if (roadmapPath) {
    const md = readFileSync(join(repoRoot(), roadmapPath), 'utf8');
    stories = parseRoadmapStories(md);
  }

  const backlog = {
    $schema: 'gtcx://workspace/pm-backlog/v1',
    repo,
    updated: new Date().toISOString().slice(0, 10),
    syncSource: 'pnpm pm:sync',
    active: nextJson?.next
      ? {
          storyId: nextJson.next.storyId,
          title: nextJson.next.title,
          status: nextJson.next.status,
          owner: nextJson.next.owner ?? null,
          tier: nextJson.selection?.tier ?? null,
        }
      : null,
    backlogClear: nextJson?.backlogClear ?? null,
    stories,
    crossRepoRefs: loadCrossRepoRefs(),
    agileHub: pmManifest?.agileHub ?? null,
    roadmapPath,
  };

  const out = pmManifest?.sync?.output ?? 'ops/pm/backlog.json';
  writeJson(out, backlog);
  return backlog;
}
