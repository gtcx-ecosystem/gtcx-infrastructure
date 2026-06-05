import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const environmentsRoot = path.join(repoRoot, '04-ship/terraform/environments');

const requiredChecks = ['trainer_artifact', 'eval_gate', 'promotion_target', 'staging_e2e'];

function fail(message) {
  console.error(`policy error: ${message}`);
  process.exitCode = 1;
}

function collectEnvironmentFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const absolute = path.join(dir, entry);
    if (statSync(absolute).isDirectory()) {
      const mainTf = path.join(absolute, 'main.tf');
      if (existsSync(mainTf)) {
        files.push(path.relative(repoRoot, mainTf));
      }
    }
  }
  return files;
}

function parseWorkflowModuleBlock(filePath, text) {
  const lines = text.split('\n');
  let inBlock = false;
  let depth = 0;
  const block = [];

  for (const line of lines) {
    if (!inBlock && /^\s*module\s+"workflow_orchestration"\s*\{/.test(line)) {
      inBlock = true;
    }

    if (inBlock) {
      block.push(line);
      depth += (line.match(/\{/g) || []).length;
      depth -= (line.match(/\}/g) || []).length;
      if (depth === 0) {
        return block.join('\n');
      }
    }
  }

  return '';
}

function readAssignment(block, key) {
  const match = block.match(new RegExp(`^\\s*${key}\\s*=\\s*(.+)$`, 'm'));
  return match ? match[1].trim() : null;
}

function readQuoted(block, key) {
  const raw = readAssignment(block, key);
  if (!raw) return null;
  const match = raw.match(/^"([^"]*)"$/);
  return match ? match[1] : null;
}

function isTrueLiteral(value) {
  return value === 'true';
}

for (const relativeFile of collectEnvironmentFiles(environmentsRoot)) {
  const absoluteFile = path.join(repoRoot, relativeFile);
  if (!existsSync(absoluteFile)) continue;

  const text = readFileSync(absoluteFile, 'utf8');
  const block = parseWorkflowModuleBlock(relativeFile, text);
  if (!block) continue;

  const environmentName = path.basename(path.dirname(absoluteFile));

  for (const key of [
    'curator_image',
    'trainer_image',
    'evaluator_image',
    'promoter_image',
    'red_team_image',
  ]) {
    const value = readQuoted(block, key);
    if (value && value.endsWith(':latest')) {
      fail(`${relativeFile}: ${key} must use an immutable SHA or release tag, not :latest`);
    }
  }

  const enabled = isTrueLiteral(readAssignment(block, 'enable_fine_tune_workflow'));
  const redTeamEnabled = isTrueLiteral(readAssignment(block, 'enable_red_team_workflow'));

  if (redTeamEnabled && !enabled) {
    fail(`${relativeFile}: enable_red_team_workflow=true requires enable_fine_tune_workflow=true`);
  }

  if (redTeamEnabled && !readQuoted(block, 'red_team_image')) {
    fail(`${relativeFile}: enable_red_team_workflow=true requires red_team_image`);
  }

  if (!enabled) continue;

  const evidenceManifest = readQuoted(block, 'enablement_evidence_manifest');
  if (!evidenceManifest) {
    fail(`${relativeFile}: enable_fine_tune_workflow=true requires enablement_evidence_manifest`);
    continue;
  }

  const resolvedManifest = path.resolve(path.dirname(absoluteFile), evidenceManifest);
  if (!existsSync(resolvedManifest)) {
    fail(`${relativeFile}: evidence manifest does not exist: ${evidenceManifest}`);
    continue;
  }

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(resolvedManifest, 'utf8'));
  } catch (error) {
    fail(`${relativeFile}: evidence manifest is not valid JSON: ${evidenceManifest}`);
    continue;
  }

  if (manifest.environment !== environmentName) {
    fail(`${relativeFile}: evidence manifest environment must equal ${environmentName}`);
  }

  for (const imageKey of ['curator_image', 'trainer_image', 'evaluator_image', 'promoter_image']) {
    const imageValue = readQuoted(block, imageKey);
    if (!imageValue) {
      fail(`${relativeFile}: enable_fine_tune_workflow=true requires ${imageKey}`);
    }
  }

  for (const checkKey of requiredChecks) {
    const status = manifest?.checks?.[checkKey]?.status;
    if (status !== 'verified') {
      fail(`${relativeFile}: evidence manifest must mark checks.${checkKey}.status as verified`);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log('Fine-tune workflow policy checks passed');
