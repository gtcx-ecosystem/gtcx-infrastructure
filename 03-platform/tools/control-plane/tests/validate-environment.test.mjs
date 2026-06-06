import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');
const script = path.join(repoRoot, '03-platform', 'tools', 'control-plane', 'validate-environment.mjs');
const ctl = path.join(repoRoot, '03-platform', 'tools', 'control-plane', 'gtcx-ctl.mjs');

function runScript(args) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

function runCtl(args) {
  return spawnSync(process.execPath, [ctl, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

describe('validate-environment', () => {
  it('requires --environment for live mode', () => {
    const result = runScript([]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /--environment=/);
  });

  it('passes CI preflight for staging and production overlays', () => {
    const result = runScript(['--ci']);
    assert.equal(
      result.status,
      0,
      result.stderr || result.stdout,
    );
    assert.match(result.stdout, /CI preflight/);
    assert.match(result.stdout, /staging/);
    assert.match(result.stdout, /production/);
  });

  it('passes CI preflight for a single environment via gtcx-ctl', () => {
    const result = runCtl(['validate', '--environment=staging', '--ci']);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /Kustomize build successful for staging/);
  });
});
