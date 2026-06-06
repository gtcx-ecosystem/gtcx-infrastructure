#!/usr/bin/env node
/**
 * Protocol 22 adoption check for gtcx-infrastructure.
 * Validates manifest, script, package scripts, and AGENTS.md references.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');

const CHECKS = [
  {
    name: 'manifest exists',
    path: join(ROOT, '01-docs/operations/agent-work-selection.md'),
    test: (p) => existsSync(p),
  },
  {
    name: 'manifest has adoption_status',
    path: join(ROOT, '01-docs/operations/agent-work-selection.md'),
    test: (p) => {
      if (!existsSync(p)) return false;
      const content = readFileSync(p, 'utf8');
      return /adoption_status:\s*(pilot|established)/.test(content);
    },
  },
  {
    name: 'selection script exists',
    path: join(ROOT, '03-platform/scripts/agent-next-work.mjs'),
    test: (p) => existsSync(p),
  },
  {
    name: 'selection script is executable',
    path: join(ROOT, '03-platform/scripts/agent-next-work.mjs'),
    test: (p) => {
      if (!existsSync(p)) return false;
      const content = readFileSync(p, 'utf8');
      return content.includes('protocol: \'22-agent-work-selection\'') && content.includes('gtcx-infrastructure');
    },
  },
  {
    name: 'package.json has agent:next-work script',
    path: join(ROOT, 'package.json'),
    test: (p) => {
      if (!existsSync(p)) return false;
      const pkg = JSON.parse(readFileSync(p, 'utf8'));
      return !!pkg.scripts?.['agent:next-work'];
    },
  },
  {
    name: 'package.json has agent:work-selection:check script',
    path: join(ROOT, 'package.json'),
    test: (p) => {
      if (!existsSync(p)) return false;
      const pkg = JSON.parse(readFileSync(p, 'utf8'));
      return !!pkg.scripts?.['agent:work-selection:check'];
    },
  },
  {
    name: 'AGENTS.md references Protocol 22',
    path: join(ROOT, 'AGENTS.md'),
    test: (p) => {
      if (!existsSync(p)) return false;
      const content = readFileSync(p, 'utf8');
      return content.includes('Protocol 22') && content.includes('agent:next-work');
    },
  },
  {
    name: 'auto-dev-state.md has Next work block',
    path: join(ROOT, '01-docs/audit/auto-dev-state.md'),
    test: (p) => {
      if (!existsSync(p)) return false;
      const content = readFileSync(p, 'utf8');
      return /Next work \(computed\)/i.test(content);
    },
  },
  {
    name: 'execution roadmap exists',
    path: join(ROOT, '01-docs/audit/execution-roadmap.md'),
    test: (p) => existsSync(p),
  },
];

let passed = 0;
let failed = 0;

for (const check of CHECKS) {
  const ok = check.test(check.path);
  if (ok) {
    passed++;
    console.log(`  ✓ ${check.name}`);
  } else {
    failed++;
    console.log(`  ✗ ${check.name}`);
  }
}

console.log(`\n${passed}/${CHECKS.length} checks passed`);
if (failed > 0) {
  console.log(`${failed} check(s) failed — Protocol 22 adoption incomplete.`);
  process.exit(1);
}
console.log('Protocol 22 adoption check passed.');
