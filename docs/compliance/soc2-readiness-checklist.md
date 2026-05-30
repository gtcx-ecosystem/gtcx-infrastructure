---
title: 'SOC 2 Type 1 Readiness Checklist'
status: 'draft'
date: '2026-05-27'
owner: 'crypto-security-engineer'
role: 'crypto-security-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'architecture', 'infrastructure']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# SOC 2 Type 1 Readiness Checklist

**Prepared for:** GTCX Infrastructure  
**Date:** 2026-05-13  
**Target:** SOC 2 Type 1 attestation (report date: 2026-Q4)  
**Framework:** AICPA Trust Services Criteria (TSC)  
**Auditor:** TBD (selection in progress)

---

## Executive Summary

| Trust Service Criteria                 | Status      | Score | Evidence                                          |
| -------------------------------------- | ----------- | ----- | ------------------------------------------------- |
| **Security (CC6.1–CC6.8)**             | Ready       | 85%   | WAF, Flow Logs, IAM, encryption, secret scanning  |
| **Availability (A1.1–A1.3)**           | Ready       | 80%   | EKS HA, RDS Multi-AZ, monitoring, runbooks        |
| **Processing Integrity (PI1.1–PI1.5)** | Partial     | 60%   | Anomaly detection, replay protection, WORM        |
| **Confidentiality (C1.1–C1.3)**        | Ready       | 85%   | KMS, TLS, private endpoints, access controls      |
| **Privacy (P1.1–P8.1)**                | Not Started | 10%   | Privacy policy, data retention, consent framework |

**Overall Readiness:** ~70% — ready to engage auditor for gap analysis.

---

## Security (Common Criteria)

### CC6.1 — Logical Access Controls

- [x] IAM roles with least privilege (staging + production)
- [x] GitHub OIDC provider (no long-lived credentials)
- [x] MFA on root AWS account
- [ ] MFA on all IAM users with console access
- [x] Role separation: deploy role ≠ admin role
- [x] JIT access tool for emergency break-glass

**Evidence:**

- `module.ci.aws_iam_role.github_deploy` (Terraform)
- `docs/security/break-glass-procedure.md`

### CC6.2 — Access Removal

- [x] Automated offboarding via GitHub org removal
- [ ] Quarterly access review process
- [ ] AWS IAM Access Analyzer enabled

**Gap:** No formal quarterly access review calendar.

### CC6.3 — Authentication

- [x] GitHub Actions OIDC authentication to AWS
- [x] EKS private endpoint (no public API access)
- [x] RDS force_ssl parameter
- [ ] AWS SSO/Identity Center for console access

**Gap:** Console access still uses IAM user credentials instead of SSO.

### CC6.4 — Encryption

- [x] RDS encryption at rest (KMS)
- [x] S3 WORM encryption (KMS)
- [x] EKS secret encryption (KMS)
- [x] VPC Flow Logs encrypted (KMS)
- [x] TLS/SSL for all endpoints
- [ ] Certificate rotation automation

**Evidence:**

- `module.eks.aws_kms_key.eks_secrets`
- `module.worm_audit.aws_kms_key.worm_audit`
- `module.database.aws_db_instance.*` with `storage_encrypted = true`

### CC6.5 — Network Security

- [x] VPC with private subnets
- [x] NAT Gateway for outbound
- [x] Security groups with least privilege
- [x] VPC endpoints for AWS services (ECR, S3, STS, CloudWatch)
- [x] WAF with OWASP CRS + rate limiting
- [x] VPC Flow Logs (365d retention)
- [ ] Network segmentation between namespaces (in progress — Linkerd Q3)

### CC6.6 — Change Management

- [x] Terraform state locking (DynamoDB)
- [x] Terraform plan review required
- [x] CI/CD gates (test, lint, audit, security)
- [x] All changes via PR with review
- [ ] Formal change advisory board (CAB) for production

### CC6.7 — Threat Detection

- [x] Anomaly detector (5 rules, CronJob)
- [x] TruffleHog secret scanning
- [x] pnpm audit with CVE acceptance log
- [x] CloudWatch alarms
- [ ] SIEM integration (future)

### CC6.8 — Incident Response

- [x] Incident response playbook (P0–P3)
- [x] Evidence preservation to WORM storage
- [x] On-call rotation documented
- [ ] First incident drill completed

**Gap:** No completed incident drill evidence yet.

---

## Availability

### A1.1 — System Availability

- [x] EKS with 3-node minimum across 3 AZs
- [x] RDS Multi-AZ for audit DB
- [x] Auto-scaling (3–6 nodes)
- [x] Health checks (liveness + readiness probes)
- [x] SLO burn-rate alerts (14.4x/6x/2x)

**Evidence:**

- `module.eks.aws_eks_node_group.main`
- `module.database.aws_db_instance.audit` (Multi-AZ)
- Prometheus alert rules

### A1.2 — Recovery

- [x] Disaster recovery runbook
- [x] RDS automated backups (30d operational, 35d audit)
- [x] Terraform state versioning (S3)
- [ ] Cross-region RDS snapshot replication
- [ ] Quarterly DR drill

**Gaps:**

- Cross-region RDS snapshot replication not configured
- No completed DR drill evidence

### A1.3 — Monitoring

- [x] CloudWatch metrics
- [x] Prometheus + Grafana (staging)
- [x] VPC Flow Logs
- [x] Anomaly detection
- [ ] Centralized log aggregation (Loki deployed but not production-grade)

---

## Processing Integrity

### PI1.1 — Complete Processing

- [x] Replay protection (fail-closed)
- [x] Audit immutability (WORM storage)
- [x] Transaction logging

### PI1.2 — Valid Processing

- [x] Schema validation (`@gtcx/protocols-schemas`)
- [x] Input validation at API gateway
- [x] Anomaly detection for invalid patterns

### PI1.3 — Accurate Processing

- [x] Compliance gateway with access profiling
- [x] Consensus mechanism (documented)
- [ ] End-to-end reconciliation process

**Gap:** No automated reconciliation between operational and audit databases.

### PI1.4 — Timely Processing

- [x] Load testing (documented)
- [x] SLO definitions
- [ ] Quarterly load test execution

### PI1.5 — Authorized Processing

- [x] Mutating tool approval gating
- [x] Audit trail for every action
- [x] Anomaly detection for unauthorized patterns

---

## Confidentiality

### C1.1 — Identification of Confidential Information

- [x] Data classification: operational vs audit
- [x] WORM storage for sensitive audit data
- [x] KMS key separation (eks-secrets, worm-audit, rds)

### C1.2 — Protection of Confidential Information

- [x] Encryption at rest (all databases, S3, EKS secrets)
- [x] Encryption in transit (TLS, SSL)
- [x] Private endpoints (no public RDS/EKS access)
- [x] Security groups restricting access

### C1.3 — Disposal of Confidential Information

- [x] S3 lifecycle policies
- [ ] Formal data retention policy document
- [ ] Automated data purging for expired records

**Gap:** No formal data retention policy signed by leadership.

---

## Privacy (Not Started)

### P1.1–P8.1 — Privacy Framework

- [ ] Privacy notice / policy
- [ ] Consent management framework
- [ ] Data subject access request (DSAR) process
- [ ] Right to erasure procedure
- [ ] Cross-border data transfer assessment
- [ ] Privacy impact assessment (PIA)

**Status:** Privacy criteria are not applicable until GTCX handles PII at scale. Currently focused on institutional/transactional data. **Recommendation:** Begin privacy framework design in Q3 2026 before pilot expansion.

---

## Auditor Engagement Readiness

### Pre-Auditor Checklist

- [x] Security controls documented and operational
- [x] Availability controls documented and operational
- [x] Processing integrity controls documented
- [x] Confidentiality controls documented and operational
- [ ] Privacy framework (not applicable yet)
- [ ] Evidence collection process defined
- [ ] Control owner assignments documented
- [ ] Sample size determination for testing
- [ ] Auditor RFP sent and responses received

### Evidence Package

| Document                         | Location                                    | Status       |
| -------------------------------- | ------------------------------------------- | ------------ |
| Infrastructure architecture      | `docs/architecture/`                        | ✅           |
| Security policies                | `docs/security/`                            | ✅           |
| Incident response playbook       | `docs/devops/incident-response-playbook.md` | ✅           |
| Disaster recovery runbook        | `docs/devops/disaster-recovery-runbook.md`  | ✅           |
| Access control matrix            | `infra/terraform/modules/ci/`               | ✅           |
| Change management logs           | GitHub PR history                           | ✅           |
| Monitoring dashboards            | Prometheus + Grafana                        | ✅ (staging) |
| Audit logs                       | WORM S3 bucket                              | ✅           |
| Penetration test report          | Pending                                     | 🔴           |
| Vulnerability scan results       | Trivy + pnpm audit                          | ✅           |
| Employee background check policy | Pending                                     | 🔴           |
| Vendor risk assessments          | Pending                                     | 🔴           |

---

## Gap Summary

| Priority | Gap                                   | Effort    | Blocker                   |
| -------- | ------------------------------------- | --------- | ------------------------- |
| **P0**   | Penetration test report               | 3–4 weeks | Budget + vendor selection |
| **P0**   | Quarterly access review process       | 1 day     | None                      |
| **P1**   | AWS SSO for console access            | 2 days    | None                      |
| **P1**   | Cross-region RDS snapshot replication | 2 days    | None                      |
| **P1**   | Data retention policy (signed)        | 1 day     | Leadership sign-off       |
| **P1**   | Incident drill evidence               | 2 hours   | Schedule drill            |
| **P2**   | Certificate rotation automation       | 3 days    | None                      |
| **P2**   | Centralized SIEM                      | 2 weeks   | Budget                    |
| **P2**   | Employee background checks            | 1 week    | HR process                |
| **P2**   | Vendor risk assessments               | 1 week    | Vendor list               |
| **P3**   | Privacy framework                     | 4 weeks   | Legal review              |

---

## Recommended Auditor Engagement Timeline

| Phase                   | Activity                            | Timeline                 | Owner              |
| ----------------------- | ----------------------------------- | ------------------------ | ------------------ |
| **Gap Analysis**        | Auditor reviews readiness checklist | 2026-05-20 to 2026-06-10 | Auditor + Platform |
| **Remediation Sprint**  | Close P0/P1 gaps                    | 2026-06-10 to 2026-07-15 | Platform           |
| **Type 1 Audit Period** | 3-month observation window          | 2026-07-15 to 2026-10-15 | Auditor            |
| **Report Draft**        | Auditor prepares report             | 2026-10-15 to 2026-11-15 | Auditor            |
| **Management Response** | Respond to exceptions               | 2026-11-15 to 2026-11-30 | Leadership         |
| **Final Report**        | SOC 2 Type 1 issued                 | 2026-12-15               | Auditor            |

---

## Next Actions

1. **This week:** Send pen-test RFP to Orange Cyberdefense SensePost
2. **This week:** Schedule first incident drill (use anomaly detector false positive scenario)
3. **Next week:** Implement AWS SSO for console access
4. **Next week:** Set up cross-region RDS snapshot replication
5. **This month:** Obtain signed data retention policy from leadership
6. **This month:** Complete first quarterly access review

---

_Checklist version: 1.0_  
_Framework: AICPA TSP Section 100A (2017 Trust Services Criteria)_  
_Next review: Post-pen-test or 2026-06-13_
