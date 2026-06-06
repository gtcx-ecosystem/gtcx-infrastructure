---
title: 'GTCX Infrastructure — Master Audit & Bank-Grade Certification'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'architecture', 'infrastructure']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# GTCX Infrastructure — Master Audit & Bank-Grade Certification

**Date:** 2026-05-12
**Repo:** `gtcx-ecosystem/gtcx-infrastructure`
**Auditor:** Kimi Code CLI (Kimi k1.6)
**Methodology:** `gtcx-ecosystem/audit/forensic-master-prompt.md`
**Reference framework:** `gtcx-ecosystem/audit/SCORING_FRAMEWORK.md`
**Prior master audit:** [master-audit-2026-05-11.md](./master-audit-2026-05-11.md)

---

## Executive Summary

| Dimension                    |      Score | Rating Band                  |
| ---------------------------- | ---------: | ---------------------------- |
| Core Weighted Score          | **7.9/10** | serious production candidate |
| Investor Lens                | **7.8/10** | serious production candidate |
| Enterprise Buyer Lens        | **8.0/10** | serious production candidate |
| African Sovereign / DFI Lens | **7.9/10** | serious production candidate |

**Verdict:** Production-capable infrastructure platform with strong institutional controls (SIGNAL 8.60/10). Two planned items remain for Phase 4 (anomaly detection, WORM storage). One flaky integration test requires isolation fix before 8.5+ claim is defensible.

**Top 3 priorities for next sprint:**

1. Fix replay-protection integration test isolation (`03-platform/tools/replay-protection/tests/integration.test.mjs:13`) — flakiness blocks clean CI
2. Deploy staging WAF + VPC Flow Logs Terraform (`04-ship/terraform/modules/waf/main.tf`, `04-ship/terraform/modules/flow-logs/main.tf`)
3. Enable `use_fips_endpoint = true` in AWS provider configs (`04-ship/terraform/`) — FIPS assessment gap

---

## 1. Initial State (Phase 1 — Pre-Improvement)

### 1.1 Architecture Audit

| Dimension                  | Score | Evidence                                                                                       |
| -------------------------- | ----- | ---------------------------------------------------------------------------------------------- |
| Modularity                 | 8.0   | 6 protocol domains, clear separation via `03-platform/tools/compliance-gateway/src/tools.mjs`  |
| Service Boundaries         | 8.0   | replay-guard, compliance-gateway, deployment-guard are distinct services with typed boundaries |
| Consequential Path Clarity | 8.5   | Mutating tools require approval ticket; auth boundary explicit in `auth.mjs`                   |
| Testability                | 7.5   | 85 tests; 1 flaky integration test under full suite                                            |
| Type Safety                | 8.0   | TypeScript strict mode clean; deployment-guard fully typed                                     |
| Regression Coverage        | 7.5   | Production fail-closed test, audit immutability fixture, security boundary gate                |

**P0 findings:** None
**P1 findings:**

- F-012: No cross-repo contract tests (resolved in this session)
- F-015: No SIGNAL/agentic maturity scorecard (resolved in this session)

### 1.2 Security Audit

| Dimension        | Score | Evidence                                                                |
| ---------------- | ----- | ----------------------------------------------------------------------- |
| Trust Boundaries | 8.5   | Bearer token auth, constant-time comparison, approval gating            |
| Fail-Closed      | 9.0   | 503 on Redis unavailable; verified in `production-fail-closed.test.mjs` |
| Audit Durability | 8.5   | Append-only audit DB, separate user, immutability test in CI            |
| Secret Handling  | 7.5   | No hardcoded secrets detected; rotation via AWS Secrets Manager Lambda  |
| AI Control       | 8.0   | Runtime policy prompt, mutating tool segregation, SIGNAL CI gate        |
| Threat Model     | 7.0   | Threat model exists; no automated STRIDE per feature yet                |

**P0 findings:** None
**P1 findings:**

- F-008: No third-party security validation (pen-test scope exists, vendor not engaged)

### 1.3 GTM Readiness

**Stage:** Production pilot (Zimbabwe testnet active, staging configured)
**90-day copy test:** Infrastructure supports 3 pilots across 2 jurisdictions
**Top 5 blockers:**

1. Pen-test vendor engagement (F-008)
2. Staging environment not yet deployed
3. Anomaly detection not implemented (S3 planned)
4. WORM audit storage not implemented (I4 planned)
5. mTLS mesh sidecar injection pending Q3 2026

### 1.4 Hygiene Audit

| Category                   | Score |
| -------------------------- | ----- |
| Monorepo structure         | 8.5   |
| Documentation organization | 8.0   |
| Package boundaries         | 7.5   |
| CI/CD hygiene              | 8.0   |
| Secret hygiene             | 7.5   |
| Operational runbooks       | 7.5   |

### 1.5 Production Readiness

| Area                  | Status                                                       |
| --------------------- | ------------------------------------------------------------ |
| Deployment automation | Partial — `deploy.sh` exists, requires `--approval-ticket`   |
| Health checks         | Present — `/health` and `/metrics` on all services           |
| Observability         | Partial — Prometheus rules exist, alert routing rehearsed    |
| DR/BCP                | Partial — quarterly DR workflow, restore evidence incomplete |
| Environment rigor     | Present — dev/staging/production/testnet overlays            |
| Operational safety    | Present — break-glass, JIT access, SoD matrix                |

---

## 2. Doc Cleanup (Phase 2)

**State at audit start:** `/01-docs/`-only — no competing roots.

Phase skipped — repo has only `/01-docs/` documentation root. The structure work that flat-`/01-docs/` repos sometimes need is performed in Phase 3 (docs-standard enforcement), not Phase 2 (cleanup is for consolidating competing roots).

No commit produced for this phase.

---

## 3. Docs-Standard Compliance (Phase 3)

| Axis                |      Score | Notes                                                             |
| ------------------- | ---------: | ----------------------------------------------------------------- |
| Structural          |     8.5/10 | 263 docs across 47 directories, canonical taxonomy followed       |
| Naming              |     8.0/10 | Consistent kebab-case; minor inconsistencies in `01-docs/08-gtm/` |
| Frontmatter         |     9.5/10 | 100% of sampled docs have Status/Date/Owner                       |
| Linking             |     7.0/10 | No automated `docs:check-links` script; manual spot-checks pass   |
| Length              |     8.5/10 | No docs exceed recommended length without TOC                     |
| Agentic Conventions |     8.0/10 | Agent onboarding, safety rules, workflow docs present             |
| RAG Indexing        |     7.5/10 | Master INDEX exists but not machine-generated                     |
| Master INDEX        |     7.5/10 | Present, current as of 2026-05-10                                 |
| **Overall**         | **8.1/10** |                                                                   |

- Standard enforcement: N/A — docs already passed validation
- Detailed compliance: `01-docs/05-audit/docs-standard-compliance-2026-05-10.md`

---

## 4. Post-Improvement State (Phase 4 — Re-Audit)

### Changes Since Prior Master Audit (2026-05-11)

| Finding                             | Status     | Resolution                                                                                                   |
| ----------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| F-012: No cross-repo contract tests | **CLOSED** | `03-platform/tools/contract-tests/protocol-schema.test.mjs` + `.github/workflows/cross-repo-contract.yml`    |
| F-015: No SIGNAL scorecard          | **CLOSED** | `01-docs/05-audit/signal-scorecard.json` (8.60/10) + `03-platform/tools/scripts/validate-signal.mjs` CI gate |
| Phase 3: WAF + VPC Flow Logs        | **CLOSED** | Terraform modules created, not yet deployed                                                                  |
| Phase 3: mTLS mesh configs          | **CLOSED** | Production + staging Linkerd overlays with kustomization                                                     |
| Phase 3: JIT access tool            | **CLOSED** | `03-platform/tools/kubectl-access/kubectl-access.sh` with audit trail                                        |
| Phase 3: CodeQL expansion           | **CLOSED** | 4 queries (crypto, jwt, sql, deserialization) in CI config                                                   |
| Phase 3: ZAP DAST                   | **CLOSED** | `.github/workflows/zap-dast.yml` + `.zap/rules.tsv`                                                          |

### New Findings

| ID    | Finding                                                                | Severity | File:Line                                                           |
| ----- | ---------------------------------------------------------------------- | -------- | ------------------------------------------------------------------- |
| G-008 | Replay integration test flaky under full suite                         | P2       | `03-platform/tools/replay-protection/tests/integration.test.mjs:13` |
| G-009 | `use_fips_endpoint` not set in Terraform despite FIPS assessment claim | P2       | `04-ship/terraform/`                                                |
| G-010 | No `docs:check-links` script for automated link validation             | P2       | `package.json`                                                      |

---

## 5. Bank-Grade Scorecard (Phase 5)

### 5.1 Core Dimensions

| Dimension                         | Weight | Score | Confidence | Notes                                                                 |
| --------------------------------- | -----: | ----: | ---------- | --------------------------------------------------------------------- |
| Code Quality                      |     15 |   7.8 | A          | Typecheck clean, lint clean, 85 tests, no files >500 LOC              |
| Repo / Folder Hygiene             |     10 |   8.3 | A          | Docs-standard passes, 263 docs, 47 dirs, no orphan roots              |
| Security                          |     20 |   8.3 | A          | SIGNAL 8.60, WAF/Flow Logs Terraform, 4 CodeQL queries, ZAP, SLSA L3  |
| Global South Resilience           |     15 |   7.2 | B          | Load tests, timeout fixes, fail-closed; no offline queue (infra repo) |
| Ecosystem Integration             |     15 |   8.2 | B          | Contract tests, cross-repo CI matrix, 13+ protocol references         |
| Agentic Maturity                  |     10 |   7.0 | A          | SIGNAL CI gate, runtime policy, approval gating; no eval pipeline     |
| Enterprise / Production Readiness |     15 |   8.2 | A          | DR workflow, staging configs, incident drills, PagerDuty simulation   |

**Raw weighted score:** 7.90/10

### 5.2 Caps Applied

| Cap                                      | Triggered? | Triggering finding                           | New ceiling |
| ---------------------------------------- | ---------- | -------------------------------------------- | ----------- |
| Unresolved critical                      | **N**      | —                                            | —           |
| 2+ unresolved high (consequential)       | **N**      | —                                            | —           |
| Money/settlement in process memory       | **N**      | —                                            | —           |
| Non-durable audit on consequential paths | **N**      | Audit is append-only with immutability tests | —           |
| Raw AI output approves consequential     | **N**      | Mutating tools require approval ticket       | —           |
| Local placeholder ecosystem authority    | **N**      | Real protocol references throughout          | —           |
| No safe degraded-mode                    | **N**      | Fail-closed behavior verified                | —           |

**Final core score:** 7.90/10

### 5.3 Audience Lens Scores

#### Investor / Sequoia-Style Lens

| Area                           | Weight | Score | Notes                                |
| ------------------------------ | -----: | ----: | ------------------------------------ |
| Technical Differentiation      |     25 |  7.67 | Code Quality + Ecosystem + Agentic   |
| Execution Credibility          |     25 |  8.10 | Code Quality + Security + Enterprise |
| Ecosystem Leverage             |     20 |  7.70 | Ecosystem + Resilience               |
| Commercialization Readiness    |     15 |  8.25 | Enterprise + Security                |
| Platform Compounding Potential |     15 |  7.47 | Resilience + Ecosystem + Agentic     |

**Investor lens score:** 7.8/10 — serious production candidate

#### Enterprise Buyer Lens

| Area                           | Weight | Score | Notes                                  |
| ------------------------------ | -----: | ----: | -------------------------------------- |
| Control Environment            |     25 |  7.83 | Security + Enterprise + Agentic        |
| Security and Auditability      |     25 |  8.30 | Security                               |
| Integration Reliability        |     20 |  8.00 | Ecosystem + Code Quality               |
| Operability and Supportability |     15 |  7.90 | Repo Hygiene + Enterprise + Resilience |
| Deployment Readiness           |     15 |  7.70 | Enterprise + Resilience                |

**Enterprise buyer lens score:** 8.0/10 — serious production candidate

#### African Sovereign / DFI Lens

| Area                           | Weight | Score | Notes                                          |
| ------------------------------ | -----: | ----: | ---------------------------------------------- |
| Mission and Regional Fit       |     15 |  8.00 | Africa-focused, Cape Town region, USSD roadmap |
| Global South Resilience        |     25 |  7.70 | Resilience + Enterprise                        |
| Governance and Trust           |     25 |  7.83 | Security + Agentic + audit behavior            |
| Institutional Interoperability |     15 |  8.25 | Ecosystem + Repo Hygiene                       |
| Long-Term Strategic Value      |     20 |  7.73 | Ecosystem + Resilience + Code Quality          |

**Sovereign / DFI lens score:** 7.9/10 — serious production candidate

---

## 6. Sprint Plan (Phase 4 / 6 Synthesis)

**6-week plan:**

| Week | Focus                              | Deliverable                             |
| ---- | ---------------------------------- | --------------------------------------- |
| 1    | Fix test flakiness + FIPS endpoint | Clean CI, Terraform FIPS flags          |
| 2    | Deploy staging WAF + Flow Logs     | Live AWS resources in staging           |
| 3    | Anomaly detection design           | Architecture doc + PoC                  |
| 4    | WORM audit storage design          | Architecture doc + Terraform module     |
| 5    | Pen-test vendor engagement         | Signed SOW, kickoff                     |
| 6    | Docs link checker + ADR registry   | `docs:check-links` script, current ADRs |

---

## 7. Top 5 Remediation Items

| Priority | Item                                                 | Owner             | Dependency    | Target | Expected Score Lift |
| -------- | ---------------------------------------------------- | ----------------- | ------------- | ------ | ------------------- |
| P1       | Fix replay integration test isolation                | Platform Engineer | None          | Week 1 | +0.1 Code Quality   |
| P1       | Enable `use_fips_endpoint` in Terraform AWS provider | Security Engineer | None          | Week 1 | +0.2 Security       |
| P1       | Deploy WAF + VPC Flow Logs to staging                | SRE               | AWS access    | Week 2 | +0.2 Enterprise     |
| P2       | Implement `docs:check-links` script                  | Docs Lead         | None          | Week 6 | +0.2 Repo Hygiene   |
| P2       | Design anomaly detection architecture                | ML Engineer       | Data pipeline | Week 3 | +0.3 Agentic        |

---

## 8. One-Point-Uplift Conditions

**To raise core score by 1.0 (to 8.9):**

1. Fix flaky test + add `docs:check-links` (+0.3 combined)
2. Deploy WAF/Flow Logs to staging + production (+0.2)
3. Anomaly detection PoC with CI integration (+0.3)
4. WORM audit storage Terraform module + test (+0.2)

**To raise investor lens by 1.0:**

1. Anomaly detection closes Agentic gap (+0.5)
2. Clean CI + 100% test reliability (+0.3)
3. Staging deployment evidence (+0.2)

**To raise enterprise buyer lens by 1.0:**

1. Pen-test report in hand (+0.4)
2. SOC 2 readiness assessment complete (+0.3)
3. WORM storage implemented (+0.3)

**To raise sovereign / DFI lens by 1.0:**

1. Anomaly detection for governance transparency (+0.4)
2. WORM audit storage for trust (+0.3)
3. Multi-region active-active design (+0.3)

---

## 9. Honest Score Recalculation (Phase 5.5 — Forensic Verification)

This section applies corrected scores based on code-level verification, not documentation-level claims.

### 9.1 What Changed

| Claim                      | Original     | Forensic Finding                                      | Honest                                    |
| -------------------------- | ------------ | ----------------------------------------------------- | ----------------------------------------- |
| Core weighted score        | 8.5 (ledger) | SCORING_FRAMEWORK recalculation = 7.90                | 7.9                                       |
| "All tests pass"           | Claimed      | 1 flaky integration test under full suite             | 40/41 pass in CI gate                     |
| FIPS "no app-level crypto" | Claimed      | 3 `createHash('sha256')` calls exist                  | Doc imprecision; SHA-256 is FIPS-approved |
| SLSA L3                    | Claimed      | Workflow verified real (227 lines, triggered on push) | Honest                                    |
| "No files >500 LOC"        | Claimed      | Max 391 LOC (`tools.mjs`)                             | Honest                                    |

### 9.2 Honest Dimension Scores

| Dimension                         | Weight  | Honest Score | Weighted    | Rationale                                                            |
| --------------------------------- | ------- | ------------ | ----------- | -------------------------------------------------------------------- |
| Code Quality                      | 15      | 7.8          | 1.17        | Clean tsc/lint/build; 85 tests; 1 flaky under full suite             |
| Repo / Folder Hygiene             | 10      | 8.3          | 0.83        | Docs-standard passes; 263 docs; no orphan roots                      |
| Security                          | 20      | 8.3          | 1.66        | SIGNAL 8.60, WAF/Flow Logs, 4 CodeQL, ZAP, SLSA L3 verified real     |
| Global South Resilience           | 15      | 7.2          | 1.08        | Load tests, fail-closed; no offline queue (not applicable for infra) |
| Ecosystem Integration             | 15      | 8.2          | 1.23        | Contract tests, cross-repo matrix, real protocol references          |
| Agentic Maturity                  | 10      | 7.0          | 0.70        | SIGNAL CI gate, policy prompt, approval gating; no eval pipeline     |
| Enterprise / Production Readiness | 15      | 8.2          | 1.23        | DR workflow, staging configs, incident drills, build evidence        |
| **Total**                         | **100** |              | **7.90/10** |                                                                      |

### 9.3 Honest Audience Lenses

| Lens          | Claimed | Honest | Δ    | Key Driver                                                |
| ------------- | ------- | ------ | ---- | --------------------------------------------------------- |
| Investor      | 8.5     | 7.8    | −0.7 | Core recalculation using SCORING_FRAMEWORK weights        |
| Enterprise    | 8.5     | 8.0    | −0.5 | Security strong; pen-test still pending                   |
| Sovereign/DFI | 8.5     | 7.9    | −0.6 | Resilience unchanged; governance strong but not certified |

### 9.4 What This Means for 10/10

The real gap to 10.0 is **2.1 points** on the core score. The critical path is:

1. **Engineering (parallelizable, ~8 weeks):** Anomaly detection, WORM storage, test flakiness fix, docs link checker, FIPS endpoint enablement
2. **External authority (serial, ~6 months):** Pen-test report, SOC 2 Type 1 attestation, ISO 27001 certification

Engineering alone can reach ~8.9. The final 1.1 points require external validation (pen-test + SOC 2 + ISO 27001).

---

## 10. Audit Grade Prompts (Automated Assessment Suite)

GTCX now maintains a complete automated audit prompt suite for all five commercial grades. These prompts are designed for execution by AI agents (Kimi Code CLI, GitHub Copilot, etc.) to produce reproducible, evidence-based grade assessments.

### 10.1 Prompt Inventory

| Grade       | Prompt File                                                  | Validator                    | Execution Time | Current Status                               |
| ----------- | ------------------------------------------------------------ | ---------------------------- | -------------- | -------------------------------------------- |
| Partnership | `01-docs/05-audit/prompts/partnership-grade-audit-prompt.md` | Self (AI agent)              | 15–30 min      | ✅ Ready — 8.5/10                            |
| Enterprise  | `01-docs/05-audit/prompts/enterprise-grade-audit-prompt.md`  | Self + External              | 2–4 hours      | ⚠️ 4.5/10 — SOC 2 + pen-test pending         |
| Investment  | `01-docs/05-audit/prompts/investment-grade-audit-prompt.md`  | Self + External + Legal      | 4–8 hours      | ⚠️ 3.0/10 — financial audit blocked          |
| Bank        | `01-docs/05-audit/prompts/bank-grade-audit-prompt.md`        | Self + External + Regulatory | 6–12 hours     | ⚠️ 2.5/10 — SOC 2 Type II + red team blocked |
| Government  | `01-docs/05-audit/prompts/government-grade-audit-prompt.md`  | Self + 3PAO + Clearance      | 8–16 hours     | ⚠️ 1.5/10 — SITA + FIPS 140-2 L3 blocked     |
| **Master**  | `01-docs/05-audit/prompts/master-audit-prompt.md`            | Orchestrator                 | 12–24 hours    | ✅ Framework complete                        |

### 10.2 Execution Protocol

Grades MUST be assessed in dependency order:

```
Partnership (P-GAP) ≥ 8.0
  └─→ Enterprise (E-GAP) ≥ 8.5
        ├─→ Investment (I-GAP) ≥ 8.5
        └─→ Bank (B-GAP) ≥ 9.0
              └─→ Government (G-GAP) ≥ 9.5
```

If a grade fails its threshold, the orchestrator HALTS and generates a remediation roadmap before proceeding.

### 10.3 Evidence Output

Each prompt produces:

1. **Evidence JSON** at `01-docs/05-audit/prompts/evidence/<grade>-grade-evidence.json`
2. **Raw command output** at `01-docs/05-audit/prompts/evidence/raw/<grade>-<timestamp>.log`
3. **Remediation roadmap** (if failed) at `01-docs/05-audit/remediation-roadmap-<grade>.md`

### 10.4 Current Grade Scorecard

| Grade       | Score   | Threshold | Status  | Primary Blocker              | Commercial Unlock          |
| ----------- | ------- | --------- | ------- | ---------------------------- | -------------------------- |
| Partnership | **8.5** | 8.0       | ✅ Pass | None                         | API partners, integrations |
| Enterprise  | **4.5** | 8.5       | ❌ Fail | SOC 2 Type I + pen-test      | Fortune 500 contracts      |
| Investment  | **3.0** | 8.5       | ❌ Fail | Financial audit + code audit | Series B/C funding         |
| Bank        | **2.5** | 9.0       | ❌ Fail | SOC 2 Type II + red team     | Banking partnerships       |
| Government  | **1.5** | 9.5       | ❌ Fail | SITA + FIPS 140-2 L3         | Sovereign contracts        |

### 10.5 Related Framework Documents

- `01-docs/05-audit/audit-grade-framework.md` — Full five-tier grade definitions with control matrices
- `01-docs/05-audit/bank-grade-rating-framework.md` — Internal vs external dual-rating methodology
- `01-docs/05-audit/10-10-roadmap-2026-05-12.md` — Engineering roadmap to 10/10

---

## 11. Audit Trail (Commits This Session)

| Phase       | Commit  | What                                                            |
| ----------- | ------- | --------------------------------------------------------------- |
| 3. Standard | 18822dd | feat(security): Phase 3 institutional controls — SIGNAL 8.60/10 |
| 6. Master   | —       | docs(audit): master forensic certification                      |

---

## 12. Sign-Off

| Role               | Status  | Date       |
| ------------------ | ------- | ---------- |
| Author             | Drafted | 2026-05-12 |
| CTO                | Pending | —          |
| Head of Security   | Pending | —          |
| Head of Compliance | Pending | —          |
| Repo lead          | Pending | —          |
