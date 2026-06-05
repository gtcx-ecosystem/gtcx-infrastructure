#!/usr/bin/env node
/**
 * Run all *.test.mjs files under ./tests (recursive). Avoids bash ** glob
 * expansion differences between macOS and Linux CI runners.
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function collectTestFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTestFiles(path));
    } else if (entry.isFile() && entry.name.endsWith('.test.mjs')) {
      files.push(path);
    }
  }
  return files.sort();
}

const testsDir = join(process.cwd(), 'tests');
const testFiles = collectTestFiles(testsDir);

if (testFiles.length === 0) {
  console.error(`No *.test.mjs files found under ${testsDir}`);
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--test', ...testFiles], {
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
