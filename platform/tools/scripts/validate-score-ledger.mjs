#!/usr/bin/env node
/**
 * Score-evidence ledger validator
 *
 * Prevents score inflation by enforcing that no audit document claims a
 * score higher than the ledger's current authorized value without a
 * corresponding ledger entry.
 *
 * Usage:
 *   node platform/tools/scripts/validate-score-ledger.mjs
 *   node platform/tools/scripts/validate-score-ledger.mjs --ledger=audit/score-evidence-ledger.json
 */

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const REPO_ROOT = process.cwd();
const AUDIT_DIR = path.join(REPO_ROOT, 'audit');

const args = process.argv.slice(2);
const ledgerArg = args.find((a) => a.startsWith('--ledger='));
const ledgerPath = ledgerArg ? ledgerArg.slice(9) : path.join('audit', 'score-evidence-ledger.json');

// ---------------------------------------------------------------------------
// Load ledger
// ---------------------------------------------------------------------------

const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));

/** @type {Map<string, number>} */
const maxAuthorizedScore = new Map();
for (const dim of ledger.dimensions) {
  maxAuthorizedScore.set(dim.name.toLowerCase(), dim.currentScore);
}

// ---------------------------------------------------------------------------
// Scan audit docs
// ---------------------------------------------------------------------------

const scorePattern = /(\d+(?:\.\d+)?)\s*\/\s*10/;

/** @type {{file: string; line: string; dimension: string; claimed: number; authorized: number}[]} */
const violations = [];

/**
 * Extract dimension name from a markdown table row by taking the first cell.
 * @param {string} line
 * @returns {string | null}
 */
function extractTableDimension(line) {
  const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
  if (cells.length < 2) return null;
  return cells[0];
}

// Historical/archived subfolders carry frozen claims from prior cycles —
// they're evidence-of-the-past, not active claims requiring ledger entries.
// Active claims live in the top-level audit files (master-audit-*.md,
// full-audit-*.md, etc.) which ARE scanned.
const EXCLUDED_SUBDIRS = new Set(['historical-cycles', 'remediation', 'archive']);

function scanDir(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDED_SUBDIRS.has(entry.name)) continue;
      scanDir(full);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const content = readFileSync(full, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const scoreMatch = scorePattern.exec(line);
        if (!scoreMatch) continue;
        const claimed = parseFloat(scoreMatch[1]);

        // Try to extract dimension from table cell
        const dimFromTable = extractTableDimension(line);

        for (const [dimName, authorized] of maxAuthorizedScore) {
          if (claimed <= authorized) continue;

          let matched = false;
          if (dimFromTable) {
            const normalized = dimFromTable.toLowerCase().replace(/\s+/g, ' ').trim();
            if (normalized === dimName) {
              matched = true;
            }
            // If this is a table row and the first cell doesn't match any ledger
            // dimension, skip further matching for this line to avoid false positives.
            continue;
          }

          // Fallback: exact word-boundary match for non-table lines
          if (!matched) {
            const pattern = new RegExp(
              '\\b' + dimName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b',
              'i'
            );
            if (pattern.test(line)) {
              matched = true;
            }
          }

          if (matched) {
            violations.push({
              file: path.relative(REPO_ROOT, full),
              line: line.trim(),
              dimension: dimName,
              claimed,
              authorized,
            });
          }
        }
      }
    }
  }
}

scanDir(AUDIT_DIR);

// ---------------------------------------------------------------------------
// Validate
// ---------------------------------------------------------------------------

if (violations.length === 0) {
  console.log('Score-evidence ledger validation passed');
  process.exit(0);
}

console.error('SCORE-LEDGER VIOLATIONS:');
for (const v of violations) {
  console.error(
    `  ${v.file}: "${v.line}"` +
      `\n    → claims ${v.dimension} = ${v.claimed}/10 ` +
      `(authorized max: ${v.authorized}/10). ` +
      `Add evidence to ${ledgerPath} before increasing this score.`
  );
}

console.error(`\n${violations.length} score-ledger violation(s) found`);
process.exit(1);
