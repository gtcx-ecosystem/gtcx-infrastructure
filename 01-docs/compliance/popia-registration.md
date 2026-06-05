---
title: 'POPIA Registration & Compliance Status'
status: 'current'
date: '2026-05-27'
owner: 'compliance-lead'
role: 'compliance-lead'
tier: 'critical'
tags: ['compliance', 'popia', 'south-africa', 'data-protection', 'government-grade']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# POPIA Registration & Compliance Status

**Document ID:** GTCX-POPIA-REG-001  
**Version:** 1.0  
**Effective Date:** 2026-05-25  
**Regulator:** Information Regulator of South Africa  
**Responsible Party:** GTCX (Pty) Ltd

---

## 1. Registration Status

| Item                                | Status    | Date       | Reference                                            |
| ----------------------------------- | --------- | ---------- | ---------------------------------------------------- |
| **Responsible party registration**  | Filed     | 2026-03-15 | IR-REF-2026-0315-GTCX                                |
| **Information Officer appointment** | Pending   | —          | Target: 2026-06-30                                   |
| **Deputy Information Officer**      | Active    | 2026-03-15 | Compliance Lead                                      |
| **PAIA Manual publication**         | Published | 2026-05-25 | `01-docs/10-compliance/paia-manual.md`               |
| **ROPA completion**                 | Completed | 2026-05-25 | `01-docs/10-compliance/popia-ropa.md`                |
| **Breach notification process**     | Published | 2026-05-25 | `01-docs/10-compliance/popia-breach-notification.md` |

## 2. Processing Grounds

GTCX processes personal information under the following lawful grounds (POPIA Section 11):

| Purpose                   | Ground                                  | Consent Required? |
| ------------------------- | --------------------------------------- | ----------------- |
| Customer onboarding (KYC) | Compliance with legal obligation (FICA) | No                |
| Transaction processing    | Performance of contract                 | Implied           |
| Marketing communications  | Consent                                 | Yes (opt-in)      |
| Fraud detection           | Legitimate interest                     | No                |
| Regulatory reporting      | Compliance with legal obligation        | No                |
| Employment                | Performance of contract                 | Implied           |

## 3. Data Subjects

| Category                   | Count (approx) | Data Types                                  |
| -------------------------- | -------------- | ------------------------------------------- |
| Customers (individuals)    | ~500 (pilot)   | ID, contact, financial, biometric           |
| Customers (legal entities) | ~50            | Registration, beneficial ownership, contact |
| Employees                  | ~25            | HR, payroll, performance                    |
| Website visitors           | ~10,000/mo     | IP, cookies, analytics                      |

## 4. Third-Party Processors

| Processor | Service              | Data Processed             | DPA Signed?            |
| --------- | -------------------- | -------------------------- | ---------------------- |
| AWS       | Cloud infrastructure | All production data        | Yes (standard AWS DPA) |
| GitHub    | Source code, CI/CD   | Dev data, secrets          | Yes (GitHub DPA)       |
| Anthropic | AI model inference   | Query content (anonymized) | Under negotiation      |
| SendGrid  | Email delivery       | Contact details            | Yes                    |

## 5. Cross-Border Transfers

| Destination                          | Mechanism       | POPIA Basis           | Status                    |
| ------------------------------------ | --------------- | --------------------- | ------------------------- |
| United States (AWS us-east-1 backup) | AWS DPA + SCCs  | Adequacy assessment   | Permitted with safeguards |
| European Union                       | AWS DPA + SCCs  | Adequacy (GDPR)       | Permitted                 |
| Zimbabwe                             | Direct transfer | Operational necessity | MoU in development        |
| Nigeria                              | Direct transfer | Operational necessity | MoU in development        |

## 6. Compliance Checklist

| Requirement                             | Status      | Evidence                                             |
| --------------------------------------- | ----------- | ---------------------------------------------------- |
| Registration with Information Regulator | ✅ Complete | IR-REF-2026-0315-GTCX                                |
| Appointment of Information Officer      | 🟡 Pending  | Target 2026-06-30                                    |
| PAIA Manual published                   | ✅ Complete | `01-docs/10-compliance/paia-manual.md`               |
| ROPA maintained                         | ✅ Complete | `01-docs/10-compliance/popia-ropa.md`                |
| Data subject access procedure           | ✅ Complete | `01-docs/10-compliance/data-retention-policy.md`     |
| Breach notification procedure           | ✅ Complete | `01-docs/10-compliance/popia-breach-notification.md` |
| Privacy policy published                | 🟡 Pending  | Target 2026-06-15                                    |
| Cookie consent mechanism                | 🟡 Pending  | Target 2026-06-15                                    |
| DPIA for high-risk processing           | ✅ Complete | `01-docs/10-compliance/dpia-2026-05.md`              |
| Staff training on POPIA                 | 🟡 Partial  | Annual training scheduled                            |

## 7. Contact

| Role                          | Name              | Email                  | Phone        |
| ----------------------------- | ----------------- | ---------------------- | ------------ |
| Information Officer (pending) | [To be appointed] | dpo@gtcx.trade         | —            |
| Deputy Information Officer    | Compliance Lead   | compliance@gtcx.trade  | —            |
| Information Regulator         | —                 | inforeg@justice.gov.za | 012 406 4818 |

---

_Last updated: 2026-05-25_
