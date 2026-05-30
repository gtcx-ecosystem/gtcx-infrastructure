---
title: 'FICA Compliance Framework'
status: 'current'
date: '2026-05-27'
owner: 'compliance-lead'
role: 'compliance-lead'
tier: 'critical'
tags: ['compliance', 'fica', 'kyc', 'aml', 'south-africa', 'bank-grade']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# FICA Compliance Framework

**Document ID:** GTCX-FICA-001  
**Version:** 1.0  
**Effective Date:** 2026-05-25  
**Jurisdiction:** South Africa (Financial Intelligence Centre Act 38 of 2001, as amended)  
**Accountable Institution:** GTCX (pending FSCA Category I/II license)  
**Compliance Officer:** [To be appointed]

---

## 1. Purpose

Establish GTCX's framework for compliance with the Financial Intelligence Centre Act (FICA), including customer identification and verification, record keeping, reporting of suspicious transactions, and ongoing due diligence.

## 2. Regulatory Status

| Item                                            | Status                  | Target Date |
| ----------------------------------------------- | ----------------------- | ----------- |
| FSCA Category I/II license application          | Not started             | 2026-Q3     |
| FIC registration as Accountable Institution     | Not started             | 2026-Q3     |
| Appointment of Compliance Officer               | Pending                 | 2026-06-30  |
| Risk Management and Compliance Programme (RMCP) | Drafted (this document) | 2026-05-25  |

## 3. Customer Due Diligence (CDD)

### 3.1 Identification and Verification

| Customer Type               | ID Required                          | Verification Method                               | Enhanced Due Diligence           |
| --------------------------- | ------------------------------------ | ------------------------------------------------- | -------------------------------- |
| Natural person (SA citizen) | Green bar-coded ID or smart ID card  | Home Affairs DHA API + biometric liveness         | PEP / sanctions screening        |
| Natural person (foreign)    | Passport + proof of residence        | Document authenticity scan + address verification | Source of funds declaration      |
| Legal entity                | CIPC registration + MOI + resolution | CIPC API + director ID verification               | Beneficial ownership declaration |
| Trust                       | Trust deed + letter of authority     | Master of the High Court verification             | Source of wealth declaration     |

### 3.2 Ongoing Due Diligence

| Trigger                        | Action                               | Owner           | SLA       |
| ------------------------------ | ------------------------------------ | --------------- | --------- |
| Transaction > R100,000         | Re-verify identity + source of funds | Compliance team | Real-time |
| Change in beneficial ownership | Re-verify all beneficial owners      | Compliance team | 48 hours  |
| PEP status change              | Escalate to Compliance Officer       | System alert    | 24 hours  |
| Adverse media match            | Manual review + case file            | Compliance team | 24 hours  |
| Account dormancy (> 12 months) | Re-activation KYC                    | Operations      | 7 days    |

## 4. Record Keeping

| Record              | Retention Period                 | Format                | Storage                    |
| ------------------- | -------------------------------- | --------------------- | -------------------------- |
| CDD records         | 5 years after relationship ends  | PDF + structured JSON | WORM S3 (COMPLIANCE mode)  |
| Transaction records | 5 years from date of transaction | Structured JSON + SQL | WORM S3 + PostgreSQL audit |
| STR/SAR records     | 5 years from filing date         | PDF + XML             | WORM S3                    |
| Risk assessments    | 5 years after relationship ends  | PDF                   | WORM S3                    |

## 5. Reporting Obligations

### 5.1 Suspicious Transaction Reports (STRs)

- Filed via the FIC's goAML portal.
- Filed within 15 days of detection.
- All staff trained to identify red flags.
- Compliance Officer reviews every alert within 24 hours.

### 5.2 Cash Threshold Reports (CTRs)

- Applicable once GTCX handles cash transactions > R49,999.
- Current digital-only model defers this obligation.
- Policy updated if cash product launched.

### 5.3 Terrorist Property Reports (TPRs)

- Immediate filing if property linked to terrorism is identified.
- No tipping-off permitted.
- Board Security Committee notified within 4 hours.

## 6. Risk Management and Compliance Programme (RMCP)

### 6.1 Risk Assessment

GTCX conducts an enterprise-wide ML/TF risk assessment annually covering:

- Customer risk (PEP, high-risk jurisdiction, cash-intensive).
- Product risk (anonymity, speed, cross-border).
- Geographic risk (sanctions, FATF grey list, corruption index).
- Delivery channel risk (digital-only vs. agent network).

### 6.2 Internal Controls

| Control                 | Implementation                                   | Testing Frequency              |
| ----------------------- | ------------------------------------------------ | ------------------------------ |
| CDD workflow automation | `tools/compliance-gateway/` KYC module           | Quarterly penetration test     |
| Sanctions screening     | Real-time API (UN, OFAC, EU, UK)                 | Daily list update verification |
| Transaction monitoring  | Anomaly detector rules AML-001 to AML-005        | Weekly rule tuning review      |
| Access controls         | IRSA + MFA + quarterly access review             | Quarterly                      |
| Audit trail             | NATS JetStream → WORM S3 with Ed25519 signatures | Continuous (real-time)         |

### 6.3 Training

| Audience          | Content                                   | Frequency           |
| ----------------- | ----------------------------------------- | ------------------- |
| All staff         | FICA awareness, red flags, STR procedures | Annual              |
| Compliance team   | Advanced typologies, regulatory updates   | Quarterly           |
| Developers        | Secure coding for KYC/transaction systems | Onboarding + annual |
| Senior management | Regulatory update, board reporting        | Quarterly           |

## 7. Exemptions and Simplified Due Diligence

GTCX does not currently apply simplified due diligence (SDD). All customers receive standard CDD at minimum. Enhanced due diligence (EDD) is mandatory for:

- Politically Exposed Persons (PEPs) and their associates.
- Customers from high-risk jurisdictions (FATF grey/black list).
- Complex ownership structures (multi-layer trusts, shell companies).
- Transactions > R1,000,000.

## 8. Compliance Mapping

| Framework   | Control                                  | Evidence                   |
| ----------- | ---------------------------------------- | -------------------------- |
| FICA 21     | Identification of clients                | CDD workflow + KYC module  |
| FICA 22     | Record keeping                           | WORM retention policy      |
| FICA 29     | Reporting of suspicious transactions     | STR process + goAML portal |
| FICA 42A    | Risk Management and Compliance Programme | This document              |
| SOC 2 CC6.1 | Logical access                           | IRSA + MFA                 |
| SOC 2 CC7.1 | Detection                                | Anomaly detector rules     |

---

_Last updated: 2026-05-25_
