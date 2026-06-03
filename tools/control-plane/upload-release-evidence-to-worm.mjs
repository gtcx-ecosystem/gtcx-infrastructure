#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

function fail(message) {
  console.error(`worm-upload error: ${message}`);
  process.exit(1);
}

function usage() {
  console.log(`Usage:
  node tools/control-plane/upload-release-evidence-to-worm.mjs \\
    --manifest=<path/to/worm-upload.json> \\
    [--output-dir=<path>] \\
    [--aws-bin=aws] \\
    [--expected-mode=COMPLIANCE] \\
    [--min-retention-days=2550] \\
    [--dry-run]

Notes:
  - The manifest must point at a verifier-valid release-evidence.ndjson file.
  - The wrapper checks the local SHA-256 before uploading.
  - Non-dry-run mode writes worm-upload-execution.json with upload and retention evidence.`);
}

function parseArgs(argv) {
  const options = {
    awsBin: 'aws',
    dryRun: false,
    expectedMode: 'COMPLIANCE',
    minRetentionDays: 2550,
  };

  for (const arg of argv) {
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (!arg.startsWith('--') || !arg.includes('=')) {
      fail(`Unsupported argument: ${arg}`);
    }

    const [key, value] = arg.slice(2).split(/=(.*)/s, 2);
    switch (key) {
      case 'manifest':
        options.manifest = value;
        break;
      case 'output-dir':
        options.outputDir = value;
        break;
      case 'aws-bin':
        options.awsBin = value;
        break;
      case 'expected-mode':
        options.expectedMode = value;
        break;
      case 'min-retention-days':
        options.minRetentionDays = Number(value);
        break;
      default:
        fail(`Unsupported argument: --${key}`);
    }
  }

  if (!options.manifest) {
    fail('Missing required argument: --manifest=...');
  }
  if (!Number.isInteger(options.minRetentionDays) || options.minRetentionDays < 1) {
    fail('--min-retention-days must be a positive integer');
  }

  return options;
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function sha256File(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function runAws(awsBin, args) {
  const result = spawnSync(awsBin, args, {
    encoding: 'utf8',
  });

  if (result.error) {
    throw new Error(result.error.message);
  }
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `aws exited ${result.status}`);
  }

  const stdout = result.stdout.trim();
  return stdout ? JSON.parse(stdout) : {};
}

function retentionFromResponses(headObject, objectRetention) {
  const retention = objectRetention?.Retention ?? {};
  return {
    mode: retention.Mode ?? headObject?.ObjectLockMode ?? null,
    retainUntil:
      retention.RetainUntilDate ?? headObject?.ObjectLockRetainUntilDate ?? null,
  };
}

function validateRetention({ mode, retainUntil }, expectedMode, minRetentionDays) {
  if (mode !== expectedMode) {
    return {
      valid: false,
      reason: `expected Object Lock mode ${expectedMode}, got ${mode ?? 'none'}`,
    };
  }

  if (!retainUntil) {
    return { valid: false, reason: 'missing retain-until timestamp' };
  }

  const retainUntilMs = Date.parse(retainUntil);
  if (!Number.isFinite(retainUntilMs)) {
    return { valid: false, reason: `invalid retain-until timestamp: ${retainUntil}` };
  }

  const minRetainUntilMs = Date.now() + minRetentionDays * 24 * 60 * 60 * 1000;
  if (retainUntilMs < minRetainUntilMs) {
    return {
      valid: false,
      reason: `retain-until is below ${minRetentionDays} days`,
    };
  }

  return { valid: true, reason: 'Object Lock retention verified' };
}

const args = process.argv.slice(2);
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  usage();
  process.exit(0);
}

const options = parseArgs(args);
const manifestPath = path.resolve(options.manifest);
if (!existsSync(manifestPath)) {
  fail(`Manifest not found: ${manifestPath}`);
}

const manifest = readJson(manifestPath);
const manifestDir = path.dirname(manifestPath);
const outputDir = path.resolve(options.outputDir ?? manifestDir);
mkdirSync(outputDir, { recursive: true });

for (const key of ['bucket', 'key', 'object', 'sha256']) {
  if (!manifest[key]) {
    fail(`Manifest is missing ${key}`);
  }
}
if (manifest.verification?.valid !== true) {
  fail('Manifest verification result is not valid');
}

const objectPath = path.resolve(manifestDir, manifest.object);
if (!existsSync(objectPath)) {
  fail(`Evidence object not found: ${objectPath}`);
}

const actualSha256 = sha256File(objectPath);
if (actualSha256 !== manifest.sha256) {
  fail(`Evidence object SHA-256 mismatch: expected ${manifest.sha256}, got ${actualSha256}`);
}

const putObjectArgs = [
  's3api',
  'put-object',
  '--bucket',
  manifest.bucket,
  '--key',
  manifest.key,
  '--body',
  objectPath,
  '--server-side-encryption',
  manifest.requiredHeaders?.serverSideEncryption ?? 'aws:kms',
  '--output',
  'json',
];

const evidence = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  manifest: manifestPath,
  object: objectPath,
  bucket: manifest.bucket,
  key: manifest.key,
  sha256: actualSha256,
  dryRun: options.dryRun,
  commands: {
    putObject: [options.awsBin, ...putObjectArgs],
  },
  upload: null,
  retention: null,
  result: {
    valid: false,
    reason: 'not executed',
  },
};

if (options.dryRun) {
  evidence.result = { valid: true, reason: 'dry-run validated manifest and planned upload' };
  const outputPath = path.join(outputDir, 'worm-upload-execution.json');
  writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  console.log(outputPath);
  process.exit(0);
}

let upload;
try {
  upload = runAws(options.awsBin, putObjectArgs);
} catch (err) {
  evidence.result = { valid: false, reason: `put-object failed: ${err.message}` };
  const outputPath = path.join(outputDir, 'worm-upload-execution.json');
  writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  fail(evidence.result.reason);
}

const versionId = upload.VersionId ?? upload.versionId ?? null;
evidence.upload = upload;

const headObjectArgs = [
  's3api',
  'head-object',
  '--bucket',
  manifest.bucket,
  '--key',
  manifest.key,
  ...(versionId ? ['--version-id', versionId] : []),
  '--output',
  'json',
];
const getObjectRetentionArgs = [
  's3api',
  'get-object-retention',
  '--bucket',
  manifest.bucket,
  '--key',
  manifest.key,
  ...(versionId ? ['--version-id', versionId] : []),
  '--output',
  'json',
];
evidence.commands.headObject = [options.awsBin, ...headObjectArgs];
evidence.commands.getObjectRetention = [options.awsBin, ...getObjectRetentionArgs];

let headObject = null;
let objectRetention = null;
let retentionError = null;
try {
  headObject = runAws(options.awsBin, headObjectArgs);
  objectRetention = runAws(options.awsBin, getObjectRetentionArgs);
} catch (err) {
  retentionError = err.message;
}

const retention = retentionFromResponses(headObject, objectRetention);
evidence.retention = {
  versionId,
  headObject,
  objectRetention,
  retention,
  error: retentionError,
};
evidence.result = validateRetention(retention, options.expectedMode, options.minRetentionDays);

const outputPath = path.join(outputDir, 'worm-upload-execution.json');
writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');

if (!evidence.result.valid) {
  fail(evidence.result.reason);
}

console.log(outputPath);
