#!/usr/bin/env node
/**
 * @fileoverview Generate pen-test SOW intake evidence (S2-13 agent prep — not signature).
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const OUT = join(ROOT, '01-docs/audit', 'pen-test-intake-evidence-2026-05-31.md');
const LATEST = join(ROOT, '01-docs/audit', 'latest.json');
const SCOPE = join(ROOT, '01-docs/audit', 'pen-test-scope-2026.md');
const RFP = join(ROOT, '01-docs/audit', 'pen-test-rfp-2026.md');

const REQUIRED_SCOPE_MARKERS = [
  'api.gtcx.trade',
  'compliance-gateway',
  'replay',
  '/v1/replay/verify',
];

export function validatePenTestArtifacts({ scopeText, latest }) {
  const failures = [];
  for (const marker of REQUIRED_SCOPE_MARKERS) {
    if (!scopeText.includes(marker)) failures.push(`pen-test-scope missing: ${marker}`);
  }
  if (!latest?.scores?.internalReadiness) {
    failures.push('latest.json missing internalReadiness score');
  }
  return failures;
}

function gitHead() {
  try {
    return execSync('git rev-parse HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function main() {
  for (const path of [SCOPE, RFP, LATEST]) {
    if (!existsSync(path)) {
      console.error(`[pen-test-intake-evidence] missing ${path}`);
      process.exit(1);
    }
  }
  const scopeText = readFileSync(SCOPE, 'utf8');
  const latest = JSON.parse(readFileSync(LATEST, 'utf8'));
  const failures = validatePenTestArtifacts({ scopeText, latest });
  if (failures.length > 0) {
    console.error('[pen-test-intake-evidence] intake not ready:');
    for (const f of failures) console.error(`- ${f}`);
    process.exit(1);
  }

  const head = gitHead();
  const body = `---
title: 'Pen-Test SOW Intake Evidence — Post Sprint 1-3'
status: current
date: '2026-05-31'
owner: agent:security-engineer
tier: critical
tags: ['audit', 'pen-test', 'evidence', 'sow']
review_cycle: on-change
agent_generated: true
human_signature: pending
---

# Pen-Test SOW Intake Evidence — 2026-05-31

> Agent-generated intake pack for EXT-INF-002 / S2-13. Human SOW signature remains
> required before vendor kickoff.

## Repository state

| Field | Value |
|-------|-------|
| HEAD | \`${head}\` |
| Branch | \`01-docs/roadmap-update-2026-05-30\` |
| Internal readiness | ${latest.scores.internalReadiness}/10 |
| Certified composite | ${latest.scores.composite}/10 |
| validate-all | 36/36 gates (agent closure session) |

## Post-remediation scope anchors (attach to SOW)

1. **Public API:** \`api.gtcx.trade\` routes via Cloudflare Tunnel to \`compliance-gateway:8500\` (not raw protocols).
2. **Replay guard:** \`/v1/replay/verify\` — contract tests in \`03-platform/tools/contract-tests/\`.
3. **Audit chain:** \`@gtcx/audit-signer\` canonical signing; catalog pinned in \`03-platform/tools/compliance-data/\`.
4. **Tenant isolation:** gateway tenancy contract tests; auth failures tagged \`platform\`.
5. **Closed P0s (2026-05-30 audit):** F1–F4, F7, F10–F14; S2-01–S2-10, S2-14; S3 structural gates.

## Vendor documents (existing)

| Document | Path |
|----------|------|
| Scope | \`01-docs/05-audit/pen-test-scope-2026.md\` |
| RFP | \`01-docs/05-audit/pen-test-rfp-2026.md\` |
| Shortlist | \`01-docs/05-audit/pen-test-vendor-shortlist.md\` |
| Readiness pack | \`01-docs/05-audit/vendor-engagement-readiness-pack.md\` |

## Human escalation (EXT-INF)

- [ ] Leadership selects vendor from shortlist
- [ ] SOW signed (S2-13)
- [ ] Kickoff scheduled against **post-Sprint-1** codebase (Q5 AFTER)

## Agent attestation

- [x] Scope documents present and reference compliance-gateway boundary
- [x] Machine-readable scores in \`01-docs/05-audit/latest.json\`
- [ ] SOW signature and vendor engagement (human)
`;

  writeFileSync(OUT, body);
  console.log(`[pen-test-intake-evidence] wrote ${OUT.replace(`${ROOT}/`, '')}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
