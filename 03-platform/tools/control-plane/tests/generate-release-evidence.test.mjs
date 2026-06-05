import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..', '..');
const script = path.join(repoRoot, 'tools', 'control-plane', 'generate-release-evidence.mjs');

function tempOutputDir() {
  return mkdtempSync(path.join(tmpdir(), 'gtcx-release-evidence-test-'));
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

describe('generate-release-evidence', () => {
  it('writes signed and verifier-valid release evidence', () => {
    const outputDir = tempOutputDir();
    execFileSync(
      process.execPath,
      [
        script,
        '--environment=ci',
        '--version=ci-test',
        '--commit=abc123',
        '--build-only',
        '--image=replay-guard=gtcx/replay-guard:ci-test',
        '--scan=replay-guard=passed',
        '--gate=lint=pass',
        '--gate=test=pass',
        '--evidence=score-ledger=01-docs/05-audit/score-evidence-ledger.json',
        '--worm-bucket=gtcx-worm-audit-staging-af-south-1',
        '--worm-key=release-evidence/ci/ci-test/release-evidence.ndjson',
        `--output-dir=${outputDir}`,
      ],
      { cwd: repoRoot, encoding: 'utf8' }
    );

    for (const file of [
      'release-evidence.json',
      'summary.md',
      'release-evidence.ndjson',
      'release-evidence-verification.json',
      'worm-upload.json',
    ]) {
      assert.equal(existsSync(path.join(outputDir, file)), true, `${file} should exist`);
    }

    const bundle = readJson(path.join(outputDir, 'release-evidence.json'));
    assert.equal(bundle.schemaVersion, 2);
    assert.deepEqual(bundle.gates, [
      { name: 'lint', status: 'pass' },
      { name: 'test', status: 'pass' },
    ]);
    assert.equal(bundle.worm.bucket, 'gtcx-worm-audit-staging-af-south-1');

    const verification = readJson(path.join(outputDir, 'release-evidence-verification.json'));
    assert.equal(verification.result.valid, true);
    assert.equal(verification.result.reason, 'all records valid');

    const upload = readJson(path.join(outputDir, 'worm-upload.json'));
    assert.equal(upload.verification.valid, true);
    assert.equal(upload.object, 'release-evidence.ndjson');
    assert.match(upload.command, /aws s3api put-object/);
  });

  it('rejects unknown gate status values', () => {
    const outputDir = tempOutputDir();
    const result = spawnSync(
      process.execPath,
      [
        script,
        '--environment=ci',
        '--version=ci-test',
        '--commit=abc123',
        '--build-only',
        '--image=replay-guard=gtcx/replay-guard:ci-test',
        '--gate=lint=unknown',
        `--output-dir=${outputDir}`,
      ],
      { cwd: repoRoot, encoding: 'utf8' }
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /must be one of pass, fail, warn, skipped/);
  });
});
