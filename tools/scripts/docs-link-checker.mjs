#!/usr/bin/env node
/**
 * @fileoverview Docs Link Checker
 *
 * Scans all markdown files in docs/ and validates that internal relative
 * links resolve to existing files.
 *
 * Usage:
 *   node tools/scripts/docs-link-checker.mjs
 *
 * Exit codes:
 *   0 = all links valid
 *   1 = one or more broken links found
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// REPO_ROOT is resolved relative to this script's location, not cwd, so
// the link checker works from any working directory (including from
// inside a tools/* package after a publish or test run).
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..', '..');
const DOCS_ROOT = resolve(REPO_ROOT, 'docs');

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, files);
    } else if (entry.endsWith('.md')) {
      files.push(relative(DOCS_ROOT, fullPath));
    }
  }
  return files;
}

const markdownFiles = walk(DOCS_ROOT);
let broken = 0;
let total = 0;

for (const file of markdownFiles) {
  const content = readFileSync(join(DOCS_ROOT, file), 'utf8');
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const linkText = match[1];
    const linkTarget = match[2];
    total++;

    // Skip external URLs and anchors
    if (/^(https?:|mailto:|#)/.test(linkTarget)) {
      continue;
    }

    // Resolve relative to the markdown file's directory
    const fileDir = dirname(join(DOCS_ROOT, file));
    const resolved = resolve(fileDir, linkTarget);

    if (!existsSync(resolved)) {
      console.error(`BROKEN: ${file} → "${linkText}" → ${linkTarget}`);
      broken++;
    }
  }
}

console.log(`Checked ${total} links across ${markdownFiles.length} markdown files.`);

if (broken > 0) {
  console.error(`\n${broken} broken link(s) found.`);
  process.exit(1);
}

console.log('All internal links resolve correctly.');
process.exit(0);
