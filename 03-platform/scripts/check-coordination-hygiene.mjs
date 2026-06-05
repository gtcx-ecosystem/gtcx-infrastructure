#!/usr/bin/env node
/**
 * Protocol 24 — warn when P0 work is blocked without a durable coordination record.
 *
 * Usage:
 *   node 03-platform/scripts/check-coordination-hygiene.mjs
 *   node 03-platform/scripts/check-coordination-hygiene.mjs --strict   # exit 1 on warnings
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const strict = process.argv.includes('--strict');
const warnings = [];

function read(rel) {
  const abs = join(ROOT, rel);
  return existsSync(abs) ? readFileSync(abs, 'utf8') : '';
}

function hasInboundOrCoordinationDoc() {
  const dirs = [
    '01-docs/08-gtm/inbound-tickets',
    '01-docs/coordination',
    '01-docs/04-ops/inbound-tickets',
  ];
  for (const dir of dirs) {
    const abs = join(ROOT, dir);
    if (!existsSync(abs)) continue;
    const files = readdirSync(abs).filter(
      (f) => f.endsWith('.md') && (f.startsWith('from-') || f.startsWith('to-')),
    );
    if (files.length > 0) return { ok: true, hint: `${dir}/${files[0]}` };
    const briefs = readdirSync(abs).filter((f) => f.endsWith('.md') && f.includes('coordination'));
    if (briefs.length > 0) return { ok: true, hint: `${dir}/${briefs[0]}` };
  }
  return { ok: false };
}

function dependenciesMentionBlocker() {
  const dep = read('.baseline/memory/dependencies.md');
  if (!dep) return false;
  return /\bblocked\b/i.test(dep) || /\bBLOCKED\b/.test(dep);
}

function pointerListsBlockers() {
  const pointer = read('01-docs/05-audit/agent-work-pointer.md');
  if (!pointer) return false;
  const m = pointer.match(/\|\s*Blocked stories\s*\|\s*([^|]+)\|/i);
  if (!m) return false;
  const cell = m[1].trim();
  return cell.length > 0 && !/^—\s*$|^-\s*$|^none$/i.test(cell);
}

function roadmapHasP0Blocked() {
  const roadmap = read('01-docs/05-audit/execution-roadmap.md');
  if (!roadmap) return false;
  const lines = roadmap.split('\n');
  for (const line of lines) {
    if (!/\|\s*P0\s*\|/i.test(line) && !/\|\s*p0\s*\|/i.test(line)) continue;
    if (/\bblocked\b/i.test(line)) return true;
  }
  return false;
}

const p0Blocked = roadmapHasP0Blocked() || pointerListsBlockers();
const hasDeps = dependenciesMentionBlocker();
const hasInbound = hasInboundOrCoordinationDoc().ok;

if (p0Blocked && !hasDeps) {
  warnings.push(
    'Roadmap has blocked P0 (or pointer lists blockers) but `.baseline/memory/dependencies.md` has no blocker entry (Protocol 24).',
  );
  warnings.push('  → Update `.baseline/memory/dependencies.md` with upstream repo and ticket link.');
}

if (p0Blocked && !hasDeps && !hasInbound && !pointerListsBlockers()) {
  warnings.push(
    '  → Or add 01-docs/08-gtm/inbound-tickets/from-<repo>-<topic>-YYYY-MM-DD.md / 01-docs/06-coordination/ brief.',
  );
  warnings.push(
    '  → Ecosystem-critical: baseline-os `pnpm ecosystem:repo:report-work` + coordination-report-latest.md',
  );
}

if (warnings.length === 0) {
  console.log('Coordination hygiene check passed (Protocol 24).');
  process.exit(0);
}

console.warn('Coordination hygiene warnings (Protocol 24):\n');
for (const w of warnings) console.warn(w);
process.exit(strict ? 1 : 0);
