---
title: 'Engineering audit — gtcx-infrastructure'
status: current
date: 2026-06-07
owner: gtcx-infrastructure
role: quality-evidence-lead
audit_lane: engineering-completeness-quality
audit_command: engineering-audit
baseline_commit: c181138
audit_quality_1to10: 8.5
readiness_signoff: 7.5
readiness_completion: 8.3
readiness_lane_score: 7.9
tier: critical
tags: ['audit', 'engineering', 'lane-1', 'forensic']
review_cycle: quarterly
related:
  - engineering-completeness-quality-2026-06-07.md
  - full-audit-2026-06-01.md
  - bank-grade-audit-2026-06-07.md
  - repo-hygiene-2026-06-06.md
---

# Engineering audit — gtcx-infrastructure (lane 1)

> **Lane 1 only.** Not bank-grade 8.3 or GCR tier.  
> **Methodology:** [engineering-scoring.md](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/03-platform/tools/audit/lane-scoring/engineering-scoring.md)  
> **Repo:** `gtcx-infrastructure` @ `c181138` · **Auditor:** Cursor agent (`/engineering-audit`)

**Delta since [`full-audit-2026-06-01.md`](full-audit-2026-06-01.md) @ `6834b476`:** M1 Foundation closed (15/15 packages typecheck/build/lint scripts); `validate-all` **50/50**; **IR-3.4** `gtcx-ctl validate --ci`; **IR-4.1** USSD k6 soak + baseline in CI. **New regressions at HEAD:** `@gtcx/audit-signer` lint (5 errors), `@gtcx/deployment-guard` typecheck (JSDoc/param mismatch). One transient `validate-all` failure (compliance-gateway coverage) observed mid-session; re-run green.

---

## 1. Executive summary

Lane 1 engineering readiness is **strong depth with signoff drag**. Orchestrated gates (`validate-all` 50/50, `build`, `format:check`, agent protocols, SIGNAL 9.60) pass. **Turbo `lint`, `typecheck`, and `pnpm test` fail** at HEAD — blocking a clean 8.0+ signoff. Completion depth remains high: 15 workspace packages, consequential-path coverage gates, replay-protection 90%+ branches, contract tests, FIPS signer tests, USSD soak baseline.

**Weighted lane score: 7.9/10.** **P0:** none. **P1:** deployment-guard typecheck + audit-signer lint. **P2:** compliance-gateway coverage flake under parallel validate-all; 12 missing READMEs.

---

## 2. Gate results (Protocol 27 — in-session @ `c181138`)

| Gate            | Command                                                           | Exit  | Notes                                                                                               |
| --------------- | ----------------------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------- |
| Format          | `pnpm format:check`                                               | 0     | All matched files pass Prettier                                                                     |
| Lint            | `pnpm lint`                                                       | **1** | `@gtcx/audit-signer` — 5 ESLint errors (import order, unused `isFipsMode`)                          |
| Typecheck       | `pnpm typecheck`                                                  | **2** | `@gtcx/deployment-guard` — `migration-safety.mjs:152-157` JSDoc/param mismatch                      |
| Test (quick)    | `pnpm test`                                                       | **2** | Fails on deployment-guard typecheck step in `validate.sh quick`; 56 package tests pass before guard |
| Build           | `pnpm build`                                                      | 0     | 15/15 turbo tasks                                                                                   |
| Architecture    | `pnpm architecture:check`                                         | N/A   | Not defined in root `package.json`                                                                  |
| Validate-all    | `node 03-platform/tools/03-platform/scripts/validate-all.mjs`     | 0     | **50/50** PASS (re-run); **49/50** once mid-session (compliance-gateway coverage)                   |
| Environment CI  | `node 03-platform/tools/control-plane/gtcx-ctl.mjs validate --ci` | 0     | staging + production kustomize offline                                                              |
| SIGNAL          | `node 03-platform/tools/03-platform/scripts/validate-signal.mjs`  | 0     | 9.60/10                                                                                             |
| Protocol 22     | `pnpm agent:work-selection:check`                                 | 0     | 9/9                                                                                                 |
| Protocol 27     | `pnpm agent:execution-obligation:check`                           | 0     | 12/12                                                                                               |
| Readiness lanes | `pnpm readiness:lanes:check` (gtcx-core)                          | 0     | SSOT + anti-drift                                                                                   |

---

## 3. Six-dimension scorecard

| #   | Dimension             | Weight |   Score | Rationale                                                                                                  |
| --- | --------------------- | -----: | ------: | ---------------------------------------------------------------------------------------------------------- |
| 1   | CI / quality gates    |    25% | **7.0** | 7/11 gates pass; lint + typecheck + test fail deterministically                                            |
| 2   | Package completeness  |    20% | **8.5** | 15 workspace packages; M1 wired typecheck/lint/build; ADR-019 exemptions documented                        |
| 3   | Test depth            |    20% | **8.0** | Consequential coverage gates; replay-protection 90.45% branches; USSD 112 tests + soak CI                  |
| 4   | Crypto / safety hooks |    15% | **8.5** | fail-closed, replay-guard, FIPS signer tests, injection-suite, anomaly-detector rules                      |
| 5   | Operational signals   |    10% | **8.2** | Prometheus/Grafana manifests; NATS audit bus; gtcx-ctl preflight; anomaly CronJob                          |
| 6   | Doc–code fidelity     |    10% | **7.8** | [`repo-hygiene-2026-06-06`](repo-hygiene-2026-06-06.md) 8.6; 12 README gaps; specs align with validate-all |

**Weighted lane score** = 7.0×0.25 + 8.5×0.20 + 8.0×0.20 + 8.5×0.15 + 8.2×0.10 + 7.8×0.10 = **7.925 → 7.9**

| Readiness metric |   Value | Basis                                                    |
| ---------------- | ------: | -------------------------------------------------------- |
| Gate signoff     | **7.5** | Three root turbo gates fail at HEAD                      |
| Completion depth | **8.3** | Package matrix + 50-gate orchestrator + IR-3.4/4.1 lifts |
| Lane headline    | **7.9** | Weighted sum (documented above)                          |

---

## 4. Findings

### ENG-P1 — `deployment-guard` typecheck blocks `pnpm test`

- **Severity:** P1
- **Evidence:** `03-platform/tools/deployment-guard/03-platform/src/migration-safety.mjs:152-157` — JSDoc `@param` names `filename/checksum/environment` but function params are `_filename/_checksum/_environment`; TS7006 implicit `any`
- **Impact:** `pnpm typecheck` exit 2; `pnpm test` (quick) exit 2 after 56 passing tests
- **Fix:** Align JSDoc with param names or add `@param {string} _filename` etc.; add explicit types

### ENG-P1 — `@gtcx/audit-signer` lint regression

- **Severity:** P1
- **Evidence:** `03-platform/tools/audit-signer/03-platform/src/signer.mjs:7-8` — import order + unused `isFipsMode`; test files `fips-mode.test.mjs`, `fips-signer.test.mjs` import order
- **Impact:** `pnpm lint` exit 1 (15/18 turbo tasks pass)
- **Fix:** `pnpm exec eslint --fix` in package; remove or use `isFipsMode`

### ENG-P2 — Compliance-gateway coverage flake under validate-all

- **Severity:** P2
- **Evidence:** Mid-session `validate-all` 49/50 — `03-platform/tools/compliance-gateway` `test:coverage:gate` exit 1; isolated re-run exit 0
- **Impact:** Intermittent CI/local witness failure under parallel load
- **Fix:** Investigate c8 race or turbo cache; pin sequential coverage in validate-all if needed

### ENG-P2 — README gaps (12 directories)

- **Severity:** P2
- **Evidence:** [`repo-hygiene-2026-06-06.md`](repo-hygiene-2026-06-06.md) §P1 — workspace packages `ussd-handler`, `compliance-gateway-mcp`, `kyc-screening`; infra dirs
- **Fix:** Add index READMEs per hygiene audit pattern

### Resolved since full-audit 2026-06-01

- **M1 Foundation (closed):** All 15 packages have typecheck/lint/build scripts; compliance-gateway primary lint debt cleared
- **IR-3.4 (closed):** `gtcx-ctl validate --ci` wired in CI + validate-all
- **IR-4.1 (closed):** USSD k6 soak + `ussd-soak-baseline-check.mjs` in CI
- **validate-all scale:** 38 → **50** gates green on witness re-run

---

## 5. Evidence gaps

| Gap                         | Lane owner           | Notes                                                                                                                           |
| --------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `architecture:check` script | Platform Engineering | Not in root manifest — use validate-all policy gates as substitute                                                              |
| Deployment-audit domain     | Lane 1 input         | No `deployment-audit-*.md` &lt;30d in-repo; cite [`bank-grade-audit-2026-06-07`](bank-grade-audit-2026-06-07.md) enterprise dim |
| Live DR/WORM recurrence     | Operator / XC        | EXT-INF-003 — not lane-1 engineering                                                                                            |

---

## 6. Index + `latest.json` update checklist

- [x] Forensic: `01-docs/05-audit/engineering-audit-2026-06-07.md` (this file)
- [x] Index: `01-docs/05-audit/engineering-completeness-quality-2026-06-07.md`
- [x] `latest.json` → `lanes.engineeringCompletenessQuality`
- [x] Do **not** mix with `lanes.bankGrade.certifiedComposite` (8.3)

---

## Agent Context Attestation

- [x] Protocol 27: gates run in-session with exit codes
- [x] Protocol 28: Class R audit authoring
- [x] Lane 1 scoring protocol applied; bank-grade composite not cited as engineering score
