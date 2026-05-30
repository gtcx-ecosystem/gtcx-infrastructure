---
title: 'POL-12: Operations Security'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'compliance', 'infrastructure', 'api', 'frontend']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# POL-12: Operations Security

**Annex A Reference:** A.12 — Operational Controls
**Effective Date:** 2026-05-08
**Review Cycle:** Annual
**Owner:** CISO
**Approved By:** Board Security Committee

## 1. Purpose

Ensure correct and secure operations of information processing facilities.

## 2. Scope

All GTCX production, staging, and development environments, CI/CD pipelines, and operational tooling.

## 3. Policy Statement

1. **Change management.** All changes to production systems follow a documented change management process: request, review, approve, test, deploy, verify. Infrastructure changes require IaC validation (Terraform validate, Kustomize build) in CI before apply. Emergency changes are permitted with post-hoc review within 48 hours.

2. **Capacity management.** Resource utilization (CPU, memory, storage, network) is monitored with alerts at 70% (warning) and 85% (critical) thresholds. Capacity planning is reviewed quarterly. Auto-scaling is configured for production workloads where applicable.

3. **Malware protection.** Endpoint protection is deployed on all GTCX-managed devices. Container images are scanned for vulnerabilities before deployment. Dependencies are audited for known CVEs in CI. No unsigned or unverified software is installed on production systems.

4. **Logging and monitoring.** All production systems generate audit logs covering: authentication events, authorization decisions, data access, configuration changes, and errors. Logs are shipped to a centralized, tamper-resistant log store (append-only audit database on port 5433). Logs are retained for 12 months minimum. Log access is restricted to security and operations personnel.

5. **Environment separation.** Production, staging, and development environments are isolated at the network and access control level. Production data is never copied to lower environments without anonymization. Each environment has its own credentials and secrets.

## 4. Responsibilities

| Role              | Responsibility                                                     |
| ----------------- | ------------------------------------------------------------------ |
| CISO              | Define logging standards, review security events                   |
| DevOps            | Implement monitoring, manage CI/CD, enforce environment separation |
| Engineering Leads | Follow change management, review capacity needs                    |
| All Personnel     | Report anomalies, do not bypass change management                  |

## 5. Exceptions

Emergency changes bypass the standard approval workflow but must be documented with justification and reviewed by the CISO within 48 hours.

## 6. Review

Reviewed annually. Monitoring thresholds and alerting rules reviewed quarterly.
