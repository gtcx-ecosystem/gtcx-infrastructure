#!/usr/bin/env node
/**
 * GTCX session start — forwards to baseline-os `baseline start` (full chain SSOT).
 * Rolled out to ecosystem repos via ecosystem:rollout-agent-start.
 *
 * Phase B-only (repo-session-core) is deprecated. This now calls the full
 * `baseline start` chain (Phase A institutional → Phase B repo → Phase C gates).
 * Use --skip-startup or --skip-gates for lighter variants.
 */
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { findBaselineOsRoot } from '../../baseline-os/03-platform/scripts/ecosystem/lib/resolve-baseline-os-root.mjs';

const baselineRoot = findBaselineOsRoot(process.cwd());
if (!baselineRoot) {
  console.error(
    'ERROR: baseline-os not found (side-by-side checkout or set GTCX_ECOSYSTEM_ROOT).',
  );
  console.error('Fallback: run `pnpm agent:next-work` and read 01-docs/04-ops/agent-universal-instructions.md');
  process.exit(1);
}

// Call baseline start (full chain) instead of repo-session-core (Phase B only)
const baselineBin = join(baselineRoot, '03-platform/packages/baselineos/dist/cli/bin.js');
const passthrough = process.argv.slice(2);
const result = spawnSync(
  process.execPath,
  [baselineBin, 'start', ...passthrough],
  {
    stdio: 'inherit',
    cwd: process.cwd(),
  }
);
process.exit(result.status ?? 1);
