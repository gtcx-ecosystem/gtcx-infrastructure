#!/usr/bin/env node
// Mirror `docs/gitbook/docs-site/` from the repo root into
// `src/content/docs/` so Astro Starlight can pick it up as content
// collection entries.
//
// We rewrite the slug for `index.md` -> `index.md` (root page) and
// strip the `README.md` (not part of the public docs).

import { mkdir, readdir, readFile, writeFile, rm, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..', '..');
const sourceDir = join(repoRoot, 'docs', 'gitbook', 'docs-site');
const targetDir = resolve(__dirname, '..', 'src', 'content', 'docs');

const SKIP_FILES = new Set(['README.md']);

async function ensureClean(dir) {
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
}

async function listMarkdown(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter(e => e.isFile() && e.name.endsWith('.md') && !SKIP_FILES.has(e.name))
    .map(e => e.name);
}

function isDraft(frontmatter) {
  return /^status:\s*['"]?draft['"]?\s*$/m.test(frontmatter);
}

async function syncFile(name) {
  const src = join(sourceDir, name);
  const raw = await readFile(src, 'utf8');
  const fm = raw.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? '';

  if (process.env.DOCS_SITE_SKIP_DRAFTS === '1' && isDraft(fm)) {
    return { name, skipped: 'draft' };
  }

  const out = join(targetDir, name);
  await writeFile(out, raw);
  return { name, skipped: null };
}

async function main() {
  try {
    await stat(sourceDir);
  } catch {
    console.error(`source directory missing: ${sourceDir}`);
    process.exit(1);
  }

  await ensureClean(targetDir);
  const files = await listMarkdown(sourceDir);
  if (files.length === 0) {
    console.error(`no markdown files found in ${sourceDir}`);
    process.exit(1);
  }

  const results = await Promise.all(files.map(syncFile));
  const synced = results.filter(r => !r.skipped);
  const skipped = results.filter(r => r.skipped);

  console.log(`synced ${synced.length} file(s) -> ${targetDir}`);
  for (const r of synced) console.log(`  ${r.name}`);
  if (skipped.length > 0) {
    console.log(`skipped ${skipped.length} draft file(s)`);
    for (const r of skipped) console.log(`  ${r.name} (${r.skipped})`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
