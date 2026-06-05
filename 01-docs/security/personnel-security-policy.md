---
title: 'Personnel Security Policy'
status: 'current'
date: '2026-05-27'
owner: 'ciso'
role: 'ciso'
tier: 'critical'
tags: ['security', 'personnel', 'clearance', 'background-check', 'government-grade']
review_cycle: 'annual'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Personnel Security Policy

**Document ID:** GTCX-PERS-001  
**Version:** 1.0  
**Effective Date:** 2026-05-25  
**Owner:** Chief Information Security Officer

---

## 1. Purpose

Establish security vetting, clearance, and ongoing personnel security requirements for all GTCX employees, contractors, and third-party personnel with access to GTCX systems, data, or facilities.

## 2. Scope

This policy applies to:

- All full-time and part-time employees.
- All contractors and consultants.
- All third-party personnel with privileged access (vendors, auditors, pen-testers).

## 3. Security Clearance Levels

Aligned with South African government clearance framework:

| Level            | Roles                                                   | Vetting Required                                              | Renewal   |
| ---------------- | ------------------------------------------------------- | ------------------------------------------------------------- | --------- |
| **Baseline**     | All staff                                               | Criminal record check, reference check                        | Annual    |
| **Confidential** | Engineering, DevOps, Security, Compliance               | Baseline + credit check + SA citizenship verification         | Biennial  |
| **Secret**       | Senior engineers, architects, Security Engineering Lead | Confidential + SSIA background investigation                  | Triennial |
| **Top Secret**   | CISO, CTO, select principals                            | Secret + polygraph (where legally permitted) + full lifestyle | Triennial |

## 4. Pre-Employment Vetting

### 4.1 All Roles

| Check                 | Provider                | Timeline | Pass Criteria                                        |
| --------------------- | ----------------------- | -------- | ---------------------------------------------------- |
| Identity verification | Home Affairs DHA        | 2 days   | Valid SA ID or passport                              |
| Criminal record check | SAPS / private provider | 5 days   | No disqualifying offenses (fraud, theft, cybercrime) |
| Reference checks      | Direct contact          | 3 days   | 2 positive professional references                   |
| Right to work         | Home Affairs / DHA      | 1 day    | Valid work permit if non-citizen                     |

### 4.2 Confidential+ Roles

| Check                       | Provider              | Timeline | Pass Criteria                                         |
| --------------------------- | --------------------- | -------- | ----------------------------------------------------- |
| Credit check                | Experian / TransUnion | 2 days   | No undisclosed judgments or bankruptcies              |
| SA citizenship verification | DHA                   | 3 days   | Confirmed citizenship or permanent residency          |
| Social media screening      | Internal              | 1 day    | No public affiliation with criminal or hostile groups |

### 4.3 Secret+ Roles

| Check                         | Provider                        | Timeline  | Pass Criteria                                                      |
| ----------------------------- | ------------------------------- | --------- | ------------------------------------------------------------------ |
| SSIA background investigation | Approved investigator           | 4–6 weeks | No foreign influence, financial vulnerability, or criminal history |
| Drug screening                | Approved clinic                 | 2 days    | Negative                                                           |
| Financial disclosure          | Self-declaration + verification | 1 week    | No undeclared foreign assets or significant debt                   |

## 5. Foreign National Policy

Foreign nationals may be employed in non-critical roles with:

- Valid work permit.
- Criminal record check from country of origin (apostilled).
- No access to classified or TOP SECRET systems.
- Quarterly access review.

Foreign nationals **may not** hold:

- CISO or CTO roles.
- Cryptographic key custody roles.
- Security Engineering Lead roles.
- Roles with unescorted data center access.

## 6. Ongoing Personnel Security

| Activity                         | Frequency | Owner                |
| -------------------------------- | --------- | -------------------- |
| Criminal record recheck          | Annual    | HR + Security        |
| Access review                    | Quarterly | Security             |
| Security awareness training      | Annual    | Security             |
| Foreign travel declaration       | Per trip  | Employee             |
| Secondary employment declaration | Annual    | Employee             |
| Financial distress reporting     | Ad-hoc    | Employee (mandatory) |

## 7. Termination Procedures

| Step | Action                                               | Owner      | Timeline        |
| ---- | ---------------------------------------------------- | ---------- | --------------- |
| 1    | Revoke all system access (IAM, VPN, MFA, physical)   | Security   | Immediate       |
| 2    | Collect company assets (laptop, phone, tokens, keys) | HR         | Same day        |
| 3    | Exit interview (security briefing)                   | Security   | Within 48 hours |
| 4    | Final access audit                                   | Security   | Within 7 days   |
| 5    | Notification to partners (if partner-facing role)    | Compliance | Within 24 hours |
| 6    | Post-termination monitoring ( Secret+ roles)         | Security   | 90 days         |

## 8. Third-Party Personnel

Pen-testers, auditors, and consultants must:

- Sign NDA + code of conduct.
- Provide criminal record check (if Confidential+ access).
- Be escorted at all times in production environments.
- Use GTCX-provided hardware only (no personal devices).
- Access revoked immediately upon engagement completion.

## 9. Compliance Mapping

| Framework            | Control                          | Evidence                               |
| -------------------- | -------------------------------- | -------------------------------------- |
| Government-Grade G.5 | Citizenship / security clearance | This document + clearance register     |
| SOC 2 CC6.1          | Logical access                   | Pre-employment checks + access reviews |
| ISO 27001 A.6.1      | Screening                        | Background check records               |
| POPIA S14            | Security safeguards              | Personnel vetting + access control     |

---

_Last updated: 2026-05-25_
