---
title: 'Partner Security Incident Notification SLA'
status: 'current'
date: '2026-05-27'
owner: 'security-lead'
role: 'security-lead'
tier: 'critical'
tags: ['security', 'incident-response', 'partners', 'sla', 'compliance']
review_cycle: 'annual'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Partner Security Incident Notification SLA

**Document ID:** GTCX-PSI-001  
**Version:** 1.0  
**Effective Date:** 2026-05-25  
**Review Cycle:** Annual  
**Owner:** Head of Security

---

## 1. Purpose

Define the Service Level Agreement (SLA) for notifying GTCX integration partners and SaaS customers of security incidents that may affect their data, systems, or operations.

## 2. Scope

This SLA applies to all partners with active integration agreements, data-sharing agreements, or API access to GTCX production systems.

## 3. Notification Triggers

| Severity     | Definition                                      | Examples                                                                   | Notification Required?    |
| ------------ | ----------------------------------------------- | -------------------------------------------------------------------------- | ------------------------- |
| **Critical** | Confirmed breach of partner data or API keys    | Unauthorized access to partner tenant data, API key compromise, ransomware | **Yes — within 24 hours** |
| **High**     | Potential breach or significant control failure | Misconfigured S3 bucket with partner data, IAM policy over-permission      | **Yes — within 48 hours** |
| **Medium**   | Vulnerability affecting partner-facing systems  | CVE in compliance-gateway with exploit path, TLS downgrade                 | **Yes — within 72 hours** |
| **Low**      | Minor policy deviation with no partner impact   | Internal phishing simulation failure, non-prod secret rotation delay       | No (quarterly summary)    |

## 4. Notification Channels

| Priority | Primary Channel                                | Backup Channel                       | Escalation                            |
| -------- | ---------------------------------------------- | ------------------------------------ | ------------------------------------- |
| Critical | Email + phone call to partner security contact | PagerDuty to partner on-call         | Board notification within 4 hours     |
| High     | Email to partner security contact              | Slack shared channel (if configured) | CISO notification within 8 hours      |
| Medium   | Email to partner security contact              | —                                    | Security team standup within 24 hours |

## 5. Notification Content

Every partner notification must include:

1. **Incident ID** (from incident tracker)
2. **Detection timestamp** (UTC)
3. **Affected systems / data classes**
4. **Partner impact assessment** (confidentiality, integrity, availability)
5. **Containment status**
6. **Remediation timeline**
7. **Point of contact** (name + email + phone)
8. **Next update timestamp**

## 6. Exceptions

- **Law enforcement hold:** If law enforcement requests a notification delay, the Head of Security may defer notification up to 72 hours with written justification.
- **National security:** If SARB or FIC directs non-disclosure, partner notification may be deferred per regulatory instruction.

## 7. Compliance Mapping

| Framework        | Control                                  | Evidence                                     |
| ---------------- | ---------------------------------------- | -------------------------------------------- |
| SOC 2 CC7.3      | Incident detection and response          | This document + incident tracker exports     |
| ISO 27001 A.16.1 | Information security incident management | This document + post-incident reviews        |
| POPIA S22        | Security compromises notification        | This document + breach notification register |

## 8. Acceptance

By executing a Partnership Agreement or Data Processing Addendum with GTCX, partners acknowledge this notification SLA.

---

_Last updated: 2026-05-25_
