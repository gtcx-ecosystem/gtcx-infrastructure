---
title: 'GTCX Vendor Risk Management Program'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'infrastructure', 'testing']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# GTCX Vendor Risk Management Program

**Owner:** CISO
**Effective Date:** 2026-05-08
**Review Cycle:** Annual
**Approved By:** Board Security Committee

## 1. Purpose

Establish a structured approach to assessing, managing, and monitoring security risks introduced by third-party vendors and service providers.

## 2. Scope

All third-party vendors, SaaS providers, cloud platforms, contractors, and service providers with access to GTCX systems, data, or infrastructure.

## 3. Vendor Classification

Vendors are classified based on data access, system criticality, and business impact:

| Tier         | Criteria                                                                                            | Examples                                                              | Assessment Depth                        | Review Frequency |
| ------------ | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------- | ---------------- |
| **Critical** | Hosts production infrastructure, processes Restricted/Confidential data, or single point of failure | AWS, GitHub                                                           | Full assessment + continuous monitoring | Quarterly        |
| **High**     | Accesses Internal data, supports key business processes, or has network access                      | Monitoring tools (Datadog, PagerDuty), CI/CD services, email provider | Full assessment                         | Semi-annually    |
| **Medium**   | Accesses limited Internal data, supports development workflows                                      | Dev tools (Figma, Notion), analytics, project management              | Standard questionnaire                  | Annually         |
| **Low**      | No data access, no system integration, commodity service                                            | Office software, general SaaS with no GTCX data                       | Self-attestation                        | Annually         |

## 4. Assessment Process

### 4.1 Pre-Onboarding Assessment

Before granting any vendor access to GTCX systems or data:

1. **Business justification.** Requesting team submits vendor request with: business need, data to be shared/accessed, systems involved, and proposed classification tier.
2. **Questionnaire.** Vendor completes the GTCX Vendor Security Questionnaire (based on SIG Lite, adapted for GTCX context). See Section 5.
3. **Evidence review.** CISO reviews: SOC 2 Type II report (or equivalent), ISO 27001 certificate, penetration test summary, incident history, and data processing practices.
4. **Risk scoring.** Vendor receives a risk score (see Section 6). Score determines approval path.
5. **Approval.** Critical/High vendors require CISO approval. Medium vendors require Security Engineer approval. Low vendors require team lead approval.

### 4.2 Ongoing Monitoring

| Activity                   | Critical      | High          | Medium        | Low           |
| -------------------------- | ------------- | ------------- | ------------- | ------------- |
| Certification status check | Quarterly     | Semi-annually | Annually      | Annually      |
| Security incident review   | Continuous    | Quarterly     | Semi-annually | Annually      |
| SLA performance review     | Monthly       | Quarterly     | Semi-annually | N/A           |
| Full reassessment          | Annually      | Annually      | Every 2 years | Every 2 years |
| Financial stability check  | Semi-annually | Annually      | N/A           | N/A           |

## 5. Vendor Security Questionnaire (SIG Lite Adapted)

### Section A: Governance

- A1. Do you maintain an information security policy reviewed at least annually?
- A2. Do you have a dedicated CISO or equivalent security leadership role?
- A3. Do you conduct security awareness training for all personnel?
- A4. Do you maintain a risk register?

### Section B: Access Control

- B1. Do you enforce multi-factor authentication for all users?
- B2. Do you implement role-based access control (RBAC)?
- B3. Do you conduct quarterly access reviews?
- B4. Do you have a formal user provisioning/deprovisioning process?

### Section C: Data Protection

- C1. Do you encrypt data at rest (AES-256 or equivalent)?
- C2. Do you encrypt data in transit (TLS 1.2+)?
- C3. Do you maintain a data classification scheme?
- C4. Where is GTCX data stored (regions/jurisdictions)?
- C5. Can you support data deletion upon contract termination?

### Section D: Incident Response

- D1. Do you have a documented incident response plan?
- D2. What is your breach notification SLA to customers?
- D3. Have you experienced a security breach in the past 24 months? If yes, describe.
- D4. Do you conduct incident response tabletop exercises?

### Section E: Operations

- E1. Do you maintain SOC 2 Type II certification? (Provide report date)
- E2. Do you maintain ISO 27001 certification? (Provide certificate)
- E3. Do you conduct annual penetration testing by an independent firm?
- E4. Do you have a vulnerability management program with defined SLAs?
- E5. Do you maintain a business continuity / disaster recovery plan?

### Section F: Subprocessors

- F1. Do you use subprocessors to handle GTCX data?
- F2. Do you assess subprocessor security?
- F3. Will you notify GTCX before adding new subprocessors handling our data?

## 6. Scoring Criteria

Each questionnaire section is scored 1-5:

| Score | Criteria                                                               |
| ----- | ---------------------------------------------------------------------- |
| 5     | Exceeds requirements: SOC 2 Type II + ISO 27001, comprehensive program |
| 4     | Meets requirements: SOC 2 Type II or ISO 27001, mature program         |
| 3     | Adequate: Documented policies, some certifications in progress         |
| 2     | Below expectations: Informal processes, no certifications              |
| 1     | Unacceptable: No documented security program                           |

**Overall score:** Average across all sections.

| Overall Score | Decision                                                                   |
| ------------- | -------------------------------------------------------------------------- |
| 4.0-5.0       | Approved                                                                   |
| 3.0-3.9       | Conditionally approved (remediation plan required within 90 days)          |
| 2.0-2.9       | Not approved for Critical/High tier; conditionally approved for Medium/Low |
| 1.0-1.9       | Not approved                                                               |

## 7. Contractual Requirements

All vendor contracts must include the following (scaled by tier):

| Requirement                            | Critical          | High              | Medium                  | Low      |
| -------------------------------------- | ----------------- | ----------------- | ----------------------- | -------- |
| Data Processing Agreement (DPA)        | Required          | Required          | Required if data access | N/A      |
| Confidentiality / NDA                  | Required          | Required          | Required                | Required |
| Right-to-audit clause                  | Required          | Required          | Best effort             | N/A      |
| Breach notification SLA                | 24 hours          | 48 hours          | 72 hours                | N/A      |
| Data return/destruction on termination | Required          | Required          | Required                | N/A      |
| Insurance (cyber liability)            | Required          | Required          | Recommended             | N/A      |
| Subprocessor notification              | Required          | Required          | N/A                     | N/A      |
| SLA with defined uptime                | Required (99.9%+) | Required (99.5%+) | Recommended             | N/A      |

## 8. Pre-Populated Vendor Assessments

### 8.1 Amazon Web Services (AWS)

| Field                     | Value                                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------------------- |
| **Classification**        | Critical                                                                                        |
| **Services used**         | EC2, RDS (PostgreSQL), S3, KMS, CloudFront, Route 53, EKS, IAM, CloudWatch, Shield              |
| **Data handled**          | All tiers (Public through Restricted)                                                           |
| **SOC 2 Type II**         | Current (reviewed annually; latest report requested Q1 each year)                               |
| **ISO 27001**             | Certified (AWS global infrastructure)                                                           |
| **Encryption at rest**    | AES-256 via KMS (customer-managed keys)                                                         |
| **Encryption in transit** | TLS 1.2+ enforced                                                                               |
| **Breach notification**   | Per AWS Customer Agreement; supplemented by GTCX DPA addendum requiring 24-hour notification    |
| **Data residency**        | Configured per GTCX requirements; primary region documented in Terraform                        |
| **Subprocessors**         | Published list; GTCX monitors for changes                                                       |
| **Penetration testing**   | Annual third-party assessment; AWS permits customer pen testing per policy                      |
| **Right-to-audit**        | Via SOC 2/ISO 27001 reports (direct audit not available; standard for hyperscale providers)     |
| **Risk score**            | 4.8 / 5.0                                                                                       |
| **Status**                | Approved                                                                                        |
| **Key risk**              | Regional outage (mitigated by multi-AZ, DR plan); vendor lock-in (mitigated by IaC abstraction) |
| **Next review**           | 2026-08-08                                                                                      |

### 8.2 GitHub (Microsoft)

| Field                     | Value                                                                                                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Classification**        | Critical                                                                                                                                                                     |
| **Services used**         | Repository hosting, GitHub Actions (CI/CD), GitHub Packages, Dependabot, code scanning                                                                                       |
| **Data handled**          | Source code (Confidential), CI/CD secrets (Restricted via GitHub Secrets), build artifacts                                                                                   |
| **SOC 2 Type II**         | Current (GitHub Enterprise; report available via Microsoft trust portal)                                                                                                     |
| **ISO 27001**             | Certified (via Microsoft)                                                                                                                                                    |
| **Encryption at rest**    | AES-256                                                                                                                                                                      |
| **Encryption in transit** | TLS 1.2+                                                                                                                                                                     |
| **Breach notification**   | Per GitHub Enterprise agreement; GTCX DPA requires 48-hour notification                                                                                                      |
| **Data residency**        | US-based; acceptable per GTCX data classification for source code                                                                                                            |
| **Subprocessors**         | Published list at github.com/subprocessors                                                                                                                                   |
| **Penetration testing**   | Microsoft conducts regular assessments; HackerOne bug bounty program active                                                                                                  |
| **Right-to-audit**        | Via SOC 2/ISO 27001 reports                                                                                                                                                  |
| **Risk score**            | 4.5 / 5.0                                                                                                                                                                    |
| **Status**                | Approved                                                                                                                                                                     |
| **Key risk**              | Platform outage affecting CI/CD (mitigated by local Git mirrors, pipeline caching); supply chain attack via GitHub Actions (mitigated by pinned action versions, CODEOWNERS) |
| **Next review**           | 2026-08-08                                                                                                                                                                   |

## 9. Annual Reassessment Schedule

| Quarter | Activity                                                                               |
| ------- | -------------------------------------------------------------------------------------- |
| Q1      | Critical vendor reassessments (AWS, GitHub); request updated SOC 2 reports             |
| Q2      | High-risk vendor reassessments; review all vendor contracts approaching renewal        |
| Q3      | Medium/Low vendor reassessments; update vendor inventory                               |
| Q4      | Program effectiveness review; update questionnaire; report to Board Security Committee |

## 10. Vendor Inventory

A centralized vendor inventory is maintained with: vendor name, classification tier, primary contact, contract expiry date, last assessment date, risk score, and status (approved / conditionally approved / under review / offboarded). The inventory is updated within 5 business days of any vendor change.

## 11. Offboarding

When a vendor relationship ends:

1. Access revoked within 24 hours.
2. Written confirmation of data return or destruction obtained within 30 days.
3. Vendor moved to "offboarded" status in inventory (not deleted).
4. Post-relationship review documented if any security concerns existed during the engagement.
