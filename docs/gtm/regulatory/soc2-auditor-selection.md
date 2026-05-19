---
title: 'SOC 2 Type 1 Auditor Selection Criteria'
status: 'current'
date: '2026-05-17'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'compliance', 'soc2', 'audit', 'gtm']
review_cycle: 'quarterly'
---

# SOC 2 Type 1 Auditor Selection Criteria

**Document ID**: GTCX-SOC2-AUDITOR-001
**Version**: 1.0
**Date**: 2026-05-17
**Classification**: Confidential
**Owner**: CISO / Compliance Lead
**Status**: Awaiting vendor engagement

---

## 1. Purpose

This document defines the selection criteria, evaluation framework, and engagement process for a SOC 2 Type 1 auditor. A SOC 2 Type 1 report is a prerequisite for:

- Bug bounty program launch (HackerOne / Bugcrowd)
- Enterprise customer security questionnaires
- Insurance coverage for cyber liability
- M4 Reference milestone completion

---

## 2. Scope of Engagement

### 2.1 In-Scope Trust Services Criteria

| Criteria                               | GTCX Relevance                                                        | Maturity |
| -------------------------------------- | --------------------------------------------------------------------- | -------- |
| **Security (CC6.1–CC6.8)**             | VPC, EKS, WAF, IAM, NetworkPolicies, Linkerd mesh                     | Mature   |
| **Availability (A1.2–A1.3)**           | 99.99% uptime target, multi-AZ EKS, RDS failover                      | Mature   |
| **Confidentiality (C1.1–C1.2)**        | Encryption at rest (KMS), in transit (TLS 1.3), classification labels | Mature   |
| **Processing Integrity (PI1.3–PI1.5)** | Replay-guard nonce validation, settlement atomicity, audit logs       | Mature   |

**Privacy (P) is out of scope for Type 1** — planned for Type 2 in 2027.

### 2.2 Audit Period

- **Observation window**: 2026-05-01 through 2026-08-31 (4 months)
- **Report issuance target**: 2026-09-30
- **Type 2 follow-on**: Observation window 2026-10-01 through 2027-03-31

---

## 3. Mandatory Auditor Requirements

| ID  | Requirement                                                       | Verification                                |
| --- | ----------------------------------------------------------------- | ------------------------------------------- |
| A-1 | AICPA-licensed CPA firm with SOC 2 practice                       | License number verification via state board |
| A-2 | Active peer review (within last 3 years)                          | Peer review letter                          |
| A-3 | Minimum 10 SOC 2 engagements in fintech / SaaS                    | Reference checks (3 minimum)                |
| A-4 | Experience with Kubernetes / cloud-native infrastructure          | Sample report redactions                    |
| A-5 | Ability to execute NDA before receiving system documentation      | NDA execution                               |
| A-6 | Professional liability insurance ≥ $2M                            | Certificate of insurance                    |
| A-7 | Named engagement partner with SOC 2 specialization (CCSA or CISA) | Certification verification                  |

---

## 4. Preferred Qualifications

| ID  | Qualification                                                        | Weight |
| --- | -------------------------------------------------------------------- | ------ |
| P-1 | Experience with African regulatory environments (POPIA, RBZ, FSCA)   | +15%   |
| P-2 | Experience auditing AI/ML systems and LLM gateway controls           | +10%   |
| P-3 | Experience with Terraform / IaC control testing                      | +10%   |
| P-4 | In-country presence or affiliate in South Africa, Kenya, or Zimbabwe | +10%   |
| P-5 | Offers bundled readiness assessment + Type 1 audit                   | +5%    |

---

## 5. Evaluation Framework

### 5.1 Scoring Rubric

| Criterion                                        | Weight | Scoring   |
| ------------------------------------------------ | ------ | --------- |
| Technical competence (cloud-native, K8s, crypto) | 30%    | 1–5 scale |
| Fintech / regulated industry experience          | 25%    | 1–5 scale |
| Geographic relevance and accessibility           | 15%    | 1–5 scale |
| Price and timeline                               | 15%    | 1–5 scale |
| References and peer review quality               | 10%    | 1–5 scale |
| Readiness assessment offering                    | 5%     | 1–5 scale |

**Minimum passing score**: 3.5/5.0 weighted average.

### 5.2 Reference Check Questions

1. Did the auditor complete the engagement on the agreed timeline?
2. Were findings communicated clearly and prioritized by risk?
3. Did the auditor demonstrate understanding of cloud-native controls?
4. Was the final report accepted by your customers / partners without qualification?
5. Would you engage this auditor again?

---

## 6. Vendor Longlist

| Firm                    | HQ           | African Presence         | Fintech SOC 2 Experience        | Notes                                       |
| ----------------------- | ------------ | ------------------------ | ------------------------------- | ------------------------------------------- |
| **BDO South Africa**    | Johannesburg | Yes (ZA, Kenya, Nigeria) | Strong                          | Preferred for regional expertise            |
| **PwC South Africa**    | Johannesburg | Yes (pan-Africa)         | Extensive                       | Premium pricing; deep bench                 |
| **EY South Africa**     | Johannesburg | Yes (pan-Africa)         | Extensive                       | Premium pricing; strong K8s practice        |
| **KPMG South Africa**   | Johannesburg | Yes (pan-Africa)         | Extensive                       | Mid-market focus                            |
| **Mazars South Africa** | Johannesburg | Yes (ZA, Mauritius)      | Moderate                        | Competitive pricing                         |
| **RSM South Africa**    | Johannesburg | Yes (ZA, Kenya)          | Growing                         | Good value; mid-market                      |
| **Prescient Assurance** | Remote / US  | No                       | Strong (Y Combinator portfolio) | Specialist SOC 2-only firm; fast turnaround |
| **Lazarus Alliance**    | Remote / US  | No                       | Strong                          | Specialist; competitive pricing             |

---

## 7. Engagement Timeline

| Phase                             | Duration | Calendar    | Deliverable                        |
| --------------------------------- | -------- | ----------- | ---------------------------------- |
| RFP distribution                  | —        | Week 1      | This document + system description |
| Vendor Q&A period                 | 1 week   | Week 2      | Clarification memo                 |
| Proposal deadline                 | —        | Week 3      | Proposals due                      |
| Evaluation & references           | 1 week   | Week 4      | Scoring matrix complete            |
| Vendor selection                  | —        | Week 5      | Signed engagement letter           |
| Readiness assessment (if bundled) | 4 weeks  | Weeks 6–9   | Gap report + remediation plan      |
| Type 1 audit fieldwork            | 2 weeks  | Weeks 10–11 | Evidence collection, interviews    |
| Draft report review               | 1 week   | Week 12     | Management response                |
| Final report issuance             | 1 week   | Week 13     | SOC 2 Type 1 report                |

**Total timeline: 13 weeks from RFP to report** (9 weeks if readiness assessment is skipped).

---

## 8. Evidence Preparedness Checklist

Before auditor engagement, GTCX must have the following evidence organized:

- [ ] **Policies**: Information Security Policy, Access Control Policy, Change Management Policy, Incident Response Plan, Business Continuity Plan
- [ ] **Procedures**: Onboarding / offboarding checklists, vulnerability management runbooks, backup verification logs
- [ ] **System descriptions**: Architecture diagrams, data flow diagrams, third-party service inventory
- [ ] **Control evidence**: CI/CD pipeline logs, Terraform plan outputs, penetration test reports, vulnerability scan results
- [ ] **Access reviews**: Quarterly access review records, privileged access logs
- [ ] **Incident records**: Post-mortems, SLA attainment metrics
- [ ] **Training records**: Security awareness training completion rates

---

## 9. Blockers and Dependencies

| Blocker                | Impact                                     | Mitigation                                                          |
| ---------------------- | ------------------------------------------ | ------------------------------------------------------------------- |
| Pen-test completion    | Auditor may require recent pen-test report | SensePost engagement underway; draft findings acceptable            |
| 6-month uptime history | Availability criteria evidence             | Production went live 2026-05-13; 4-month window accepted for Type 1 |
| mTLS mesh injection    | Network security control                   | Documented as planned control (Q3 2026) with compensating controls  |

---

## 10. Approval

| Role                 | Name  | Date | Signature |
| -------------------- | ----- | ---- | --------- |
| CISO                 | [TBD] |      |           |
| CFO (budget owner)   | [TBD] |      |           |
| CEO (final approval) | [TBD] |      |           |

---

_This document is a living artifact. Update when vendor selection is complete or blockers are resolved._
