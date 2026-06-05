---
title: 'Partner Security Self-Assessment Questionnaire'
status: 'current'
date: '2026-05-27'
owner: 'security-lead'
role: 'security-lead'
tier: 'critical'
tags: ['security', 'partners', 'assessment', 'questionnaire', 'compliance']
review_cycle: 'annual'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Partner Security Self-Assessment Questionnaire

**Document ID:** GTCX-PSQ-001  
**Version:** 1.0  
**Effective Date:** 2026-05-25  
**Review Cycle:** Annual (or on-boarding)  
**Owner:** Head of Security

---

## Instructions

Partners integrating with GTCX APIs or handling GTCX customer data must complete this questionnaire annually and within 30 days of any material security event.

Return completed questionnaires to: **security@gtcx.trade**

---

## Section A — Organization & Governance

| #   | Question                                                      | Response | Evidence                   |
| --- | ------------------------------------------------------------- | -------- | -------------------------- |
| A.1 | Company name and primary contact for security matters         |          |                            |
| A.2 | Do you have a designated security officer (CISO/CSO/DPO)?     | Yes / No | Name + title               |
| A.3 | Is your security program governed by a board-level committee? | Yes / No | Charter or meeting minutes |
| A.4 | Date of last independent security audit or penetration test   |          | Report reference           |
| A.5 | Do you maintain cyber insurance with minimum $5M coverage?    | Yes / No | Certificate                |

## Section B — Access Control

| #   | Question                                                               | Response | Evidence            |
| --- | ---------------------------------------------------------------------- | -------- | ------------------- |
| B.1 | Do you enforce MFA on all administrative and production access?        | Yes / No | Policy doc          |
| B.2 | Are access reviews performed at least quarterly?                       | Yes / No | Last review date    |
| B.3 | Do you use least-privilege IAM / RBAC for all GTCX-integrated systems? | Yes / No | Sample IAM policy   |
| B.4 | Are API keys / service accounts rotated at least every 90 days?        | Yes / No | Rotation log sample |
| B.5 | Do you maintain an inventory of all accounts with access to GTCX data? | Yes / No | Inventory export    |

## Section C — Data Protection

| #   | Question                                                                      | Response | Evidence                  |
| --- | ----------------------------------------------------------------------------- | -------- | ------------------------- |
| C.1 | Is GTCX partner data encrypted at rest (AES-256 or equivalent)?               | Yes / No | Configuration screenshot  |
| C.2 | Is GTCX partner data encrypted in transit (TLS 1.2+)?                         | Yes / No | SSL Labs report or config |
| C.3 | Do you have a data classification policy?                                     | Yes / No | Policy doc                |
| C.4 | Is data retention aligned with GTCX DPA (max 7 years audit, 30 days PII)?     | Yes / No | Retention schedule        |
| C.5 | Do you have secure deletion procedures for GTCX data on contract termination? | Yes / No | Procedure doc             |

## Section D — Incident Response

| #   | Question                                                                        | Response | Evidence               |
| --- | ------------------------------------------------------------------------------- | -------- | ---------------------- |
| D.1 | Do you have a documented incident response plan?                                | Yes / No | Plan doc               |
| D.2 | Can you notify GTCX within 72 hours of a security incident affecting GTCX data? | Yes / No | Notification procedure |
| D.3 | Have you exercised your incident response plan in the last 12 months?           | Yes / No | Exercise report        |
| D.4 | Do you maintain forensic capability (logs, chain of custody)?                   | Yes / No | Log retention policy   |

## Section E — Subprocessors & Supply Chain

| #   | Question                                                                   | Response | Evidence            |
| --- | -------------------------------------------------------------------------- | -------- | ------------------- |
| E.1 | Do you use subprocessors to process GTCX data?                             | Yes / No | Subprocessor list   |
| E.2 | Are all subprocessors contractually bound to equivalent security controls? | Yes / No | Contract clauses    |
| E.3 | Do you perform annual security assessments on critical subprocessors?      | Yes / No | Assessment schedule |

## Section F — AI / LLM Specific (if applicable)

| #   | Question                                                           | Response | Evidence        |
| --- | ------------------------------------------------------------------ | -------- | --------------- |
| F.1 | Do you send GTCX data to third-party LLM providers?                | Yes / No | Provider list   |
| F.2 | If yes, do you have a Data Processing Addendum with each provider? | Yes / No | DPA references  |
| F.3 | Do you prohibit training-data retention clauses in LLM contracts?  | Yes / No | Contract review |

---

## Scoring

| Score   | Interpretation | Action                              |
| ------- | -------------- | ----------------------------------- |
| 90–100% | Low risk       | Annual re-assessment                |
| 70–89%  | Medium risk    | 90-day remediation plan required    |
| < 70%   | High risk      | Engagement paused until remediation |

---

## Acceptance

By submitting this questionnaire, the partner certifies that all responses are accurate to the best of their knowledge and agrees to notify GTCX within 10 business days of any material change.

**Signature:** **\*\*\*\***\_\_\_**\*\*\*\***  
**Date:** **\*\*\*\***\_\_\_**\*\*\*\***  
**Name:** **\*\*\*\***\_\_\_**\*\*\*\***  
**Title:** **\*\*\*\***\_\_\_**\*\*\*\***

---

_Last updated: 2026-05-25_
