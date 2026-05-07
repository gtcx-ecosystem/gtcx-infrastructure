#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const k8sDir = path.join(repoRoot, 'infra', 'kubernetes');

let exitCode = 0;

function fail(message) {
  console.error(`k8s-policy: ${message}`);
  exitCode = 1;
}

function warn(message) {
  console.warn(`k8s-policy: ${message}`);
}

function findYamlFiles(dir) {
  const files = [];
  for (const entry of globSync('**/*.yaml', { cwd: dir })) {
    files.push(path.join(dir, entry));
  }
  for (const entry of globSync('**/*.yml', { cwd: dir })) {
    files.push(path.join(dir, entry));
  }
  return files;
}

function parseDocuments(text) {
  return text.split(/^---\s*$/m).map((doc) => doc.trim()).filter(Boolean);
}

function parseSimpleYaml(text) {
  const lines = text.split('\n');
  const result = {};
  let currentKey = null;
  let indentStack = [];

  for (const line of lines) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue;
    const match = line.match(/^(\s*)(\w+):\s*(.*)$/);
    if (match) {
      const [, indent, key, value] = match;
      const depth = indent.length;
      currentKey = key;
      result[key] = value || {};
    }
  }
  return result;
}

function isDeploymentLike(doc) {
  return doc.includes('kind: Deployment') || doc.includes('kind: StatefulSet');
}

function isProductionOrStaging(doc) {
  return doc.includes('namespace: gtcx-production') || doc.includes('namespace: gtcx-staging');
}

function hasLatestTag(doc) {
  const imageMatches = doc.match(/image:\s*(.+)/g);
  if (!imageMatches) return false;
  return imageMatches.some((m) => m.includes(':latest'));
}

function hasResourceLimits(doc) {
  const containers = doc.split(/containers:\s*\n/);
  if (containers.length < 2) return false;

  for (let i = 1; i < containers.length; i++) {
    const container = containers[i];
    const hasRequests = container.includes('requests:') && container.includes('cpu:') && container.includes('memory:');
    const hasLimits = container.includes('limits:') && container.includes('cpu:') && container.includes('memory:');
    if (!hasRequests || !hasLimits) {
      return false;
    }
  }
  return true;
}

const yamlFiles = findYamlFiles(k8sDir);

for (const file of yamlFiles) {
  if (path.basename(file) === 'kustomization.yaml') continue;

  const text = readFileSync(file, 'utf8');
  const docs = parseDocuments(text);

  for (const doc of docs) {
    if (!isDeploymentLike(doc)) continue;
    if (!isProductionOrStaging(doc)) continue;

    const relativePath = path.relative(repoRoot, file);

    if (hasLatestTag(doc)) {
      fail(`${relativePath}: Deployment uses :latest image tag`);
    }

    if (!hasResourceLimits(doc)) {
      fail(`${relativePath}: Deployment is missing CPU/memory requests and limits on one or more containers`);
    }
  }
}

if (exitCode === 0) {
  console.log('Kubernetes policy checks passed');
} else {
  console.error(`\nKubernetes policy checks failed with ${exitCode} violation(s)`);
}

process.exit(exitCode);
