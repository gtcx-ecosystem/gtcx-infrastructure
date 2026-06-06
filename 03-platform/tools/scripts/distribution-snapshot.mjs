#!/usr/bin/env node
/**
 * @fileoverview Distribution Snapshot
 *
 * Daily empirical measurement of whether the publish-strategy is
 * working. Pulls four signals into a single JSON snapshot:
 *
 *   - npm downloads for @gtcx/audit-signer (last day, last 7 days, last 30 days)
 *   - GitHub stars + forks + open issues for gtcx-ecosystem/gtcx-infrastructure
 *   - GitHub stars + forks + open issues for amani-amina-anai/terraform-aws-compliance-db
 *   - Last-success timestamps so a stale snapshot is detectable
 *
 * Writes to 01-docs/05-audit/distribution-snapshots/<YYYY-MM-DD>.json.
 * Idempotent — same-day reruns overwrite.
 *
 * Designed to be called by a daily GitHub Actions cron, but runs
 * locally too. Network failure on any one signal does not abort the
 * snapshot — the failing field is set to null with an error string.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..', '..', '..');
const OUTPUT_DIR = resolve(REPO_ROOT, 'docs', 'audit', 'distribution-snapshots');

const NPM_PACKAGE = '@gtcx/audit-signer';
const GITHUB_REPOS = [
  'gtcx-ecosystem/gtcx-infrastructure',
  'amani-amina-anai/terraform-aws-compliance-db',
];

const today = new Date().toISOString().slice(0, 10);

async function safeFetchJson(url, fetcher = globalThis.fetch) {
  try {
    const res = await fetcher(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'gtcx-distribution-snapshot' },
    });
    if (!res.ok) {
      return { error: `HTTP ${res.status}`, body: null };
    }
    return { error: null, body: await res.json() };
  } catch (err) {
    return { error: err.message ?? String(err), body: null };
  }
}

export async function fetchNpmDownloads(packageName, fetcher = globalThis.fetch) {
  const encoded = encodeURIComponent(packageName);
  const periods = ['last-day', 'last-week', 'last-month'];
  const out = {};
  for (const period of periods) {
    const url = `https://api.npmjs.org/downloads/point/${period}/${encoded}`;
    const { error, body } = await safeFetchJson(url, fetcher);
    if (error) {
      out[period] = { error, downloads: null };
    } else {
      out[period] = { downloads: Number(body?.downloads) || 0 };
    }
  }
  return out;
}

export async function fetchGithubRepoStats(repo, fetcher = globalThis.fetch) {
  const url = `https://api.github.com/repos/${repo}`;
  const { error, body } = await safeFetchJson(url, fetcher);
  if (error) {
    return { error, stars: null, forks: null, openIssues: null };
  }
  return {
    stars: body.stargazers_count ?? 0,
    forks: body.forks_count ?? 0,
    openIssues: body.open_issues_count ?? 0,
    lastUpdated: body.updated_at ?? null,
  };
}

/**
 * Build the full snapshot object. Pure (callable without IO when
 * `fetcher` is mocked) so the test suite can assert on shape.
 */
export async function buildSnapshot({ fetcher = globalThis.fetch } = {}) {
  const npm = await fetchNpmDownloads(NPM_PACKAGE, fetcher);
  const github = {};
  for (const repo of GITHUB_REPOS) {
    github[repo] = await fetchGithubRepoStats(repo, fetcher);
  }
  return {
    schemaVersion: 1,
    snapshotDate: today,
    producedAt: new Date().toISOString(),
    npm: {
      package: NPM_PACKAGE,
      ...npm,
    },
    github,
  };
}

export async function writeSnapshot(snapshot, outputDir = OUTPUT_DIR) {
  mkdirSync(outputDir, { recursive: true });
  const file = resolve(outputDir, `${snapshot.snapshotDate}.json`);
  // Trailing newline keeps generated JSON compatible with `pnpm format:check`.
  writeFileSync(file, `${JSON.stringify(snapshot, null, 2)}\n`);
  return file;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildSnapshot().then((snapshot) => {
    const file = writeSnapshot(snapshot);
    console.log(JSON.stringify({
      ok: true,
      file,
      npmLastWeek: snapshot.npm['last-week']?.downloads,
      githubStarsRepo1: snapshot.github[GITHUB_REPOS[0]]?.stars,
      githubStarsRepo2: snapshot.github[GITHUB_REPOS[1]]?.stars,
    }, null, 2));
  }).catch((err) => {
    console.error(JSON.stringify({ ok: false, error: err.message }));
    process.exit(1);
  });
}
