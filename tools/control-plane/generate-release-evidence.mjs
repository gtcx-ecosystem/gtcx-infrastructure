#!/usr/bin/env node

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

function fail(message) {
  console.error(`release-evidence error: ${message}`);
  process.exit(1);
}

function usage() {
  console.log(`Usage:
  node tools/control-plane/generate-release-evidence.mjs \\
    --environment=<env> \\
    --version=<tag> \\
    --commit=<sha> \\
    --smoke-base-url=<url> \\
    --rollback-target=<target> \\
    [--approval-ticket=<id>] \\
    [--sbom=<name>=<path>]... \\
    [--scan=<name>=<status>]... \\
    [--image=<name>=<image-ref>]... \\
    [--output-dir=<path>]

Notes:
  - Image refs must be immutable release tags or digest-pinned. ':latest' is rejected.
  - Repeat --image, --sbom, and --scan to add multiple entries.
  - Output defaults to infra/security/reports/release-evidence/<environment>/<utc-timestamp>/`);
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

const args = process.argv.slice(2);
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  usage();
  process.exit(0);
}

const options = {
  images: [],
  sboms: [],
  scans: [],
};

for (const arg of args) {
  if (!arg.startsWith('--') || !arg.includes('=')) {
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
    default:
      fail(`Unsupported argument: --${key}`);
  }
}

for (const key of ['environment', 'version', 'commit', 'smoke-base-url', 'rollback-target']) {
  if (!options[key]) {
    fail(`Missing required argument: --${key}=...`);
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

const bundle = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  environment: options.environment,
  release: {
    version: options.version,
    commit: options.commit,
    approvalTicket: options['approval-ticket'] ?? null,
  },
  deployment: {
    smokeBaseUrl: options['smoke-base-url'],
    rollbackTarget: options['rollback-target'],
  },
  images: imageEntries,
  sboms: sbomEntries,
  scans: scanEntries,
};

writeFileSync(
  path.join(outputDir, 'release-evidence.json'),
  `${JSON.stringify(bundle, null, 2)}\n`,
  'utf8'
);

const summary = [
  '# Release Evidence',
  '',
  `- Generated at: ${bundle.generatedAt}`,
  `- Environment: ${bundle.environment}`,
  `- Version: ${bundle.release.version}`,
  `- Commit: ${bundle.release.commit}`,
  `- Approval ticket: ${bundle.release.approvalTicket ?? 'none'}`,
  `- Smoke base URL: ${bundle.deployment.smokeBaseUrl}`,
  `- Rollback target: ${bundle.deployment.rollbackTarget}`,
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
  '## Files',
  '- release-evidence.json',
];

writeFileSync(path.join(outputDir, 'summary.md'), `${summary.join('\n')}\n`, 'utf8');

console.log(outputDir);
