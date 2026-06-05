#!/usr/bin/env node
/**
 * @fileoverview Enforce the repository Node.js runtime floor.
 *
 * Package manifests accept Node >=20.18.0. GitHub Actions use the exact
 * 20.18.0 toolchain so CI cannot silently float to a different Node 20 patch.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_PACKAGE_ENGINE = '>=20.18.0';
const REQUIRED_CI_NODE_VERSION = '20.18.0';
/** Astro 6 requires Node >=22.12; built in docs-site-build.yml, excluded from main CI turbo build. */
const DOCS_SITE_PACKAGE = '03-platform/tools/docs-site/package.json';
const DOCS_SITE_PACKAGE_ENGINE = '>=22.12.0';
const DOCS_SITE_CI_NODE_VERSION = '22.12.0';
const DOCS_SITE_CI_WORKFLOW = '.github/workflows/docs-site-build.yml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function listWorkspacePackageFiles() {
  const files = ['package.json', '04-ship/migrations/package.json'];
  const toolsDir = join(ROOT, 'tools');
  for (const entry of readdirSync(toolsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const packagePath = `03-platform/tools/${entry.name}/package.json`;
    if (existsSync(join(ROOT, packagePath))) files.push(packagePath);
  }
  return files.sort();
}

function listYamlFiles(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listYamlFiles(full));
    } else if (/\.(ya?ml)$/u.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function expectedPackageEngine(file) {
  return file === DOCS_SITE_PACKAGE ? DOCS_SITE_PACKAGE_ENGINE : REQUIRED_PACKAGE_ENGINE;
}

function checkPackageEngines() {
  const failures = [];
  for (const file of listWorkspacePackageFiles()) {
    const pkg = readJson(join(ROOT, file));
    const expected = expectedPackageEngine(file);
    if (pkg.engines?.node !== expected) {
      failures.push(
        `${file}: engines.node must be ${JSON.stringify(expected)}, got ${JSON.stringify(pkg.engines?.node)}`
      );
    }
  }
  return failures;
}

function checkGithubNodeVersions() {
  const failures = [];
  for (const file of listYamlFiles(join(ROOT, '.github'))) {
    const rel = relative(ROOT, file);
    const text = readFileSync(file, 'utf8');
    const lines = text.split('\n');
    lines.forEach((line, index) => {
      const nodeVersion = line.match(/node-version:\s*['"]?([^'"\s#]+)['"]?/u);
      if (nodeVersion && !nodeVersion[1].startsWith('${{')) {
        const expectedCi =
          rel === DOCS_SITE_CI_WORKFLOW ? DOCS_SITE_CI_NODE_VERSION : REQUIRED_CI_NODE_VERSION;
        if (nodeVersion[1] !== expectedCi) {
          failures.push(
            `${rel}:${index + 1}: node-version must be ${expectedCi}, got ${nodeVersion[1]}`
          );
        }
      }
    });

    if (rel.startsWith('.github/actions/')) {
      const inputDefault = text.match(
        /inputs:\s*[\s\S]*?node-version:\s*[\s\S]*?default:\s*['"]?([^'"\s#]+)['"]?/u
      );
      if (inputDefault && inputDefault[1] !== REQUIRED_CI_NODE_VERSION) {
        failures.push(
          `${rel}: node-version input default must be ${REQUIRED_CI_NODE_VERSION}, got ${inputDefault[1]}`
        );
      }
    }
  }
  return failures;
}

const failures = [...checkPackageEngines(), ...checkGithubNodeVersions()];
if (failures.length > 0) {
  console.error('[node-version-floor-check] Node floor drift detected:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `[node-version-floor-check] ${listWorkspacePackageFiles().length} package manifest(s) and GitHub Actions Node versions satisfy ${REQUIRED_PACKAGE_ENGINE} / ${REQUIRED_CI_NODE_VERSION}`
);
