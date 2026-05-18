---
title: 'GTCX Audit Grade Framework'
status: 'current'
date: '2026-05-10'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags:
  [
    'security',
    'compliance',
    'audit',
    'bank-grade',
    'enterprise-grade',
    'government-grade',
    'investment-grade',
    'partnership-grade',
  ]
review_cycle: 'quarterly'
---

# GTCX Audit Grade Framework

**Version:** 1.0  
**Date:** 2026-05-10  
**Classification:** Internal — Executive, Engineering, Security, Legal

---

## 1. Philosophy

Not every relationship demands the same security posture. A payment API partner does not need the same rigor as a central bank. We define **five audit grades**, each with distinct control sets, validation depth, and commercial unlocks.

> **Rule:** You cannot claim a grade until _all_ controls in that grade are validated by the appropriate party (internal or external).

---

## 2. Grade Definitions

### 2.1 Partnership-Grade

**For:** API integrators, SaaS partners, non-critical data sharing, referral relationships.

**Commercial unlock:** Partner API keys, revenue-share agreements, co-marketing.

**Control summary:** Basic hygiene. No sensitive data access. Standard contractual protections.

| Control | Requirement                           | Validator | Evidence            |
| ------- | ------------------------------------- | --------- | ------------------- |
| P.1     | HTTPS-only API endpoints              | Self      | TLS 1.3 scan        |
| P.2     | API authentication (key or OAuth 2.0) | Self      | Integration test    |
| P.3     | Basic rate limiting                   | Self      | Load test           |
| P.4     | Published security contact            | Self      | `security.txt`      |
| P.5     | Incident notification SLA (72h)       | Self      | Contract clause     |
| P.6     | No PII storage in partner systems     | Self      | Architecture review |
| P.7     | Annual self-assessment questionnaire  | Self      | Signed attestation  |

**Score:** Partnership-Grade = average(P.1–P.7) × 10  
**Target:** ≥ 8.0/10  
**GTCX status:** ✅ **8.5/10** — All controls operational.

---

### 2.2 Enterprise-Grade

**For:** Fortune 500, multinational corporates, healthcare, telecom. Handles employee or customer PII.

**Commercial unlock:** Enterprise contracts ($100K–$5M ACV), procurement approval, DPA signed, custom SLAs.

**Control summary:** SOC 2 Type I minimum. Annual pen-test. Data residency. SLA-backed security operations.

| Control | Requirement                     | Validator            | Evidence                                    |
| ------- | ------------------------------- | -------------------- | ------------------------------------------- |
| E.1     | SOC 2 Type I (or ISO 27001)     | AICPA-accredited CPA | Opinion letter                              |
| E.2     | Annual penetration test         | CREST or equivalent  | Clean report (0 critical, ≤3 high)          |
| E.3     | Data residency guarantee        | Self + Legal         | Contract addendum, AWS region lock          |
| E.4     | Encryption at rest + in transit | Self                 | KMS audit, TLS scan                         |
| E.5     | RBAC with least privilege       | Self                 | IAM Access Analyzer, quarterly review       |
| E.6     | 99.9% uptime SLA with penalties | Self                 | Grafana SLO dashboards, historical evidence |
| E.7     | Bug bounty or VDP               | Self                 | Program live (e.g., HackerOne)              |
| E.8     | Business continuity plan        | Self                 | Documented RTO/RPO, annual test             |
| E.9     | Vendor risk assessment passed   | Customer             | Questionnaire score ≥ 85%                   |
| E.10    | Data deletion certification     | Self + Legal         | Certificate of destruction                  |

**Score:** Enterprise-Grade = average(E.1–E.10) × 10  
**Target:** ≥ 8.5/10  
**GTCX status:** ⚠️ **4.5/10** — E.1, E.2, E.6 partially done. E.7, E.10 not started.

---

### 2.3 Investment-Grade

**For:** Venture capital, private equity, M&A due diligence, IPO readiness. Financial and operational deep-dive.

**Commercial unlock:** Series B/C term sheets, acquisition LOIs, credit facilities, public listing.

**Control summary:** All Enterprise controls + financial audit, deep code review, IP cleanliness, cap table security, forensic accounting.

| Control | Requirement                      | Validator               | Evidence                                                   |
| ------- | -------------------------------- | ----------------------- | ---------------------------------------------------------- |
| I.1     | All Enterprise-Grade controls    | External auditors       | E-Score ≥ 8.5                                              |
| I.2     | Financial audit (GAAP/IFRS)      | Big 4 or Tier 2 CPA     | Unqualified opinion                                        |
| I.3     | Cap table security               | Legal + Self            | Carta/equity platform audit, 2FA enforced                  |
| I.4     | Deep code audit (critical paths) | Specialized AppSec firm | 0 critical, ≤2 high in `gtcx-platforms` + `gtcx-protocols` |
| I.5     | IP cleanliness review            | IP counsel              | No contamination, all dependencies licensed                |
| I.6     | Forensic accounting readiness    | Forensic accountant     | Books audit-trail clean, no related-party red flags        |
| I.7     | Key-person risk mitigation       | Self                    | Succession plan, documentation, bus-factor ≥ 2             |
| I.8     | Regulatory relationship map      | Legal                   | All regulator contacts documented, no enforcement actions  |
| I.9     | Customer concentration risk      | Self                    | No single customer > 30% revenue                           |
| I.10    | ESG baseline                     | Self                    | Carbon footprint, diversity metrics, governance board      |

**Score:** Investment-Grade = (Enterprise-Grade × 0.40) + (average(I.1–I.10) × 10 × 0.60)  
**Target:** ≥ 8.5/10  
**GTCX status:** ⚠️ **3.0/10** — I.3, I.4, I.5, I.6, I.8, I.10 not started.

---

### 2.4 Bank-Grade

**For:** Banks, insurers, payment processors, card networks. Handles financial transactions, card data, or regulated payments.

**Commercial unlock:** Banking-as-a-Service partnerships, payment processing licenses, card issuance, correspondent banking.

**Control summary:** All Enterprise controls + SOC 2 Type II, PCI DSS (if cards), red team exercises, dedicated security function, regulatory engagement.

| Control | Requirement                          | Validator                         | Evidence                                            |
| ------- | ------------------------------------ | --------------------------------- | --------------------------------------------------- |
| B.1     | SOC 2 Type II                        | AICPA-accredited CPA              | 12-month observation period, clean opinion          |
| B.2     | PCI DSS Level 1 (if card data)       | QSA (Qualified Security Assessor) | AOC (Attestation of Compliance)                     |
| B.3     | Red team exercise (annual)           | Accredited adversary simulation   | Assume-breach narrative, lateral movement contained |
| B.4     | Dedicated CISO or vCISO              | Self + Board                      | Named officer, monthly board reporting              |
| B.5     | Regulatory relationship (SARB, FSCA) | Self + Legal                      | Engagement letters, no outstanding findings         |
| B.6     | Fraud detection + AML monitoring     | Self                              | Transaction monitoring rules, SAR filing process    |
| B.7     | Segregation of duties (SoD)          | Internal audit                    | No single person can approve + execute payments     |
| B.8     | BCP tested annually with evidence    | External witness                  | DR test report, RTO demonstrated                    |
| B.9     | Customer fund segregation            | Legal + CPA                       | Trust account audit, daily reconciliation           |
| B.10    | Pen-test every 6 months              | CREST or equivalent               | Two clean reports per year                          |

**Score:** Bank-Grade = (Enterprise-Grade × 0.30) + (average(B.1–B.10) × 10 × 0.70)  
**Target:** ≥ 9.0/10  
**GTCX status:** ⚠️ **2.5/10** — B.1 Type I pending (Type II not started), B.2 not applicable yet, B.3–B.10 not started.

---

### 2.5 Government-Grade

**For:** Sovereign contracts, central bank digital currency (CBDC), national ID, defense-adjacent, critical infrastructure.

**Commercial unlock:** Government procurement, CBDC infrastructure, national payment switch, SITA contracts.

**Control summary:** All Bank-Grade controls + sovereign-specific requirements: FedRAMP/StateRAMP equivalent, supply chain attestation, citizenship screening, air-gapped options, FIPS 140-2 Level 3.

| Control | Requirement                                         | Validator                         | Evidence                                        |
| ------- | --------------------------------------------------- | --------------------------------- | ----------------------------------------------- |
| G.1     | All Bank-Grade controls                             | External auditors                 | B-Score ≥ 9.0                                   |
| G.2     | FedRAMP Moderate (or SITA equivalent)               | 3PAO (Third-Party Assessment Org) | ATO (Authority to Operate)                      |
| G.3     | FIPS 140-2 Level 3 (or Level 2 with HSM)            | NIST-accredited lab               | CMVP certificate                                |
| G.4     | Supply chain SBOM + attestation                     | Self + 3PAO                       | SPDX/CycloneDX SBOMs for all artifacts          |
| G.5     | Citizenship / security clearance for critical roles | Government                        | Background checks, clearance letters            |
| G.6     | Data sovereignty (no cross-border without MoU)      | Legal + Government                | POPIA compliance, data localization contract    |
| G.7     | Air-gapped deployment option                        | Self                              | Architecture doc, tested offline replica        |
| G.8     | 99.99% uptime SLA (52.6m downtime/year)             | Self                              | Historical evidence, redundant regions          |
| G.9     | Continuous monitoring + SIEM                        | Self + 3PAO                       | 24/7 SOC, real-time threat intel feeds          |
| G.10    | Zero-trust architecture (mTLS, micro-segmentation)  | Red team                          | No lateral movement in assumed-breach test      |
| G.11    | King IV governance compliance                       | Governance consultant             | Board charter, ethics policy, audit committee   |
| G.12    | POPIA + FICA + PAIA compliance                      | Legal + POPIA Info Regulator      | Registration, ROPA, breach notification process |

**Score:** Government-Grade = (Bank-Grade × 0.30) + (average(G.1–G.12) × 10 × 0.70)  
**Target:** ≥ 9.5/10  
**GTCX status:** ⚠️ **1.5/10** — G.2–G.12 not started. G.6 partially addressed via af-south-1 residency.

---

## 3. GTCX Current Grade Scorecard

| Grade                 | Score      | Status         | Primary Blocker              | Commercial Impact            |
| --------------------- | ---------- | -------------- | ---------------------------- | ---------------------------- |
| **Partnership-Grade** | **8.5/10** | ✅ Ready       | None                         | API partners, integrations   |
| **Enterprise-Grade**  | **4.5/10** | ⚠️ In progress | SOC 2 Type I + pen-test      | Enterprise contracts blocked |
| **Investment-Grade**  | **3.0/10** | ⚠️ Not started | Financial audit + code audit | Series B/C blocked           |
| **Bank-Grade**        | **2.5/10** | ⚠️ Not started | SOC 2 Type II + red team     | Banking partnerships blocked |
| **Government-Grade**  | **1.5/10** | ⚠️ Not started | SITA/FedRAMP equivalent      | Sovereign contracts blocked  |

---

## 4. Grade Escalation Path

```
Partnership-Grade (8.5) ──► Enterprise-Grade ──► Investment-Grade ──► Bank-Grade ──► Government-Grade
        ✅ Ready              ⚠️ 4.5/10            ⚠️ 3.0/10           ⚠️ 2.5/10         ⚠️ 1.5/10

To reach Enterprise:
  → SOC 2 Type I (Q3 2026)
  → Pen-test clean (Jun 2026)
  → Bug bounty program (Q3 2026)

To reach Investment:
  → All Enterprise controls
  → Financial audit (Q4 2026)
  → Deep code audit (Q4 2026)

To reach Bank-Grade:
  → SOC 2 Type II (Q2 2027)
  → Red team exercise (Q1 2027)
  → Dedicated CISO (Q4 2026)

To reach Government-Grade:
  → SITA assessment (2027)
  → FIPS 140-2 Level 3 (2027)
  → Air-gapped option (Q4 2027)
```

---

## 5. Per-Customer Grade Assignment

Not all customers need the highest grade. We match grade to risk:

| Customer Type                               | Required Grade   | GTCX Ready? |
| ------------------------------------------- | ---------------- | ----------- |
| Fintech API partner (read-only market data) | Partnership      | ✅ Yes      |
| Corporate treasury dashboard                | Enterprise       | ⚠️ Q3 2026  |
| VC due diligence (Series B)                 | Investment       | ⚠️ Q4 2026  |
| Retail bank partnership                     | Bank-Grade       | ⚠️ Q2 2027  |
| SARB CBDC pilot                             | Government-Grade | ⚠️ 2027+    |

---

## 6. Grade Maintenance

| Grade            | Re-validation Frequency            | Trigger for Re-assessment           |
| ---------------- | ---------------------------------- | ----------------------------------- |
| Partnership      | Annual self-assessment             | New data type shared, breach        |
| Enterprise       | Annual external audit              | SOC 2 renewal, pen-test expiry      |
| Investment       | Per funding round                  | New investor DD, M&A approach       |
| Bank-Grade       | 6-month pen-test + annual SOC 2 II | New product line, regulator inquiry |
| Government-Grade | Continuous (ATO) + annual 3PAO     | System change, incident, re-compete |

---

## 7. South Africa-Specific Mapping

| GTCX Grade       | SA Regulatory Relevance                                            |
| ---------------- | ------------------------------------------------------------------ |
| Partnership      | POPIA notification registration                                    |
| Enterprise       | POPIA responsible party obligations, FICA KYC                      |
| Investment       | SARB Prudential Authority notification (if deposit-taking)         |
| Bank-Grade       | FSCA license (Category I/II), SARB clearance, PAIA compliance      |
| Government-Grade | SITA framework agreement, State Security Agency clearance, King IV |

---

## 8. Appendix: Auditor Engagement Log by Grade

| Grade      | Engagement         | Vendor               | Stage       | ETA      | Budget   |
| ---------- | ------------------ | -------------------- | ----------- | -------- | -------- |
| Enterprise | Pen-test           | SensePost (Orange)   | RFP ready   | Jun 2026 | $15–25K  |
| Enterprise | SOC 2 Type I       | TBD                  | Shortlist   | Q3 2026  | $15–30K  |
| Investment | Financial audit    | TBD                  | Not started | Q4 2026  | $20–40K  |
| Investment | Code audit         | TBD                  | Not started | Q4 2026  | $30–50K  |
| Bank-Grade | SOC 2 Type II      | TBD (same as Type I) | Not started | Q2 2027  | $25–50K  |
| Bank-Grade | Red team           | TBD                  | Not started | Q1 2027  | $40–80K  |
| Government | SITA assessment    | SITA                 | Not started | 2027     | TBD      |
| Government | FIPS 140-2 Level 3 | NIST-accredited lab  | Not started | 2027     | $50–100K |

---

## 9. Related Documents

- `docs/audit/bank-grade-rating-framework.md` — Internal vs external dual-rating for Bank-Grade specifically
- `docs/audit/archive/10-10-roadmap-2026-05-12.md` — Full engineering roadmap
- `docs/audit/pen-test-scope-2026.md` — Penetration test scope
- `docs/compliance/soc2-gap-analysis.md` — SOC 2 readiness checklist
- `docs/engineering/gtcx-platforms-m3-contract.md` — M3 cross-repo deliverables
