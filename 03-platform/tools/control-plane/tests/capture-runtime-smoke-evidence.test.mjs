import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..', '..');
const script = path.join(repoRoot, 'tools', 'control-plane', 'capture-runtime-smoke-evidence.mjs');
const unreachableBaseUrl = 'http://127.0.0.1:9';

function tempOutputDir() {
  return mkdtempSync(path.join(tmpdir(), 'gtcx-runtime-smoke-test-'));
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

describe('capture-runtime-smoke-evidence', () => {
  it('captures failed public probes as evidence without strict failure', () => {
    const outputDir = tempOutputDir();
    execFileSync(
      process.execPath,
      [
        script,
        '--environment=ci',
        `--base-url=${unreachableBaseUrl}`,
        '--endpoint=health=/health',
        '--timeout-ms=250',
        `--output-dir=${outputDir}`,
      ],
      { cwd: repoRoot, encoding: 'utf8' }
    );

    const evidence = readJson(path.join(outputDir, 'runtime-smoke-evidence.json'));
    assert.equal(evidence.status, 'failed');
    assert.equal(evidence.summary.total, 1);
    assert.equal(evidence.summary.failed, 1);
    assert.equal(evidence.probes[0].request.authorization, null);
    assert.equal(existsSync(path.join(outputDir, 'summary.md')), true);
  });

  it('redacts bearer tokens from failed authenticated evidence', () => {
    const outputDir = tempOutputDir();
    execFileSync(
      process.execPath,
      [
        script,
        '--environment=staging',
        `--base-url=${unreachableBaseUrl}`,
        '--endpoint=health=/health',
        '--mode=bearer',
        '--bearer-token-env=RUNTIME_SMOKE_TEST_TOKEN',
        '--timeout-ms=250',
        `--output-dir=${outputDir}`,
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        env: { ...process.env, RUNTIME_SMOKE_TEST_TOKEN: 'test-token' },
      }
    );

    const raw = readFileSync(path.join(outputDir, 'runtime-smoke-evidence.json'), 'utf8');
    assert.equal(raw.includes('test-token'), false);

    const evidence = JSON.parse(raw);
    assert.equal(evidence.status, 'failed');
    assert.equal(evidence.probes[0].request.authorization, 'Bearer <redacted>');
  });

  it('fails in strict mode when a probe fails', () => {
    const outputDir = tempOutputDir();
    const result = spawnSync(
      process.execPath,
      [
        script,
        '--environment=ci',
        `--base-url=${unreachableBaseUrl}`,
        '--endpoint=health=/health',
        '--timeout-ms=250',
        `--output-dir=${outputDir}`,
        '--strict',
      ],
      { cwd: repoRoot, encoding: 'utf8' }
    );

    assert.equal(result.status, 1);
    const evidence = readJson(path.join(outputDir, 'runtime-smoke-evidence.json'));
    assert.equal(evidence.status, 'failed');
    assert.equal(evidence.probes[0].status, null);
  });
});
