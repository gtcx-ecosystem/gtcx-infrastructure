#!/usr/bin/env node
/**
 * @fileoverview Report dependabot PR merge readiness by tier (S3-01 operator aid).
 *
 * Usage:
 *   node platform/tools/scripts/dependabot-merge-plan.mjs
 *   node platform/tools/scripts/dependabot-merge-plan.mjs --check
 */

import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const TIER1 = [/tinyexec/];
const TIER2 = [/@eslint\/js/];
const TIER4 = [/\bai\b/, /@ai-sdk\//];
const REJECT = [/@types\/node/, /typescript.*6\.0/];

export function classifyPr(title) {
  if (REJECT.some((r) => r.test(title))) return 'reject';
  if (TIER1.some((r) => r.test(title))) return 'tier1';
  if (TIER2.some((r) => r.test(title))) return 'tier2';
  if (TIER4.some((r) => r.test(title))) return 'tier4-batch';
  return 'tier3-review';
}

export function parseGhPrList(json) {
  return JSON.parse(json);
}

export function summarizeReadiness(prs, checksByNumber) {
  const failures = [];
  const plan = [];
  for (const pr of prs) {
    const tier = classifyPr(pr.title);
    if (tier === 'reject') {
      plan.push({ number: pr.number, tier, title: pr.title, action: 'close-with-rationale' });
      continue;
    }
    const checks = checksByNumber.get(pr.number) ?? [];
    const ciFail = checks.some((c) => c.state === 'FAIL' || c.state === 'failure');
    const action = ciFail ? 'blocked-ci-red' : 'merge-when-approved';
    if (tier === 'tier1' && ciFail) {
      failures.push(
        `PR #${pr.number} tier1 blocked: CI red — merge roadmap branch to main first`
      );
    }
    plan.push({ number: pr.number, tier, title: pr.title, action, ciFail });
  }
  return { plan, failures };
}

function fetchOpenDependabotPrs() {
  const json = execSync(
    'gh pr list --state open --json number,title,headRefName --limit 30',
    { cwd: ROOT, encoding: 'utf8' }
  );
  return parseGhPrList(json).filter((p) => p.headRefName.startsWith('dependabot/'));
}

function fetchChecks(prNumber) {
  try {
    const out = execSync(`gh pr checks ${prNumber} --json name,state 2>/dev/null`, {
      cwd: ROOT,
      encoding: 'utf8',
    });
    return JSON.parse(out);
  } catch {
    return [];
  }
}

function main() {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) {
    console.log(
      '[dependabot-merge-plan] skip: GH_TOKEN not set (optional locally; required in CI for gh pr list)'
    );
    return;
  }
  process.env.GH_TOKEN = token;

  const checkOnly = process.argv.includes('--check');
  const prs = fetchOpenDependabotPrs();
  const checksByNumber = new Map();
  for (const pr of prs) {
    checksByNumber.set(pr.number, fetchChecks(pr.number));
  }
  const { plan, failures } = summarizeReadiness(prs, checksByNumber);

  for (const row of plan) {
    console.log(
      `#${row.number} [${row.tier}] ${row.action}${row.ciFail ? ' (CI red)' : ''} — ${row.title}`
    );
  }

  if (checkOnly && failures.length > 0) {
    console.error('[dependabot-merge-plan] unblock: merge 01-docs/roadmap-update-2026-05-30 to main');
    for (const f of failures) console.error(`- ${f}`);
    process.exit(1);
  }

  const tier1Ready = plan.filter((p) => p.tier === 'tier1' && p.action === 'merge-when-approved');
  console.log(
    `[dependabot-merge-plan] ${prs.length} dependabot PR(s); tier1 merge-ready: ${tier1Ready.length}`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main();
