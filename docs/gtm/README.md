---
title: 'GTM — Go-to-Market Regulatory Readiness'
status: 'current'
date: '2026-05-27'
owner: 'crypto-security-engineer'
role: 'crypto-security-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'architecture', 'infrastructure']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 95
autonomy_level: 'sovereign'
---

# GTM — Go-to-Market Regulatory Readiness

Everything needed to enter African central bank sandboxes and scale to full licensing.

See [GTM Documentation Overview](overview.md) for scope boundaries and ownership.

## Inbound tickets (cross-repo)

| Document                                                                                                 | From                                            |
| -------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| [`inbound-tickets/from-gtcx-protocols-2026-06-01.md`](inbound-tickets/from-gtcx-protocols-2026-06-01.md) | gtcx-protocols P0 (#60 / #61) — INF-49, #86 HSM |
| [`inbound-tickets/to-gtcx-protocols-2026-06-01.md`](inbound-tickets/to-gtcx-protocols-2026-06-01.md)     | Outbound ack + next steps to protocols          |

---

## Sandbox Application (`sandbox-application/`)

The 10-document evidence package submitted to regulators. One `workflow_dispatch` on `security-evidence.yml` generates the automated scan appendices.

| Document                                                                            | Purpose                                               | Fill-in required                    |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------- |
| [Architecture Overview](sandbox-application/architecture-overview.md)               | 2-page system overview for non-technical examiners    | Company name, contact info          |
| [Data Residency Proof](sandbox-application/data-residency-proof.md)                 | Proof all data stays in af-south-1                    | Date, preparer name                 |
| [Encryption Statement](sandbox-application/encryption-statement.md)                 | Encryption at rest, in transit, and crypto operations | Date, preparer name                 |
| [KYC Retention Schedule](sandbox-application/kyc-retention-schedule.md)             | Per-jurisdiction retention with legal basis           | Date, preparer name                 |
| [Internal Security Assessment](sandbox-application/internal-security-assessment.md) | OWASP TG v4.2 assessment (2 engineers, 2 days)        | Findings, OWASP checklist, sign-off |
| [Pre-Submission Agenda](sandbox-application/pre-submission-agenda.md)               | Meeting agenda for regulator sandbox team             | Meeting date, attendees             |

## Plans (`plans/`)

| Document                                                          | Context                                       | Cost                   |
| ----------------------------------------------------------------- | --------------------------------------------- | ---------------------- |
| [Global South 10/10 Plan](plans/global-south-10x-plan.md)         | African sandbox markets — **use this one**    | $0-$20K, 8-12 weeks    |
| [Bank-Grade 10/10 Plan](plans/bank-grade-10x-remediation-plan.md) | FFIEC/SOC 2/ISO 27001 — US/EU bank subsidiary | $750K-$1.3M, 12 months |

## Regulatory (`regulatory/`)

Board-ready documents and certification readiness. Used for full licensing (post-sandbox) or Tier 1 bank partnerships.

| Document                                                                             | When needed                                   |
| ------------------------------------------------------------------------------------ | --------------------------------------------- |
| [Incident Response Plan v1.0](regulatory/incident-response-plan-v1.md)               | Sandbox application (board-signed)            |
| [RTO/RPO Board Resolution](regulatory/rto-rpo-resolution.md)                         | Sandbox application (board-signed)            |
| [Regulatory Notification Templates](regulatory/regulatory-notification-templates.md) | Sandbox application (GDPR, central bank, PCI) |
| [Pen-Test Scope + RFP](regulatory/pentest-scope-rfp.md)                              | When engaging external pen-test firm          |
| [SOC 2 Type II Readiness](regulatory/soc2-readiness-checklist.md)                    | Post-revenue, bank partnership                |
| [ISO 27001 ISMS Scope](regulatory/iso27001-isms-scope.md)                            | Government procurement, AU contracts          |
| [PCI-DSS Scoping](regulatory/pci-dss-scoping.md)                                     | If/when processing card payments              |

## Quick Start

```bash
# 1. Generate security evidence (runs ZAP, Trivy, CodeQL, npm audit)
gh workflow run security-evidence.yml -f environment=testnet

# 2. Assemble the evidence package locally
bash infra/scripts/assemble-sandbox-evidence.sh

# 3. Fill in the security assessment template (2 engineers, 2 days)
# 4. Get board signatures on IRP + RTO/RPO
# 5. Submit to regulator
```
