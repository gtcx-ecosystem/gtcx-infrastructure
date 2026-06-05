#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import {
  append,
  createChain,
  createRecord,
  fromNdjson,
  generateKeyPair,
  toNdjson,
  verifyChain,
} from '../audit-signer/03-platform/src/index.mjs';

function fail(message) {
  console.error(`release-evidence error: ${message}`);
  process.exit(1);
}

function usage() {
  console.log(`Usage:
  node 03-platform/tools/control-plane/generate-release-evidence.mjs \\
    --environment=<env> \\
    --version=<tag> \\
    --commit=<sha> \\
    --smoke-base-url=<url> \\
    --rollback-target=<target> \\
    [--approval-ticket=<id>] \\
    [--sbom=<name>=<path>]... \\
    [--scan=<name>=<status>]... \\
    [--image=<name>=<image-ref>]... \\
    [--gate=<name>=<pass|fail|warn|skipped>]... \\
    [--evidence=<name>=<path-or-uri>]... \\
    [--worm-bucket=<bucket>] \\
    [--worm-key=<key>] \\
    [--output-dir=<path>]

Build-only mode (no smoke/rollback required):
  node 03-platform/tools/control-plane/generate-release-evidence.mjs \\
    --environment=ci \\
    --version=<tag> \\
    --commit=<sha> \\
    --build-only \\
    [--image=<name>=<image-ref>]... \\
    [--sbom=<name>=<path>]... \\
    [--scan=<name>=<status>]... \\
    [--gate=<name>=<pass|fail|warn|skipped>]...

Notes:
  - Image refs must be immutable release tags or digest-pinned. ':latest' is rejected.
  - Repeat --image, --sbom, and --scan to add multiple entries.
  - Repeat --gate to record validation outcomes that have already completed.
  - The command writes signed NDJSON and verifier output for offline audit.
  - Output defaults to 04-ship/security/reports/release-evidence/<environment>/<utc-timestamp>/`);
}

function parseAssignment(value, flagName) {
  const index = value.indexOf('=');
  if (index <= 0 || index === value.length - 1) {
    fail(`${flagName} entries must use <name>=<value>`);
  }

  return {
    name: value.slice(0, index),
    value: value.slice(index + 1),
  };
}

function isImmutableImageRef(ref) {
  if (ref.includes('@sha256:')) {
    return true;
  }

  const lastSlash = ref.lastIndexOf('/');
  const lastColon = ref.lastIndexOf(':');
  if (lastColon <= lastSlash) {
    return false;
  }

  const tag = ref.slice(lastColon + 1);
  if (!tag || tag === 'latest') {
    return false;
  }

  return true;
}

function normalizeGateStatus(status, gateName) {
  const normalized = status.toLowerCase();
  if (!['pass', 'fail', 'warn', 'skipped'].includes(normalized)) {
    fail(`--gate=${gateName}=... must be one of pass, fail, warn, skipped`);
  }
  return normalized;
}

function sha256File(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

const args = process.argv.slice(2);
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  usage();
  process.exit(0);
}

const options = {
  images: [],
  sboms: [],
  scans: [],
  gates: [],
  evidence: [],
  buildOnly: false,
};

for (const arg of args) {
  if (!arg.startsWith('--')) {
    fail(`Unsupported argument: ${arg}`);
  }

  // Boolean flags without '='
  if (arg === '--build-only') {
    options.buildOnly = true;
    continue;
  }

  if (!arg.includes('=')) {
    fail(`Unsupported argument: ${arg}`);
  }

  const [key, value] = arg.slice(2).split(/=(.*)/s, 2);
  switch (key) {
    case 'environment':
    case 'version':
    case 'commit':
    case 'smoke-base-url':
    case 'rollback-target':
    case 'approval-ticket':
    case 'output-dir':
    case 'worm-bucket':
    case 'worm-key':
      options[key] = value;
      break;
    case 'image':
      options.images.push(parseAssignment(value, '--image'));
      break;
    case 'sbom':
      options.sboms.push(parseAssignment(value, '--sbom'));
      break;
    case 'scan':
      options.scans.push(parseAssignment(value, '--scan'));
      break;
    case 'gate': {
      const entry = parseAssignment(value, '--gate');
      options.gates.push({
        name: entry.name,
        status: normalizeGateStatus(entry.value, entry.name),
      });
      break;
    }
    case 'evidence':
      options.evidence.push(parseAssignment(value, '--evidence'));
      break;
    default:
      fail(`Unsupported argument: --${key}`);
  }
}

for (const key of ['environment', 'version', 'commit']) {
  if (!options[key]) {
    fail(`Missing required argument: --${key}=...`);
  }
}

if (!options.buildOnly) {
  for (const key of ['smoke-base-url', 'rollback-target']) {
    if (!options[key]) {
      fail(`Missing required argument: --${key}=... (or use --build-only)`);
    }
  }
}

if (options.images.length === 0) {
  fail('At least one --image=<name>=<image-ref> is required');
}

for (const image of options.images) {
  if (!isImmutableImageRef(image.value)) {
    fail(`Image ref must be immutable and not use :latest: ${image.value}`);
  }
}

const timestamp = new Date()
  .toISOString()
  .replaceAll(':', '')
  .replace(/\.\d{3}Z$/, 'Z');
const outputDir =
  options['output-dir'] ??
  path.join('infra', 'security', 'reports', 'release-evidence', options.environment, timestamp);

mkdirSync(outputDir, { recursive: true });

const imageEntries = options.images.map((entry) => ({
  name: entry.name,
  ref: entry.value,
}));
const sbomEntries = options.sboms.map((entry) => ({
  name: entry.name,
  artifact: entry.value,
}));
const scanEntries = options.scans.map((entry) => ({
  name: entry.name,
  status: entry.value,
}));
const gateEntries = options.gates.map((entry) => ({
  name: entry.name,
  status: entry.status,
}));
const evidenceEntries = options.evidence.map((entry) => ({
  name: entry.name,
  uri: entry.value,
}));
const wormKey =
  options['worm-key'] ??
  path.posix.join(
    'release-evidence',
    options.environment,
    options.version,
    timestamp,
    'release-evidence.ndjson'
  );

const bundle = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  environment: options.environment,
  release: {
    version: options.version,
    commit: options.commit,
    approvalTicket: options['approval-ticket'] ?? null,
  },
  deployment: options.buildOnly
    ? { smokeBaseUrl: null, rollbackTarget: null, buildOnly: true }
    : { smokeBaseUrl: options['smoke-base-url'], rollbackTarget: options['rollback-target'] },
  images: imageEntries,
  sboms: sbomEntries,
  scans: scanEntries,
  gates: gateEntries,
  evidence: evidenceEntries,
  worm: {
    bucket: options['worm-bucket'] ?? null,
    key: wormKey,
    uploadReady: true,
    requiredHeaders: {
      serverSideEncryption: 'aws:kms',
    },
  },
};

const bundlePath = path.join(outputDir, 'release-evidence.json');
writeFileSync(bundlePath, `${JSON.stringify(bundle, null, 2)}\n`, 'utf8');

const summary = [
  '# Release Evidence',
  '',
  `- Generated at: ${bundle.generatedAt}`,
  `- Environment: ${bundle.environment}`,
  `- Version: ${bundle.release.version}`,
  `- Commit: ${bundle.release.commit}`,
  `- Approval ticket: ${bundle.release.approvalTicket ?? 'none'}`,
  `- Smoke base URL: ${bundle.deployment.smokeBaseUrl ?? 'N/A (build-only)'}`,
  `- Rollback target: ${bundle.deployment.rollbackTarget ?? 'N/A (build-only)'}`,
  '',
  '## Images',
  ...imageEntries.map((entry) => `- ${entry.name}: \`${entry.ref}\``),
  '',
  '## SBOM Artifacts',
  ...(sbomEntries.length > 0
    ? sbomEntries.map((entry) => `- ${entry.name}: \`${entry.artifact}\``)
    : ['- none recorded']),
  '',
  '## Scan Status',
  ...(scanEntries.length > 0
    ? scanEntries.map((entry) => `- ${entry.name}: ${entry.status}`)
    : ['- none recorded']),
  '',
  '## Validation Gates',
  ...(gateEntries.length > 0
    ? gateEntries.map((entry) => `- ${entry.name}: ${entry.status}`)
    : ['- none recorded']),
  '',
  '## Evidence Pointers',
  ...(evidenceEntries.length > 0
    ? evidenceEntries.map((entry) => `- ${entry.name}: \`${entry.uri}\``)
    : ['- none recorded']),
  '',
  '## WORM Target',
  `- Bucket: ${bundle.worm.bucket ?? 'not configured'}`,
  `- Key: \`${bundle.worm.key}\``,
  '',
  '## Files',
  '- release-evidence.json',
  '- summary.md',
  '- release-evidence.ndjson',
  '- release-evidence-verification.json',
  '- worm-upload.json',
];

const summaryPath = path.join(outputDir, 'summary.md');
writeFileSync(summaryPath, `${summary.join('\n')}\n`, 'utf8');

const fileHashes = {
  'release-evidence.json': sha256File(bundlePath),
  'summary.md': sha256File(summaryPath),
};

const keyPair = generateKeyPair();
const chain = createChain();
append(
  chain,
  createRecord({
    actor: 'gtcx-infrastructure-release-evidence',
    action: 'release.evidence.generated',
    target: `${bundle.environment}:${bundle.release.version}`,
    reason: 'recurring release evidence bundle',
    payload: {
      schemaVersion: bundle.schemaVersion,
      environment: bundle.environment,
      release: bundle.release,
      deployment: bundle.deployment,
      images: bundle.images,
      sboms: bundle.sboms,
      scans: bundle.scans,
      gates: bundle.gates,
      evidence: bundle.evidence,
      worm: bundle.worm,
      fileHashes,
    },
  }),
  keyPair.privateKey,
  keyPair.publicKey
);

const ndjsonPath = path.join(outputDir, 'release-evidence.ndjson');
const ndjson = toNdjson(chain);
writeFileSync(ndjsonPath, ndjson, 'utf8');

const verification = {
  generatedAt: new Date().toISOString(),
  verifier: '@gtcx/audit-signer',
  result: verifyChain(fromNdjson(ndjson)),
};
const verificationPath = path.join(outputDir, 'release-evidence-verification.json');
writeFileSync(verificationPath, `${JSON.stringify(verification, null, 2)}\n`, 'utf8');

const uploadManifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  bucket: bundle.worm.bucket,
  key: bundle.worm.key,
  object: 'release-evidence.ndjson',
  sha256: sha256File(ndjsonPath),
  verification: verification.result,
  requiredHeaders: bundle.worm.requiredHeaders,
  command:
    bundle.worm.bucket === null
      ? null
      : [
          'aws s3api put-object',
          `--bucket ${bundle.worm.bucket}`,
          `--key ${bundle.worm.key}`,
          '--body release-evidence.ndjson',
          '--server-side-encryption aws:kms',
        ].join(' '),
};
writeFileSync(
  path.join(outputDir, 'worm-upload.json'),
  `${JSON.stringify(uploadManifest, null, 2)}\n`,
  'utf8'
);

console.log(outputDir);
