import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const ecrModuleFile = path.join(repoRoot, 'infra/terraform/modules/ecr/main.tf');
const workflowFile = path.join(repoRoot, '.github/workflows/build-push-ecr.yml');
const environmentsRoot = path.join(repoRoot, 'infra/terraform/environments');

const workflowImageKeys = [
  'curator_image',
  'trainer_image',
  'evaluator_image',
  'promoter_image',
  'red_team_image',
];

function fail(message) {
  console.error(`contract error: ${message}`);
  process.exitCode = 1;
}

function read(filePath) {
  return readFileSync(filePath, 'utf8');
}

function parseQuotedList(listBlock) {
  return [...listBlock.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

function parseEcrRepositories() {
  const text = read(ecrModuleFile);
  const match = text.match(
    /variable\s+"repositories"\s*\{[\s\S]*?default\s*=\s*\[(?<items>[\s\S]*?)\]/
  );
  if (!match?.groups?.items) {
    throw new Error(
      'Could not parse default repositories from infra/terraform/modules/ecr/main.tf'
    );
  }

  return new Set(parseQuotedList(match.groups.items));
}

function parseWorkflowBuildRepositories() {
  const text = read(workflowFile);
  const repos = new Set();

  for (const match of text.matchAll(/^\s*ecr_repos:\s*([^\n#]+)$/gm)) {
    const entries = match[1]
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    for (const entry of entries) {
      repos.add(entry);
    }
  }

  return repos;
}

function collectEnvironmentFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const absolute = path.join(dir, entry);
    if (!statSync(absolute).isDirectory()) continue;
    const mainTf = path.join(absolute, 'main.tf');
    if (existsSync(mainTf)) {
      files.push(path.relative(repoRoot, mainTf));
    }
  }
  return files;
}

function parseWorkflowModuleBlock(text) {
  const lines = text.split('\n');
  let inBlock = false;
  let depth = 0;
  const block = [];

  for (const line of lines) {
    if (!inBlock && /^\s*module\s+"workflow_orchestration"\s*\{/.test(line)) {
      inBlock = true;
    }

    if (!inBlock) continue;

    block.push(line);
    depth += (line.match(/\{/g) || []).length;
    depth -= (line.match(/\}/g) || []).length;
    if (depth === 0) {
      return block.join('\n');
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

function extractModuleEcrRepo(imageValue) {
  const match = imageValue.match(/\$\{module\.ecr\.repository_urls\["([^"]+)"\]\}:/);
  return match ? match[1] : null;
}

const ecrRepositories = parseEcrRepositories();
const workflowBuildRepositories = parseWorkflowBuildRepositories();

for (const repoName of workflowBuildRepositories) {
  if (!ecrRepositories.has(repoName)) {
    fail(
      `${path.relative(repoRoot, workflowFile)}: build workflow repo ${repoName} is not declared in infra/terraform/modules/ecr/main.tf`
    );
  }
}

for (const relativeFile of collectEnvironmentFiles(environmentsRoot)) {
  const absoluteFile = path.join(repoRoot, relativeFile);
  const text = read(absoluteFile);
  const block = parseWorkflowModuleBlock(text);
  if (!block) continue;

  for (const key of workflowImageKeys) {
    const imageValue = readQuoted(block, key);
    if (!imageValue) continue;

    const referencedRepo = extractModuleEcrRepo(imageValue);
    if (!referencedRepo) continue;

    if (!ecrRepositories.has(referencedRepo)) {
      fail(
        `${relativeFile}: ${key} references ECR repo ${referencedRepo}, but infra/terraform/modules/ecr/main.tf does not declare it`
      );
    }

    if (!workflowBuildRepositories.has(referencedRepo)) {
      fail(
        `${relativeFile}: ${key} references ECR repo ${referencedRepo}, but .github/workflows/build-push-ecr.yml does not build it`
      );
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log('Workflow image contract checks passed');
