/**
 * Canonical path joins for gtcx-infrastructure — import from scripts/tests via sor-map.
 * SoR: config/sor-map.json
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CONFIG_DIR = dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = join(CONFIG_DIR, '..');
export const ALLOWLIST_PATH = join(REPO_ROOT, 'docs/operations/repo/root-allowlist.json');
export const SOR_MAP_PATH = join(REPO_ROOT, 'config/sor-map.json');
export const REPO_KIND_PATH = join(REPO_ROOT, 'config/repo-kind.json');
export const GOVERNANCE_SPINE_PATH = join(REPO_ROOT, 'config/governance-spine.json');
export const DOCS_INDEX_PATH = join(REPO_ROOT, 'docs/INDEX.md');
export const PLATFORM_SCRIPTS = join(REPO_ROOT, 'platform/scripts');
export const PLATFORM_TOOLS = join(REPO_ROOT, 'platform/tools');
export const DEPLOY_ROOT = join(REPO_ROOT, 'deploy');
export const DEPLOY_SCRIPTS = join(REPO_ROOT, 'deploy/platform/scripts');
export const AUDIT_EVIDENCE = join(REPO_ROOT, 'audit/evidence');
export const AUDIT_NARRATIVE = join(REPO_ROOT, 'audit');
export const TOOLCHAIN = join(REPO_ROOT, 'config/toolchain');

/** @returns {Record<string, unknown>} */
export function loadSorMap() {
  return JSON.parse(readFileSync(SOR_MAP_PATH, 'utf8'));
}

/** @param {string} key sor-map paths key */
export function relFromSor(key) {
  const sor = loadSorMap();
  const rel = sor.paths?.[key];
  if (!rel) throw new Error(`sor-map paths.${key} missing`);
  return rel;
}

/** @param {string} key sor-map paths key */
export function absFromSor(key) {
  return join(REPO_ROOT, relFromSor(key));
}
