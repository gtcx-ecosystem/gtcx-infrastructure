import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..', '..');
const generateScript = path.join(repoRoot, 'tools', 'control-plane', 'generate-release-evidence.mjs');
const uploadScript = path.join(repoRoot, 'tools', 'control-plane', 'upload-release-evidence-to-worm.mjs');

function tempOutputDir() {
  return mkdtempSync(path.join(tmpdir(), 'gtcx-worm-upload-test-'));
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function generateEvidence(outputDir) {
  execFileSync(
    process.execPath,
    [
      generateScript,
      '--environment=ci',
      '--version=ci-test',
      '--commit=abc123',
      '--build-only',
      '--image=replay-guard=gtcx/replay-guard:ci-test',
      '--gate=lint=pass',
      '--worm-bucket=gtcx-worm-audit-staging-af-south-1',
      '--worm-key=release-evidence/ci/ci-test/release-evidence.ndjson',
      `--output-dir=${outputDir}`,
    ],
    { cwd: repoRoot, encoding: 'utf8' }
  );
}

describe('upload-release-evidence-to-worm', () => {
  it('validates manifest and writes dry-run upload evidence', () => {
    const outputDir = tempOutputDir();
    generateEvidence(outputDir);

    const stdout = execFileSync(
      process.execPath,
      [uploadScript, `--manifest=${path.join(outputDir, 'worm-upload.json')}`, '--dry-run'],
      { cwd: repoRoot, encoding: 'utf8' }
    ).trim();

    const evidence = readJson(stdout);
    assert.equal(evidence.dryRun, true);
    assert.equal(evidence.result.valid, true);
    assert.equal(evidence.bucket, 'gtcx-worm-audit-staging-af-south-1');
    assert.deepEqual(evidence.commands.putObject.slice(0, 3), ['aws', 's3api', 'put-object']);
  });

  it('rejects a manifest when the local object hash does not match', () => {
    const outputDir = tempOutputDir();
    generateEvidence(outputDir);

    const manifestPath = path.join(outputDir, 'worm-upload.json');
    const manifest = readJson(manifestPath);
    manifest.sha256 = '0'.repeat(64);
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

    const result = spawnSync(
      process.execPath,
      [uploadScript, `--manifest=${manifestPath}`, '--dry-run'],
      { cwd: repoRoot, encoding: 'utf8' }
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /SHA-256 mismatch/);
  });
});
