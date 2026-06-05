---
title: 'Incident Response Plan v1.0'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'infrastructure', 'api']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Incident Response Plan v1.0

**Classification:** Confidential
**Owner:** Chief Information Security Officer (CISO)
**Effective Date:** **\_\_\_\_**
**Next Review:** Quarterly (90 days from effective date)
**Approval:** See Board Sign-Off (Section 14)
**Document ID:** GTCX-IRP-001

---

## 1. Purpose

This document establishes the formal Incident Response Plan (IRP) for the Global Trade & Compliance Exchange (GTCX) ecosystem. It defines the organizational response to security incidents affecting GTCX systems, data, and operations. This is the board-approved governance document; the operational runbook resides at `01-docs/04-ops/runbooks/incident-response.md`.

## 2. Scope

This plan applies to:

- All GTCX production, staging, and development environments
- All personnel (employees, contractors, managed service providers) with access to GTCX systems
- All data processed, stored, or transmitted by GTCX systems including personally identifiable information (PII), financial transaction data, cardholder data, and compliance records
- Third-party integrations and vendor-hosted components that process GTCX data
- Hardware devices (TapKit, VaultKit) and their associated provisioning infrastructure

## 3. Authority

| Role                   | Authority                                                                                                                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CISO**               | Incident Commander for all P1 and P2 incidents. Authority to invoke containment actions, engage external counsel, authorize forensic investigation, and activate regulatory notification procedures without prior executive approval. |
| **Engineering Lead**   | Incident Commander for P3 and P4 incidents. Authority to invoke technical containment actions.                                                                                                                                        |
| **CEO**                | Authority to approve public statements and board notifications. CISO may act in CEO absence for time-critical regulatory notifications.                                                                                               |
| **General Counsel**    | Authority over legal privilege, law enforcement liaison, and regulatory notification content.                                                                                                                                         |
| **Board of Directors** | Receives notification per escalation matrix. Approves this plan annually.                                                                                                                                                             |

## 4. Definitions

| Term                        | Definition                                                                                                                  |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Security Incident**       | Any event that actually or potentially compromises the confidentiality, integrity, or availability of GTCX systems or data. |
| **Data Breach**             | A confirmed incident resulting in unauthorized access to or exfiltration of protected data.                                 |
| **Incident Commander (IC)** | The designated individual with decision authority for the duration of an incident.                                          |
| **Evidence**                | Any digital artifact, log, memory dump, disk image, or network capture relevant to an incident.                             |

## 5. Severity Classification

| Severity           | Description                                                                            | Examples                                                                                         | Response SLA | Update Cadence   |
| ------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------ | ---------------- |
| **P1 -- Critical** | Active exploitation, confirmed data breach, key compromise, or complete service outage | HSM key compromise, audit chain tampering, auth bypass, mass data exfiltration, ransomware       | < 15 minutes | Every 30 minutes |
| **P2 -- High**     | Exploitable vulnerability, significant service degradation, or partial data exposure   | Privilege escalation, brute-force attack in progress, rate limit bypass, single-tenant data leak | < 1 hour     | Every 1 hour     |
| **P3 -- Medium**   | Non-exploitable vulnerability, policy violation, or degraded monitoring                | Failed auth spike, configuration drift, certificate expiry warning, backup failure               | < 4 hours    | Every 4 hours    |
| **P4 -- Low**      | Informational finding or minor policy deviation                                        | New dependency CVE (no known exploit), log anomaly, documentation gap                            | < 24 hours   | Daily            |

When severity is ambiguous, escalate to the higher level. Downgrading is always easier than explaining delay.

## 6. Incident Response Phases

### 6.1 Detection

Sources of incident indicators:

- CloudTrail and GuardDuty alerts (AWS)
- Prometheus/Grafana alerting rules
- Application audit logs (`PersistentAuditLog`)
- VPC Flow Logs and WAF logs
- SOC monitoring (SIEM correlation rules)
- External reports (bug bounty, customer, partner, regulator)
- Replay protection metrics (`gtcx_pvp_replay_check_total{result=rejected}`)

All detection sources must feed into the SIEM within 60 seconds of generation. The SOC must acknowledge P1 alerts within 5 minutes.

### 6.2 Triage

1. Assess severity using the classification table (Section 5).
2. Designate an Incident Commander per the authority matrix (Section 3).
3. Open a dedicated incident channel (Slack: `#incident-YYYYMMDD-NNN`).
4. Create an incident record in the ticketing system with severity, initial assessment, and affected systems.
5. Begin the incident timeline log. Every action, decision, and communication is timestamped.

### 6.3 Containment

Containment actions are authorized by the Incident Commander. The principle is minimal scope: act on the smallest surface that stops the bleeding.

| Incident Type         | Containment Action                                                          |
| --------------------- | --------------------------------------------------------------------------- |
| Key compromise        | Immediate revocation via `HsmProvider.keyLifecycle.revoke()`, then rotation |
| Authentication breach | Account lockout via `AccountLockoutManager`, session invalidation           |
| Data exfiltration     | Network isolation of affected segments, API key revocation                  |
| Ransomware            | Immediate network isolation, preserve encrypted artifacts                   |
| Replay attack         | Flush replay cache, upgrade to Redis-backed cache                           |
| DDoS                  | Engage CDN/WAF rate limiting, activate DDoS mitigation provider             |

### 6.4 Investigation

See `01-docs/09-security/forensic-readiness.md` for evidence collection procedures.

1. Preserve evidence before remediation (see Section 10).
2. Export audit trail for the incident window.
3. Correlate deployment history, configuration changes, and access logs.
4. Identify root cause, attack vector, and scope of impact.
5. Document findings in the incident record with timestamps and evidence references.

### 6.5 Eradication and Recovery

1. Remove the threat actor's access (credentials, backdoors, compromised accounts).
2. Apply the permanent fix or confirm containment is durable.
3. Restore from known-good backups if data integrity is compromised.
4. Verify the fix: run automated tests, confirm metrics return to baseline, monitor for 30 minutes minimum (P1) or 15 minutes (P2+).

### 6.6 Post-Incident Review

| Severity | Review Deadline           | Participants                                                                |
| -------- | ------------------------- | --------------------------------------------------------------------------- |
| **P1**   | Within 48 hours           | CISO, Engineering Lead, IC, all responders, General Counsel, CEO (optional) |
| **P2**   | Within 1 week             | Engineering Lead, IC, responders                                            |
| **P3**   | Within 2 weeks            | Team lead, responders                                                       |
| **P4**   | Next sprint retrospective | Assigned engineer                                                           |

Post-incident review requirements:

- Blameless format. Focus on systems, processes, and gaps.
- Complete timeline from detection to resolution.
- Root cause analysis (5 Whys or Ishikawa).
- Controls that detected the incident.
- Controls that failed or were absent.
- Remediation actions taken.
- Preventive measures and action items with owners and deadlines.
- Update to STRIDE threat model for affected components.
- Update to `01-docs/10-compliance/controls-matrix.md` with new or modified controls.

## 7. Escalation Matrix

### 7.1 Internal Escalation

| Severity | First Responder   | Escalate To                           | Executive Notify      | Board Notify                  |
| -------- | ----------------- | ------------------------------------- | --------------------- | ----------------------------- |
| **P1**   | On-call engineer  | CISO + Engineering Lead (immediately) | CEO within 15 minutes | Board Chair within 1 hour     |
| **P2**   | On-call engineer  | Engineering Lead (within 15 min)      | CISO within 1 hour    | Board summary within 24 hours |
| **P3**   | Assigned engineer | Team lead (if unresolved in 4 hours)  | Not required          | Not required                  |
| **P4**   | Assigned engineer | Not required                          | Not required          | Not required                  |

### 7.2 External Escalation

| Stakeholder                 | Trigger                                                  | Timeline                         | Responsible            |
| --------------------------- | -------------------------------------------------------- | -------------------------------- | ---------------------- |
| **Legal counsel**           | Any confirmed data breach (P1/P2)                        | Within 1 hour of confirmation    | CISO                   |
| **Regulators**              | See Section 8 (Regulatory Notification)                  | Per jurisdiction                 | General Counsel + CISO |
| **Law enforcement**         | See Section 9                                            | Per procedure                    | General Counsel        |
| **PR/Communications**       | Any P1 incident, any incident with public visibility     | Within 2 hours                   | CEO + CISO             |
| **Affected customers**      | Confirmed breach of customer data                        | Per jurisdiction (see Section 8) | General Counsel        |
| **Card brands**             | Cardholder data compromise                               | Immediately                      | CISO + PCI QSA         |
| **Cyber insurance carrier** | Any P1 incident, any incident likely to generate a claim | Within 24 hours                  | CFO + General Counsel  |

## 8. Regulatory Notification SLAs

### 8.1 Data Protection

| Regulation                     | Notification To                   | Deadline                       | Trigger                                               |
| ------------------------------ | --------------------------------- | ------------------------------ | ----------------------------------------------------- |
| **GDPR (EU)**                  | Supervisory authority             | 72 hours from awareness        | Personal data breach affecting EU data subjects       |
| **GDPR (EU)**                  | Affected individuals              | Without undue delay            | High risk to rights and freedoms of individuals       |
| **Kenya Data Protection Act**  | Data Commissioner                 | 72 hours from awareness        | Personal data breach affecting Kenyan data subjects   |
| **Uganda Data Protection Act** | Personal Data Protection Office   | 48 hours from awareness        | Personal data breach affecting Ugandan data subjects  |
| **Tanzania (EPOCA)**           | TCRA                              | 24 hours from awareness        | Security incident affecting electronic communications |
| **Rwanda Data Protection Law** | National Cyber Security Authority | 72 hours from awareness        | Personal data breach affecting Rwandan data subjects  |
| **South Africa (POPIA)**       | Information Regulator             | As soon as reasonably possible | Compromise of personal information                    |
| **Nigeria (NDPR)**             | NITDA                             | 72 hours from awareness        | Data breach affecting Nigerian data subjects          |

### 8.2 Financial Regulation

| Regulation                     | Notification To              | Deadline                      | Trigger                                                 |
| ------------------------------ | ---------------------------- | ----------------------------- | ------------------------------------------------------- |
| **PCI-DSS**                    | Acquiring bank + card brands | Immediately upon confirmation | Compromise of cardholder data                           |
| **Central Bank of Kenya**      | CBK Banking Supervision      | 24 hours                      | Incident affecting banking operations or customer funds |
| **Bank of Uganda**             | BOU                          | 24 hours                      | Incident affecting financial services                   |
| **Bank of Tanzania**           | BOT                          | 24 hours                      | Incident affecting payment systems                      |
| **National Bank of Rwanda**    | BNR                          | 24 hours                      | Incident affecting financial operations                 |
| **Central Bank of Nigeria**    | CBN                          | 24 hours                      | Incident affecting financial systems                    |
| **South African Reserve Bank** | SARB                         | 24 hours                      | Incident affecting payment or financial infrastructure  |

### 8.3 SOC 2

Per CC7.3 and CC7.4, confirmed breaches must be communicated to affected parties within 72 hours. The SOC 2 auditor must be notified of any P1 incident within 30 days for inclusion in the management assertion.

## 9. Law Enforcement Liaison Procedure

1. **Decision authority.** Only the General Counsel or CISO may authorize contact with law enforcement. No other personnel may initiate law enforcement contact regarding an incident.

2. **When to engage law enforcement:**
   - Confirmed criminal activity (unauthorized access, fraud, extortion/ransomware demands)
   - Incident involving threat to life or safety
   - Regulatory obligation to report (e.g., money laundering indicators)
   - When directed by legal counsel

3. **Procedure:**
   a. General Counsel prepares a disclosure package: incident summary, timeline, affected systems (no raw evidence without legal review).
   b. All communications with law enforcement are logged in the incident record.
   c. Evidence is provided only pursuant to a formal legal process (subpoena, court order) or with General Counsel authorization.
   d. Do not disclose customer PII to law enforcement without legal process or General Counsel approval.
   e. Maintain legal privilege: label all internal analysis documents as "Privileged and Confidential -- Prepared at Direction of Counsel."

4. **Jurisdiction contacts:**
   - Kenya: Directorate of Criminal Investigations (DCI), National KE-CIRT/CC
   - Uganda: CID Cyber Crime Unit
   - Tanzania: Tanzania Police Force Cyber Crime Unit
   - Rwanda: Rwanda Investigation Bureau (RIB)
   - International: INTERPOL Cyber Crime Directorate (via local liaison)

## 10. Evidence Preservation Requirements

All incident evidence must be preserved to forensic standards. See `01-docs/09-security/forensic-readiness.md` for detailed procedures.

### 10.1 Minimum Evidence Set

For any P1 or P2 incident, the following must be collected and preserved:

- Application audit logs for the incident window (export from `PersistentAuditLog`)
- CloudTrail logs for the incident window
- VPC Flow Logs for affected network segments
- System logs (syslog, journal) from affected hosts
- Memory dumps (if host compromise suspected)
- Disk snapshots of affected volumes
- Container images running at time of incident
- Kubernetes pod logs and events
- SIEM correlation results and alerts

### 10.2 Chain of Custody

Every evidence artifact must have:

- Collector identity (who)
- Collection timestamp (when, UTC)
- Collection method (how)
- SHA-256 hash of the artifact at time of collection
- Storage location
- Access log (who accessed the evidence and when)

Evidence must be stored in the forensic evidence bucket with write-once, read-many (WORM) retention. See `01-docs/09-security/forensic-readiness.md` for chain-of-custody forms and procedures.

## 11. PR/Communications Playbook

### 11.1 Principles

- No external communication without CEO or CISO approval.
- Legal counsel reviews all external statements before release.
- Communicate facts, not speculation. If the investigation is ongoing, say so.
- Never disclose technical details that could aid further exploitation.

### 11.2 Holding Statements

**P1 -- Critical Incident (Public-Facing)**

**P1 -- Critical Incident (Regulator-Facing)**

**P2 -- High Severity (Internal Stakeholders)**

**P3/P4 -- No External Communication Required**

Internal notification only. Standard incident channel communication per operational runbook.

### 11.3 Communication Channels

| Audience           | Channel                          | Approval Required     |
| ------------------ | -------------------------------- | --------------------- |
| Internal staff     | Slack `#incident-*` channel      | IC                    |
| Executive team     | Direct message + email           | IC                    |
| Board of Directors | Email from CEO or CISO           | CEO                   |
| Regulators         | Formal letter (see Appendix C)   | General Counsel       |
| Affected customers | Email from official GTCX address | CEO + General Counsel |
| Media              | Written statement only           | CEO + General Counsel |
| Law enforcement    | Per Section 9 procedure          | General Counsel       |

## 12. Tabletop Exercise Schedule

| Exercise           | Frequency                       | Participants                                              | Objective                                                                  |
| ------------------ | ------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------- |
| **P1 Simulation**  | Quarterly                       | CISO, Engineering Lead, on-call rotation, General Counsel | Test full escalation chain, regulatory notification, evidence preservation |
| **P2 Technical**   | Quarterly (alternating with P1) | Engineering team, SOC                                     | Test technical containment and investigation procedures                    |
| **Board Briefing** | Annually                        | Board of Directors, CISO, CEO                             | Board familiarity with IRP, test board notification procedures             |
| **Cross-Team**     | Semi-annually                   | All teams with incident response roles                    | End-to-end exercise including external communications                      |

Each tabletop exercise must produce:

- Exercise report with scenario, actions taken, gaps identified
- Action items with owners and deadlines
- Updates to this plan if gaps warrant changes

A board observer must attend at least one quarterly exercise per year.

## 13. Plan Maintenance

| Activity                    | Frequency                  | Responsible             |
| --------------------------- | -------------------------- | ----------------------- |
| Full plan review and update | Quarterly                  | CISO                    |
| Contact list verification   | Monthly                    | Security team           |
| Tabletop exercise           | Quarterly                  | CISO + Engineering Lead |
| Post-incident plan update   | After every P1/P2 incident | IC                      |
| Board re-approval           | Annually                   | Board of Directors      |

## 14. Board Sign-Off

### Agent preparation (S2-12)

The operational IRP runbook at `01-docs/04-ops/runbooks/incident-response.md` is
agent-maintained and validated in CI. Board signatures below remain a **human
escalation** (EXT-INF). Agents must not fill signature fields autonomously.

| Artifact               | Agent owner                | CI gate                |
| ---------------------- | -------------------------- | ---------------------- |
| IRP v1 (this document) | `agent:compliance-officer` | docs-standard          |
| Operational runbook    | `agent:platform-architect` | runbook-commands-check |
| Alert routing          | `agent:platform-architect` | alertmanager-env-check |

This Incident Response Plan has been reviewed and approved by the GTCX Board of Directors.

| Role            | Name                     | Signature                | Date         |
| --------------- | ------------------------ | ------------------------ | ------------ |
| Board Chair     | **\*\***\_\_\_\_**\*\*** | **\*\***\_\_\_\_**\*\*** | **\_\_\_\_** |
| CEO             | **\*\***\_\_\_\_**\*\*** | **\*\***\_\_\_\_**\*\*** | **\_\_\_\_** |
| CISO            | **\*\***\_\_\_\_**\*\*** | **\*\***\_\_\_\_**\*\*** | **\_\_\_\_** |
| General Counsel | **\*\***\_\_\_\_**\*\*** | **\*\***\_\_\_\_**\*\*** | **\_\_\_\_** |

**Approval Resolution Reference:** **\*\***\_\_\_\_**\*\***

---

## Appendix A: Contact List Template

| Role                        | Name         | Phone (Primary) | Phone (Secondary) | Email        | Escalation Order |
| --------------------------- | ------------ | --------------- | ----------------- | ------------ | ---------------- |
| CISO                        | **\_\_\_\_** | **\_\_\_\_**    | **\_\_\_\_**      | **\_\_\_\_** | 1                |
| Engineering Lead            | **\_\_\_\_** | **\_\_\_\_**    | **\_\_\_\_**      | **\_\_\_\_** | 2                |
| CEO                         | **\_\_\_\_** | **\_\_\_\_**    | **\_\_\_\_**      | **\_\_\_\_** | 3                |
| General Counsel             | **\_\_\_\_** | **\_\_\_\_**    | **\_\_\_\_**      | **\_\_\_\_** | 4                |
| CFO                         | **\_\_\_\_** | **\_\_\_\_**    | **\_\_\_\_**      | **\_\_\_\_** | 5                |
| Board Chair                 | **\_\_\_\_** | **\_\_\_\_**    | **\_\_\_\_**      | **\_\_\_\_** | 6                |
| On-Call Engineer (rotation) | **\_\_\_\_** | **\_\_\_\_**    | **\_\_\_\_**      | **\_\_\_\_** | --               |
| PR/Communications Lead      | **\_\_\_\_** | **\_\_\_\_**    | **\_\_\_\_**      | **\_\_\_\_** | --               |
| Cyber Insurance Broker      | **\_\_\_\_** | **\_\_\_\_**    | **\_\_\_\_**      | **\_\_\_\_** | --               |
| External Legal Counsel      | **\_\_\_\_** | **\_\_\_\_**    | **\_\_\_\_**      | **\_\_\_\_** | --               |
| Forensic Investigation Firm | **\_\_\_\_** | **\_\_\_\_**    | **\_\_\_\_**      | **\_\_\_\_** | --               |
| PCI QSA                     | **\_\_\_\_** | **\_\_\_\_**    | **\_\_\_\_**      | **\_\_\_\_** | --               |
| Managed SOC Provider        | **\_\_\_\_** | **\_\_\_\_**    | **\_\_\_\_**      | **\_\_\_\_** | --               |

## Appendix B: Notification Letter Template -- Affected Individuals

```
[GTCX Letterhead]

Date: [Date]

Dear [Individual Name],

We are writing to inform you of a security incident that may have affected your personal data.

WHAT HAPPENED
On [date], GTCX detected [brief description of incident]. We immediately activated our incident response procedures and began an investigation.

WHAT INFORMATION WAS INVOLVED
Based on our investigation, the following categories of your personal data may have been affected:
- [List specific data categories: name, email, phone, etc.]

WHAT WE ARE DOING
- We contained the incident on [date].
- We notified [relevant regulatory authority] on [date].
- We have implemented [brief description of remediation measures].
- We have engaged [forensic firm / security consultants] to assist with our investigation.

WHAT YOU CAN DO
- [Specific actionable recommendations based on data type]
- Monitor your accounts for unusual activity.
- [If credentials involved: Change your password immediately.]

FOR MORE INFORMATION
If you have questions, please contact us at:
Email: [incident-specific email]
Phone: [incident-specific phone]
Hours: [operating hours]

We take the security of your data seriously and sincerely apologize for this incident.

Sincerely,

[Name]
[Title]
GTCX
```

## Appendix C: Regulatory Notification Letter Template

```
[GTCX Letterhead]

Date: [Date]
Reference: GTCX-INC-[YYYY]-[NNN]

To: [Regulatory Authority Name]
    [Address]

RE: Data Breach Notification under [Applicable Regulation]

Dear [Authority Contact],

1. REPORTING ENTITY
   Name: Global Trade & Compliance Exchange (GTCX)
   Registration: [Company registration number]
   Data Protection Officer: [Name, Email, Phone]

2. INCIDENT SUMMARY
   Date of discovery: [Date and time UTC]
   Date of occurrence (if known): [Date and time UTC]
   Nature of incident: [Brief factual description]
   Systems affected: [List of affected systems]

3. DATA AFFECTED
   Categories of data: [Personal data, financial data, etc.]
   Categories of data subjects: [Customers, employees, partners]
   Approximate number of records: [Number or range]
   Approximate number of individuals: [Number or range]

4. LIKELY CONSEQUENCES
   [Assessment of risk to data subjects]

5. MEASURES TAKEN
   Containment: [Actions taken to contain the breach]
   Remediation: [Actions taken or planned to remediate]
   Notification to individuals: [Whether individuals have been / will be notified]

6. CROSS-BORDER CONSIDERATIONS
   Jurisdictions affected: [List]
   Other authorities notified: [List]

7. CONTACT INFORMATION
   Primary contact: [Name]
   Title: [Title]
   Email: [Email]
   Phone: [Phone]
   Available: [Hours]

We will provide supplementary information as our investigation progresses.

Sincerely,

[Name]
[Title]
GTCX
```

## Appendix D: Law Enforcement Notification Template

```
[GTCX Letterhead]
PRIVILEGED AND CONFIDENTIAL

Date: [Date]
Reference: GTCX-INC-[YYYY]-[NNN]

To: [Law Enforcement Agency]
    [Division / Unit]
    [Address]

RE: Cybersecurity Incident Report

Dear [Officer / Unit],

Global Trade & Compliance Exchange (GTCX) wishes to report a cybersecurity incident for your awareness and potential investigation.

1. INCIDENT SUMMARY
   Date detected: [Date]
   Nature: [Brief description -- unauthorized access, fraud, extortion, etc.]
   Impact: [Brief description of impact]

2. TECHNICAL INDICATORS (as approved by legal counsel)
   [IP addresses, domains, indicators of compromise -- only as approved]

3. EVIDENCE AVAILABILITY
   Digital evidence has been preserved in accordance with our forensic procedures.
   Chain of custody documentation is available upon request.
   Evidence will be provided pursuant to appropriate legal process.

4. POINT OF CONTACT
   Name: [General Counsel or CISO name]
   Title: [Title]
   Email: [Email]
   Phone: [Phone]

5. LEGAL REPRESENTATION
   [External counsel name and firm, if engaged]

We request that the existence of this report be treated as confidential to avoid compromising our ongoing investigation and remediation efforts.

Sincerely,

[Name]
[Title]
GTCX
```

## Revision History

| Version | Date         | Author | Changes            |
| ------- | ------------ | ------ | ------------------ |
| 1.0     | **\_\_\_\_** | CISO   | Initial formal IRP |
