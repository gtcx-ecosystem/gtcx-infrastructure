---
title: 'Canonical audit scoring'
status: current
date: '2026-06-01'
owner: quality-evidence-lead
tier: critical
tags: ['audit', 'scoring', 'IR', 'XC']
review_cycle: on-change
---

# Canonical audit scoring — gtcx-infrastructure

**Single source of truth:** `node tools/scripts/compute-audit-scores.mjs --write` → `docs/audit/latest.json`

## Two independent scores (do not merge them)

| ID     | Name                               | JSON key                       | What it measures                                                                                   |
| ------ | ---------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------- |
| **IR** | **Internal Engineering Readiness** | `internalEngineeringReadiness` | Can engineering ship and prove it **in this repo**? Gates, code, tests, structural automation.     |
| **XC** | **External / GTM Clearance**       | `externalClearance`            | Are **outside-the-repo** blockers closed? Legal, pilot owner, pen-test SOW, operator-run live ops. |

**IR is not “minus outsiders.”** XC is a **separate** score. A team can have **IR 7.6** with full engineering velocity while **XC 9.0** (one point of external burden) until EXT-INF items close.

### Formulas (v2 — fixed)

```
IR = Σ (internalDimension × weight)   # 7 dimensions; CI penalties from ci-snapshot.json only

externalBlockerBurden = Σ weight of open items in scoring-rubric.json → externalBlockers
XC = 10 − min(10, externalBlockerBurden)
```

**Do not use:** `certifiedReadiness`, `certified composite`, `CR = IR − gap`. Those are **retired** (v1 rubric).

## Track 1 — Internal engineering (IR)

### Seven dimensions

| Dimension             | Weight | Ledger id                 | In scope                                              | Out of scope                                |
| --------------------- | ------ | ------------------------- | ----------------------------------------------------- | ------------------------------------------- |
| codeQuality           | 15%    | `code-quality`            | Tests, coverage, types                                | —                                           |
| repoHygiene           | 12%    | `repo-hygiene`            | CI truth, format, docs                                | —                                           |
| security              | 15%    | `security`                | Policies, Kyverno, audit gate                         | Vendor pen-test execution                   |
| globalSouthResilience | 10%    | `global-south-resilience` | USSD, low-bandwidth                                   | —                                           |
| ecosystemIntegration  | 10%    | `ecosystem-integration`   | Contract tests in-repo                                | Org secret for sibling repos                |
| agenticMaturity       | 13%    | `agentic-maturity`        | validate-all, eval gates                              | —                                           |
| enterpriseReadiness   | 25%    | `enterprise-readiness`    | DR **script**, WORM **gate**, evidence **generators** | Live RDS restore, recurring WORM **upload** |

### CI penalties (still internal)

From `docs/audit/ci-snapshot.json` — e.g. `main` Prettier fail → `repoHygiene −0.4`.

## Track 2 — External / GTM blockers (XC)

Canonical list: `scoring-rubric.json` → `externalBlockers.items`  
Full register: [`external-dependencies-register-2026-05-31.md`](./external-dependencies-register-2026-05-31.md)

| Category      | Example EXT-INF | Blocks                          |
| ------------- | --------------- | ------------------------------- |
| **gtm**       | EXT-INF-013     | Pilot owner, cadence            |
| **legal**     | EXT-INF-014     | DPA, pilot agreement            |
| **assurance** | EXT-INF-002     | Pen-test SOW signature          |
| **operator**  | EXT-INF-003     | Live WORM recurrence (AWS/OIDC) |

When an item closes: set `status: "done"` in **both** the register and `scoring-rubric.json`, then `--write`.

## What full audits must do

1. Run `node tools/scripts/compute-audit-scores.mjs --markdown` — paste **both** IR and XC blocks.
2. Phase 1–5: qualitative ratings only (Strong / Good / Pass).
3. Phase 3 GTM: stage labels (S2, S3) — **not** a third /10 score.
4. Sprint plans: say which track moves (e.g. “closes EXT-INF-013 → XC +0.25”), not “CR +0.8”.

## Supplementary (neither IR nor XC)

| Metric                    | Where                                           |
| ------------------------- | ----------------------------------------------- |
| SIGNAL ≈9.6               | `signal-scorecard.json`                         |
| GTM S0–S6                 | Phase 3 narrative                               |
| Retired 9.0 core-weighted | Historical only — see `AUDIT-RECONCILIATION.md` |

## Files

| File                                  | Role                               |
| ------------------------------------- | ---------------------------------- |
| `scoring-rubric.json`                 | IR weights + external blocker list |
| `score-evidence-ledger.json`          | IR dimension history (append-only) |
| `ci-snapshot.json`                    | IR CI penalties                    |
| `external-dependencies-register-*.md` | Human-facing EXT-INF detail        |
| `latest.json`                         | Calculator output                  |
| `ir-10-10-roadmap.md`                 | IR 7.6 → 10.0 execution plan       |
