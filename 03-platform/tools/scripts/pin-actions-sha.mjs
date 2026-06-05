#!/usr/bin/env node
/**
 * @fileoverview Pin every GitHub Actions `uses:` reference in
 * .github/workflows/ to a 40-char commit SHA, preserving the original
 * tag as a trailing comment. Idempotent: SHA-already-pinned lines are
 * left untouched.
 *
 * Resolution uses `git ls-remote https://github.com/<owner>/<repo>`
 * — no GitHub API token required, no rate limits.
 *
 * Modes:
 *   --check       exit non-zero if any `uses:` line is not SHA-pinned
 *   default       resolve + rewrite in place; prints the change set
 *
 * Floating refs (@main, @master, @latest) are an error and rewritten
 * to the current commit SHA of that branch — operators MUST review
 * the diff before committing.
 */

import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WORKFLOWS_DIR = join(REPO_ROOT, '.github', 'workflows');
const checkOnly = process.argv.includes('--check');

// `uses: owner/repo@ref` or `uses: owner/repo/path@ref` (reusable workflows).
// Matches both block form (`      uses: ...`) and list-item form
// (`      - uses: ...`). Permissive on whitespace around the colon so
// `uses :` (space before) and `uses:owner/repo@ref` (no space after) are
// caught too — those YAML shapes either round-trip or are silently
// non-pinned, both unacceptable. Output is normalized to `uses: ` form.
// SHA is 40 lowercase hex; anything else is a tag/branch.
export const USES_RX = /^(\s*(?:-\s+)?)uses\s*:\s*([^@\s]+)@([^\s#]+)(.*)$/;
export const SHA_RX = /^[0-9a-f]{40}$/;

// SLSA GitHub Generator reusable workflows MUST be referenced by tag (not SHA)
// because the generator downloads pre-built release binaries keyed to the tag.
// Using a SHA would cause `generate-builder` to fail with a 404.
// See: https://github.com/slsa-framework/slsa-github-generator/issues/1076
const TAG_REQUIRED_ACTIONS = new Set([
  'slsa-framework/slsa-github-generator/.github/workflows/generator_generic_slsa3.yml',
  'slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml',
]);

const cache = new Map();

function resolveSha(actionPath, ref) {
  // actionPath may be `owner/repo` or `owner/repo/sub/path`. SHA lives
  // on the root repo regardless of subpath.
  const [owner, repo] = actionPath.split('/');
  const key = `${owner}/${repo}@${ref}`;
  if (cache.has(key)) return cache.get(key);

  const url = `https://github.com/${owner}/${repo}.git`;
  // Try tags first (most common: `@v4`, `@v4.2.2`).
  let out = '';
  try {
    out = execFileSync('git', ['ls-remote', url, `refs/tags/${ref}`, `refs/tags/${ref}^{}`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    cache.set(key, { error: err.message });
    return cache.get(key);
  }

  // Prefer the dereferenced tag (^{}) line when present (annotated
  // tags); otherwise take the first line.
  const lines = out.trim().split('\n').filter(Boolean);
  if (lines.length === 0) {
    // Fall back to branch resolution for @main, @master, etc.
    try {
      const branchOut = execFileSync('git', ['ls-remote', url, `refs/heads/${ref}`], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      const branchLines = branchOut.trim().split('\n').filter(Boolean);
      if (branchLines.length > 0) {
        const sha = branchLines[0].split('\t')[0];
        cache.set(key, { sha, kind: 'branch' });
        return cache.get(key);
      }
    } catch {
      // fallthrough
    }
    cache.set(key, { error: `tag/branch not found: ${ref}` });
    return cache.get(key);
  }
  // Prefer the line ending in `^{}` (peeled annotated tag).
  const peeled = lines.find((l) => l.endsWith('^{}'));
  const chosen = peeled ?? lines[0];
  const sha = chosen.split('\t')[0];
  cache.set(key, { sha, kind: 'tag' });
  return cache.get(key);
}

function processFile(path) {
  const lines = readFileSync(path, 'utf8').split('\n');
  const changes = [];
  const out = lines.map((line) => {
    const m = line.match(USES_RX);
    if (!m) return line;
    const [, prefix, actionPath, ref, suffix] = m;
    if (SHA_RX.test(ref)) {
      // Already SHA-pinned. If the trailing comment doesn't include
      // a `# <ref>` tag annotation, leave it alone — we don't know
      // what the original tag was.
      return line;
    }
    if (TAG_REQUIRED_ACTIONS.has(actionPath)) {
      // Tag-required actions are intentionally left unpinned.
      return line;
    }
    const result = resolveSha(actionPath, ref);
    if (result.error) {
      throw new Error(`${path}: cannot resolve ${actionPath}@${ref}: ${result.error}`);
    }
    const annotation = result.kind === 'branch'
      ? `# pin: ${ref} (branch — review on dependabot bumps)`
      : `# ${ref}`;
    const cleanedSuffix = suffix.replace(/^\s*#.*$/, '').trimEnd();
    // Normalize to canonical `uses: <action>@<sha>` regardless of the
    // input shape (`uses :`, `uses:`, etc.) so the rewrite always emits
    // valid + idiomatic YAML.
    const newLine = `${prefix}uses: ${actionPath}@${result.sha} ${annotation}${cleanedSuffix ? ` ${cleanedSuffix}` : ''}`;
    changes.push({ from: line.trim(), to: newLine.trim() });
    return newLine;
  });
  return { changed: changes.length > 0, text: out.join('\n'), changes };
}

function main() {
  const files = readdirSync(WORKFLOWS_DIR)
    .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
    .map((f) => join(WORKFLOWS_DIR, f))
    .sort();

  const offenders = [];
  let totalChanges = 0;

  for (const file of files) {
    const result = processFile(file);
    if (result.changed) {
      offenders.push({ file, changes: result.changes });
      totalChanges += result.changes.length;
      if (!checkOnly) writeFileSync(file, result.text);
    }
  }

  if (checkOnly) {
    if (offenders.length > 0) {
      console.error(`[pin-actions-sha] ${totalChanges} unpinned uses: line(s) across ${offenders.length} file(s):`);
      for (const o of offenders) {
        console.error(`\n  ${o.file.replace(`${REPO_ROOT}/`, '')}`);
        for (const c of o.changes) {
          console.error(`    - ${c.from}`);
        }
      }
      console.error('\nRun `node 03-platform/tools/03-platform/scripts/pin-actions-sha.mjs` to pin them.');
      process.exit(1);
    }
    console.log('[pin-actions-sha] all GitHub Actions uses: lines are SHA-pinned');
    return;
  }

  if (totalChanges === 0) {
    console.log('[pin-actions-sha] no changes needed (already pinned)');
    return;
  }
  console.log(`[pin-actions-sha] pinned ${totalChanges} uses: line(s) across ${offenders.length} file(s)`);
  for (const o of offenders) {
    console.log(`\n  ${o.file.replace(`${REPO_ROOT}/`, '')}`);
    for (const c of o.changes) {
      console.log(`    ${c.from}`);
      console.log(`    → ${c.to}`);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
