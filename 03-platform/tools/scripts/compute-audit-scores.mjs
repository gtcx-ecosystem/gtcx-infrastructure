#!/usr/bin/env node
/**
 * Canonical audit score calculator — IR (engineering) and XC (external) are independent.
 *
 * Usage:
 *   node 03-platform/tools/03-platform/scripts/compute-audit-scores.mjs
 *   node 03-platform/tools/03-platform/scripts/compute-audit-scores.mjs --write
 *   node 03-platform/tools/03-platform/scripts/compute-audit-scores.mjs --markdown
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const RUBRIC = path.join(ROOT, '01-docs/05-audit/scoring-rubric.json');
const LEDGER = path.join(ROOT, '01-docs/05-audit/score-evidence-ledger.json');
const CI_SNAPSHOT = path.join(ROOT, '01-docs/05-audit/ci-snapshot.json');
const LATEST = path.join(ROOT, '01-docs/05-audit/latest.json');

function round1(n) {
  return Math.round(n * 10) / 10;
}

function loadJson(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

function gitHead() {
  try {
    return execSync('git rev-parse HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function compute() {
  const rubric = loadJson(RUBRIC);
  const ledger = loadJson(LEDGER);
  const ci = loadJson(CI_SNAPSHOT);

  const dimensionsConfig = rubric.internalDimensions ?? rubric.dimensions ?? [];
  const externalConfig = rubric.externalBlockers ?? {
    items: rubric.externalAssurancePenalties ?? [],
    burdenCap: 2.0,
  };

  const ledgerById = new Map(ledger.dimensions.map((d) => [d.id, d]));

  /** @type {Record<string, { base: number, adjusted: number, ledgerId: string, weight: number }>} */
  const dimensions = {};

  for (const dim of dimensionsConfig) {
    const entry = ledgerById.get(dim.ledgerId);
    if (!entry) {
      throw new Error(`Ledger missing dimension ${dim.ledgerId} for ${dim.id}`);
    }
    let score = entry.currentScore;
    for (const pen of rubric.ciPenalties ?? []) {
      if (pen.when === 'mainCiFormatFail' && ci.mainCiFormatFail) {
        if (pen.dimension === dim.id) score += pen.delta;
      }
      if (pen.when === 'mainCiJobFail' && ci.mainCiJobFail) {
        if (pen.dimension === dim.id) score += pen.delta;
      }
    }
    score = Math.max(0, Math.min(10, score));
    dimensions[dim.id] = {
      base: entry.currentScore,
      adjusted: round1(score),
      ledgerId: dim.ledgerId,
      weight: dim.weight,
    };
  }

  let internalEngineeringReadiness = 0;
  for (const dim of dimensionsConfig) {
    internalEngineeringReadiness += dimensions[dim.id].adjusted * dim.weight;
  }
  internalEngineeringReadiness = round1(internalEngineeringReadiness);

  const burdenCap = externalConfig.burdenCap ?? 2.0;
  let externalBlockerBurden = 0;
  const openExternalBlockers = [];
  const externalByCategory = { gtm: 0, legal: 0, assurance: 0, operator: 0, other: 0 };

  for (const ext of externalConfig.items ?? []) {
    if (ext.status === 'open') {
      const w = ext.weight ?? ext.penalty ?? 0;
      externalBlockerBurden += w;
      openExternalBlockers.push({
        id: ext.id,
        category: ext.category ?? 'other',
        label: ext.label,
        weight: w,
      });
      const cat = ext.category ?? 'other';
      externalByCategory[cat] = (externalByCategory[cat] ?? 0) + w;
    }
  }
  externalBlockerBurden = Math.min(burdenCap, round1(externalBlockerBurden));
  const externalClearance = round1(Math.max(0, 10 - externalBlockerBurden));

  return {
    rubricId: rubric.rubricId,
    computedAt: new Date().toISOString(),
    head: gitHead() ?? ci.head,
    internalEngineeringReadiness,
    internalReadiness: internalEngineeringReadiness,
    externalClearance,
    externalBlockerBurden,
    openExternalBlockers,
    externalByCategory,
    dimensions,
    ciSnapshot: {
      mainCiFormatFail: ci.mainCiFormatFail,
      mainCiJobFail: ci.mainCiJobFail,
      localValidateAllPass: ci.localValidateAllPass,
      localValidateAllGateCount: ci.localValidateAllGateCount,
    },
    externalRegister: externalConfig.register,
  };
}

function scorecardMarkdown(result) {
  const openList =
    result.openExternalBlockers.length === 0
      ? 'none'
      : result.openExternalBlockers.map((b) => `${b.id} (${b.category})`).join(', ');

  const lines = [
    '## Canonical Scorecard',
    '',
    '### Track 1 — Internal engineering (repo-controlled)',
    '',
    '| Metric | Score | How computed |',
    '|--------|-------|----------------|',
    `| **Internal Engineering Readiness (IR)** | **${result.internalEngineeringReadiness}/10** | Weighted sum of 7 in-repo dimensions + CI penalties only |`,
    '',
    '| Dimension | Weight | Ledger base | After CI penalty |',
    '|-----------|--------|-------------|------------------|',
  ];
  for (const [id, d] of Object.entries(result.dimensions)) {
    lines.push(
      `| ${id} | ${(d.weight * 100).toFixed(0)}% | ${d.base} | **${d.adjusted}** |`
    );
  }
  lines.push(
    '',
    '### Track 2 — External / GTM blockers (separate; does NOT reduce IR)',
    '',
    '| Metric | Score | How computed |',
    '|--------|-------|----------------|',
    `| **External / GTM Clearance (XC)** | **${result.externalClearance}/10** | 10 − ${result.externalBlockerBurden} burden (${openList}) |`,
    '',
    '| Category | Open burden |',
    '|----------|-------------|'
  );
  for (const [cat, burden] of Object.entries(result.externalByCategory)) {
    if (burden > 0) {
      lines.push(`| ${cat} | ${burden} |`);
    }
  }
  lines.push(
    '',
    `Register: \`${result.externalRegister ?? '01-docs/05-audit/external-dependencies-register-2026-05-31.md'}\``,
    '',
    '**Retired:** `certifiedReadiness`, `CR = IR − gap`, `composite` as external-adjusted score.',
    '',
    'Recompute: `node 03-platform/tools/03-platform/scripts/compute-audit-scores.mjs --write`',
    ''
  );
  return lines.join('\n');
}

function main() {
  const write = process.argv.includes('--write');
  const markdown = process.argv.includes('--markdown');
  const result = compute();

  if (markdown) {
    console.log(scorecardMarkdown(result));
    return;
  }

  console.log(JSON.stringify(result, null, 2));

  if (write) {
    const prev = loadJson(LATEST);
    const next = {
      ...prev,
      auditDate: result.computedAt.slice(0, 10),
      verifiedAt: result.computedAt,
      head: result.head?.slice(0, 7) ?? prev.head,
      rubricId: result.rubricId,
      scores: {
        internalEngineeringReadiness: result.internalEngineeringReadiness,
        internalReadiness: result.internalEngineeringReadiness,
        externalClearance: result.externalClearance,
        externalBlockerBurden: result.externalBlockerBurden,
        codeQuality: result.dimensions.codeQuality.adjusted,
        repoHygiene: result.dimensions.repoHygiene.adjusted,
        security: result.dimensions.security.adjusted,
        globalSouthResilience: result.dimensions.globalSouthResilience.adjusted,
        ecosystemIntegration: result.dimensions.ecosystemIntegration.adjusted,
        agenticMaturity: result.dimensions.agenticMaturity.adjusted,
        enterpriseReadiness: result.dimensions.enterpriseReadiness.adjusted,
      },
      externalBlockers: {
        register: result.externalRegister,
        open: result.openExternalBlockers,
        burden: result.externalBlockerBurden,
        byCategory: result.externalByCategory,
      },
      scoreReconciliation:
        'IR = in-repo engineering only. XC = external/GTM track (separate). See 01-docs/05-audit/SCORING.md v2. certifiedReadiness/composite as IR−gap are retired.',
      deprecatedScores: {
        certifiedReadiness: 'retired — use externalClearance (XC) for external track; IR for engineering',
        composite: 'retired — use internalEngineeringReadiness',
      },
      ciSnapshot: result.ciSnapshot,
    };
    writeFileSync(LATEST, `${JSON.stringify(next, null, 2)}\n`);
    console.error(`Wrote ${LATEST}`);
  }
}

main();
