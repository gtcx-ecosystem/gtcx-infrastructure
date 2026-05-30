---
title: 'GTCX Infrastructure — Master Audit Report (2026-05-25)'
status: current
date: '2026-05-27'
audit_type: master
target_repo: gtcx-infrastructure
audit_date: 2026-05-25
owner: frontier-infra-engineer
composite: 9.0
composite_raw: 9.0
investor: 7.8
enterprise: 8.0
sov_dfi: 7.9
p0_count: 0
p1_count: 4
caps_fired: 0
role: 'protocol-architect'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
tier: 'standard'
tags: ['documentation', 'audit']
review_cycle: 'on-change'
---

# GTCX Infrastructure — Master Audit Report (2026-05-25)

**Date:** 2026-05-25  
**Repo:** `gtcx-ecosystem/gtcx-infrastructure`  
**Auditor:** Kimi Code CLI (Kimi k1.6)  
**Methodology:** `docs/audit/prompts/master-audit-prompt.md` (MAOP v1.0)  
**Baseline:** [`full-audit-2026-05-22.md`](./full-audit-2026-05-22.md) (core 9.0, all caps lifted)  
**Delta:** 3 days — Round-4 docs hygiene only (no engineering changes)

---

## Executive Summary

| Dimension                    |      Score | Rating Band                           |
| ---------------------------- | ---------: | ------------------------------------- |
| Core Weighted Score          | **9.0/10** | production-ready with strong controls |
| Investor Lens                | **7.8/10** | credible beta                         |
| Enterprise Buyer Lens        | **8.0/10** | credible beta                         |
| African Sovereign / DFI Lens | **7.9/10** | credible beta                         |

**Verdict:** Internal engineering substrate is complete and all critical caps remain lifted. Vault TLS enabled, container contexts Kyverno-compliant, mTLS mesh configurations complete, `@gtcx/audit-signer` published, audit-flush IRSA wired. The only remaining blockers for higher certification grades are **external validations** (SOC 2 Type I, pen-test execution, red team, FSCA/SARB engagement).

**Highest achievable certification grade:** Partnership-Grade (8.8/10 — **PASS**)  
**Highest internal readiness:** Enterprise-Grade (7.6/10 preliminary; 3.8/10 certifiable pending SOC 2 + pen-test)

---

## 1. Master Audit Orchestration Results

### Phase 1: Partnership-Grade Audit (P-GAP) ✅ PASS

| Control                           | Status | Score | Evidence                                                             |
| --------------------------------- | ------ | ----: | -------------------------------------------------------------------- |
| P.1 HTTPS-only endpoints          | Pass   |  0.85 | ACM + ssl-redirect in all ingresses                                  |
| P.2 API authentication            | Pass   |  1.00 | `auth.mjs` middleware enforced in `server.mjs`                       |
| P.3 Rate limiting                 | Pass   |  1.00 | WAF RateBasedRule (2000/5min) + gateway throttling                   |
| P.4 Security contact              | Pass   |  0.90 | `SECURITY.md` + bug bounty policy; no `security.txt`                 |
| P.5 Incident SLA                  | Pass   |  0.80 | 72h acknowledgement in security policy; no partner-specific doc      |
| P.6 No PII in partner APIs        | Pass   |  1.00 | Zero PII fields in compliance-gateway; architecture confirms         |
| P.7 Self-assessment questionnaire | Pass   |  0.50 | Vendor risk program has questionnaires; no partner-specific template |

**Overall: 8.8/10** (threshold 8.0) — **Partnership-Grade unlocked.**

### Phase 2: Enterprise-Grade Audit (E-GAP) 🟡 PENDING-EXTERNAL

| Control            | Status | Score | External? | Evidence                                              |
| ------------------ | ------ | ----: | --------- | ----------------------------------------------------- |
| E.1 SOC 2 Type I   | Fail   |  0.65 | ✅        | ~92% readiness; auditor not engaged                   |
| E.2 Pen-test       | Fail   |  0.60 | ✅        | RFP ready; vendor shortlist complete; not sent        |
| E.3 Data residency | Pass   |  0.95 | ❌        | af-south-1 only; proof doc exists                     |
| E.4 Encryption     | Pass   |  0.95 | ❌        | RDS+S3+KMS encrypted; TLS configured                  |
| E.5 RBAC           | Pass   |  0.75 | ❌        | IRSA scoped; ALB `Describe*` wildcard remains         |
| E.6 Uptime SLA     | Pass   |  0.90 | ❌        | SLO dashboards + burn-rate alerts; RTO/RPO documented |
| E.7 Bug bounty/VDP | Pass   |  0.75 | ❌        | Policy published; no live platform confirmed          |
| E.8 BCP            | Pass   |  0.95 | ❌        | DR runbooks + 2 drills executed                       |
| E.9 Vendor risk    | Pass   |  1.00 | ❌        | Program + controls matrix exist                       |
| E.10 Data deletion | Pass   |  0.90 | ❌        | Retention policy active; no cert template             |

**Preliminary: 7.6/10 | Certifiable: 3.8/10** (threshold 8.5) — **Blocked by E.1 + E.2.**

> Per MAOP gating rules, higher grades are halted for **certification purposes**. Internal readiness assessment continues below for planning.

### Phase 3: Investment-Grade Audit (I-GAP) 🔴 NOT-READY

**Prerequisite:** E-GAP certifiable < 8.5 → **certification skipped.**  
**Readiness assessment:** 4.1/10 preliminary (2.5 certifiable).

Key gaps:

- No CPA engaged for financial audit (I.2)
- No cap table platform or shareholder agreement (I.3)
- No accounting policies or expense policy (I.6)
- No revenue analytics or customer concentration policy (I.9)
- Minimal ESG baseline (I.10)

**DD readiness: RED.** Do not enter Series B due diligence without closing Enterprise-Grade external blockers first.

### Phase 4: Bank-Grade Audit (B-GAP) 🔴 NOT-READY

**Prerequisite:** E-GAP certifiable < 8.5 → **certification skipped.**  
**Readiness assessment:** 3.6/10 preliminary (2.2 certifiable).

Key gaps:

- SOC 2 Type II blocked by Type I incomplete (B.1)
- Red team exercise not executed (B.3)
- No SARB engagement or FSCA license (B.5)
- AML policy partial, not operational (B.6)
- No trust account documentation (B.9)
- No pen-test reports (B.10)

**Banking readiness: RED.** No correspondent relationship possible until Enterprise + Bank external blockers closed.

### Phase 5: Government-Grade Audit (G-GAP) 🔴 NOT-READY

**Prerequisite:** B-GAP < 9.0 → **certification skipped.**  
**Readiness assessment:** 3.1/10 preliminary (1.9 certifiable).

Key gaps:

- No SITA / FedRAMP engagement (G.2)
- No HSM / FIPS 140-2 L3 certificate (G.3)
- No security clearances (G.5)
- No 24/7 SOC or SIEM (G.9)
- Zero-trust not operationally validated (G.10)
- No PAIA manual; POPIA/FICA partial (G.12)

**Government readiness: RED.** No sovereign contract bidding until Bank-Grade achieved.

---

## 2. Delta Since Last Baseline (2026-05-22)

| Area              | Change       | Commit / Evidence                                                                  |
| ----------------- | ------------ | ---------------------------------------------------------------------------------- |
| Core score        | **None**     | Remains 9.0 per ledger                                                             |
| Engineering       | **None**     | No code changes since `27bbedb` (metrics snapshot)                                 |
| Docs hygiene      | **Improved** | Round-4 governance refresh; folder consolidation (`devops/` → `operations/`, etc.) |
| Docs-standard     | **Stable**   | Frontmatter + README coverage maintained; no new violations                        |
| External blockers | **None**     | Pen-test RFP still ready-to-send; SOC 2 auditor still not engaged                  |
| P0 findings       | **0**        | All internal P0s closed as of 2026-05-22                                           |
| P1 findings       | **4**        | Same 4 residual P1s from full audit (see §3)                                       |

---

## 3. Residual Findings (from 2026-05-22 Full Audit)

| Priority | Finding                                                             | Status                                      | Owner                |
| -------- | ------------------------------------------------------------------- | ------------------------------------------- | -------------------- |
| P1       | Pen-test RFP not sent                                               | **Ready for 2026-05-29 send**               | Leadership           |
| P1       | SOC 2 outreach not sent                                             | **Engagement plan ready**                   | CISO + Finance       |
| P1       | `tools/audit-flush/Dockerfile` does not bundle `@gtcx/audit-signer` | Unblocked by npm publish (2026-05-22)       | Platform Engineering |
| P1       | Adaptive policy state is per-pod, not global                        | Acceptable through pilot; Redis at >10 pods | Platform Engineering |
| P2       | `tools/audit-flush/` lacks NATS integration test                    | Add docker-compose test before prod deploy  | Platform Engineering |

---

## 4. Grade Remediation Roadmaps

### Enterprise-Grade → 8.5+ Certifiable

**Current:** 7.6 preliminary / 3.8 certifiable  
**Target:** 8.5+ certifiable  
**Gap:** +4.7 points (entirely from external validations)

**Critical path:**

1. [ ] **E.2:** Send pen-test RFP to SensePost + Nclose
   - Owner: Leadership / Security Lead
   - ETA: 2026-05-29
   - Evidence: Signed SOW
2. [ ] **E.1:** Engage SOC 2 Type I auditor and begin gap analysis
   - Owner: CISO + Finance
   - ETA: 2026-06-15
   - Evidence: Engagement letter + gap analysis report
3. [ ] **E.5:** Remove `elasticloadbalancing:Describe*` wildcard from ALB policy
   - Owner: Platform Engineering
   - ETA: 2026-06-01
   - Evidence: `terraform plan` diff

### Bank-Grade → 9.0+ Certifiable

**Current:** 3.6 preliminary / 2.2 certifiable  
**Target:** 9.0+ certifiable  
**Prerequisite:** Enterprise-Grade certifiable first.

**Critical path (after Enterprise):**

1. [ ] **B.1:** Complete SOC 2 Type I → begin Type II observation period (≥6 months)
2. [ ] **B.3:** Execute red team exercise with external vendor; document containment
3. [ ] **B.5:** File SARB notification + begin FSCA Category I/II license application
4. [ ] **B.6:** Draft AML monitoring policy, SAR process, sanctions screening config
5. [ ] **B.8:** Execute witnessed DR test with external auditor signature
6. [ ] **B.9:** Document trust accounts + daily reconciliation + CPA audit trail
7. [ ] **B.10:** Complete first pen-test; remediate critical/high findings; schedule second

---

## 5. One-Point-Uplift Conditions (From Current State)

**To raise Partnership-Grade by 1.0 (to 9.8):**

1. Deploy `.well-known/security.txt` (+0.1 to P.4)
2. Publish partner-specific incident notification SLA (+0.2 to P.5)
3. Publish partner self-assessment questionnaire template (+0.5 to P.7)

**To raise Enterprise certifiable score to 8.5+:**

1. Send pen-test RFP (+2.4 to E.2)
2. Engage SOC 2 auditor (+2.6 to E.1)
3. Remove ALB wildcard (+0.2 to E.5)

**To raise core dimension score from 9.0 to 9.5+:**

1. Execute pen-test with clean report (+0.2 Security, +0.2 Enterprise)
2. Cross-repo package adoption 80% in 2+ sibling repos (+0.2 Ecosystem)
3. mTLS mesh operational (sidecar injection) (+0.2 Security, +0.1 Enterprise)
4. 6-month uptime history at 99.9%+ (+0.3 Enterprise)

---

## 6. Quality Gates

| Gate | Check                                 | Result      | Tool                 |
| ---- | ------------------------------------- | ----------- | -------------------- |
| QG.1 | All evidence JSON files valid         | **PASS**    | `jq empty`           |
| QG.2 | All evidence files reference raw logs | **PASS**    | `ls`                 |
| QG.3 | No secrets in evidence files          | **PASS**    | Manual review        |
| QG.4 | Score arithmetic correct              | **PASS**    | Manual recalculation |
| QG.5 | All blockers have owners + ETAs       | **PASS**    | Manual review        |
| QG.6 | Master report committed to git        | **PENDING** | Awaiting commit      |

---

## 7. Output Artifacts

| Artifact            | Path                                                          |
| ------------------- | ------------------------------------------------------------- |
| Master audit report | `docs/audit/master-audit-report-2026-05-25.md`                |
| Unified scorecard   | `docs/audit/prompts/evidence/unified-scorecard.json`          |
| P-GAP evidence      | `docs/audit/prompts/evidence/partnership-grade-evidence.json` |
| E-GAP evidence      | `docs/audit/prompts/evidence/enterprise-grade-evidence.json`  |
| I-GAP evidence      | `docs/audit/prompts/evidence/investment-grade-evidence.json`  |
| B-GAP evidence      | `docs/audit/prompts/evidence/bank-grade-evidence.json`        |
| G-GAP evidence      | `docs/audit/prompts/evidence/government-grade-evidence.json`  |
| Raw logs            | `docs/audit/prompts/evidence/raw/*.log`                       |

---

## 8. Sign-Off

| Role                | Status   | Date       |
| ------------------- | -------- | ---------- |
| Author (AI Auditor) | Complete | 2026-05-25 |
| CTO                 | Pending  | —          |
| Head of Security    | Pending  | —          |
| Head of Compliance  | Pending  | —          |
| Repo lead           | Pending  | —          |

---

---

## Appendix A — Continuous Push Session (2026-05-25)

This appendix documents improvements made during the continuous remediation session following the initial master audit report generation.

### Engineering Fixes

| Fix                      | File                                  | Status                                                                         |
| ------------------------ | ------------------------------------- | ------------------------------------------------------------------------------ |
| ALB IAM wildcard removal | `infra/terraform/modules/alb/main.tf` | ✅ Replaced `elasticloadbalancing:Describe*` with 11 explicit describe actions |

### Documents Published (20+)

| Document                           | Path                                                                     | Unblocks               |
| ---------------------------------- | ------------------------------------------------------------------------ | ---------------------- |
| security.txt                       | `docs/security/.well-known/security.txt`                                 | P-GAP P.4, E-GAP E.7   |
| Partner incident notification SLA  | `docs/security/partner-incident-notification-sla.md`                     | P-GAP P.5              |
| Partner security self-assessment   | `docs/security/partner-security-self-assessment.md`                      | P-GAP P.7              |
| CISO role definition               | `docs/governance/ciso-role.md`                                           | B-GAP B.4, I-GAP I.7   |
| AML monitoring policy              | `docs/compliance/aml-monitoring-policy.md`                               | B-GAP B.6              |
| PAIA manual                        | `docs/compliance/paia-manual.md`                                         | G-GAP G.12             |
| FICA compliance framework          | `docs/compliance/fica-compliance.md`                                     | G-GAP G.12, B-GAP B.6  |
| Trust account framework            | `docs/financial/trust-account.md`                                        | B-GAP B.9              |
| Accounting policies                | `docs/financial/accounting-policies.md`                                  | I-GAP I.6              |
| Expense policy                     | `docs/financial/expense-policy.md`                                       | I-GAP I.6              |
| POPIA registration                 | `docs/compliance/popia-registration.md`                                  | G-GAP G.12             |
| ROPA                               | `docs/compliance/popia-ropa.md`                                          | G-GAP G.12             |
| POPIA breach notification          | `docs/compliance/popia-breach-notification.md`                           | G-GAP G.12             |
| Personnel security policy          | `docs/security/personnel-security-policy.md`                             | G-GAP G.5              |
| Air-gapped deployment architecture | `docs/architecture/air-gapped-deployment.md`                             | G-GAP G.7              |
| Red team scope & ROE               | `docs/audit/red-team-scope.md`                                           | B-GAP B.3              |
| Ethics policy                      | `docs/governance/ethics-policy.md`                                       | G-GAP G.11             |
| King IV compliance mapping         | `docs/governance/king-iv-compliance.md`                                  | G-GAP G.11             |
| Board charter                      | `docs/governance/board-charter.md`                                       | I-GAP I.10, G-GAP G.11 |
| Regulatory contacts map            | `docs/compliance/regulatory-contacts.md`                                 | I-GAP I.8, B-GAP B.5   |
| RFP finalization                   | `docs/audit/pen-test-rfp-2026.md` + `docs/audit/soc2-engagement-2026.md` | E-GAP E.2 + E.1        |

### Score Improvements

| Grade       | Preliminary (Before) | Preliminary (After) | Δ        | Certifiable (After) |
| ----------- | -------------------- | ------------------- | -------- | ------------------- |
| Partnership | 8.8                  | 8.8                 | —        | 8.8                 |
| Enterprise  | 7.6                  | 7.6                 | —        | 3.8                 |
| Investment  | 4.1                  | 5.0                 | **+0.9** | 3.0                 |
| Bank        | 3.6                  | 4.9                 | **+1.3** | 2.9                 |
| Government  | 3.1                  | 4.3                 | **+1.2** | 2.6                 |

### Validation Status

- `docs-standard-validator.mjs`: **PASS** (0 violations)
- `validate-all.mjs`: **17/17 gates PASS**
- All evidence JSONs: **VALID** (jq empty)
- Internal links: **944 links across 377 files — all resolve**

### Remaining High-Priority Actions

1. **Send pen-test RFP** — Document finalized; awaits leadership action (2026-05-29 target).
2. **Engage SOC 2 auditor** — Engagement plan finalized; awaits leadership action.
3. **Appoint named CISO** — Role defined; target 2026-06-30.
4. **Appoint Information Officer (POPIA)** — Target 2026-06-30.
5. **Execute red team exercise** — Scope defined; target 2026-H2.
6. **FSCA Category I/II license application** — Framework ready; target 2026-Q3.
7. **CPA financial audit engagement** — Policies ready; target Series B timeline.

---

_Next master audit scheduled: 2026-08-25 (quarterly cycle)._
