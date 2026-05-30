#!/usr/bin/env node
/**
 * @fileoverview Detect (and optionally fix) duplicated YAML frontmatter
 * blocks in docs/operations/runbooks/.
 *
 * Background: a session-backfill batch update prepended a new
 * frontmatter block to every runbook without removing the original,
 * leaving every file with two back-to-back `---` blocks. Markdown
 * parsers only read the first, so the curated `tier: critical` and
 * specific tags on disaster-recovery / deployment / rollback runbooks
 * were silently replaced with template values (`tier: standard`, generic
 * tags). The 10/10 internal sign-off scored these runbooks as
 * machine-readable; they were partly readable, with the wrong metadata.
 *
 * Modes:
 *   --check  exit non-zero if any runbook has duplicated frontmatter
 *   default  merge the two blocks in place (original wins on conflicts;
 *            keys present only in the new block are added; date := max)
 *
 * Idempotent: re-running on a clean file is a no-op.
 */

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
// Scan operations/runbooks AND the agents/ tree — both suffered the
// session-backfill double-frontmatter pattern.
const SCAN_DIRS = [
  join(REPO_ROOT, 'docs', 'operations', 'runbooks'),
  join(REPO_ROOT, 'docs', 'agents'),
];
const checkOnly = process.argv.includes('--check');

const FRONTMATTER_RX = /^---\n([\s\S]*?)\n---/;

/**
 * Detect duplicated front-matter: look for two `---` … `---` blocks
 * separated only by whitespace at the file head.
 *
 * @param {string} text
 * @returns {{
 *   hasDuplicate: boolean,
 *   firstBlock?: string,
 *   secondBlock?: string,
 *   restAfterSecond?: string,
 * }}
 */
function detectDuplicate(text) {
  const m1 = text.match(FRONTMATTER_RX);
  if (!m1) return { hasDuplicate: false };
  const afterFirst = text.slice(m1[0].length);
  // Allow optional whitespace between blocks.
  const gap = afterFirst.match(/^\s*/)[0];
  const tail = afterFirst.slice(gap.length);
  const m2 = tail.match(FRONTMATTER_RX);
  if (!m2) return { hasDuplicate: false };
  return {
    hasDuplicate: true,
    firstBlock: m1[1],
    secondBlock: m2[1],
    restAfterSecond: tail.slice(m2[0].length),
  };
}

/**
 * Parse a YAML-frontmatter block into an ordered map. Supports the
 * limited subset present in this repo: top-level scalars, single-line
 * arrays, single- or double-quoted strings, bare values. Comments and
 * nested objects are intentionally unsupported — the runbook frontmatter
 * has never used them.
 *
 * @param {string} block
 * @returns {Map<string, string>}
 */
function parseBlock(block) {
  const map = new Map();
  for (const rawLine of block.split('\n')) {
    const line = rawLine.replace(/\s+$/, '');
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m) continue;
    map.set(m[1], m[2]);
  }
  return map;
}

/**
 * Normalize a frontmatter value for comparison: strip outer quotes,
 * collapse single↔double, return the inner string. Used only by the
 * date-max comparator and the equivalence check.
 *
 * @param {string} v
 * @returns {string}
 */
function stripQuotes(v) {
  return v.replace(/^['"]/, '').replace(/['"]$/, '');
}

/**
 * Merge the two parsed blocks. The original (second) block wins on
 * conflicts — it carries hand-curated values (`tier: critical`, specific
 * tags, owner). Keys present only in the new (first) block are added:
 * those are typically the agent-baseline additions (`agent_id`,
 * `trust_score`, `autonomy_level`). `date` is set to the lexically
 * larger ISO-8601 value (newer wins).
 *
 * @param {Map<string, string>} first
 * @param {Map<string, string>} second
 * @returns {string[]}
 */
function mergeBlocks(first, second) {
  const merged = new Map(second);
  for (const [k, v] of first) {
    if (!merged.has(k)) merged.set(k, v);
  }
  if (first.has('date') && second.has('date')) {
    const a = stripQuotes(first.get('date'));
    const b = stripQuotes(second.get('date'));
    merged.set('date', a > b ? first.get('date') : second.get('date'));
  }
  // Stable ordering: title, status, date first; then everything else
  // in insertion order. Keeps the file diff minimal.
  const order = ['title', 'status', 'date'];
  const lines = [];
  for (const k of order) {
    if (merged.has(k)) {
      lines.push(`${k}: ${merged.get(k)}`);
      merged.delete(k);
    }
  }
  for (const [k, v] of merged) {
    lines.push(`${k}: ${v}`);
  }
  return lines;
}

function processFile(text) {
  const det = detectDuplicate(text);
  if (!det.hasDuplicate) return { changed: false, text };
  const first = parseBlock(det.firstBlock);
  const second = parseBlock(det.secondBlock);
  const mergedLines = mergeBlocks(first, second);
  const newFrontmatter = `---\n${mergedLines.join('\n')}\n---`;
  // Strip a single leading newline from the body if present so the
  // output isn't double-spaced relative to the original.
  const rest = det.restAfterSecond.replace(/^\n/, '\n');
  return { changed: true, text: `${newFrontmatter}${rest}` };
}

function main() {
  const files = [];
  function walk(dir) {
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else if (entry.endsWith('.md')) files.push(p);
    }
  }
  for (const dir of SCAN_DIRS) {
    try {
      walk(dir);
    } catch {
      // Directory doesn't exist — skip silently.
    }
  }

  const offenders = [];
  let changedCount = 0;

  for (const file of files) {
    const original = readFileSync(file, 'utf8');
    const result = processFile(original);
    if (result.changed) {
      offenders.push(file.replace(`${REPO_ROOT}/`, ''));
      if (!checkOnly) {
        writeFileSync(file, result.text);
        changedCount += 1;
      }
    }
  }

  if (checkOnly) {
    if (offenders.length > 0) {
      console.error(
        `[runbook-frontmatter-check] ${offenders.length} file(s) with duplicated frontmatter:`
      );
      for (const f of offenders) console.error(`  - ${f}`);
      console.error('\nRun `node tools/scripts/runbook-frontmatter-check.mjs` to merge.');
      process.exit(1);
    }
    console.log(`[runbook-frontmatter-check] ${files.length} runbook(s) clean`);
    return;
  }

  if (changedCount === 0) {
    console.log(`[runbook-frontmatter-check] no changes (${files.length} runbooks clean)`);
    return;
  }
  console.log(`[runbook-frontmatter-check] merged frontmatter in ${changedCount} file(s)`);
}

main();
