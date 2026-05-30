---
title: 'KYC/AML Record Retention Schedule'
status: 'current'
date: '2026-05-27'
owner: 'quality-evidence-lead'
role: 'quality-evidence-lead'
tier: 'standard'
tags: ['security', 'compliance', 'infrastructure', 'testing', 'api']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# KYC/AML Record Retention Schedule

**Classification:** Confidential — Regulator Submission
**Date:** 2026-05-25
**Prepared by:** GTCX Compliance Lead

---

## Statement

GTCX retains KYC and AML records in accordance with each jurisdiction's requirements. Retention periods are encoded in infrastructure-as-code and enforced automatically. Records cannot be deleted before the retention period expires.

---

## Retention Schedule by Jurisdiction

| Jurisdiction | KYC Records | Audit Records | Legal Basis                                      | Regulator                            |
| ------------ | ----------- | ------------- | ------------------------------------------------ | ------------------------------------ |
| Zimbabwe     | 5 years     | 7 years       | FATF baseline, RBZ AML/CFT Regulations           | Reserve Bank of Zimbabwe (RBZ)       |
| South Africa | 5 years     | 7 years       | FICA §22, Companies Act §24                      | SARB / Financial Intelligence Centre |
| Nigeria      | 6 years     | 7 years       | CBN AML/CFT Regulation §18, CAMA 2020            | Central Bank of Nigeria (CBN)        |
| Egypt        | 5 years     | 10 years      | AML Law No. 80/2002, Egyptian Commercial Code    | Central Bank of Egypt (CBE)          |
| Kenya        | 5 years     | 7 years       | Proceeds of Crime and AML Act §47, Companies Act | Central Bank of Kenya (CBK)          |
| Ghana        | 5 years     | 7 years       | AML Act 2020, Companies Act                      | Bank of Ghana (BoG)                  |
| Tanzania     | 5 years     | 7 years       | AML Act 2006 (amended 2022), TRA requirements    | Bank of Tanzania (BoT)               |
| Rwanda       | 5 years     | 7 years       | AML/CFT Law (2021)                               | National Bank of Rwanda (BNR)        |
| WAEMU        | 5 years     | 10 years      | BCEAO Instruction 01/2017, OHADA Uniform Act     | BCEAO                                |
| CEMAC        | 5 years     | 10 years      | COBAC regulations, OHADA Uniform Act             | BEAC                                 |
| EAC          | 5 years     | 7 years       | EAC Financial Integration Framework              | EAC member central banks             |

## Record Types and Storage

| Record Type                                 | Storage                  | Format                     | Retention                   | Deletion Method                     |
| ------------------------------------------- | ------------------------ | -------------------------- | --------------------------- | ----------------------------------- |
| Customer identification (name, ID, address) | Operational DB (RDS)     | Encrypted columns          | Per jurisdiction above      | Automated after retention + 30 days |
| ID document images                          | S3 (KYC bucket)          | Encrypted objects, SSE-KMS | Per jurisdiction above      | S3 lifecycle policy                 |
| Transaction records                         | Operational DB (RDS)     | Encrypted at rest          | 7 years (all jurisdictions) | Automated                           |
| Audit trail events                          | Audit DB (RDS) + WORM S3 | Append-only, encrypted     | 7 years minimum             | Cannot be deleted (WORM)            |
| Screening results (PEP, sanctions)          | Operational DB (RDS)     | Encrypted at rest          | Same as KYC records         | Automated                           |

## Technical Enforcement

Retention is enforced through infrastructure-as-code, not application logic:

```hcl
# From: infra/terraform/modules/compliance-db/main.tf
zimbabwe = {
  kyc_retention_days   = 1825  # 5 years
  audit_retention_days = 2555  # 7 years
}
```

- **S3 lifecycle policies** automatically transition records to Glacier after 90 days and expire after the retention period.
- **S3 Object Lock (COMPLIANCE mode)** on audit storage prevents deletion by any user, including root, until retention expires.
- **Database backup retention** is set to 35 days (RDS maximum) with additional S3 exports for 7-year archival.
- **Legal hold** capability allows retention extension for ongoing investigations or litigation.

## Regulatory Data Protection Alignment

| Jurisdiction | Data Protection Law                  | Authority             | Cross-Border                      |
| ------------ | ------------------------------------ | --------------------- | --------------------------------- |
| Zimbabwe     | Cyber and Data Protection Act (2021) | POTRAZ                | Allowed with safeguards           |
| South Africa | POPIA (2013)                         | Information Regulator | Allowed to adequate jurisdictions |
| Nigeria      | NDPA (2023)                          | NDPC                  | Requires NDPC approval            |
| Kenya        | DPA (2019)                           | ODPC                  | Allowed with safeguards           |

---

_Prepared for regulatory submission. Retention periods sourced from central bank circulars, AML legislation, and FATF mutual evaluation reports._
