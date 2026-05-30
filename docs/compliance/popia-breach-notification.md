---
title: 'POPIA Breach Notification Procedure'
status: 'current'
date: '2026-05-27'
owner: 'compliance-lead'
role: 'compliance-lead'
tier: 'critical'
tags: ['compliance', 'popia', 'breach', 'incident-response', 'data-protection']
review_cycle: 'annual'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# POPIA Breach Notification Procedure

**Document ID:** GTCX-POPIA-BR-001  
**Version:** 1.0  
**Effective Date:** 2026-05-25  
**Legal Basis:** POPIA Section 22  
**Owner:** Deputy Information Officer (Compliance Lead)

---

## 1. Trigger

A breach notification is required when:

1. There is **unauthorized access to, disclosure of, or loss of** personal information.
2. The breach is **reasonably likely to result in** serious harm to the data subject (identity theft, financial loss, reputational damage, physical harm, humiliation).

## 2. Notification Timeline

| Party                                                | Timeline                                                                           | Method                                          | Content                                                             |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------- |
| **Information Regulator**                            | As soon as reasonably possible, and within **notification requirement determined** | goAML portal or email to inforeg@justice.gov.za | Breach description, affected data subjects, measures taken          |
| **Affected data subjects**                           | Without unreasonable delay after identifying affected individuals                  | Email + SMS (if contact available)              | Nature of breach, likely consequences, steps taken, contact details |
| **Partner organizations** (if partner data affected) | Within 24 hours of internal confirmation                                           | Email to partner security contact               | Impact assessment, containment status, next steps                   |
| **Law enforcement** (if criminal activity suspected) | Immediately                                                                        | SAPS Cybercrime Unit or FIC                     | Evidence preservation request                                       |

## 3. Breach Response Workflow

```
Detection
    │
    ▼
Containment (Security Team — 1 hour)
    │
    ▼
Assessment (Compliance Lead + CISO — 4 hours)
    │
    ▼
Decision: Notification Required?
    ├── YES ──► Notify Information Regulator
    │             Notify affected data subjects
    │             Notify partners (if applicable)
    │             Document in breach register
    │
    └── NO ──► Document in incident log
                Close with justification
```

## 4. Assessment Criteria

To determine if notification is required, assess:

| Factor                     | High Risk (Notify)                              | Low Risk (Document)              |
| -------------------------- | ----------------------------------------------- | -------------------------------- |
| Sensitivity of data        | Financial, biometric, health, children          | Publicly available business info |
| Number of subjects         | > 100                                           | < 10                             |
| Likelihood of misuse       | High (unencrypted, accessible)                  | Low (encrypted, no exfiltration) |
| Harm potential             | Identity theft, financial loss, physical safety | Spam, minor inconvenience        |
| Data subject vulnerability | Children, elderly, financially distressed       | General population               |

## 5. Notification Template (Data Subjects)

> **Subject:** Important Security Notice — GTCX Account
>
> Dear [Name],
>
> We are writing to inform you of a security incident that may have affected your personal information held by GTCX.
>
> **What happened:** [Brief factual description]
> **When:** [Date of detection]
> **What information was involved:** [Categories of personal information]
> **What we are doing:** [Containment and remediation steps]
> **What you should do:** [Recommended protective steps]
> **Contact:** For questions, contact our Data Protection Officer at dpo@gtcx.io or +27 [number].
>
> We sincerely apologize for any inconvenience.
>
> GTCX Security Team

## 6. Breach Register

Every breach (notified or not) is recorded in the breach register:

| Field                             | Description  |
| --------------------------------- | ------------ |
| Breach ID                         | BR-YYYY-NNNN |
| Detection date                    |              |
| Containment date                  |              |
| Assessment date                   |              |
| Notification date (if applicable) |              |
| Affected data subjects (count)    |              |
| Data categories                   |              |
| Root cause                        |              |
| Remediation                       |              |
| Lessons learned                   |              |
| Owner                             |              |

The breach register is stored in WORM S3 with 7-year retention.

## 7. Testing

This breach notification procedure is tested annually via tabletop exercise.

| Date       | Exercise           | Result                           |
| ---------- | ------------------ | -------------------------------- |
| 2026-05-25 | Document published | First exercise scheduled 2026-Q3 |

## 8. Compliance Mapping

| Framework       | Control                | Evidence                                |
| --------------- | ---------------------- | --------------------------------------- |
| POPIA S22       | Notification of breach | This document + breach register         |
| SOC 2 CC7.3     | Incident response      | Incident response plan + this procedure |
| GDPR Article 33 | Breach notification    | This document (parallel process)        |

---

_Last updated: 2026-05-25_
