---
title: 'Anti-Money Laundering (AML) Monitoring Policy'
status: 'current'
date: '2026-05-27'
owner: 'compliance-lead'
role: 'compliance-lead'
tier: 'critical'
tags: ['compliance', 'aml', 'fica', 'sanctions', 'monitoring', 'bank-grade']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Anti-Money Laundering (AML) Monitoring Policy

**Document ID:** GTCX-AML-001  
**Version:** 1.0  
**Effective Date:** 2026-05-25  
**Jurisdiction:** South Africa (FIC Act), Zimbabwe (Exchange Control), Nigeria (NDPA + CBN)  
**Owner:** Head of Compliance

---

## 1. Purpose

Establish the framework for detecting, reporting, and mitigating money laundering, terrorist financing, and sanctions evasion risks across the GTCX platform.

## 2. Scope

This policy applies to:

- All GTCX-operated transactional services (TradePass, PvP, PANX).
- All partner banks and payment processors integrated with GTCX.
- All customer onboarding flows involving KYC/AML checks.
- All employees with access to transaction monitoring systems.

## 3. Regulatory Framework

| Jurisdiction  | Regulator  | Key Requirements                               |
| ------------- | ---------- | ---------------------------------------------- |
| South Africa  | FIC        | FICA KYC, STR filing, record keeping (5 years) |
| Zimbabwe      | RBZ + FIU  | Exchange control, gold trade licensing         |
| Nigeria       | CBN + NFIU | AML/CFT compliance for fintech partnerships    |
| International | FATF       | Recommendation 10 (CDD), 20 (reporting)        |

## 4. Risk-Based Approach

GTCX classifies customers and transactions into risk tiers:

| Tier       | Criteria                                              | Monitoring Frequency                | Enhanced Due Diligence |
| ---------- | ----------------------------------------------------- | ----------------------------------- | ---------------------- |
| **Low**    | Individual, domestic, < $10K/month                    | Automated daily batch               | No                     |
| **Medium** | SME, cross-border, $10K–$100K/month                   | Automated real-time + weekly review | Trigger-based          |
| **High**   | Corporate, PEP, > $100K/month, high-risk jurisdiction | Real-time + daily analyst review    | Mandatory              |

## 5. Transaction Monitoring Rules

The following automated rules are implemented in the GTCX anomaly detector (`03-platform/tools/anomaly-detector/`):

| Rule ID | Description                                                  | Threshold                                            | Action             |
| ------- | ------------------------------------------------------------ | ---------------------------------------------------- | ------------------ |
| AML-001 | Structuring (multiple just-below-threshold deposits)         | 3+ transactions at 95% of reporting threshold in 24h | Alert + hold       |
| AML-002 | Rapid movement (funds in → out within 1 hour)                | Inflow > $50K and outflow > 90% within 1h            | Alert + review     |
| AML-003 | Jurisdiction mismatch (high-risk sender → low-risk receiver) | Sender country FATF grey/black list                  | Enhanced screening |
| AML-004 | Velocity spike ( > 300% of 30-day average)                   | Daily volume > 3× rolling 30d average                | Alert + throttle   |
| AML-005 | Round-number concentration ( > 70% round numbers)            | Daily round-number ratio > 70%                       | Alert + review     |

## 6. Sanctions Screening

| List                   | Source              | Update Frequency | Integration   |
| ---------------------- | ------------------- | ---------------- | ------------- |
| UN Consolidated List   | UN Security Council | Daily            | Automated API |
| OFAC SDN               | US Treasury         | Daily            | Automated API |
| EU Consolidated List   | EU Council          | Daily            | Automated API |
| UK Sanctions List      | HM Treasury         | Daily            | Automated API |
| South Africa Sanctions | FIC                 | Weekly           | Manual batch  |

All customer names, beneficial owners, and counterparties are screened at onboarding and before every transaction > $1,000.

## 7. Suspicious Transaction Report (STR) / Suspicious Activity Report (SAR)

| Step | Action                                                             | Owner            | SLA                     |
| ---- | ------------------------------------------------------------------ | ---------------- | ----------------------- |
| 1    | Anomaly detector flags or analyst identifies suspicious activity   | System / Analyst | Real-time               |
| 2    | Compliance Lead reviews and determines if STR warranted            | Compliance Lead  | 24 hours                |
| 3    | If warranted, STR filed with FIC (SA) / FIU (Zim) / NFIU (Nigeria) | Compliance Lead  | 48 hours from detection |
| 4    | Case documented in secure case management system                   | Compliance Lead  | 24 hours                |
| 5    | Board Security Committee notified (if > $100K or PEP involved)     | CISO             | 4 hours                 |

**STR filing channels:**

- South Africa: goAML portal (FIC)
- Zimbabwe: FIU secure portal
- Nigeria: NFIU reporting platform

## 8. Record Keeping

| Record Type                   | Retention Period                | Storage                    | Format     |
| ----------------------------- | ------------------------------- | -------------------------- | ---------- |
| STR/SAR filings               | 5 years                         | WORM S3 (COMPLIANCE mode)  | PDF + XML  |
| Transaction monitoring alerts | 7 years                         | WORM S3 + PostgreSQL audit | JSON + SQL |
| Sanctions screening results   | 5 years                         | WORM S3                    | CSV + PDF  |
| Customer risk assessments     | 5 years after relationship ends | WORM S3                    | PDF        |

## 9. Training

| Role            | Frequency           | Content                                           | Evidence                        |
| --------------- | ------------------- | ------------------------------------------------- | ------------------------------- |
| All staff       | Annual              | AML awareness, red flags, reporting               | Training completion certificate |
| Compliance team | Quarterly           | Advanced typologies, regulatory updates           | Attendance register             |
| Developers      | Onboarding + annual | Secure coding for financial systems, audit trails | Training completion certificate |

## 10. Policy Review

This policy is reviewed quarterly and updated when:

- New FATF recommendations are issued.
- GTCX enters a new jurisdiction.
- A significant AML control failure occurs.
- A regulator issues new guidance.

## 11. Compliance Mapping

| Framework   | Control        | Evidence                        |
| ----------- | -------------- | ------------------------------- |
| SOC 2 CC6.1 | Logical access | Screening API access controls   |
| SOC 2 CC7.1 | Detection      | Anomaly detector rules + alerts |
| FATF R.10   | CDD            | KYC module + risk assessment    |
| FATF R.20   | Reporting      | STR/SAR process + filing log    |
| FICA 42A    | Record keeping | WORM retention policy           |

---

_Last updated: 2026-05-25_
