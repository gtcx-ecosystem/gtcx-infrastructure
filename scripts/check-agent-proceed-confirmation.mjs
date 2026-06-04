#!/usr/bin/env node
// ============================================================================
// Protocol 26 — Agent Proceed Confirmation adoption validator
// ============================================================================
// Run: pnpm agent:proceed-confirmation:check
// ============================================================================

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = process.cwd();

const paths = {
  agentsMd: join(REPO_ROOT, "AGENTS.md"),
  cursorRule: join(
    REPO_ROOT,
    ".cursor/rules/protocol-26-agent-proceed-confirmation.mdc"
  ),
  manifest: join(
    REPO_ROOT,
    "docs/operations/agent-proceed-confirmation.md"
  ),
  pkg: join(REPO_ROOT, "package.json"),
  ciWorkflow: join(REPO_ROOT, ".github/workflows/ci.yml"),
};

const checks = [
  {
    name: "AGENTS.md references Phase 5.6",
    test: () => /Phase 5\.6/.test(readFileSync(paths.agentsMd, "utf8")),
  },
  {
    name: "AGENTS.md references Protocol 26",
    test: () =>
      /Protocol 26|26-agent-proceed-confirmation/.test(
        readFileSync(paths.agentsMd, "utf8")
      ),
  },
  {
    name: "AGENTS.md has Proceed Brief template",
    test: () =>
      /Proceed Brief/.test(readFileSync(paths.agentsMd, "utf8")) &&
      /Override:/.test(readFileSync(paths.agentsMd, "utf8")),
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
    name: "Manifest exists",
    test: () => existsSync(paths.manifest),
  },
  {
    name: "package.json has agent:proceed-confirmation:check script",
    test: () => {
      const pkg = JSON.parse(readFileSync(paths.pkg, "utf8"));
      return !!pkg.scripts?.["agent:proceed-confirmation:check"];
    },
  },
  {
    name: "CI runs agent:proceed-confirmation:check",
    test: () =>
      /agent:proceed-confirmation:check/.test(
        readFileSync(paths.ciWorkflow, "utf8")
      ),
  },
  {
    name: "Cursor rule forbids Your call / Two options menus",
    test: () => {
      const rule = readFileSync(paths.cursorRule, "utf8");
      return (
        rule.includes("Your call") &&
        rule.includes("Two options") &&
        rule.includes("alwaysApply: true")
      );
    },
  },
  {
    name: "agent-next-work embeds communicationPolicy",
    test: () =>
      /communicationPolicy/.test(
        readFileSync(join(REPO_ROOT, "scripts/agent-next-work.mjs"), "utf8")
      ),
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
