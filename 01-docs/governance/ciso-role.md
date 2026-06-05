---
title: 'Chief Information Security Officer (CISO) Role Definition'
status: 'current'
date: '2026-05-27'
owner: 'ceo'
role: 'ciso'
tier: 'critical'
tags: ['governance', 'security', 'ciso', 'role-definition', 'compliance']
review_cycle: 'annual'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Chief Information Security Officer (CISO) Role Definition

**Document ID:** GTCX-CISO-001  
**Version:** 1.0  
**Effective Date:** 2026-05-25  
**Reports to:** CEO / Board Security Committee  
**Direct Reports:** Security Engineering Lead, Compliance Lead, SOC Lead (when established)

---

## 1. Purpose

Define the authority, responsibilities, and accountability of the Chief Information Security Officer (CISO) at GTCX. This role is a standing member of the Board Security Committee per the [`Board Security Committee Charter`](../compliance/board-security-committee-charter.md).

## 2. Authority

The CISO holds the following authorities:

| Authority                    | Scope                                                  | Limit                                                                   |
| ---------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------- |
| **Security policy approval** | All GTCX security policies                             | Board Security Committee ratification required for board-level policies |
| **Incident command**         | All security incidents                                 | CEO notification within 4 hours for Critical incidents                  |
| **Production block**         | Halt production deployments on security grounds        | Must provide written justification within 24 hours                      |
| **Vendor security veto**     | Block vendor onboarding that fails security assessment | Escalation to CEO if >$100K contract                                    |
| **Budget ownership**         | Security tooling, pen-test, audit, training budgets    | Board approval required for >$50K unplanned spend                       |

## 3. Responsibilities

### 3.1 Strategic

- Maintain the GTCX security strategy and 3-year roadmap.
- Present monthly security posture report to Board Security Committee.
- Define risk appetite and annual security OKRs.
- Own relationships with external auditors, pen-test vendors, and regulators (SARB, FSCA, Info Regulator).

### 3.2 Operational

- Oversee vulnerability management program (Trivy, CodeQL, DAST, dependency audit).
- Oversee incident response program (24 runbooks, quarterly drills).
- Oversee identity and access management (IRSA, MFA, quarterly access reviews).
- Oversee security monitoring (Prometheus/Grafana/Alertmanager, CloudTrail, GuardDuty).
- Approve all break-glass access requests.

### 3.3 Compliance

- Own SOC 2 Type I / Type II attestation program.
- Own POPIA, FICA, and PAIA compliance posture.
- Maintain controls matrix and evidence inventory.
- Coordinate external audit responses.

### 3.4 Engineering

- Review and approve all architecture decision records (ADRs) with security impact.
- Approve changes to cryptographic primitives, key ceremonies, and HSM operations.
- Sign off on security-critical Terraform modules ( Vault, KMS, NetworkPolicy, WAF ).

## 4. Accountability

The CISO is personally accountable for:

1. **No undetected critical breaches** > 30 days.
2. **100% remediation** of critical pen-test findings within 30 days of report.
3. **Zero overdue** SOC 2 / ISO 27001 / POPIA findings.
4. **Quarterly board reporting** delivered on schedule.

## 5. Delegation

In the CISO's absence, authority delegates in this order:

1. Security Engineering Lead (technical decisions)
2. Compliance Lead (regulatory / audit decisions)
3. CEO (business-critical decisions)

## 6. Current Appointment

| Field                  | Value                                                    |
| ---------------------- | -------------------------------------------------------- |
| **Name**               | [To be appointed]                                        |
| **Appointment Date**   | [Pending]                                                |
| **Employment Type**    | Full-time preferred; vCISO acceptable through S3 Revenue |
| **Clearance Required** | South African Confidential minimum (Secret preferred)    |
| **Start Target**       | 2026-06-30                                               |

## 7. Compliance Mapping

| Framework            | Control                       | Evidence                                         |
| -------------------- | ----------------------------- | ------------------------------------------------ |
| SOC 2 CC1.1          | Governance structure          | This document + Board Security Committee Charter |
| ISO 27001 A.5.1      | Information security policies | This document + security policy suite            |
| King IV Principle 12 | Governance of risk            | This document + risk register                    |

---

_Last updated: 2026-05-25_
