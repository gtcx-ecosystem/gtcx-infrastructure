#!/usr/bin/env node
/**
 * @fileoverview Flag empty `catch {}` blocks in production source.
 * The pattern is appropriate in narrow contexts (shutdown drains,
 * fire-and-forget cleanup) but otherwise hides exactly the kind of
 * silent failure that delayed the audit-flush S3 bug from being
 * caught for weeks.
 *
 * Approach: walk `tools/<pkg>/src/**` and grep for an exact-match
 * `catch {}` or `catch () {}`. Allowlist a small set of justified
 * sites (each with a comment in this file explaining why).
 *
 * Run with `--list` to print the catch sites without exiting non-zero.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Each allowlist entry is a `path:line` (path relative to repo root)
// with a justification. Adding new entries requires the explanation
// — empty allowlist additions fail review.
const ALLOWLIST = new Set([
  // Shutdown / drain paths — these run during process termination
  // and reraising would prevent clean teardown.
  'tools/compliance-gateway/src/audit-sink.mjs:138', // await natsClient.drain() during sink.close()
  'tools/compliance-gateway/src/adaptive-policy-store.mjs:151', // fall-through path with cleanup
  'tools/compliance-gateway/src/adaptive-policy-store.mjs:154', // client.disconnect() during shutdown
  'tools/compliance-gateway/src/adaptive-policy-store.mjs:244', // await client.quit() during dispose
  'tools/compliance-gateway/src/adaptive-policy-store.mjs:279', // await activeStore.close() during reset
  // budget-store shutdown / already-closed paths
  'tools/compliance-gateway/src/budget-store.mjs:134', // client.disconnect() during dispose
  'tools/compliance-gateway/src/budget-store.mjs:192', // already closed during teardown
  'tools/compliance-gateway/src/budget-store.mjs:243', // best-effort reset during swap
  'tools/compliance-gateway/src/budget-store.mjs:248', // best-effort close during swap
  // NATS stream already-exists (race-safe creation) + shutdown drain.
  'tools/audit-flush/src/nats-consumer.mjs:75',
  'tools/audit-flush/src/nats-consumer.mjs:187',
  // Audit-capture sinks are best-effort by design — a slow / failing
  // sink must not break replay verification on the hot path.
  'tools/replay-protection/src/audit/audit-capture.mjs:88',
  // baseline-os cost-router shim — graceful fallback when dist is not
  // built or BASELINE_COST_ROUTER=0. Reraising would break the query
  // path even when cost routing is disabled.
  'tools/compliance-gateway/src/server.mjs:91',
  'tools/compliance-gateway/src/cost-router-shim.mjs:34',
]);

const SRC_GLOBS = [
  'tools/compliance-gateway/src',
  'tools/audit-flush/src',
  'tools/replay-protection/src',
  'tools/audit-signer/src',
  'tools/deployment-guard/src',
  'tools/compliance-gateway-mcp/src',
];

// Matches a `catch` whose body is empty, OR contains only whitespace +
// block/line comments. Catch parameter is optional and may be a plain
// identifier or a destructuring pattern (object/array).
//
// Why both shapes count as empty: `catch (e) { /* ignore */ }` and
// `catch ({ code }) {}` both swallow the error without acting on it —
// the silent-failure pattern fail-closed.mjs exists to replace.
export const EMPTY_CATCH_RX =
  /catch\s*(?:\(\s*(?:[A-Za-z_$][\w$]*|\{[^{}]*\}|\[[^[\]]*\])\s*\))?\s*\{(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*)*\}/g;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.m?js$/.test(entry) && !entry.endsWith('.test.mjs')) out.push(p);
  }
  return out;
}

function findEmptyCatches(file) {
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  const hits = [];
  EMPTY_CATCH_RX.lastIndex = 0;
  let m;
  while ((m = EMPTY_CATCH_RX.exec(text)) !== null) {
    // Find the line number of the match.
    let lineNo = 1;
    for (let i = 0; i < m.index; i += 1) {
      if (text.charCodeAt(i) === 10) lineNo += 1;
    }
    hits.push({
      file: relative(REPO_ROOT, file),
      line: lineNo,
      source: lines[lineNo - 1]?.trim() ?? '',
    });
  }
  return hits;
}

function main() {
  const listOnly = process.argv.includes('--list');
  const all = [];
  for (const glob of SRC_GLOBS) {
    const dir = join(REPO_ROOT, glob);
    try {
      statSync(dir);
    } catch {
      continue;
    }
    for (const f of walk(dir)) {
      all.push(...findEmptyCatches(f));
    }
  }

  const offenders = all.filter((h) => !ALLOWLIST.has(`${h.file}:${h.line}`));
  const allowed = all.filter((h) => ALLOWLIST.has(`${h.file}:${h.line}`));

  if (listOnly) {
    console.log(`[empty-catch-check] total empty catches: ${all.length}`);
    console.log(`[empty-catch-check] allowed: ${allowed.length}`);
    console.log(`[empty-catch-check] unallowed: ${offenders.length}`);
    for (const h of offenders) console.log(`  - ${h.file}:${h.line}  ${h.source}`);
    return;
  }

  if (offenders.length > 0) {
    console.error(`[empty-catch-check] ${offenders.length} new empty catch block(s):`);
    for (const h of offenders) {
      console.error(`  - ${h.file}:${h.line}  ${h.source}`);
    }
    console.error(
      '\nEmpty `catch {}` hides silent failures. Either:\n' +
        '  1. Use tools/scripts/fail-closed.mjs to log and decide explicitly.\n' +
        '  2. Log via console.error if the failure is truly informational.\n' +
        '  3. Add the site to ALLOWLIST in this script WITH a justification comment.\n'
    );
    process.exit(1);
  }

  // Detect stale allowlist entries (allowlisted but no longer present).
  const live = new Set(all.map((h) => `${h.file}:${h.line}`));
  const stale = [...ALLOWLIST].filter((entry) => !live.has(entry));
  if (stale.length > 0) {
    console.error(
      `[empty-catch-check] stale ALLOWLIST entries (no longer present):\n  ${stale.join('\n  ')}`
    );
    process.exit(1);
  }

  console.log(
    `[empty-catch-check] ${all.length} empty catch(es); ${allowed.length} allowed, 0 unallowed`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main();
