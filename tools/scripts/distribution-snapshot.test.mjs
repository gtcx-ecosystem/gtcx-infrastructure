/**
 * @fileoverview Unit tests for distribution-snapshot.
 *
 * The build function is pure when given a mocked fetcher, so we can
 * exercise success + failure paths without network IO.
 */

import assert from 'node:assert';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  fetchNpmDownloads,
  fetchGithubRepoStats,
  buildSnapshot,
  writeSnapshot,
} from './distribution-snapshot.mjs';

function fetcherForResponses(responses) {
  // responses: Map<url-substring, { ok, status, body }>
  return async (url) => {
    for (const [needle, response] of responses.entries()) {
      if (url.includes(needle)) {
        return {
          ok: response.ok,
          status: response.status,
          json: async () => response.body,
        };
      }
    }
    throw new Error(`unexpected URL: ${url}`);
  };
}

describe('fetchNpmDownloads', () => {
  it('returns counts for three time periods on happy path', async () => {
    const fetcher = fetcherForResponses(new Map([
      ['last-day', { ok: true, status: 200, body: { downloads: 7, package: 'x' } }],
      ['last-week', { ok: true, status: 200, body: { downloads: 42, package: 'x' } }],
      ['last-month', { ok: true, status: 200, body: { downloads: 180, package: 'x' } }],
    ]));
    const result = await fetchNpmDownloads('@gtcx/audit-signer', fetcher);
    assert.strictEqual(result['last-day'].downloads, 7);
    assert.strictEqual(result['last-week'].downloads, 42);
    assert.strictEqual(result['last-month'].downloads, 180);
  });

  it('records error per period when fetch fails', async () => {
    const fetcher = fetcherForResponses(new Map([
      ['last-day', { ok: false, status: 500, body: null }],
      ['last-week', { ok: true, status: 200, body: { downloads: 5 } }],
      ['last-month', { ok: true, status: 200, body: { downloads: 30 } }],
    ]));
    const result = await fetchNpmDownloads('@gtcx/audit-signer', fetcher);
    assert.strictEqual(result['last-day'].error, 'HTTP 500');
    assert.strictEqual(result['last-day'].downloads, null);
    assert.strictEqual(result['last-week'].downloads, 5);
  });

  it('records error when fetch throws', async () => {
    const fetcher = async () => { throw new Error('network down'); };
    const result = await fetchNpmDownloads('@gtcx/audit-signer', fetcher);
    assert.match(result['last-day'].error, /network down/);
    assert.strictEqual(result['last-week'].downloads, null);
  });
});

describe('fetchGithubRepoStats', () => {
  it('extracts stars, forks, openIssues on happy path', async () => {
    const fetcher = fetcherForResponses(new Map([
      ['api.github.com/repos', {
        ok: true, status: 200, body: {
          stargazers_count: 12,
          forks_count: 3,
          open_issues_count: 1,
          updated_at: '2026-05-22T00:00:00Z',
        },
      }],
    ]));
    const result = await fetchGithubRepoStats('gtcx-ecosystem/gtcx-infrastructure', fetcher);
    assert.strictEqual(result.stars, 12);
    assert.strictEqual(result.forks, 3);
    assert.strictEqual(result.openIssues, 1);
    assert.strictEqual(result.lastUpdated, '2026-05-22T00:00:00Z');
  });

  it('returns error when GitHub API returns 404', async () => {
    const fetcher = fetcherForResponses(new Map([
      ['api.github.com/repos', { ok: false, status: 404, body: null }],
    ]));
    const result = await fetchGithubRepoStats('missing/repo', fetcher);
    assert.strictEqual(result.error, 'HTTP 404');
    assert.strictEqual(result.stars, null);
  });

  it('defaults missing fields to 0', async () => {
    const fetcher = fetcherForResponses(new Map([
      ['api.github.com/repos', { ok: true, status: 200, body: {} }],
    ]));
    const result = await fetchGithubRepoStats('empty/repo', fetcher);
    assert.strictEqual(result.stars, 0);
    assert.strictEqual(result.forks, 0);
  });
});

describe('buildSnapshot', () => {
  it('returns a schema-versioned snapshot with npm + github data', async () => {
    const fetcher = fetcherForResponses(new Map([
      ['last-day', { ok: true, status: 200, body: { downloads: 5 } }],
      ['last-week', { ok: true, status: 200, body: { downloads: 30 } }],
      ['last-month', { ok: true, status: 200, body: { downloads: 120 } }],
      ['api.github.com/repos', { ok: true, status: 200, body: { stargazers_count: 8, forks_count: 2, open_issues_count: 0 } }],
    ]));
    const snapshot = await buildSnapshot({ fetcher });
    assert.strictEqual(snapshot.schemaVersion, 1);
    assert.match(snapshot.snapshotDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(snapshot.producedAt, /T/);
    assert.strictEqual(snapshot.npm.package, '@gtcx/audit-signer');
    assert.strictEqual(snapshot.npm['last-week'].downloads, 30);
    const repoNames = Object.keys(snapshot.github);
    assert.ok(repoNames.length >= 2, 'should track ≥2 github repos');
    for (const repo of repoNames) {
      assert.strictEqual(snapshot.github[repo].stars, 8);
    }
  });
});

describe('writeSnapshot', () => {
  it('writes JSON with trailing newline for prettier compatibility', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'dist-snap-'));
    try {
      const snapshot = {
        schemaVersion: 1,
        snapshotDate: '2026-06-01',
        producedAt: '2026-06-01T00:00:00.000Z',
        npm: { package: '@gtcx/audit-signer', 'last-week': { downloads: 1 } },
        github: {},
      };
      const file = await writeSnapshot(snapshot, dir);
      const raw = readFileSync(file, 'utf8');
      assert.ok(raw.endsWith('\n'), 'snapshot file must end with newline');
      assert.deepStrictEqual(JSON.parse(raw.trimEnd()), snapshot);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
