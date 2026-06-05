---
title: 'Record of Processing Activities (ROPA)'
status: 'current'
date: '2026-05-27'
owner: 'compliance-lead'
role: 'compliance-lead'
tier: 'critical'
tags: ['compliance', 'popia', 'ropa', 'gdpr', 'data-protection']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Record of Processing Activities (ROPA)

**Document ID:** GTCX-ROPA-001  
**Version:** 1.0  
**Effective Date:** 2026-05-25  
**Legal Basis:** POPIA Section 17 + GDPR Article 30  
**Owner:** Deputy Information Officer (Compliance Lead)

---

## Activity 1: Customer Onboarding (KYC)

| Field                 | Detail                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------- |
| **Activity ID**       | ROPA-001                                                                                |
| **Purpose**           | Verify customer identity for FICA compliance and fraud prevention                       |
| **Lawful basis**      | Compliance with legal obligation (FICA)                                                 |
| **Data subjects**     | Natural persons, legal entity representatives                                           |
| **Data categories**   | Full name, ID number, passport, proof of address, photograph, biometric data (liveness) |
| **Recipients**        | FIC (SA), RBZ (Zim), internal compliance team                                           |
| **Retention**         | 5 years after relationship ends (7 years for Zimbabwe)                                  |
| **Security measures** | AES-256 at rest, TLS 1.3 in transit, WORM S3, access logging                            |
| **Cross-border**      | No (af-south-1 only)                                                                    |
| **DPIA required?**    | Yes — completed                                                                         |

## Activity 2: Transaction Processing

| Field                 | Detail                                                                       |
| --------------------- | ---------------------------------------------------------------------------- |
| **Activity ID**       | ROPA-002                                                                     |
| **Purpose**           | Execute and record commodity trade transactions                              |
| **Lawful basis**      | Performance of contract                                                      |
| **Data subjects**     | Customers (buyers, sellers, agents)                                          |
| **Data categories**   | Transaction amount, counterparties, geolocation (GeoTag), device fingerprint |
| **Recipients**        | Partner banks, settlement providers, regulators (on request)                 |
| **Retention**         | 7 years                                                                      |
| **Security measures** | Ed25519 signed audit chain, NATS JetStream, WORM S3                          |
| **Cross-border**      | Counterparty data may transit to partner jurisdictions                       |
| **DPIA required?**    | No (standard financial processing)                                           |

## Activity 3: AI-Mediated Compliance Queries

| Field                 | Detail                                                                              |
| --------------------- | ----------------------------------------------------------------------------------- |
| **Activity ID**       | ROPA-003                                                                            |
| **Purpose**           | Generate compliance scores and attestation via AI models                            |
| **Lawful basis**      | Legitimate interest (fraud prevention) + consent (where required)                   |
| **Data subjects**     | Customers whose data is queried                                                     |
| **Data categories**   | Query context, KYC summary, risk indicators, AI output                              |
| **Recipients**        | Anthropic (LLM inference), internal compliance team                                 |
| **Retention**         | 7 years (audit trail)                                                               |
| **Security measures** | Anonymization where possible, delimited untrusted-context blocks, output validation |
| **Cross-border**      | LLM inference may transit to US (Anthropic)                                         |
| **DPIA required?**    | Yes — completed                                                                     |

## Activity 4: Marketing & Communications

| Field                 | Detail                                                      |
| --------------------- | ----------------------------------------------------------- |
| **Activity ID**       | ROPA-004                                                    |
| **Purpose**           | Product updates, newsletters, event invitations             |
| **Lawful basis**      | Consent (opt-in)                                            |
| **Data subjects**     | Prospects, customers, partners                              |
| **Data categories**   | Name, email, company, marketing preferences                 |
| **Recipients**        | SendGrid (email delivery), CRM system                       |
| **Retention**         | Duration of consent + 3 years                               |
| **Security measures** | Encrypted storage, preference center, unsubscribe mechanism |
| **Cross-border**      | SendGrid US data center (DPA in place)                      |
| **DPIA required?**    | No                                                          |

## Activity 5: Employee HR & Payroll

| Field                 | Detail                                                                             |
| --------------------- | ---------------------------------------------------------------------------------- |
| **Activity ID**       | ROPA-005                                                                           |
| **Purpose**           | Employment administration, payroll, performance management                         |
| **Lawful basis**      | Performance of contract + legal obligation (tax, labor law)                        |
| **Data subjects**     | Employees, contractors                                                             |
| **Data categories**   | Name, ID, contact, bank details, salary, performance reviews, disciplinary records |
| **Recipients**        | SARS (tax), UIF, internal HR                                                       |
| **Retention**         | 5 years after employment ends                                                      |
| **Security measures** | Role-based access, encrypted storage, quarterly access reviews                     |
| **Cross-border**      | No                                                                                 |
| **DPIA required?**    | No                                                                                 |

## Activity 6: Website Analytics

| Field                 | Detail                                                                    |
| --------------------- | ------------------------------------------------------------------------- |
| **Activity ID**       | ROPA-006                                                                  |
| **Purpose**           | Website performance, user experience improvement                          |
| **Lawful basis**      | Consent (cookies) + legitimate interest (server logs)                     |
| **Data subjects**     | Website visitors                                                          |
| **Data categories**   | IP address (anonymized), browser, device, pages visited, session duration |
| **Recipients**        | Internal analytics team                                                   |
| **Retention**         | 90 days (server logs), 26 months (aggregated analytics)                   |
| **Security measures** | IP anonymization, no third-party trackers without consent                 |
| **Cross-border**      | No                                                                        |
| **DPIA required?**    | No                                                                        |

---

_Last updated: 2026-05-25_
