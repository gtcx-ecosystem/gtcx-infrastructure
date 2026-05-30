---
title: 'GTCX Infrastructure — Agile Team'
status: 'current'
date: '2026-05-27'
id: TEAM-INFRA
version: '1.0'
effective_date: '2026-05-27'
owner: 'infrastructure@gtcx.io'
role: 'protocol-architect'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
tier: 'standard'
tags: ['documentation', 'agile']
review_cycle: 'on-change'
---

# GTCX Infrastructure — Agile Team

> **Team Charter:** Build and maintain the cloud infrastructure, Kubernetes clusters, networking, observability, and disaster recovery systems that keep the entire GTCX ecosystem running across African data centers and global cloud regions. This squad is the single owner of all work for gtcx-infrastructure — **leading** the technical direction, **managing** the backlog and sprint commitments, **documenting** architecture and decisions, **organizing** ceremonies and stakeholder communication, **verifying** quality through testing and review, and **ensuring** the highest standard of deliverables across every commit.  
> **Squad Size:** 2–3 people (target: 5)  
> **Last Updated:** 2026-05-27

## Responsibilities by Function

This squad owns the full lifecycle of work for `gtcx-infrastructure`:

| Function           | What It Means                                                             | Primary Owner         |
| ------------------ | ------------------------------------------------------------------------- | --------------------- |
| **Lead**           | Technical direction for Kubernetes, networking, cloud, edge               | Engineering Lead      |
| **Manage**         | Backlog grooming, sprint planning, ClickUp task sync, stakeholder updates | Product Manager       |
| **Document**       | Architecture docs, runbooks, IaC specs, DR procedures                     | Engineering Lead + PM |
| **Organize**       | Sprint ceremonies, cross-repo dependency sync, release coordination       | Scrum Master          |
| **Verify**         | Infrastructure testing, chaos engineering, security scanning              | QA Lead               |
| **Ensure Quality** | Zero manual production changes, immutable infrastructure, audit trails    | Whole Squad           |

## ClickUp Work Management

This squad manages all `gtcx-infrastructure` work in ClickUp. Source of truth for sprint commitments and backlog priority is git (`docs/agile/`), but ClickUp is the operational execution layer.

| Activity         | ClickUp Action                                                 | Owner                     |
| ---------------- | -------------------------------------------------------------- | ------------------------- |
| Sprint planning  | Create sprint list, assign tasks, set due dates                | Scrum Master              |
| Daily standup    | Update task status, log blockers, move cards                   | All squad members         |
| Backlog grooming | Tag priorities, estimate effort, link to epics                 | Product Manager           |
| Task creation    | Create ClickUp tasks from sprint commitments and backlog items | Scrum Master              |
| Status sync      | Bi-directional sync between git sprint docs and ClickUp        | Scrum Master + Automation |
| Release tracking | Mark tasks complete, update milestones, notify stakeholders    | Product Manager           |

**ClickUp List ID:** TBD (set during onboarding)

## Roles & Responsibilities

### Product Manager

| Field                | Value                                                                                                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Name**             | @amanianai                                                                                                                                                                                                               |
| **Type**             | Full-time (shared)                                                                                                                                                                                                       |
| **Responsibilities** | Own the backlog and roadmap for gtcx-infrastructure. Manage multi-region deployment strategy and vendor relationships. Ensure ClickUp reflects current priorities. Document infrastructure strategy and cost governance. |
| **Accountable For**  | Sprint completion rate, infrastructure uptime, cost optimization, ClickUp list hygiene, stakeholder satisfaction                                                                                                         |
| **Current Status**   | 🟢 Staffed                                                                                                                                                                                                               |

### Scrum Master / Agile Lead

| Field                | Value                                                                                                                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**             | @amanianai (acting)                                                                                                                                                                                   |
| **Type**             | Agent-assisted                                                                                                                                                                                        |
| **Responsibilities** | Facilitate all ceremonies. Manage ClickUp task creation and status sync. Track velocity and blocker resolution. Organize cross-repo infrastructure dependency coordination. Document sprint outcomes. |
| **Accountable For**  | Sprint health, blocker resolution time, team velocity, ClickUp completeness                                                                                                                           |
| **Current Status**   | 🟡 Recruiting                                                                                                                                                                                         |

### Engineering Lead — Cloud & Kubernetes

| Field                | Value                                                                                                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**             | @amanianai                                                                                                                                                                                              |
| **Type**             | Full-time                                                                                                                                                                                               |
| **Responsibilities** | Lead technical direction for Kubernetes clusters, cloud infrastructure, service mesh, and autoscaling. Document architecture and IaC patterns. Organize technical reviews. Verify deployment readiness. |
| **Accountable For**  | System reliability, technical debt, code review throughput, cluster uptime, infrastructure cost                                                                                                         |
| **Current Status**   | 🟢 Staffed                                                                                                                                                                                              |

### Engineering Lead — Networking & Edge

| Field                | Value                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**             | TBD                                                                                                                                                                                                  |
| **Type**             | —                                                                                                                                                                                                    |
| **Responsibilities** | Lead technical direction for multi-region networking, CDN, edge computing, and data sovereignty. Document network architecture. Organize technical reviews. Verify connectivity and latency targets. |
| **Accountable For**  | Network reliability, latency targets, data sovereignty compliance, edge deployment success                                                                                                           |
| **Current Status**   | 🔴 Vacant                                                                                                                                                                                            |

### QA / Quality Lead

| Field                | Value                                                                                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**             | @amanianai (acting)                                                                                                                                                                                           |
| **Type**             | Agent-assisted                                                                                                                                                                                                |
| **Responsibilities** | Define test strategy for infrastructure (chaos engineering, security scanning, DR drills). Verify all releases through testing. Document test plans and coverage. Ensure no manual production changes escape. |
| **Accountable For**  | Test coverage, defect escape rate, release confidence, DR test success rate                                                                                                                                   |
| **Current Status**   | 🟡 Recruiting                                                                                                                                                                                                 |

### DevOps / Platform Engineer

| Field                | Value                                                                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**             | @amanianai (acting)                                                                                                                                               |
| **Type**             | Shared resource                                                                                                                                                   |
| **Responsibilities** | Manage CI/CD for infrastructure, Terraform state, and GitOps workflows. Organize release orchestration. Verify backup and recovery procedures. Document runbooks. |
| **Accountable For**  | Deployment frequency, mean time to recovery, runbook coverage, backup verification                                                                                |
| **Current Status**   | 🟣 Shared                                                                                                                                                         |

### Security / Compliance Officer

| Field                | Value                                                                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**             | @amanianai (acting)                                                                                                                                                        |
| **Type**             | Shared resource                                                                                                                                                            |
| **Responsibilities** | Manage infrastructure security posture, vulnerability scanning, and compliance mapping. Verify security controls. Document compliance evidence. Organize security reviews. |
| **Accountable For**  | Security audit score, vulnerability remediation time, compliance gap closure                                                                                               |
| **Current Status**   | 🟣 Shared                                                                                                                                                                  |

---

## RACI Matrix

| Activity                     | PM    | SM    | Eng Cloud | Eng Network | QA    | DevOps | Security |
| ---------------------------- | ----- | ----- | --------- | ----------- | ----- | ------ | -------- |
| **Lead** technical direction | C     | I     | **A**     | **A**       | C     | I      | I        |
| **Manage** backlog & ClickUp | **A** | **R** | C         | C           | I     | I      | I        |
| **Document** architecture    | C     | I     | **A**     | **A**       | I     | C      | I        |
| **Organize** ceremonies      | C     | **A** | C         | C           | C     | I      | I        |
| **Verify** code quality      | I     | C     | C         | C           | **A** | I      | C        |
| **Ensure** release quality   | C     | C     | C         | C           | C     | **A**  | C        |
| Sprint planning              | **A** | **R** | C         | C           | C     | I      | I        |
| Daily standup                | C     | **A** | C         | C           | C     | I      | I        |
| Code review                  | I     | I     | **A**     | **A**       | C     | I      | C        |
| Test strategy                | C     | C     | C         | C           | **A** | I      | C        |
| Deployment                   | I     | I     | C         | C           | C     | **A**  | C        |
| Incident response            | C     | C     | **A**     | **A**       | C     | **A**  | C        |
| Stakeholder demo             | **A** | C     | C         | C           | C     | I      | I        |

---

## Team Health

| Metric                              | Target  | Current | Trend |
| ----------------------------------- | ------- | ------- | ----- |
| Cluster uptime                      | > 99.9% | —       | —     |
| Deployment frequency                | Daily   | —       | —     |
| Mean time to recovery               | < 30min | —       | —     |
| Infrastructure cost vs budget       | < 100%  | —       | —     |
| Test coverage (IaC)                 | > 80%   | —       | —     |
| Security vulnerabilities (critical) | 0       | —       | —     |
| ClickUp task sync accuracy          | > 95%   | —       | —     |
| Documentation coverage              | > 80%   | —       | —     |

---

## Communication

| Channel                    | Purpose                                        | Cadence            |
| -------------------------- | ---------------------------------------------- | ------------------ |
| Daily standup              | Blockers, progress, plans, ClickUp updates     | Daily 09:00 UTC    |
| Sprint planning            | Commitments, estimation, ClickUp tasking       | Bi-weekly Monday   |
| Sprint review              | Demo, stakeholder feedback                     | Bi-weekly Thursday |
| Retrospective              | Process improvement, quality reflection        | Bi-weekly Friday   |
| Slack #gtcx-infrastructure | Async updates, alerts                          | Continuous         |
| ClickUp                    | Task tracking, status updates, blocker logging | Continuous         |
| PagerDuty                  | On-call alerts, incident response              | 24/7               |

---

## Hiring Priority

| Priority | Role                       | When    | Why                                                               |
| -------- | -------------------------- | ------- | ----------------------------------------------------------------- |
| P1       | Networking & Edge Engineer | Q2 2026 | Multi-region African deployment needs dedicated network architect |
| P1       | DevOps Engineer            | Q2 2026 | Infrastructure CI/CD and GitOps need dedicated owner              |
| P2       | QA Engineer                | Q3 2026 | Chaos engineering and security scanning need dedicated validation |
| P2       | Security Engineer          | Q3 2026 | Infrastructure security posture needs dedicated owner             |
| P3       | SRE / Platform Engineer    | Q4 2026 | SLO/SLI management and incident response at scale                 |
