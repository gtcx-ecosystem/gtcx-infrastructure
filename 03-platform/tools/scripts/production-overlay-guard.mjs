#!/usr/bin/env node
/**
 * @fileoverview Guard against committing a version-shaped (`v1.0.0`,
 * `1.2.3`, `latest`) tag in production overlay image references.
 *
 * Production deploys go through `04-ship/03-platform/scripts/deploy.sh`, which
 * rewrites the kustomization at runtime via `kustomize edit set image`
 * to inject the real ECR URI + 40-char commit SHA. The committed file
 * must contain a placeholder tag so that a manual
 * `kubectl apply -k overlays/production/` fails fast (ImagePullBackOff)
 * instead of silently deploying a stale or decorative version.
 *
 * Accepted committed tags:
 *   - PLACEHOLDER-RUN-DEPLOY-SH  (intentionally unparseable as a real release)
 *   - 40-char lowercase hex SHA  (pre-pinned by CI for stable services)
 *
 * Rejected:
 *   - v\d+(\.\d+)*          → looks real, not real
 *   - \d+\.\d+              → semver-ish
 *   - latest                → never in production
 *   - main / master / dev   → branch refs
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TARGET = join(REPO_ROOT, 'infra', 'kubernetes', 'overlays', 'production', 'kustomization.yaml');

export const SHA_RX = /^[0-9a-f]{40}$/;
export const PLACEHOLDER_RX = /^PLACEHOLDER-RUN-DEPLOY-SH$/;
export const TAG_LINE_RX = /^\s*newTag:\s*['"]?([^'"\s]+)['"]?/;

/**
 * Classify a kustomization image tag.
 * @param {string} tag
 * @returns {'sha'|'placeholder'|'disallowed'}
 */
export function classifyTag(tag) {
  if (SHA_RX.test(tag)) return 'sha';
  if (PLACEHOLDER_RX.test(tag)) return 'placeholder';
  return 'disallowed';
}

function main() {
  let text;
  try {
    text = readFileSync(TARGET, 'utf8');
  } catch (err) {
    console.error(`[production-overlay-guard] cannot read ${TARGET}: ${err.message}`);
    process.exit(1);
  }

  const offenders = [];
  let lineNo = 0;
  for (const line of text.split('\n')) {
    lineNo += 1;
    const m = line.match(TAG_LINE_RX);
    if (!m) continue;
    const tag = m[1];
    if (classifyTag(tag) !== 'disallowed') continue;
    offenders.push({ line: lineNo, tag, source: line.trim() });
  }

  if (offenders.length > 0) {
    console.error(
      '[production-overlay-guard] disallowed image tag(s) in production overlay:'
    );
    for (const o of offenders) {
      console.error(`  - ${TARGET.replace(`${REPO_ROOT}/`, '')}:${o.line}  ${o.source}`);
    }
    console.error(
      '\nProduction images must be either:\n' +
        '  - the literal placeholder `PLACEHOLDER-RUN-DEPLOY-SH` (rewritten by deploy.sh), OR\n' +
        '  - a 40-char lowercase hex SHA (pre-pinned by CI for stable services).\n' +
        '\nA version-shaped tag like `v1.0.0` previously looked real but was decorative;\n' +
        'kubectl apply -k would try to pull a non-existent image OR — worse — silently\n' +
        'pull whatever `latest` points at if the placeholder ever became a real ref.'
    );
    process.exit(1);
  }
  console.log('[production-overlay-guard] production overlay image tags clean');
}

if (import.meta.url === `file://${process.argv[1]}`) main();
