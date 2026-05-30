---
title: 'SOC Requirements Specification'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'compliance', 'architecture', 'infrastructure', 'testing']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# SOC Requirements Specification

**Classification:** Internal
**Owner:** CISO
**Version:** 1.0
**Last Updated:** **\_\_\_\_**

---

## 1. Overview

This document specifies the requirements for 24/7 Security Operations Center (SOC) capability for the GTCX ecosystem. The SOC may be delivered as an internal team, a managed SOC provider, or a hybrid model. Regardless of delivery model, the requirements in this document are mandatory.

## 2. Monitoring Scope

### 2.1 Cloud Infrastructure

| Source                | Required Coverage                                         | Retention                                            |
| --------------------- | --------------------------------------------------------- | ---------------------------------------------------- |
| **AWS CloudTrail**    | All management events, all data events for S3 and Lambda  | 1 year (hot), 7 years (cold)                         |
| **AWS GuardDuty**     | All findings, severity Medium and above trigger SOC alert | Findings retained per AWS default + exported to SIEM |
| **VPC Flow Logs**     | All VPCs, all subnets, accept and reject                  | 90 days (hot), 1 year (cold)                         |
| **AWS Config**        | All resource types, compliance rules for CIS Benchmark    | Continuous                                           |
| **WAF Logs**          | All rules, blocked and counted requests                   | 90 days                                              |
| **Route 53 DNS Logs** | All query logs for GTCX domains                           | 90 days                                              |

### 2.2 Application Layer

| Source                     | Required Coverage                                                                                   | Retention                          |
| -------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **Application audit logs** | All `PersistentAuditLog` events, both operational and audit databases                               | 1 year (hot), 7 years (cold/audit) |
| **Prometheus metrics**     | All security-relevant counters and gauges (auth failures, replay rejections, rate limit exhaustion) | 90 days                            |
| **Grafana alerts**         | All alerting rules forwarded to SIEM                                                                | Per SIEM retention                 |
| **Container logs**         | All Kubernetes pod stdout/stderr via Fluent Bit or equivalent                                       | 90 days                            |
| **Kubernetes events**      | All cluster events, audit logs                                                                      | 90 days                            |
| **Kubernetes audit log**   | API server audit policy at RequestResponse level for sensitive resources                            | 1 year                             |

### 2.3 Identity and Access

| Source                     | Required Coverage                                                                              | Retention |
| -------------------------- | ---------------------------------------------------------------------------------------------- | --------- |
| **IAM activity**           | All IAM changes, console logins, API key usage                                                 | 1 year    |
| **SSO/IdP logs**           | All authentication events, MFA events, failures                                                | 1 year    |
| **Database access logs**   | All connections, privilege changes, DDL statements on both `gtcx_development` and `gtcx_audit` | 1 year    |
| **Secrets Manager access** | All read/write events                                                                          | 1 year    |
| **HSM audit logs**         | All key operations (create, sign, verify, revoke, rotate)                                      | 7 years   |

### 2.4 Network

| Source                        | Required Coverage                 | Retention       |
| ----------------------------- | --------------------------------- | --------------- |
| **VPC Flow Logs**             | See Section 2.1                   | See Section 2.1 |
| **Load balancer access logs** | All ALB/NLB access logs           | 90 days         |
| **CDN logs**                  | All CloudFront or equivalent logs | 90 days         |
| **VPN/Bastion logs**          | All access events                 | 1 year          |

## 3. MTTR Targets

Mean Time to Respond (MTTR) is measured from alert firing to first human acknowledgment and triage action.

| Severity           | MTTR Target  | Escalation if Exceeded            |
| ------------------ | ------------ | --------------------------------- |
| **P1 -- Critical** | < 15 minutes | Auto-page CISO + Engineering Lead |
| **P2 -- High**     | < 1 hour     | Auto-page Engineering Lead        |
| **P3 -- Medium**   | < 4 hours    | Auto-notify team lead             |
| **P4 -- Low**      | < 24 hours   | Queue for next business day       |

MTTR must be tracked as a monthly metric and reported to the CISO. Any month where P1 MTTR exceeds 15 minutes triggers a mandatory process review.

## 4. Detection Rules (Minimum Set)

The SOC must implement and maintain detection rules for at minimum:

### 4.1 Critical Detections (Alert within 1 minute)

- Unauthorized IAM role assumption or privilege escalation
- GuardDuty High/Critical findings
- HSM key operations outside authorized windows
- Audit log chain integrity failure (`PersistentAuditLog.verify()` failure)
- Database DDL on `gtcx_audit` (any modification attempt)
- Console login from new geography or IP
- Multiple failed authentication attempts exceeding threshold (brute force)
- Replay cache rejection spike (> 3x baseline in 5-minute window)

### 4.2 High Priority Detections (Alert within 5 minutes)

- S3 bucket policy changes or public access grants
- Security group modifications allowing inbound from 0.0.0.0/0
- Kubernetes RBAC changes
- Container running as root in production namespace
- Certificate expiry within 7 days
- Backup job failure
- Rate limiter exhaustion events

### 4.3 Medium Priority Detections (Alert within 15 minutes)

- Configuration drift from baseline (AWS Config non-compliant)
- New dependency vulnerability (CVSS >= 7.0)
- Unusual data transfer volume (> 2 standard deviations from baseline)
- Failed Terraform plan in production pipeline
- Pod restart loop (CrashLoopBackOff) in production

## 5. Threat Intelligence Requirements

### 5.1 Feeds

The SOC must consume and operationalize threat intelligence from:

- Commercial threat intelligence feed (at least one: Recorded Future, CrowdStrike, Mandiant)
- CISA/US-CERT advisories
- KE-CIRT/CC advisories (Kenya)
- AWS Security Bulletins
- CVE/NVD database (automated scanning)
- GTCX-specific IoC list (maintained internally)

### 5.2 Briefing Schedule

| Deliverable                           | Frequency                                       | Audience                               |
| ------------------------------------- | ----------------------------------------------- | -------------------------------------- |
| **Threat intelligence brief**         | Weekly                                          | CISO, Engineering Lead                 |
| **Emerging threat advisory**          | As needed (within 4 hours of critical advisory) | CISO, Engineering Lead, affected teams |
| **Quarterly threat landscape report** | Quarterly                                       | CISO, Board (summary)                  |
| **IoC update**                        | Daily (automated)                               | SIEM rule base                         |

## 6. SOC Tooling Requirements

### 6.1 SIEM (Security Information and Event Management)

| Requirement            | Specification                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Log ingestion**      | All sources in Section 2, minimum 500 GB/day capacity with headroom for 3x growth                                        |
| **Correlation engine** | Real-time correlation across all log sources, custom rule support                                                        |
| **Retention**          | Hot: 90 days searchable in < 30 seconds. Warm: 1 year searchable in < 5 minutes. Cold: 7 years retrievable in < 24 hours |
| **Query language**     | Support for complex queries across all log types                                                                         |
| **Dashboards**         | Customizable dashboards for SOC analysts, CISO, engineering                                                              |
| **API**                | REST API for automation and integration                                                                                  |
| **Compliance**         | SOC 2 Type II certified. Data residency options for African jurisdictions                                                |

Candidates: Splunk, Elastic SIEM, Microsoft Sentinel, Sumo Logic, Panther.

### 6.2 SOAR (Security Orchestration, Automation, and Response)

| Requirement               | Specification                                                                                      |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| **Playbook automation**   | Automated containment actions for high-confidence detections (e.g., auto-isolate compromised host) |
| **Ticketing integration** | Bi-directional sync with incident management (Jira, Linear, or equivalent)                         |
| **Evidence collection**   | Automated evidence gathering on incident creation (logs, snapshots, network captures)              |
| **Notification**          | Multi-channel alerting: PagerDuty/Opsgenie, Slack, email, SMS                                      |
| **Runbook execution**     | Ability to execute documented runbooks with approval gates for destructive actions                 |

Candidates: Palo Alto XSOAR, Splunk SOAR, Tines, Torq.

### 6.3 Ticketing and Incident Management

| Requirement                | Specification                                                                |
| -------------------------- | ---------------------------------------------------------------------------- |
| **Incident lifecycle**     | Create, assign, escalate, resolve, close with full audit trail               |
| **SLA tracking**           | Automatic SLA timers per severity with breach alerting                       |
| **Post-incident workflow** | Structured post-mortem template, action item tracking                        |
| **Reporting**              | Monthly SOC metrics report: incidents by severity, MTTR, false positive rate |

### 6.4 Endpoint Detection and Response (EDR)

| Requirement     | Specification                                                            |
| --------------- | ------------------------------------------------------------------------ |
| **Coverage**    | All bastion hosts, admin workstations, CI/CD runners                     |
| **Capability**  | Real-time process monitoring, file integrity monitoring, memory analysis |
| **Integration** | Feeds alerts to SIEM, supports remote isolation via SOAR                 |

## 7. SOC Operating Model

### 7.1 Staffing Model (Internal)

If operating an internal SOC:

| Shift                     | Coverage               | Minimum Staffing                                      |
| ------------------------- | ---------------------- | ----------------------------------------------------- |
| Day (08:00-16:00 EAT)     | Primary business hours | 2 analysts                                            |
| Evening (16:00-00:00 EAT) | Extended hours         | 1 analyst                                             |
| Night (00:00-08:00 EAT)   | Overnight              | 1 analyst (on-call acceptable with < 15 min response) |
| Weekend/Holiday           | Full coverage          | 1 analyst (on-call acceptable with < 15 min response) |

Minimum team: 1 SOC Manager, 4 SOC Analysts (Tier 1/2), 1 Senior Analyst (Tier 3).

### 7.2 Hybrid Model (Recommended for Current Scale)

- Managed SOC provider for 24/7 Tier 1/2 monitoring and alerting
- Internal security team for Tier 3 analysis, threat hunting, and incident command
- Clear runbook handoff procedures between managed SOC and internal team
- Monthly service review with managed SOC provider

## 8. Managed SOC Vendor Evaluation Criteria

If outsourcing SOC operations (fully or partially), evaluate vendors against:

| Criterion                     | Weight    | Requirements                                                                       |
| ----------------------------- | --------- | ---------------------------------------------------------------------------------- |
| **24/7 coverage**             | Must-have | True 24/7/365 with staffed analysts (not just on-call)                             |
| **MTTR SLAs**                 | Must-have | Contractual SLAs matching Section 3 targets with financial penalties               |
| **SIEM platform**             | Must-have | Modern SIEM with custom rule support (see Section 6.1)                             |
| **Africa presence**           | High      | Analysts with regional context; data residency compliance                          |
| **Certifications**            | Must-have | SOC 2 Type II, ISO 27001                                                           |
| **Threat intelligence**       | High      | Integrated threat intel with Africa/fintech focus                                  |
| **Integration capability**    | Must-have | API-based integration with GTCX monitoring stack (Prometheus, Grafana, CloudTrail) |
| **Incident response support** | High      | Ability to support containment actions per approved runbooks                       |
| **Reporting**                 | Must-have | Monthly metrics, quarterly business reviews                                        |
| **Regulatory familiarity**    | High      | Experience with GDPR, PCI-DSS, African data protection regulations                 |
| **Scalability**               | Medium    | Ability to scale log ingestion 3x within 30 days                                   |
| **Cost model**                | Medium    | Predictable pricing (per-endpoint or flat fee preferred over per-GB)               |
| **Contract terms**            | Medium    | 12-month initial term with 30-day termination for cause                            |

### 8.1 Evaluation Process

1. Issue RFP to minimum 3 vendors.
2. Score against criteria table above.
3. Conduct 2-week proof-of-concept with top 2 candidates.
4. Verify contractual SLAs and penalty clauses with legal.
5. Board approval for final vendor selection (annual spend > $50K).

## 9. Tabletop Exercises

The SOC (internal or managed) must participate in quarterly tabletop exercises per the Incident Response Plan (`docs/compliance/incident-response-plan-v1.md`, Section 12).

Requirements:

- SOC analysts must demonstrate familiarity with GTCX escalation procedures
- Managed SOC provider must designate a participant for each exercise
- A board observer must attend at least one exercise per year
- Exercise results must be documented and gaps addressed within 30 days

## 10. Metrics and Reporting

### 10.1 Monthly SOC Report

| Metric                            | Target                                     |
| --------------------------------- | ------------------------------------------ |
| P1 MTTR                           | < 15 minutes                               |
| P2 MTTR                           | < 1 hour                                   |
| P3 MTTR                           | < 4 hours                                  |
| Total incidents by severity       | Trend analysis                             |
| False positive rate               | < 10% of total alerts                      |
| Detection rule coverage           | 100% of Section 4 rules active             |
| Log ingestion health              | > 99.9% of expected log sources reporting  |
| Threat intel IoCs operationalized | 100% of critical advisories within 4 hours |

### 10.2 Quarterly Board Summary

- Incident count and severity distribution
- MTTR performance vs. targets
- Notable threats and mitigations
- Tabletop exercise results
- Recommendations for security investment

## Revision History

| Version | Date         | Author | Changes                                |
| ------- | ------------ | ------ | -------------------------------------- |
| 1.0     | **\_\_\_\_** | CISO   | Initial SOC requirements specification |
