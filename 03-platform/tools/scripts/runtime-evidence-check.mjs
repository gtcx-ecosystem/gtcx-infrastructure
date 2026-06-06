#!/usr/bin/env node
/**
 * @fileoverview Dry-run release evidence bundle generation (S3-04 structural gate).
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const SCRIPT = join(ROOT, 'tools', 'control-plane', 'generate-release-evidence.mjs');

function main() {
  if (!existsSync(SCRIPT)) {
    console.error('[runtime-evidence-check] generate-release-evidence.mjs missing');
    process.exit(1);
  }
  const outDir = mkdtempSync(join(tmpdir(), 'gtcx-release-evidence-'));
  try {
    const imageRef =
      'ghcr.io/gtcx-ecosystem/audit-flush:v0.1.0@sha256:0000000000000000000000000000000000000000000000000000000000000000';
    execSync(
      `node "${SCRIPT}" --environment=ci --version=validate-all --commit=HEAD --build-only --output-dir="${outDir}" --image=audit-flush=${imageRef}`,
      { cwd: ROOT, stdio: 'pipe', encoding: 'utf8' }
    );
    const bundle = join(outDir, 'release-evidence.json');
    if (!existsSync(bundle)) {
      console.error('[runtime-evidence-check] release-evidence.json not emitted');
      process.exit(1);
    }
    const parsed = JSON.parse(readFileSync(bundle, 'utf8'));
    if (!parsed.schemaVersion || !parsed.release?.commit) {
      console.error('[runtime-evidence-check] bundle missing schemaVersion or release.commit');
      process.exit(1);
    }
    const verificationPath = join(outDir, 'release-evidence-verification.json');
    if (!existsSync(verificationPath)) {
      console.error('[runtime-evidence-check] release-evidence-verification.json missing');
      process.exit(1);
    }
    const verification = JSON.parse(readFileSync(verificationPath, 'utf8'));
    if (!verification.result?.valid) {
      console.error('[runtime-evidence-check] signed chain verification failed');
      process.exit(1);
    }
    console.log('[runtime-evidence-check] build-only release evidence bundle OK');
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
