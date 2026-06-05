---
title: 'gtcx-infrastructure — Bank-grade Audit 2026-06-07'
status: current
date: 2026-06-07
owner: gtcx-infrastructure
role: quality-evidence-lead
tier: critical
tags: ['audit', 'bank-grade', 'lane-4', 'master-audit-alias']
review_cycle: weekly-or-on-change
audit_lane: bank-grade
audit_command: bank-grade-audit
alias_commands: ['master-audit', 'comprehensive-audit']
auditor: Cursor Agent (Auto)
methodology: gtcx-docs/03-platform/tools/audit/audit-framework/SCORING_FRAMEWORK.md
commit: 9d7d763
prior_bank_grade: 01-docs/05-audit/master-audit-2026-06-02.md
prior_certified_composite: 7.1
certified_composite: 8.3
composite_raw: 8.26
grade: B
p0_open: 0
p1_open: 6
p2_open: 4
audit_quality_1to10: 8.4
investor_lens: 7.9
enterprise_lens: 7.6
sovereign_dfi_lens: 7.4
---

# gtcx-infrastructure — Bank-grade Audit (Lane 4)

**Command:** `bank-grade-audit` (`/master-audit` alias)  
**Repository:** `gtcx-ecosystem/gtcx-infrastructure`  
**Commit:** `9d7d763`  
**Auditor:** Cursor Agent (Auto)  
**Scoring:** [`SCORING_FRAMEWORK.md`](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/03-platform/tools/audit/audit-framework/SCORING_FRAMEWORK.md) + [`bank-grade-scoring.md`](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/03-platform/tools/audit/lane-scoring/bank-grade-scoring.md)

**Input audits (cite, do not re-prove):**

| Lane / artifact              | Path                                                                                           | Role                                        |
| ---------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Prior lane 4 (legacy master) | [`master-audit-2026-06-02.md`](master-audit-2026-06-02.md)                                     | Certified composite **7.1** @ `4189077`     |
| GTM (lane 5)                 | [`gtm-audit-2026-06-05.md`](gtm-audit-2026-06-05.md)                                           | GR-T3; commercial 10/100; regulatory 85/100 |
| Repo hygiene (domain)        | [`repo-hygiene-2026-06-06.md`](repo-hygiene-2026-06-06.md)                                     | 8.6/10; README gaps                         |
| SIGNAL assessment            | [`signal-assessment-2026-06-07.md`](signal-assessment-2026-06-07.md)                           | L2 low; team ownership TBD                  |
| Bank-grade controls JSON     | [`prompts/evidence/bank-grade-evidence.json`](prompts/evidence/bank-grade-evidence.json)       | B.1–B.10 regulatory overlay                 |
| External register            | [`external-dependencies-register-2026-05-31.md`](external-dependencies-register-2026-05-31.md) | EXT-INF human gates                         |

**Forbidden claims:** This file does **not** state lane-1 engineering signoff or GCR tier scores.

## Executive Summary

gtcx-infrastructure is a **credible beta / limited-production platform substrate** at **certified composite 8.3 / 10 (B)** on lane-4 bank-grade scoring.

**Delta vs [`master-audit-2026-06-02.md`](master-audit-2026-06-02.md) @ `4189077`:** **+1.2 composite** — M1 Foundation closed (all 15 workspace packages wired for typecheck/build/lint); `validate-all` **50/50** (was 38); **IR-3.4** `gtcx-ctl validate --ci` in CI; **IR-4.1** USSD k6 soak + baseline gate; ECR module includes `compliance-gateway` + `gtcx-sovereign`; Global South Resilience uplift from USSD handler maturity. **No in-repo P0.** Open program blockers remain **external/human** (pen-test SOW EXT-INF-002, ZWCMP EXT-INF-013/014, SOC 2 Type I, FSCA/SARB, named CISO).

**Verdict:** Strong institutional **engineering substrate** for sovereign pilot and regulator sandbox. Not A-band bank-certified without third-party assurance and regulatory engagement.

## Dimension Scorecard (lane 4 — seven core)

| Dimension                         |   Weight |   Score | Weighted | Confidence | Notes                                                                                                        |
| --------------------------------- | -------: | ------: | -------: | ---------- | ------------------------------------------------------------------------------------------------------------ |
| Code Quality                      |      15% |     8.2 |     1.23 | B          | M1 closed monorepo script gaps; **new** `@gtcx/audit-signer` lint + `deployment-guard` typecheck regressions |
| Repo / Folder Hygiene             |      10% |     8.5 |     0.85 | A          | [`repo-hygiene-2026-06-06`](repo-hygiene-2026-06-06.md) 8.6; 12 missing READMEs tracked                      |
| Security                          |      20% |     8.6 |     1.72 | A          | 50-gate validate-all; fail-closed + replay-guard; pen-test still external                                    |
| Global South Resilience           |      15% |     7.2 |     1.08 | A          | USSD soak CI (p95 ~1.8ms); handler 91% branches; offline queue still boolean flag                            |
| Ecosystem Integration             |      15% |     8.7 |     1.31 | B          | Staging unblock proven; ECR image contract; INF-86 preceremony green                                         |
| Agentic Maturity                  |      10% |     8.3 |     0.83 | B          | P22–P28 witnessed; SIGNAL L2-low (Human Lead TBD caps team dim)                                              |
| Enterprise / Production Readiness |      15% |     7.6 |     1.14 | B          | `gtcx-ctl validate --ci`; DR structural; live RDS restore = operator                                         |
| **Certified composite**           | **100%** | **8.3** | **8.26** | —          | Raw **8.26** → published **8.3**                                                                             |

## Non-compensable caps

| Cap rule                                         | Applied? | Rationale                                                 |
| ------------------------------------------------ | -------- | --------------------------------------------------------- |
| Critical finding → max 5.9                       | No       | P0 = 0 in-repo                                            |
| Two+ high on consequential paths → max 6.9       | No       | High items are external/human, not live trust failures    |
| Dimension caps (memory audit, AI approval, etc.) | No       | NATS→WORM prod path; no raw AI on consequential mutations |

## Audience lenses (same evidence set)

| Lens             | Score | Band                                       | One-line                                                            |
| ---------------- | ----: | ------------------------------------------ | ------------------------------------------------------------------- |
| Investor         |   7.9 | Credible beta                              | 50-gate witness + IR lifts demonstrate execution velocity           |
| Enterprise buyer |   7.6 | Production candidate with procurement gaps | Control environment solid; SOC 2 / pen-test block Fortune 500       |
| Sovereign / DFI  |   7.4 | Pilot-ready substrate                      | USSD + af-south-1 genuine; FSCA/SARB + production ceremony external |

## Command evidence (Protocol 27 — this pass @ `9d7d763`)

| Command                                                           | Exit | Notes                                                                         |
| ----------------------------------------------------------------- | ---: | ----------------------------------------------------------------------------- |
| `git rev-parse --short HEAD`                                      |    0 | `9d7d763`                                                                     |
| `node 03-platform/tools/03-platform/scripts/validate-all.mjs`     |    0 | **50/50** gates PASS                                                          |
| `node 03-platform/tools/03-platform/scripts/validate-signal.mjs`  |    0 | 9.60/10 PASS                                                                  |
| `node 03-platform/tools/control-plane/gtcx-ctl.mjs validate --ci` |    0 | staging + production kustomize offline                                        |
| `pnpm format:check`                                               |    0 | After prettier on DR + pen-test evidence docs                                 |
| `pnpm agent:work-selection:check`                                 |    0 | 9/9 Protocol 22 adoption                                                      |
| `pnpm lint`                                                       |    1 | `@gtcx/audit-signer` — 5 ESLint errors (import order, unused `isFipsMode`)    |
| `pnpm test`                                                       |    2 | `deployment-guard` typecheck — JSDoc/param mismatch in `migration-safety.mjs` |
| `pnpm readiness:lanes:check` (gtcx-core)                          |    0 | SSOT + anti-drift hub scan                                                    |

## Findings

### P0 — none (in-repo)

No unresolved critical findings on consequential code paths in repo-controlled gates.

### P1

| ID       | Finding                                            | Owner                 | Evidence                                                                                                   |
| -------- | -------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------- |
| BG-P1-01 | Pen-test SOW unsigned (EXT-INF-002)                | Leadership / Security | [`pen-test-intake-evidence-2026-05-31.md`](pen-test-intake-evidence-2026-05-31.md); B.10 control_score 0.0 |
| BG-P1-02 | ZWCMP pilot owner unassigned (EXT-INF-013)         | GTM / Leadership      | [`external-dependencies-register-2026-05-31.md`](external-dependencies-register-2026-05-31.md)             |
| BG-P1-03 | DPA + pilot agreement unsigned (EXT-INF-014)       | Legal                 | Same register                                                                                              |
| BG-P1-04 | Named CISO/vCISO not appointed (B.4)               | CEO / Board           | [`ciso-appointment.md`](../governance/ciso-appointment.md) target 2026-06-30                               |
| BG-P1-05 | FSCA license + SARB notification not started (B.5) | Compliance / Legal    | No `sarb-engagement.md`; FICA notes application not started                                                |
| BG-P1-06 | SOC 2 Type I auditor not engaged (B.1 / E.1)       | CISO + Finance        | [`bank-grade-evidence.json`](prompts/evidence/bank-grade-evidence.json)                                    |

### P2

| ID       | Finding                                                 | Owner                | Evidence                                                                       |
| -------- | ------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| BG-P2-01 | `@gtcx/audit-signer` lint regression                    | Platform Engineering | `pnpm lint` exit 1 — 5 ESLint errors                                           |
| BG-P2-02 | `deployment-guard` typecheck failure blocks `pnpm test` | Platform Engineering | TS8024/TS7006 in `migration-safety.mjs:152-157`                                |
| BG-P2-03 | Live RDS restore DR test pending operator creds (B.8)   | Operator             | [`dr-fire-drill-evidence-2026-05-31.md`](dr-fire-drill-evidence-2026-05-31.md) |
| BG-P2-04 | 12 directories missing READMEs                          | Platform Engineering | [`repo-hygiene-2026-06-06.md`](repo-hygiene-2026-06-06.md) §P1                 |

## Top remediation (ordered)

| Priority | Item                                               | Owner                | Target     |
| -------- | -------------------------------------------------- | -------------------- | ---------- |
| P1       | Sign pen-test SOW (EXT-INF-002)                    | Leadership           | 2026-06-15 |
| P1       | Appoint named CISO/vCISO                           | CEO / Board          | 2026-06-30 |
| P1       | Engage SOC 2 Type I auditor                        | CISO + Finance       | 2026-06-30 |
| P1       | Assign ZWCMP pilot owner + cadence                 | GTM                  | 2026-06-15 |
| P2       | Fix audit-signer lint + deployment-guard typecheck | Platform Engineering | 2026-06-10 |
| P2       | Execute live RDS restore with external witness     | Operator             | 2026-Q3    |

## Regulatory overlay (B.1–B.10)

See [`prompts/evidence/bank-grade-evidence.json`](prompts/evidence/bank-grade-evidence.json). **Banking readiness: yellow** (engineering substrate improved; external assurance unchanged). **Final regulatory score 2.58** (0.6× multiplier on incomplete externals) — distinct from lane-4 **certified composite 8.3**.

## One-point uplift conditions

- **Core (+1.0 → 9.3):** Close P2 lint/typecheck regressions; live RDS restore witnessed; pen-test SOW signed.
- **Investor (+1.0 → 8.9):** Demonstrate PRD-002 audit route Tier B (signature verify end-to-end) on staging in CI.
- **Enterprise (+1.0 → 8.6):** SOC 2 Type I gap analysis complete; first pen-test report on file.
- **Sovereign (+1.0 → 8.4):** File SARB notification; INF-86 production key ceremony with dated evidence.

## Agent Context Attestation

- [x] Phase 1: Baseline + SCORING_FRAMEWORK loaded
- [x] Phase 3: `git status` + prior master-audit cited
- [x] Protocol 27: verification ladder executed in-session (commands + exit codes above)
- [x] Protocol 28: Class R audit authoring; Class S blockers flagged only
- [x] Lane index + `latest.json` `lanes.bankGrade` updated
