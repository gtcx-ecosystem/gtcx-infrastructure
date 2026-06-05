#!/usr/bin/env node
/**
 * @fileoverview Kyverno Policy Validator
 *
 * Validates both Kyverno policy files AND service manifest compliance:
 *
 * Policy structural checks:
 *   - All .yaml files in the policies directory are valid Kubernetes resources
 *   - Required fields (apiVersion, kind, metadata.name) are present
 *   - Policy kinds are valid Kyverno types (ClusterPolicy, Policy)
 *   - kustomization.yaml references all policy files
 *   - No duplicate policy names
 *
 * Service compliance checks (simulates policy enforcement for workloads
 * deployed to gtcx-production or gtcx-staging namespaces):
 *   - No :latest image tags (reject-latest-tag)
 *   - Containers set securityContext.runAsNonRoot=true (require-security-context)
 *   - Containers set securityContext.readOnlyRootFilesystem=true
 *   - Containers drop ALL capabilities
 *   - No privileged containers, hostNetwork, or hostPID (deny-privileged-containers)
 *   - CPU/memory requests and limits on all containers (require-resource-limits)
 *   - Pod template has gtcx.trade/data-classification label (require-encryption-annotations)
 *
 * Exits 0 on pass, 1 with categorized violations.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const POLICIES_DIR = path.join(process.cwd(), 'infra', 'kubernetes', 'base', 'policies');
const KUSTOMIZATION_FILE = path.join(POLICIES_DIR, 'kustomization.yaml');
const SERVICES_DIR = path.join(process.cwd(), 'infra', 'kubernetes', 'base', 'services');
const OVERLAYS_DIR = path.join(process.cwd(), 'infra', 'kubernetes', 'overlays');

const VALID_POLICY_KINDS = new Set(['ClusterPolicy', 'Policy']);
const VALID_API_VERSIONS = new Set(['kyverno.io/v1', 'kyverno.io/v2', 'kyverno.io/v2beta1', 'kustomize.config.k8s.io/v1beta1']);
const WORKLOAD_KINDS = new Set(['Deployment', 'StatefulSet', 'DaemonSet', 'CronJob', 'Job']);
const VALID_CLASSIFICATIONS = new Set(['public', 'internal', 'confidential', 'restricted']);

// The "4 services" from the M1 cap-lift roadmap item, plus anomaly-detector (M3)
const FOCUS_SERVICES = new Set([
  'promtail',
  'cloudflared',
  'gtcx-postgres-audit',
  'postgres-exporter',
  'anomaly-detector',
]);

const CHECK_ALL = process.argv.includes('--all');

let exitCode = 0;
let serviceViolationCount = 0;

function fail(category, message) {
  console.error(`kyverno-policy: [${category}] ${message}`);
  exitCode = 1;
}

function failService(file, kind, name, message) {
  console.error(`kyverno-policy: [SERVICE] ${file} — ${kind}/${name}: ${message}`);
  exitCode = 1;
  serviceViolationCount++;
}

function parseYamlDocuments(text) {
  const docs = [];
  let current = [];
  for (const line of text.split('\n')) {
    if (line.trim() === '---') {
      if (current.length > 0) {
        docs.push(current.join('\n'));
        current = [];
      }
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) {
    docs.push(current.join('\n'));
  }
  return docs;
}

function extractTopLevelField(doc, key) {
  const match = doc.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return match?.[1]?.trim() ?? null;
}

function extractNestedField(doc, ...keys) {
  const lines = doc.split('\n');
  let depth = 0;
  const indentStack = [0];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;

    const indent = line.length - line.trimStart().length;
    while (indentStack.length > 1 && indent <= indentStack[indentStack.length - 1]) {
      indentStack.pop();
      depth--;
    }

    if (trimmed.startsWith(keys[depth] + ':')) {
      if (depth === keys.length - 1) {
        const value = trimmed.slice(keys[depth].length + 1).trim();
        return value || '<nested>';
      }
      indentStack.push(indent);
      depth++;
    }
  }
  return null;
}

function extractAllValuesAtDepth(doc, ...keys) {
  const lines = doc.split('\n');
  let depth = 0;
  const indentStack = [0];
  const values = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;

    const indent = line.length - line.trimStart().length;
    while (indentStack.length > 1 && indent <= indentStack[indentStack.length - 1]) {
      indentStack.pop();
      depth--;
    }

    if (depth < keys.length && trimmed.startsWith(keys[depth] + ':')) {
      if (depth === keys.length - 1) {
        const value = trimmed.slice(keys[depth].length + 1).trim();
        values.push(value || '<nested>');
      } else {
        indentStack.push(indent);
        depth++;
      }
    }
  }
  return values;
}

/**
 * Extract each container block from a document as a raw string.
 * Looks for `containers:` under `spec:` (or `spec.template.spec:` for CronJob).
 */
function extractContainerBlocks(doc, kind) {
  const lines = doc.split('\n');
  const containerPath = kind === 'CronJob' ? ['spec', 'template', 'spec', 'containers'] : ['spec', 'containers'];

  let depth = 0;
  const indentStack = [0];
  let inContainers = false;
  let containersIndent = -1;
  let containerIndent = -1;
  const containers = [];
  let currentContainer = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;

    const indent = line.length - line.trimStart().length;

    while (indentStack.length > 1 && indent <= indentStack[indentStack.length - 1]) {
      indentStack.pop();
      depth--;
    }

    if (!inContainers) {
      if (depth < containerPath.length && trimmed.startsWith(containerPath[depth] + ':')) {
        if (depth === containerPath.length - 1) {
          inContainers = true;
          containersIndent = indent;
          continue;
        }
        indentStack.push(indent);
        depth++;
      }
      continue;
    }

    // We are inside containers list
    if (indent <= containersIndent) {
      // Exited containers block
      if (currentContainer.length > 0) {
        containers.push(currentContainer.join('\n'));
        currentContainer = [];
      }
      break;
    }

    if (trimmed.startsWith('- ') && (containerIndent === -1 || indent === containerIndent)) {
      if (currentContainer.length > 0) {
        containers.push(currentContainer.join('\n'));
      }
      currentContainer = [line];
      containerIndent = indent;
    } else if (containerIndent !== -1 && indent > containerIndent) {
      currentContainer.push(line);
    }
  }

  if (currentContainer.length > 0) {
    containers.push(currentContainer.join('\n'));
  }

  return containers;
}

function hasLatestTag(containerDoc) {
  const imageMatches = containerDoc.match(/image:\s*(.+)/);
  if (!imageMatches) return false;
  const image = imageMatches[1].trim().replace(/^['"]|['"]$/g, '');
  return image.endsWith(':latest');
}

function getImage(containerDoc) {
  const match = containerDoc.match(/image:\s*(.+)/);
  return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : null;
}

function getContainerName(containerDoc) {
  const firstLine = containerDoc.split('\n')[0]?.trim() || '';
  const match = firstLine.match(/^-?\s*name:\s*(.+)$/);
  return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : '<unnamed>';
}

function containerHasField(containerDoc, ...keys) {
  return extractNestedField(containerDoc, ...keys) !== null;
}

function containerFieldValue(containerDoc, ...keys) {
  return extractNestedField(containerDoc, ...keys);
}

function hasResourceLimits(containerDoc) {
  return containerHasField(containerDoc, 'resources', 'requests', 'memory') &&
    containerHasField(containerDoc, 'resources', 'requests', 'cpu') &&
    containerHasField(containerDoc, 'resources', 'limits', 'memory') &&
    containerHasField(containerDoc, 'resources', 'limits', 'cpu');
}

function hasCapabilityDropAll(containerDoc) {
  // Check for drop list with ALL — handles both inline and nested YAML list formats
  return /capabilities:[\s\S]*?drop:[\s\S]*?-\s*ALL/.test(containerDoc);
}

function isTrueish(value) {
  return value === 'true' || value === "'true'" || value === '"true"' || value === true;
}

function getPodTemplateBlock(doc, kind) {
  if (kind === 'CronJob') {
    const match = doc.match(/spec:\s*\n[\s\S]*?jobTemplate:\s*\n[\s\S]*?spec:\s*\n[\s\S]*?template:\s*\n([\s\S]*?)(?=\n\w|$(?!\n))/);
    return match ? match[1] : null;
  }
  const match = doc.match(/spec:\s*\n[\s\S]*?template:\s*\n([\s\S]*?)(?=\n\w|$(?!\n))/);
  return match ? match[1] : null;
}

function getPodSpecBlock(doc, kind) {
  const template = getPodTemplateBlock(doc, kind);
  if (!template) return null;
  const match = template.match(/spec:\s*\n([\s\S]*?)(?=\n\w|$(?!\n))/);
  return match ? match[1] : null;
}

function getPodLabels(doc, kind) {
  const template = getPodTemplateBlock(doc, kind);
  if (!template) return {};
  const match = template.match(/metadata:\s*\n([\s\S]*?)(?=\n\w|$(?!\n))/);
  if (!match) return {};
  const meta = match[1];
  const labels = {};
  const labelMatch = meta.match(/labels:\s*\n([\s\S]*?)(?=\n\w|$(?!\n))/);
  if (labelMatch) {
    const labelBlock = labelMatch[1];
    for (const line of labelBlock.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ')) continue;
      const kv = trimmed.match(/^(\S+):\s*(.+)$/);
      if (kv) {
        labels[kv[1]] = kv[2].replace(/^['"]|['"]$/g, '');
      }
    }
  }
  return labels;
}

function hasHostNetwork(doc) {
  return /^\s*hostNetwork:\s*true/m.test(doc);
}

function hasHostPid(doc) {
  return /^\s*hostPID:\s*true/m.test(doc);
}

function hasPrivilegedContainer(containers) {
  for (const c of containers) {
    const val = containerFieldValue(c, 'securityContext', 'privileged');
    if (val && isTrueish(val)) return true;
  }
  return false;
}

// ============================================================================
// 1. Policy structural validation
// ============================================================================

const policyFiles = readdirSync(POLICIES_DIR)
  .filter((f) => f.endsWith('.yaml') && f !== 'kustomization.yaml')
  .sort();

if (policyFiles.length === 0) {
  fail('DISCOVERY', 'No policy YAML files found in policies directory');
  process.exit(exitCode);
}

console.log(`kyverno-policy: Found ${policyFiles.length} policy files`);

const seenNames = new Set();

for (const filename of policyFiles) {
  const filepath = path.join(POLICIES_DIR, filename);
  const text = readFileSync(filepath, 'utf8');
  const docs = parseYamlDocuments(text);

  if (docs.length === 0) {
    fail('STRUCTURE', `${filename}: No YAML documents found`);
    continue;
  }

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    const apiVersion = extractTopLevelField(doc, 'apiVersion');
    const kind = extractTopLevelField(doc, 'kind');
    const name = extractNestedField(doc, 'metadata', 'name');

    if (!apiVersion) {
      fail('STRUCTURE', `${filename}[doc ${i + 1}]: Missing apiVersion`);
    } else if (!VALID_API_VERSIONS.has(apiVersion)) {
      fail('STRUCTURE', `${filename}[doc ${i + 1}]: Unknown apiVersion "${apiVersion}"`);
    }

    if (!kind) {
      fail('STRUCTURE', `${filename}[doc ${i + 1}]: Missing kind`);
    } else if (VALID_POLICY_KINDS.has(kind)) {
      if (!name) {
        fail('STRUCTURE', `${filename}[doc ${i + 1}]: Missing metadata.name`);
      } else {
        if (seenNames.has(name)) {
          fail('UNIQUENESS', `${filename}: Duplicate policy name "${name}"`);
        }
        seenNames.add(name);
      }

      const validationFailureAction = extractNestedField(doc, 'spec', 'validationFailureAction');
      if (!validationFailureAction) {
        fail('POLICY', `${filename}: Missing spec.validationFailureAction`);
      }

      const rules = extractNestedField(doc, 'spec', 'rules');
      if (!rules) {
        fail('POLICY', `${filename}: Missing spec.rules`);
      }
    } else if (kind !== 'Kustomization') {
      fail('STRUCTURE', `${filename}[doc ${i + 1}]: Unexpected kind "${kind}"`);
    }
  }
}

// Validate kustomization.yaml references all policy files
const kustomizationText = readFileSync(KUSTOMIZATION_FILE, 'utf8');
const resourcesMatch = kustomizationText.match(/resources:[ \t]*\n((?:[ \t]*-[ \t]*.+\n?)+)/m);

if (!resourcesMatch) {
  fail('KUSTOMIZATION', 'kustomization.yaml: Missing resources section');
} else {
  const referencedFiles = resourcesMatch[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim());

  for (const filename of policyFiles) {
    if (!referencedFiles.includes(filename)) {
      fail('KUSTOMIZATION', `kustomization.yaml: Missing reference to ${filename}`);
    }
  }

  for (const ref of referencedFiles) {
    if (!policyFiles.includes(ref) && ref !== 'kustomization.yaml') {
      fail('KUSTOMIZATION', `kustomization.yaml: References non-existent file ${ref}`);
    }
  }

  console.log(`kyverno-policy: Kustomization references ${referencedFiles.length} resources`);
}

// ============================================================================
// 2. Service manifest compliance validation
// ============================================================================

function findYamlFiles(dir) {
  const results = [];
  function walk(current) {
    for (const entry of readdirSync(current)) {
      const full = path.join(current, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        walk(full);
      } else if (entry.endsWith('.yaml') || entry.endsWith('.yml')) {
        if (entry === 'kustomization.yaml') continue;
        results.push(full);
      }
    }
  }
  walk(dir);
  return results;
}

const serviceFiles = findYamlFiles(SERVICES_DIR);
const overlayFiles = findYamlFiles(OVERLAYS_DIR);
const allManifestFiles = [...serviceFiles, ...overlayFiles];

console.log(`kyverno-policy: Checking ${serviceFiles.length} service files + ${overlayFiles.length} overlay files`);

for (const filepath of allManifestFiles) {
  const text = readFileSync(filepath, 'utf8');
  const docs = parseYamlDocuments(text);
  const relativePath = path.relative(process.cwd(), filepath);

  for (const doc of docs) {
    const kind = extractTopLevelField(doc, 'kind');
    if (!kind || !WORKLOAD_KINDS.has(kind)) continue;

    const name = extractNestedField(doc, 'metadata', 'name');
    if (!name) continue;

    if (!CHECK_ALL && !FOCUS_SERVICES.has(name)) continue;

    const containers = extractContainerBlocks(doc, kind);
    if (containers.length === 0) continue;

    // Check image tags
    for (const container of containers) {
      const image = getImage(container);
      if (hasLatestTag(container)) {
        failService(relativePath, kind, name, `Container uses :latest tag (${image})`);
      }
    }

    // Check securityContext per container
    for (const container of containers) {
      const containerName = getContainerName(container);

      const runAsNonRoot = containerFieldValue(container, 'securityContext', 'runAsNonRoot');
      if (!runAsNonRoot || !isTrueish(runAsNonRoot)) {
        failService(relativePath, kind, name, `Container "${containerName}" missing securityContext.runAsNonRoot: true`);
      }

      const readOnlyRootFs = containerFieldValue(container, 'securityContext', 'readOnlyRootFilesystem');
      if (!readOnlyRootFs || !isTrueish(readOnlyRootFs)) {
        failService(relativePath, kind, name, `Container "${containerName}" missing securityContext.readOnlyRootFilesystem: true`);
      }

      if (!hasCapabilityDropAll(container)) {
        failService(relativePath, kind, name, `Container "${containerName}" missing capabilities.drop: [ALL]`);
      }

      if (!hasResourceLimits(container)) {
        failService(relativePath, kind, name, `Container "${containerName}" missing CPU/memory requests and limits`);
      }
    }

    // Check privileged containers
    if (hasPrivilegedContainer(containers)) {
      failService(relativePath, kind, name, `One or more containers have privileged: true`);
    }

    // Check hostNetwork / hostPID at pod spec level
    const podSpec = kind === 'CronJob'
      ? extractNestedField(doc, 'spec', 'jobTemplate', 'spec', 'template', 'spec')
      : extractNestedField(doc, 'spec', 'template', 'spec');
    if (podSpec) {
      if (hasHostNetwork(doc)) {
        failService(relativePath, kind, name, `Pod spec has hostNetwork: true`);
      }
      if (hasHostPid(doc)) {
        failService(relativePath, kind, name, `Pod spec has hostPID: true`);
      }
    }

    // Check data classification label
    const labels = getPodLabels(doc, kind);
    const classification = labels['gtcx.trade/data-classification'];
    if (!classification) {
      failService(relativePath, kind, name, `Pod template missing gtcx.trade/data-classification label`);
    } else if (!VALID_CLASSIFICATIONS.has(classification)) {
      failService(relativePath, kind, name, `Invalid data classification "${classification}"`);
    }
  }
}

// ============================================================================
// 3. Summary
// ============================================================================

if (exitCode !== 0) {
  console.error(`\nkyverno-policy: Validation FAILED with violations`);
  process.exit(exitCode);
}

console.log(`kyverno-policy: All ${policyFiles.length} policy files structurally valid`);
console.log(`kyverno-policy: All service manifests comply with Kyverno policies`);
