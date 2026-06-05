#!/usr/bin/env node
/**
 * @fileoverview Ensure every Prometheus alert in 04-ship/monitoring/alerts/
 * carries a `runbook_url` annotation pointing at the canonical alerts
 * runbook section (01-docs/04-ops/runbooks/alerts.md#<alertname-lower>).
 *
 * Rationale: the prior repo had 0 alerts with `runbook_url` despite
 * routing P0 pages to PagerDuty. An on-call engineer paged at 02:00
 * received an alert with no actionable runbook link. This script is
 * idempotent — runs as part of `pnpm test` to prevent regression.
 *
 * Behavior:
 *   - `--check`: exit non-zero if any alert is missing runbook_url
 *   - default:   add the annotation in place
 *
 * The script does a structural find — it does NOT round-trip YAML
 * through a parser, so comments and formatting are preserved exactly.
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ALERTS_DIR = join(REPO_ROOT, 'infra', 'monitoring', 'alerts');
const RUNBOOK_PATH = join(REPO_ROOT, 'docs', 'operations', 'runbooks', 'alerts.md');
const RUNBOOK_BASE =
  'https://github.com/gtcx-ecosystem/gtcx-infrastructure/blob/main/01-docs/04-ops/runbooks/alerts.md';

const checkOnly = process.argv.includes('--check');

/**
 * Compute the GitHub-style markdown anchor for a heading text. Matches
 * the algorithm GitHub uses: lowercase, drop everything that isn't
 * a-z 0-9 space underscore or hyphen, trim, collapse runs of whitespace
 * to single hyphens.
 *
 * @param {string} heading
 * @returns {string}
 */
export function ghAnchor(heading) {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9 _-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * Extract every markdown heading from a runbook text and return the set
 * of anchor strings each heading would resolve to.
 *
 * @param {string} runbookText
 * @returns {Set<string>}
 */
export function extractAnchors(runbookText) {
  const anchors = new Set();
  for (const line of runbookText.split('\n')) {
    const m = line.match(/^#+\s+(.+?)\s*$/);
    if (!m) continue;
    const a = ghAnchor(m[1]);
    if (a) anchors.add(a);
  }
  return anchors;
}

/**
 * Extract every `runbook_url:` reference and return {alertFile, anchor}
 * tuples for each one that points at the canonical alerts runbook.
 *
 * @param {Record<string, string>} alertFiles - filename → text
 * @returns {Array<{ file: string, anchor: string }>}
 */
export function extractReferencedAnchors(alertFiles) {
  const refs = [];
  const rx = /runbook_url:\s*['"][^'"]*alerts\.md#([^'"]+)['"]/g;
  for (const [file, text] of Object.entries(alertFiles)) {
    for (const m of text.matchAll(rx)) {
      refs.push({ file, anchor: m[1] });
    }
  }
  return refs;
}

/**
 * Find every alert in a file and ensure its annotations: block contains
 * a runbook_url line. Returns { changed, missing[], totalAlerts }.
 *
 * Algorithm:
 *   1. Walk lines top-to-bottom.
 *   2. On `      - alert: <Name>`, remember the name and search forward
 *      within the same alert block (until next `      - alert:` or
 *      `  - name:` or EOF) for an `        annotations:` line.
 *   3. Within that alert block, if any line matches `^\s+runbook_url:`,
 *      mark as OK. Otherwise insert as the first child of annotations.
 *
 * @param {string} text
 * @returns {{ updated: string, missing: string[], totalAlerts: number, changed: boolean }}
 */
function processFile(text) {
  const lines = text.split('\n');
  const alertStart = /^\s*- alert:\s+([A-Za-z0-9_-]+)\s*$/;
  const annotationsStart = /^(\s+)annotations:\s*$/;
  const runbookUrl = /^\s+runbook_url:/;
  const blockBoundary = /^(\s*- alert:|\s*- name:|groups:)/;

  let i = 0;
  const out = [];
  const missing = [];
  let totalAlerts = 0;
  let changed = false;

  while (i < lines.length) {
    const m = lines[i].match(alertStart);
    if (!m) {
      out.push(lines[i]);
      i += 1;
      continue;
    }

    const alertName = m[1];
    totalAlerts += 1;
    out.push(lines[i]);
    i += 1;

    // Collect the alert block until the next boundary or EOF.
    const blockStart = out.length;
    let annotationsLineInOut = -1;
    let annotationsIndent = '';
    let hasRunbookUrl = false;

    while (i < lines.length && !blockBoundary.test(lines[i])) {
      const an = lines[i].match(annotationsStart);
      if (an) {
        annotationsLineInOut = out.length;
        annotationsIndent = an[1];
      } else if (runbookUrl.test(lines[i])) {
        hasRunbookUrl = true;
      }
      out.push(lines[i]);
      i += 1;
    }

    if (hasRunbookUrl) continue;

    if (annotationsLineInOut === -1) {
      // No annotations block — synthesize one right after the alert
      // line. We assume the labels: block (4 spaces deeper) exists; use
      // its indentation as a guide. Fallback to 8 spaces total.
      const guess = inferIndent(out, blockStart) ?? '        ';
      const annot = `${guess}annotations:`;
      const url = `${guess}  runbook_url: '${RUNBOOK_BASE}#${alertName.toLowerCase()}'`;
      // Insert at end of block (just before exit).
      out.push(annot, url);
      missing.push(alertName);
      changed = true;
      continue;
    }

    // Insert runbook_url as the first child of annotations.
    const childIndent = `${annotationsIndent}  `;
    const insertLine = `${childIndent}runbook_url: '${RUNBOOK_BASE}#${alertName.toLowerCase()}'`;
    out.splice(annotationsLineInOut + 1, 0, insertLine);
    missing.push(alertName);
    changed = true;
  }

  return {
    updated: out.join('\n'),
    missing,
    totalAlerts,
    changed,
  };
}

/**
 * Infer the indentation used by sibling keys inside an alert block, by
 * looking at the line just after `- alert: ...` (typically `expr:` or
 * `for:`).
 *
 * @param {string[]} out
 * @param {number} blockStart
 * @returns {string | null}
 */
function inferIndent(out, blockStart) {
  for (let k = blockStart; k < out.length; k += 1) {
    const m = out[k].match(/^(\s+)[a-z_]+:/);
    if (m) return m[1];
  }
  return null;
}

function main() {
  const files = readdirSync(ALERTS_DIR)
    .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
    .map((f) => join(ALERTS_DIR, f))
    .sort();

  const allMissing = [];
  let totalAlerts = 0;
  let totalChangedFiles = 0;

  for (const file of files) {
    const original = readFileSync(file, 'utf8');
    const result = processFile(original);
    totalAlerts += result.totalAlerts;
    for (const name of result.missing) {
      allMissing.push({ file: file.replace(`${REPO_ROOT}/`, ''), alert: name });
    }
    if (result.changed) {
      totalChangedFiles += 1;
      if (!checkOnly) writeFileSync(file, result.updated);
    }
  }

  if (checkOnly) {
    if (allMissing.length > 0) {
      console.error(
        `[alerts-add-runbook-url] ${allMissing.length} alert(s) missing runbook_url:`
      );
      for (const m of allMissing) {
        console.error(`  - ${m.file}: ${m.alert}`);
      }
      console.error(
        '\nRun `node 03-platform/tools/03-platform/scripts/alerts-add-runbook-url.mjs` to add them.'
      );
      process.exit(1);
    }

    // Second gate: every runbook_url anchor must resolve in alerts.md.
    // The prior gate confirmed annotations exist; this one prevents the
    // "44 of 44 annotated, 31 of 44 anchors dead" outcome the audit
    // surfaced.
    const runbookText = readFileSync(RUNBOOK_PATH, 'utf8');
    const validAnchors = extractAnchors(runbookText);
    const alertFiles = Object.fromEntries(
      files.map((f) => [f.replace(`${REPO_ROOT}/`, ''), readFileSync(f, 'utf8')])
    );
    const refs = extractReferencedAnchors(alertFiles);
    const deadRefs = refs.filter((r) => !validAnchors.has(r.anchor));
    if (deadRefs.length > 0) {
      const uniqueDead = [...new Set(deadRefs.map((r) => r.anchor))].sort();
      console.error(
        `[alerts-add-runbook-url] ${uniqueDead.length} runbook_url anchor(s) point at sections that do not exist in alerts.md:`
      );
      for (const anchor of uniqueDead) {
        const ref = deadRefs.find((r) => r.anchor === anchor);
        console.error(`  - #${anchor}  (referenced from ${ref.file})`);
      }
      console.error(
        '\nAdd a `### ' +
          uniqueDead[0] +
          '` (etc.) section to 01-docs/04-ops/runbooks/alerts.md so the\n' +
          'on-call engineer paged at 02:00 lands on a real runbook section, not a 404.'
      );
      process.exit(1);
    }

    console.log(
      `[alerts-add-runbook-url] ${totalAlerts} alerts carry runbook_url; all ${refs.length} anchors resolve`
    );
    return;
  }

  if (totalChangedFiles === 0) {
    console.log(`[alerts-add-runbook-url] no changes needed (${totalAlerts} alerts checked)`);
    return;
  }
  console.log(
    `[alerts-add-runbook-url] added runbook_url to ${allMissing.length} alert(s) across ${totalChangedFiles} file(s)`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main();
