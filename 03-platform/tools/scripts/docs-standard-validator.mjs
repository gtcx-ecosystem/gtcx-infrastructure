#!/usr/bin/env node
/**
 * Docs-standard validator
 *
 * Enforces the repo-local docs standard established in the
 * 2026-05-10 docs-standard compliance pass.  Replaces the stub
 * docs-links CI job with real validation.
 *
 * Checks:
 *   1. Broken internal markdown links
 *   2. Missing frontmatter on substantive docs
 *   3. Non-canonical filenames (uppercase, spaces, etc.)
 *   4. Empty directories under 01-docs/
 *   5. Missing README/index in docs subdirectories
 *
 * Usage:
 *   node 03-platform/tools/03-platform/scripts/docs-standard-validator.mjs
 *   node 03-platform/tools/03-platform/scripts/docs-standard-validator.mjs --dump-baseline > .docs-exceptions.json
 *   node 03-platform/tools/03-platform/scripts/docs-standard-validator.mjs --baseline=.docs-exceptions.json
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// REPO_ROOT is resolved relative to this script's location, not cwd.
// The script lives at <repo>/03-platform/tools/03-platform/scripts/, so two dirname() calls land
// at the repo root regardless of where the user invoked it from.
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
const DOCS_ROOT = path.join(REPO_ROOT, 'docs');

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const dumpBaseline = args.includes('--dump-baseline');
const baselineArg = args.find((a) => a.startsWith('--baseline='));
const baselinePath = baselineArg ? baselineArg.slice(11) : null;

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const EXCLUDED_PATHS = [
  /node_modules/,
  /\.git/,
  /\.baseline/,
  /\.turbo/,
  /dist/,
  /build/,
  /audit\/evidence\/ci-dry-run/,
];

// Draft templates, historical archives, and generated reports are not substantive.
const NON_SUBSTANTIVE_PATTERNS = [
  /\/templates\//,
  /\/archive\//,
  /\/external\//,
  /_template\.md$/,
  /_draft\.md$/,
  /_example\.md$/,
  /\.report\.md$/,
];

const ALLOWED_UPPERCASE_NAMES = new Set([
  'README.md',
  'INDEX.md',
  'CLAUDE.md',
  'CONTRIBUTING.md',
  'LICENSE',
  'SECURITY.md',
  'CHANGELOG.md',
  'SCORING.md',
  'AUDIT-RECONCILIATION.md',
]);

// ADR filenames are an approved exception per docs-standard-compliance audit.
const ADR_PATTERN = /^adr-\d+/i;

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function isExcluded(filePath) {
  return EXCLUDED_PATHS.some((p) => p.test(filePath));
}

function isSubstantiveDoc(filePath) {
  return !NON_SUBSTANTIVE_PATTERNS.some((p) => p.test(filePath));
}

function isAllowedUppercase(basename) {
  if (ALLOWED_UPPERCASE_NAMES.has(basename)) return true;
  if (ADR_PATTERN.test(basename)) return true;
  return false;
}

function walk(dir, callback) {
  if (isExcluded(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (isExcluded(full)) continue;
    if (entry.isDirectory()) {
      walk(full, callback);
    } else if (entry.isFile()) {
      callback(full);
    }
  }
}

function relativeDocs(filePath) {
  return path.relative(REPO_ROOT, filePath);
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

function checkLinks(violations) {
  /** @type {Map<string, string[]>} */
  const fileLinks = new Map();

  walk(DOCS_ROOT, (filePath) => {
    if (!filePath.endsWith('.md')) return;
    const content = readFileSync(filePath, 'utf8');
    const links = [];
    const linkRegex = /\[([^\]]*)\]\(([^)\s"]+)(?:\s+"[^"]*")?\)/g;
    let m;
    while ((m = linkRegex.exec(content)) !== null) {
      links.push(m[2]);
    }
    fileLinks.set(filePath, links);
  });

  for (const [filePath, links] of fileLinks) {
    for (const raw of links) {
      if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) continue;
      if (raw.startsWith('#')) continue;

      const [targetPath] = raw.split('#');
      const resolved = path.resolve(path.dirname(filePath), targetPath);

      if (path.extname(targetPath)) {
        if (!existsSync(resolved)) {
          violations.push({
            type: 'broken-link',
            file: relativeDocs(filePath),
            target: relativeDocs(resolved),
            detail: `Link target does not exist: ${raw}`,
          });
        }
        continue;
      }

      const candidates = [
        resolved + '.md',
        path.join(resolved, 'README.md'),
        path.join(resolved, 'index.md'),
      ];
      if (!candidates.some((c) => existsSync(c))) {
        violations.push({
          type: 'broken-link',
          file: relativeDocs(filePath),
          target: relativeDocs(resolved),
          detail: `Link target does not exist: ${raw}`,
        });
      }
    }
  }
}

function checkFrontmatter(violations) {
  walk(DOCS_ROOT, (filePath) => {
    if (!filePath.endsWith('.md')) return;
    if (!isSubstantiveDoc(filePath)) return;

    const basename = path.basename(filePath);
    if (basename === 'README.md' || basename === 'INDEX.md' || basename === 'index.md') return;
    // ADRs use their own header convention
    if (ADR_PATTERN.test(basename)) return;

    const content = readFileSync(filePath, 'utf8');

    // Check for YAML frontmatter first
    const hasYamlFrontmatter = content.trimStart().startsWith('---\n');
    if (hasYamlFrontmatter) {
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (fmMatch) {
        const fm = fmMatch[1];
        const hasStatus = /^status:/m.test(fm);
        const hasDate = /^date:/m.test(fm);
        const hasOwner = /^owner:/m.test(fm);

        if (!hasStatus || !hasDate || !hasOwner) {
          const missing = [
            !hasStatus && 'status',
            !hasDate && 'date',
            !hasOwner && 'owner',
          ].filter(Boolean);
          violations.push({
            type: 'missing-frontmatter',
            file: relativeDocs(filePath),
            detail: `Missing YAML frontmatter fields: ${missing.join(', ')}`,
          });
        }
        return; // Valid YAML frontmatter found
      }
    }

    // Fallback: check old-style blockquote metadata
    const hasStatus = /\*\*Status:\*\*|^Status:/m.test(content);
    const hasDate = /\*\*Date:\*\*|^Date:/m.test(content);
    const hasOwner = /\*\*Owner:\*\*|^Owner:/m.test(content);

    if (!hasStatus || !hasDate || !hasOwner) {
      const missing = [
        !hasStatus && 'Status',
        !hasDate && 'Date',
        !hasOwner && 'Owner',
      ].filter(Boolean);
      violations.push({
        type: 'missing-frontmatter',
        file: relativeDocs(filePath),
        detail: `Missing frontmatter fields: ${missing.join(', ')}`,
      });
    }
  });
}

function checkNaming(violations) {
  walk(DOCS_ROOT, (filePath) => {
    if (!filePath.endsWith('.md')) return;
    const basename = path.basename(filePath);
    if (isAllowedUppercase(basename)) return;

    if (!/^[a-z0-9]+(-[a-z0-9]+)*\.md$/.test(basename)) {
      violations.push({
        type: 'naming',
        file: relativeDocs(filePath),
        detail: `Filename must be lowercase-with-hyphens (got: ${basename})`,
      });
    }
  });
}

function checkEmptyDirs(violations) {
  function scan(dir) {
    if (isExcluded(dir)) return false;
    const entries = readdirSync(dir, { withFileTypes: true });
    const hasContent = entries.some((e) => {
      if (!e.isDirectory()) return true;
      const sub = path.join(dir, e.name);
      return scan(sub);
    });
    if (!hasContent) {
      violations.push({
        type: 'empty-dir',
        file: relativeDocs(dir),
        detail: 'Directory contains no files',
      });
    }
    return hasContent;
  }
  scan(DOCS_ROOT);
}

function checkIndex(violations) {
  // Top-level audience collections are approved structural deviations.
  const TOP_LEVEL_DEVIATIONS = new Set([
    'agents',
    'agile',
    'architecture',
    'assessments',
    'audit',
    'compliance',
    'decisions',
    'devops',
    'engineering',
    'external',
    'gtm',
    'onboarding',
    'operations',
    'principles',
    'reference',
    'release',
    'remediation',
    'research',
    'scripts',
    'security',
    'specs',
  ]);

  function scan(dir, depth = 0) {
    if (isExcluded(dir)) return;
    const entries = readdirSync(dir, { withFileTypes: true });
    const subdirs = entries.filter((e) => e.isDirectory());

    for (const sub of subdirs) {
      const subPath = path.join(dir, sub.name);
      if (isExcluded(subPath)) continue;

      const isTopLevel = depth === 0;
      const hasIndex =
        existsSync(path.join(subPath, 'README.md')) ||
        existsSync(path.join(subPath, 'index.md'));

      if (!hasIndex && !(isTopLevel && TOP_LEVEL_DEVIATIONS.has(sub.name))) {
        violations.push({
          type: 'missing-index',
          file: relativeDocs(subPath),
          detail: 'Subdirectory missing README.md or index.md',
        });
      }
      scan(subPath, depth + 1);
    }
  }
  scan(DOCS_ROOT);
}

// ---------------------------------------------------------------------------
// Baseline helpers
// ---------------------------------------------------------------------------

function makeKey(v) {
  return `${v.type}|${v.file}`;
}

function loadBaseline(path) {
  try {
    const raw = readFileSync(path, 'utf8');
    const data = JSON.parse(raw);
    return new Set((data.exceptions || []).map(makeKey));
  } catch {
    return new Set();
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const violations = [];

checkLinks(violations);
checkFrontmatter(violations);
checkNaming(violations);
checkEmptyDirs(violations);
checkIndex(violations);

if (dumpBaseline) {
  const baseline = {
    version: 1,
    generatedAt: new Date().toISOString(),
    exceptions: violations.map((v) => ({
      type: v.type,
      file: v.file,
      detail: v.detail,
      reviewBy: '2026-06-30',
    })),
  };
  console.log(JSON.stringify(baseline, null, 2));
  process.exit(0);
}

let filtered = violations;
if (baselinePath) {
  const baseline = loadBaseline(baselinePath);
  filtered = violations.filter((v) => !baseline.has(makeKey(v)));
}

if (filtered.length === 0) {
  console.log('Docs-standard validation passed');
  process.exit(0);
}

const byType = new Map();
for (const v of filtered) {
  const list = byType.get(v.type) ?? [];
  list.push(v);
  byType.set(v.type, list);
}

let total = 0;
for (const [type, list] of byType) {
  console.error(`\n${type.toUpperCase()} (${list.length}):`);
  for (const v of list) {
    console.error(`  ${v.file}`);
    console.error(`    → ${v.detail}`);
  }
  total += list.length;
}

console.error(`\n${total} docs-standard violation(s) found`);
process.exit(1);
