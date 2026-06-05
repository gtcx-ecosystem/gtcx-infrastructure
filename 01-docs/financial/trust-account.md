---
title: 'Customer Fund Segregation & Trust Account Framework'
status: 'current'
date: '2026-05-27'
owner: 'cfo'
role: 'cfo'
tier: 'critical'
tags: ['financial', 'trust-account', 'fund-segregation', 'bank-grade', 'compliance']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Customer Fund Segregation & Trust Account Framework

**Document ID:** GTCX-TRUST-001  
**Version:** 1.0  
**Effective Date:** 2026-05-25  
**Jurisdiction:** South Africa (FAIS), Zimbabwe (Exchange Control), International (FATF R.24)  
**Owner:** Chief Financial Officer

---

## 1. Purpose

Define the architecture, controls, and operational procedures for segregating customer funds from GTCX operational funds. This framework is a prerequisite for Bank-Grade certification and banking partnership agreements.

## 2. Regulatory Context

| Jurisdiction | Requirement                   | Status                                               |
| ------------ | ----------------------------- | ---------------------------------------------------- |
| South Africa | FAIS — client money in trust  | Framework defined; accounts pending bank partnership |
| Zimbabwe     | RBZ Exchange Control          | Framework defined; pending RBZ approval              |
| FATF R.24    | Transparency of legal persons | Beneficial ownership register maintained             |

## 3. Trust Account Architecture

### 3.1 Account Structure

```
GTCX Operational Account (Company Funds)
├── Operating expenses
├── Payroll
├── Tax reserves
└── Investor capital

GTCX Trust Account (Customer Funds)
├── ZAR Customer Sub-account
│   ├── Retail customers
│   ├── SME customers
│   └── Institutional customers
├── USD Customer Sub-account
│   └── Cross-border settlements
├── XAU Customer Sub-account
│   └── Gold-backed instrument reserves
└── Unallocated (in-transit) Buffer
```

### 3.2 Banking Partners (Target)

| Account Type      | Target Bank               | Jurisdiction  | Status      |
| ----------------- | ------------------------- | ------------- | ----------- |
| ZAR Trust         | Standard Bank / ABSA      | South Africa  | RFP pending |
| USD Correspondent | Citi / Standard Chartered | International | RFP pending |
| XAU Custody       | Rand Refinery / Brink's   | South Africa  | RFP pending |

## 4. Controls

### 4.1 Daily Reconciliation

| Step | Action                                                | Owner        | Evidence              |
| ---- | ----------------------------------------------------- | ------------ | --------------------- |
| 1    | Extract trust account balance from bank API           | Treasury Ops | API log               |
| 2    | Extract customer liability ledger from operational DB | Treasury Ops | SQL export            |
| 3    | Compare balances                                      | Treasury Ops | Reconciliation report |
| 4    | Resolve discrepancies > 0.01%                         | CFO          | Exception report      |
| 5    | CFO sign-off                                          | CFO          | Digital signature     |
| 6    | Archive to WORM S3                                    | Compliance   | S3 Object Lock record |

### 4.2 Segregation of Duties

| Role                      | Can Initiate   | Can Approve           | Can Execute             |
| ------------------------- | -------------- | --------------------- | ----------------------- |
| Treasury Analyst          | Reconciliation | —                     | —                       |
| Treasury Manager          | —              | Reconciliation        | —                       |
| CFO                       | —              | Disbursements > $100K | —                       |
| Bank Relationship Manager | —              | —                     | External transfers only |

### 4.3 Audit Trail

Every trust account movement produces:

1. Operational audit record (PostgreSQL).
2. Tamper-evident audit record (NATS → WORM S3, Ed25519 signed).
3. Bank statement entry reconciled within 24 hours.

## 5. Disbursement Policies

### 5.1 Permitted Disbursements

| Type                             | Approval Required             | Evidence                    |
| -------------------------------- | ----------------------------- | --------------------------- |
| Customer withdrawal (≤ $10K)     | Automated (risk rules)        | Signed request + biometric  |
| Customer withdrawal ($10K–$100K) | Treasury Manager + Compliance | Dual approval ticket        |
| Customer withdrawal (> $100K)    | CFO + Compliance Officer      | Board resolution if > $500K |
| Fee deduction                    | Automated (contractual rate)  | Billing record              |
| Chargeback / reversal            | Compliance + Legal            | Investigation file          |

### 5.2 Prohibited Uses

Trust funds must NEVER be used for:

- GTCX operating expenses.
- Staff salaries or bonuses.
- Marketing or travel.
- Investment in securities or crypto.
- Lending to directors or affiliates.

## 6. CPA Audit Trail

| Audit Type                      | Frequency   | Auditor           | Evidence           |
| ------------------------------- | ----------- | ----------------- | ------------------ |
| Reconciliation review           | Monthly     | Internal Audit    | Reports            |
| Trust account independent audit | Quarterly   | External CPA      | Opinion letter     |
| Full financial statement audit  | Annually    | External CPA      | Audited financials |
| Regulatory examination          | As required | SARB / FSCA / RBZ | Examination report |

## 7. Breach Response

1. **Immediate freeze** — Treasury Ops freezes all trust disbursements.
2. **CFO + Compliance Officer notification** — within 1 hour.
3. **Investigation** — Internal Audit + forensic accountant.
4. **Regulator notification** — within 24 hours.
5. **Customer notification** — affected customers within 48 hours.
6. **Remediation** — restitution + process fix + Board review.

## 8. Implementation Roadmap

| Phase | Deliverable                      | Target Date | Dependency                       |
| ----- | -------------------------------- | ----------- | -------------------------------- |
| 1     | Bank partnership RFPs sent       | 2026-Q3     | Pen-test complete                |
| 2     | Trust accounts opened            | 2026-Q4     | Bank partnership signed          |
| 3     | Reconciliation automation live   | 2026-Q4     | API integration                  |
| 4     | First CPA audit                  | 2027-Q1     | 3 months of data                 |
| 5     | Regulatory examination readiness | 2027-Q2     | SOC 2 Type II + pen-test history |

## 9. Compliance Mapping

| Framework      | Control                   | Evidence                      |
| -------------- | ------------------------- | ----------------------------- |
| Bank-Grade B.9 | Customer fund segregation | This document                 |
| SOC 2 CC6.1    | Logical access            | SoD matrix                    |
| SOC 2 CC7.2    | Monitoring                | Daily reconciliation          |
| FAIS           | Client money              | Trust account architecture    |
| FATF R.24      | Transparency              | Beneficial ownership register |

---

_Last updated: 2026-05-25_
