#!/usr/bin/env node
/**
 * @fileoverview Validate that every `pnpm` and `pnpm ctl` command
 * referenced in a runbook code block actually exists. Catches the
 * "runbook theater" pattern where docs prescribe commands the
 * toolchain cannot run.
 *
 * Scope (intentionally narrow):
 *   - `pnpm <script>` references → must exist as a script in the root
 *     package.json scripts map.
 *   - `pnpm ctl <area> <action>` → must match a known subcommand in
 *     tools/control-plane/gtcx-ctl.mjs's help output.
 *
 * Out of scope (would produce too many false positives):
 *   - Bare shell commands (curl, kubectl, etc).
 *   - `node tools/...` direct invocations (those exist as files;
 *     verified separately).
 *   - Command flags/options — only the verb path is checked. A bad
 *     flag value passes; a misnamed subcommand fails.
 *
 * Run with `--check` (default) or `--list` to print the resolved
 * command graph.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const RUNBOOKS_DIR = join(REPO_ROOT, 'docs', 'operations', 'runbooks');

// Hand-maintained from gtcx-ctl.mjs's showHelp(). The CLI is small
// enough that drift is detectable on PR review. A self-describing
// CLI (--commands json) would close this loop; tracked as a follow-up.
const CTL_COMMANDS = new Set([
  'deploy plan',
  'deploy apply',
  'deploy rollback',
  'workflow status',
  'workflow trigger',
  'workflow suspend',
  'workflow resume',
  'evidence rollback-capture',
  'evidence prepare-intelligence-env',
  'evidence release-bundle',
  'evidence runtime-smoke',
  'evidence worm-upload',
  'validate',
]);

function loadPnpmScripts() {
  const pkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8'));
  return new Set(Object.keys(pkg.scripts ?? {}));
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (entry.endsWith('.md')) out.push(p);
  }
  return out;
}

function extractCodeBlocks(text) {
  const blocks = [];
  const rx = /```(?:bash|sh|shell)?\n([\s\S]*?)```/g;
  let m;
  while ((m = rx.exec(text)) !== null) blocks.push(m[1]);
  return blocks;
}

function extractCommands(blocks) {
  const refs = [];
  for (const block of blocks) {
    // Skip blocks explicitly tagged as running outside this repo.
    // Convention: a `# cwd: <other-repo>` comment anywhere in the block
    // exempts the entire block from this-repo command validation.
    if (/^\s*#\s*cwd:\s*(?!\s*\.|\s*\/Users\/amanianai\/Sites\/gtcx-ecosystem\/gtcx-infrastructure)/m.test(block)) {
      continue;
    }
    for (const rawLine of block.split('\n')) {
      // Strip leading `$ ` or `# ` prompts; ignore comment lines.
      const line = rawLine.replace(/^\s*\$?\s*/, '').replace(/^#.*$/, '').trim();
      if (!line) continue;
      // pnpm ctl <area> [action] [flags...]
      const ctlMatch = line.match(/^pnpm\s+ctl\s+([a-z-]+)(?:\s+([a-z-]+))?/);
      if (ctlMatch) {
        const verb = ctlMatch[2] ? `${ctlMatch[1]} ${ctlMatch[2]}` : ctlMatch[1];
        refs.push({ kind: 'ctl', verb, raw: line });
        continue;
      }
      // pnpm <script> [flags...] — but only the first token after `pnpm`,
      // and only if it doesn't begin with `-` or look like an `install`.
      const pnpmMatch = line.match(/^pnpm\s+(?:run\s+)?([a-z][a-z0-9:_-]*)/);
      if (pnpmMatch) {
        const script = pnpmMatch[1];
        // Skip built-ins and dependency installs which aren't repo scripts.
        if (['install', 'add', 'remove', 'update', 'audit', 'run', 'exec', 'why', 'list', 'ls', 'outdated', 'store', 'create'].includes(script)) {
          continue;
        }
        refs.push({ kind: 'script', verb: script, raw: line });
      }
    }
  }
  return refs;
}

function main() {
  const checkOnly = !process.argv.includes('--list');
  const scripts = loadPnpmScripts();
  const files = walk(RUNBOOKS_DIR);

  const failures = [];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const blocks = extractCodeBlocks(text);
    const refs = extractCommands(blocks);
    for (const ref of refs) {
      if (ref.kind === 'ctl') {
        if (!CTL_COMMANDS.has(ref.verb)) {
          failures.push({ file: file.replace(`${REPO_ROOT}/`, ''), ...ref });
        }
      } else if (ref.kind === 'script') {
        if (!scripts.has(ref.verb)) {
          failures.push({ file: file.replace(`${REPO_ROOT}/`, ''), ...ref });
        }
      }
    }
  }

  if (!checkOnly) {
    console.log(`[runbook-commands-check] checked ${files.length} runbook(s)`);
    console.log(`[runbook-commands-check] root pnpm scripts: ${scripts.size}`);
    console.log(`[runbook-commands-check] known ctl verbs: ${CTL_COMMANDS.size}`);
  }

  if (failures.length > 0) {
    console.error(`[runbook-commands-check] ${failures.length} unknown command(s):`);
    for (const f of failures) {
      console.error(`  - ${f.file}: ${f.kind} '${f.verb}'`);
      console.error(`      ${f.raw}`);
    }
    console.error(
      '\nEither rename the runbook command to a real one, or add the missing ' +
        'script/CLI subcommand.'
    );
    process.exit(1);
  }
  console.log(`[runbook-commands-check] all referenced pnpm + pnpm ctl commands exist`);
}

main();
