---
title: 'Pilot Success Criteria — ZWCMP Zimbabwe'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'informational'
tags: ['crypto', 'compliance', 'architecture', 'infrastructure', 'api']
review_cycle: 'monthly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Pilot Success Criteria — ZWCMP Zimbabwe

## Overview

| Field            | Value                                                                                                                                                                                                                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Pilot name       | ZWCMP TradePass Pilot                                                                                                                                                                                                                                                                                                                      |
| Customer         | Zimbabwe Chamber of Mines / Women in Mining Cooperative                                                                                                                                                                                                                                                                                    |
| Duration         | 30 calendar days from first live verification                                                                                                                                                                                                                                                                                              |
| Operators        | ~200 licensed female mine operators                                                                                                                                                                                                                                                                                                        |
| Region           | Zimbabwe (infrastructure in af-south-1, Cape Town)                                                                                                                                                                                                                                                                                         |
| Primary protocol | TradePass (trade verification)                                                                                                                                                                                                                                                                                                             |
| GTCX owner       | **TBD — Q6 ANSWERED 2026-05-31 (sales-led). Profile: senior pilot-facing operator, regulator-comfort + Chamber-of-Mines political fluency, prior African-central-bank pilot experience. Owner name + first cadence call must be recorded in `external-dependencies-register-2026-05-31.md` (EXT-INF-013) by Sprint 1 close (2026-06-07).** |

---

## Success Criteria

The pilot is successful if ALL of the following are met at day 30:

### 1. Functional

| Criterion                         | Target                           | Measurement                      |
| --------------------------------- | -------------------------------- | -------------------------------- |
| TradePass verifications processed | >= 50 unique verifications       | Count from audit database        |
| Operators onboarded               | >= 20 operators with active DIDs | Count from AGX platform          |
| End-to-end verification time      | < 30 seconds (p95)               | Prometheus latency metric        |
| Verification accuracy             | 0 false positives reported       | Operator feedback + audit review |

### 2. Reliability

| Criterion                    | Target                    | Measurement                      |
| ---------------------------- | ------------------------- | -------------------------------- |
| Platform availability        | >= 95% (342 hours of 360) | Prometheus uptime recording rule |
| Unplanned downtime incidents | <= 3                      | Incident log count               |
| Data loss events             | 0                         | Audit database integrity check   |
| Mean time to recovery (MTTR) | < 2 hours                 | Incident log timestamps          |

### 3. Data Sovereignty

| Criterion                      | Target                       | Measurement                                         |
| ------------------------------ | ---------------------------- | --------------------------------------------------- |
| Operational data in af-south-1 | 100%                         | AWS resource audit (RDS, S3, EKS all in af-south-1) |
| Terraform state in af-south-1  | 100%                         | S3 bucket location verification                     |
| PII sent to external APIs      | Documented and DPA-covered   | Data flow diagram review                            |
| Audit records immutable        | 0 modifications or deletions | PostgreSQL audit role verification                  |

### 4. Operator Experience

| Criterion                    | Target                 | Measurement                          |
| ---------------------------- | ---------------------- | ------------------------------------ |
| Operator satisfaction        | >= 3.5/5 average       | Post-pilot survey                    |
| Support tickets resolved     | >= 80% within 24 hours | Support ticket log                   |
| Onboarding time per operator | < 30 minutes           | Observed during first 10 onboardings |

---

## Failure Criteria

The pilot is terminated early if ANY of the following occur:

- Data breach or unauthorized access to operator PII
- Operator data leaked between accounts (multi-tenancy failure)
- Platform unavailable for > 24 continuous hours
- Audit database records modified or deleted
- Data found outside af-south-1 without documented justification

---

## Pilot Timeline

| Week      | Milestone                                                                  |
| --------- | -------------------------------------------------------------------------- |
| Pre-pilot | Infrastructure deployed, DPAs executed, onboarding tested with 5 operators |
| Week 1    | 20 operators onboarded, first 10 verifications processed                   |
| Week 2    | Remaining operators onboarded, verification volume increasing              |
| Week 3    | Steady-state operations, SLO monitoring active                             |
| Week 4    | Final verification batch, data sovereignty audit, survey collection        |
| Day 31    | Pilot review meeting, success/failure determination                        |

---

## Data Handling at Pilot End

### If pilot succeeds (converts to production)

- All data retained under production data retention policies
- Operator DIDs and verifications become production records
- Audit trail preserved (7-year retention per FATF)

### If pilot terminates (no conversion)

- Operator PII deleted within 30 days of termination notice
- Audit records retained for compliance (anonymized if requested)
- Infrastructure decommissioned: `terraform destroy` for zimbabwe-pilot
- S3 buckets emptied and deleted
- ECR images deregistered
- Confirmation of deletion provided to ZWCMP in writing

---

## Support During Pilot

| Severity                  | Response Time | Channel                      |
| ------------------------- | ------------- | ---------------------------- |
| P0 — Platform down        | 1 hour        | PagerDuty → on-call engineer |
| P1 — Core flow degraded   | 4 hours       | Slack #gtcx-incidents        |
| P2 — Non-critical issue   | 24 hours      | Slack #gtcx-alerts           |
| P3 — Question/enhancement | 72 hours      | Email or scheduled call      |

On-call rotation: [Define before pilot start — minimum 2 engineers]

---

## Approval

| Role                  | Name | Date | Signature |
| --------------------- | ---- | ---- | --------- |
| GTCX Founder          |      |      |           |
| GTCX Engineering Lead |      |      |           |
| ZWCMP Representative  |      |      |           |
