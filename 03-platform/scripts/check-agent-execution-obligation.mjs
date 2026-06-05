#!/usr/bin/env node
// ============================================================================
// Protocol 27 — Agent Execution Obligation adoption validator
// ============================================================================
// Run: pnpm agent:execution-obligation:check
// ============================================================================

import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = process.cwd();

const paths = {
  agentsMd: join(REPO_ROOT, "AGENTS.md"),
  cursorRule: join(
    REPO_ROOT,
    ".cursor/rules/protocol-27-agent-execution-obligation.mdc"
  ),
  pkg: join(REPO_ROOT, "package.json"),
  ciWorkflow: join(REPO_ROOT, ".github/workflows/ci.yml"),
};

const checks = [
  {
    name: "AGENTS.md references Phase 5.7",
    test: () => /Phase 5\.7/.test(readFileSync(paths.agentsMd, "utf8")),
  },
  {
    name: "AGENTS.md references Protocol 27",
    test: () =>
      /Protocol 27|27-agent-execution-obligation/.test(
        readFileSync(paths.agentsMd, "utf8")
      ),
  },
  {
    name: "AGENTS.md lists V2–V4 commands",
    test: () =>
      /V2.*pnpm lint/.test(readFileSync(paths.agentsMd, "utf8")) &&
      /V3.*pnpm test/.test(readFileSync(paths.agentsMd, "utf8")) &&
      /V4.*validate-all/.test(readFileSync(paths.agentsMd, "utf8")),
  },
  {
    name: "Cursor rule exists",
    test: () => existsSync(paths.cursorRule),
  },
  {
    name: "Cursor rule has alwaysApply: true",
    test: () =>
      /alwaysApply:\s*true/.test(readFileSync(paths.cursorRule, "utf8")),
  },
  {
    name: "package.json has test script",
    test: () => {
      const pkg = JSON.parse(readFileSync(paths.pkg, "utf8"));
      return !!pkg.scripts?.test;
    },
  },
  {
    name: "package.json has lint script",
    test: () => {
      const pkg = JSON.parse(readFileSync(paths.pkg, "utf8"));
      return !!pkg.scripts?.lint;
    },
  },
  {
    name: "package.json has typecheck script",
    test: () => {
      const pkg = JSON.parse(readFileSync(paths.pkg, "utf8"));
      return !!pkg.scripts?.typecheck;
    },
  },
  {
    name: "CI workflow runs lint",
    test: () => /pnpm lint/.test(readFileSync(paths.ciWorkflow, "utf8")),
  },
  {
    name: "CI workflow runs typecheck",
    test: () => /pnpm typecheck/.test(readFileSync(paths.ciWorkflow, "utf8")),
  },
  {
    name: "CI workflow runs test",
    test: () => /pnpm test/.test(readFileSync(paths.ciWorkflow, "utf8")),
  },
  {
    name: "CI workflow runs validate-all",
    test: () =>
      /validate-all\.mjs/.test(readFileSync(paths.ciWorkflow, "utf8")),
  },
];

let passed = 0;
let failed = 0;

for (const check of checks) {
  try {
    const ok = check.test();
    if (ok) {
      console.log(`  ✅ ${check.name}`);
      passed++;
    } else {
      console.log(`  ❌ ${check.name}`);
      failed++;
    }
  } catch (err) {
    console.log(`  ❌ ${check.name} — ${err.message}`);
    failed++;
  }
}

console.log(`\n${passed}/${checks.length} checks passed`);

if (failed > 0) {
  process.exit(1);
}
