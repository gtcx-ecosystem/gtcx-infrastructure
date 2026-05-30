---
title: 'GTCX Bank-Grade Audit Rating Framework'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'compliance', 'audit', 'bank-grade', 'rating']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# GTCX Bank-Grade Audit Rating Framework

**Version:** 1.0  
**Date:** 2026-05-10  
**Classification:** Internal — Engineering & Security

---

## 1. Philosophy

Bank-grade is not a single score. It is a **dual-rating system**:

| Dimension               | What it measures                                                    | Who validates                        | Confidence |
| ----------------------- | ------------------------------------------------------------------- | ------------------------------------ | ---------- |
| **Internal (I-Rating)** | Control design, architecture, operational hygiene                   | Self-assessment + automated evidence | B+         |
| **External (E-Rating)** | Control effectiveness against real attackers + regulatory standards | Accredited third party               | A          |

> **A bank will not onboard a fintech without both.**
>
> - I-Rating ≥ 9.0 proves you _built_ it right.
> - E-Rating ≥ 9.0 proves an outsider _verified_ it.

---

## 2. Internal Rating (I-Rating)

Scored out of 10. Assessed quarterly by Infrastructure + Security. Evidence is automated where possible.

### 2.1 Scoring Dimensions

| #    | Dimension                        | Weight | Current | Evidence Source                                                                             |
| ---- | -------------------------------- | ------ | ------- | ------------------------------------------------------------------------------------------- |
| I.1  | Identity & Access Management     | 15%    | 9.2     | IAM Access Analyzer, AWS Config `iam-password-policy`, `mfa-enabled-for-iam-console-access` |
| I.2  | Encryption & Key Management      | 15%    | 9.5     | KMS key policies, HSM backing (FIPS 140-2), S3 SSE-KMS, RDS encryption                      |
| I.3  | Network Security                 | 12%    | 8.8     | WAF rules, Security Groups, NACLs, VPC Flow Logs, private EKS endpoint                      |
| I.4  | Logging & Monitoring             | 12%    | 9.6     | CloudTrail (KMS-encrypted + validation), 14 CIS metric filters/alarms, GuardDuty            |
| I.5  | Infrastructure Hardening         | 10%    | 9.0     | EKS non-root containers, read-only rootfs, seccomp, IRSA, OIDC                              |
| I.6  | Data Protection & Residency      | 10%    | 9.3     | WORM audit storage (COMPLIANCE + Object Lock), RDS Multi-AZ, backup retention               |
| I.7  | Supply Chain Security            | 8%     | 8.5     | SLSA provenance, ECR immutable tags, TruffleHog CI, pnpm audit gate                         |
| I.8  | Operational Resilience           | 8%     | 8.0     | SLO burn-rate alerts, on-call drill template, DR test scheduled (not yet executed)          |
| I.9  | Configuration Drift & Compliance | 5%     | 9.1     | AWS Config 8 managed rules, all COMPLIANT, Security Hub findings tracked                    |
| I.10 | Incident Response Readiness      | 5%     | 7.5     | Runbook templates exist, no simulated incident exercise yet                                 |

### 2.2 Current I-Rating Calculation

```
I-Rating = Σ(dimension_score × weight)
         = (9.2×0.15) + (9.5×0.15) + (8.8×0.12) + (9.6×0.12)
         + (9.0×0.10) + (9.3×0.10) + (8.5×0.08) + (8.0×0.08)
         + (9.1×0.05) + (7.5×0.05)
         = 1.38 + 1.425 + 1.056 + 1.152 + 0.90 + 0.93 + 0.68 + 0.64 + 0.455 + 0.375
         = 8.993
         ≈ 9.0
```

**Current I-Rating: 9.0/10** (Strong — bank-build-ready)

### 2.3 Gap to I-Rating 10.0

| Dimension                  | Gap  | Fix                                           |
| -------------------------- | ---- | --------------------------------------------- |
| I.8 Operational Resilience | -2.0 | Execute Q2 DR test with evidence              |
| I.10 Incident Response     | -2.5 | Run tabletop exercise, document response time |
| I.7 Supply Chain           | -1.5 | SLSA Level 2 provenance (currently Level 1)   |
| I.3 Network Security       | -1.2 | mTLS mesh (Linkerd) deployed                  |

---

## 3. External Rating (E-Rating)

Scored out of 10. Assessed only after third-party engagement completes. No self-assessment allowed.

### 3.1 Scoring Dimensions

| #   | Dimension                    | Weight | Current | Validator                                          | Evidence Required                                       |
| --- | ---------------------------- | ------ | ------- | -------------------------------------------------- | ------------------------------------------------------- |
| E.1 | Penetration Test             | 25%    | 0.0     | CREST-accredited firm (e.g., SensePost, NCC Group) | Signed report, risk matrix, remediation evidence        |
| E.2 | SOC 2 Type I                 | 25%    | 0.0     | AICPA-licensed CPA firm                            | Auditor opinion letter, trust services criteria mapping |
| E.3 | Code Audit / Secure Review   | 15%    | 0.0     | Specialized AppSec firm                            | Critical/high finding count = 0                         |
| E.4 | Disaster Recovery Validation | 15%    | 0.0     | Independent SRE consultant or auditor              | RTO/RPO demonstrated under simulated failure            |
| E.5 | Compliance Mapping           | 10%    | 0.0     | Compliance consultant                              | PCI DSS / GDPR / POPIA gap analysis complete            |
| E.6 | Red Team Exercise            | 10%    | 0.0     | Accredited adversary simulation firm               | Assume-breach narrative, lateral movement contained     |

### 3.2 Current E-Rating

```
E-Rating = 0.0/10 (Not started)
```

**Status:** Procurement in progress.

| Engagement       | Vendor                          | Stage                        | ETA                               |
| ---------------- | ------------------------------- | ---------------------------- | --------------------------------- |
| Penetration Test | SensePost (Orange Cyberdefense) | RFP ready, awaiting send     | 3–4 weeks post-send               |
| SOC 2 Type I     | TBD                             | Gap analysis checklist ready | 3–6 months post-auditor selection |

### 3.3 E-Rating Trajectory (Estimated)

| Milestone                                | E-Rating | Cumulative Evidence |
| ---------------------------------------- | -------- | ------------------- |
| Pen-test report clean (no critical/high) | 2.5      | E.1 partial         |
| SOC 2 Type I attestation                 | 5.0      | E.1 + E.2           |
| Code audit clean + DR validation         | 7.5      | E.1–E.4             |
| Compliance mapping + red team            | 9.0–10.0 | E.1–E.6             |

---

## 4. Combined Bank-Grade Scorecard

### 4.1 Formula

```
Bank-Grade Score = (I-Rating × 0.40) + (E-Rating × 0.60)
```

> **Rationale:** External validation carries more weight with banks, regulators, and enterprise customers. A 40/60 split reflects that building right (I) is necessary but not sufficient — proving it (E) is what unlocks revenue.

### 4.2 Current State

```
Bank-Grade Score = (9.0 × 0.40) + (0.0 × 0.60) = 3.6/10
```

| Rating   | Interpretation     | Customer Readiness                          |
| -------- | ------------------ | ------------------------------------------- |
| 0–3.9    | **Pre-bank-grade** | No enterprise or bank conversations         |
| 4.0–5.9  | **Audit-pending**  | Early enterprise talks, NDA-only            |
| 6.0–7.9  | **Bank-evaluable** | RFPs accepted, security questionnaire ready |
| 8.0–8.9  | **Bank-ready**     | POCs approved, compliance review passed     |
| 9.0–10.0 | **Bank-grade**     | Production contracts, regulatory reliance   |

**GTCX is currently at 3.6 — Pre-bank-grade.**

### 4.3 Target Trajectory

| Date       | I-Rating | E-Rating | Bank-Grade | Milestone                  |
| ---------- | -------- | -------- | ---------- | -------------------------- |
| 2026-05-10 | 9.0      | 0.0      | **3.6**    | _Current_                  |
| 2026-06-15 | 9.2      | 2.5      | **4.9**    | Pen-test complete          |
| 2026-08-15 | 9.3      | 5.0      | **6.7**    | SOC 2 Type I in hand       |
| 2026-10-15 | 9.5      | 7.5      | **8.1**    | Code audit + DR validation |
| 2026-12-15 | 9.6      | 9.5      | **9.5**    | Full bank-grade            |

---

## 5. What Unblocks Each Rating

### I-Rating 9.5 → 10.0 (Internal)

- [ ] Execute Q2 DR test → publish evidence log
- [ ] Incident response tabletop exercise with external observer
- [ ] SLSA Level 2 provenance in CI (`slsa-github-generator`)
- [ ] Linkerd mTLS mesh in production
- [ ] 100% Security Hub findings resolved (0 open)

### E-Rating 0.0 → 9.5 (External)

- [ ] Send pen-test RFP to SensePost
- [ ] Receive clean pen-test report (0 critical, ≤2 high with remediation plan)
- [ ] Select SOC 2 auditor (recommendations: [ ], [ ])
- [ ] Complete SOC 2 Type I audit
- [ ] Engage code audit firm for `gtcx-platforms` + `gtcx-protocols`
- [ ] Run DR validation with independent witness
- [ ] POPIA compliance mapping (South Africa-specific)

---

## 6. Appendix: Auditor Engagement Log

| Date       | Activity                            | Owner          | Status                        |
| ---------- | ----------------------------------- | -------------- | ----------------------------- |
| 2026-05-10 | Bank-grade rating framework defined | @amanianai     | ✅ Complete                   |
| 2026-05-10 | Internal rating calculated at 9.0   | @amanianai     | ✅ Complete                   |
| 2026-05-10 | Pen-test RFP prepared (SensePost)   | @amanianai     | ✅ Ready                      |
| TBD        | Send pen-test RFP                   | Leadership     | ⏳ Blocked — budget approval  |
| TBD        | Select SOC 2 auditor                | CISO + Finance | ⏳ Blocked — vendor shortlist |

---

## 7. Related Documents

- `docs/audit/archive/10-10-roadmap-2026-05-12.md` — Full 10/10 score trajectory
- `docs/audit/pen-test-scope-2026.md` — Pen-test scope including gtcx-platforms
- `docs/engineering/gtcx-platforms-m3-contract.md` — Cross-repo M3 deliverables
- `docs/compliance/soc2-gap-analysis.md` — SOC 2 readiness checklist
