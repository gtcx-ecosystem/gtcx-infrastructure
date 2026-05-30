---
title: 'Security Operations Center (SOC) Operations Plan'
status: 'current'
date: '2026-05-27'
owner: 'ciso'
role: 'ciso'
tier: 'critical'
tags: ['soc', 'security-operations', 'siem', 'monitoring', 'government-grade']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Security Operations Center (SOC) Operations Plan

**Document ID:** GTCX-SOC-001  
**Version:** 1.0  
**Effective Date:** 2026-05-25  
**Owner:** Chief Information Security Officer  
**Target Operational Date:** 2027-Q1

---

## 1. Purpose

Define the architecture, staffing, procedures, and metrics for a 24/7 Security Operations Center (SOC) capable of supporting Government-Grade certification and critical infrastructure contracts.

## 2. SOC Maturity Model

| Level                 | Description                           | GTCX Current Status                        | Target  |
| --------------------- | ------------------------------------- | ------------------------------------------ | ------- |
| **L1 — Reactive**     | Alert-driven, manual response         | Current (Prometheus/Grafana/Alertmanager)  | 2026-Q2 |
| **L2 — Managed**      | Playbooks, triage, business hours SOC | Partial (runbooks exist, no dedicated SOC) | 2026-Q4 |
| **L3 — Defined**      | 24/7 coverage, SIEM, threat intel     | Not yet operational                        | 2027-Q1 |
| **L4 — Quantitative** | Metrics-driven, MTTR < 1 hour         | Not yet operational                        | 2027-Q3 |
| **L5 — Optimized**    | AI-assisted, predictive, purple team  | Not yet operational                        | 2028    |

## 3. Architecture

### 3.1 Technology Stack

| Layer               | Tool                                       | Status             |
| ------------------- | ------------------------------------------ | ------------------ |
| **Data ingestion**  | Fluent Bit + Vector                        | Active             |
| **Log storage**     | Loki + MinIO (long-term)                   | Active             |
| **Metrics**         | Prometheus + Thanos                        | Active             |
| **Tracing**         | Jaeger + Tempo                             | Active             |
| **SIEM**            | Wazuh (open-source) or Splunk (enterprise) | Evaluation pending |
| **SOAR**            | Shuffle or Palo Alto XSOAR                 | Evaluation pending |
| **Threat intel**    | MISP + OSINT feeds                         | Evaluation pending |
| **Case management** | TheHive or ServiceNow SecOps               | Evaluation pending |

### 3.2 Detection Coverage

| Data Source      | Ingestion       | Detection Rules | Response Playbook |
| ---------------- | --------------- | --------------- | ----------------- |
| AWS CloudTrail   | ✅ Real-time    | 25+             | ✅                |
| EKS audit logs   | ✅ Real-time    | 15+             | ✅                |
| VPC Flow Logs    | ✅ Hourly batch | 10+             | ✅                |
| Application logs | ✅ Real-time    | 20+             | ✅                |
| Endpoint (EDR)   | 🟡 Planned      | —               | 🟡                |
| DNS logs         | 🟡 Planned      | —               | 🟡                |
| Email security   | 🟡 Planned      | —               | 🟡                |

## 4. Staffing Model

### 4.1 Roles

| Role                        | Count | Shift        | Responsibilities                                      |
| --------------------------- | ----- | ------------ | ----------------------------------------------------- |
| **SOC Manager**             | 1     | Day          | Strategy, metrics, escalations, stakeholder reporting |
| **SOC Analyst (L1)**        | 2     | Rotating 12h | Alert triage, initial containment, ticket creation    |
| **SOC Analyst (L2)**        | 2     | Rotating 12h | Investigation, threat hunting, malware analysis       |
| **Incident Responder (L3)** | 1     | On-call      | Critical incident command, forensics, legal liaison   |
| **Threat Intel Analyst**    | 1     | Day          | Intel curation, IOC management, adversary tracking    |

### 4.2 Coverage Model

| Time             | Coverage                        | Notes            |
| ---------------- | ------------------------------- | ---------------- |
| 06:00–18:00 SAST | 2 analysts + manager            | Business hours   |
| 18:00–06:00 SAST | 1 analyst (remote) + on-call L3 | Night shift      |
| Weekends         | 1 analyst (remote) + on-call L3 | Reduced coverage |
| Public holidays  | 1 analyst (remote) + on-call L3 | Reduced coverage |

**Target:** Full 24/7 coverage by 2027-Q1.

## 5. Metrics & SLAs

| Metric                                  | Current   | L3 Target | L5 Target    |
| --------------------------------------- | --------- | --------- | ------------ |
| **MTTD** (Mean Time To Detect)          | ~24 hours | < 4 hours | < 1 hour     |
| **MTTR** (Mean Time To Respond)         | ~8 hours  | < 1 hour  | < 15 minutes |
| **MTTC** (Mean Time To Contain)         | ~48 hours | < 4 hours | < 1 hour     |
| **Alert fidelity** (true positive rate) | ~30%      | > 70%     | > 90%        |
| **Escalation rate**                     | ~50%      | < 20%     | < 10%        |

## 6. Runbooks

| Scenario                | Runbook                                                  | Status    |
| ----------------------- | -------------------------------------------------------- | --------- |
| Unauthorized IAM access | `docs/operations/runbooks/iam-compromise-response.md`    | Published |
| Kubernetes pod escape   | `docs/operations/runbooks/k8s-incident-response.md`      | Published |
| Data exfiltration alert | `docs/operations/runbooks/data-exfiltration-response.md` | Draft     |
| Ransomware detection    | `docs/operations/runbooks/ransomware-response.md`        | Draft     |
| Insider threat          | `docs/operations/runbooks/insider-threat-response.md`    | Draft     |
| Nation-state APT        | `docs/operations/runbooks/apt-response.md`               | Draft     |

## 7. Threat Intelligence

| Feed                      | Source      | Integration | Status  |
| ------------------------- | ----------- | ----------- | ------- |
| AWS GuardDuty findings    | AWS         | Native      | Active  |
| MISP community            | CIRCL       | API         | Planned |
| AlienVault OTX            | AT&T        | API         | Planned |
| African cyber threat feed | AfriCERT    | Email/TAXII | Planned |
| Vendor threat briefings   | AWS, GitHub | Quarterly   | Active  |

## 8. Compliance Mapping

| Framework            | Control                                  | Evidence                        |
| -------------------- | ---------------------------------------- | ------------------------------- |
| Government-Grade G.9 | 24/7 SOC + SIEM                          | This document                   |
| SOC 2 CC7.1          | Detection                                | Alert configuration + telemetry |
| SOC 2 CC7.2          | Monitoring                               | Dashboards + metrics            |
| SOC 2 CC7.3          | Incident response                        | Runbooks + drill evidence       |
| ISO 27001 A.16.1     | Information security incident management | SOC procedures                  |

## 9. Implementation Roadmap

| Phase | Deliverable                  | Target Date | Budget           |
| ----- | ---------------------------- | ----------- | ---------------- |
| 1     | SIEM selection + procurement | 2026-Q3     | $30K–$80K/year   |
| 2     | SOC analyst hiring (L1 × 2)  | 2026-Q4     | $60K–$100K/year  |
| 3     | 24/7 coverage launch         | 2027-Q1     | $150K–$250K/year |
| 4     | Threat intel platform + SOAR | 2027-Q2     | $40K–$100K/year  |
| 5     | L4 maturity (MTTR < 1h)      | 2027-Q3     | Operational      |
| 6     | L5 maturity (AI-assisted)    | 2028        | TBD              |

---

_Last updated: 2026-05-25_
