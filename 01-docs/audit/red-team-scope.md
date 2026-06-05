---
title: 'Red Team Exercise Scope & Rules of Engagement'
status: 'current'
date: '2026-05-27'
owner: 'security-lead'
role: 'security-lead'
tier: 'critical'
tags: ['security', 'red-team', 'penetration-test', 'bank-grade', 'assumed-breach']
review_cycle: 'annual'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Red Team Exercise Scope & Rules of Engagement

**Document ID:** GTCX-RT-001  
**Version:** 1.0  
**Effective Date:** 2026-05-25  
**Target Execution Window:** 2026-H2 (post-pen-test, pre-SOC 2 Type II observation)  
**Owner:** Head of Security

---

## 1. Objective

Evaluate GTCX's ability to detect, contain, and eradicate a sophisticated adversary operating under an **assumed-breach** model. Unlike a standard pen-test, the red team is granted a foothold and tasked with achieving objectives through lateral movement, privilege escalation, and data exfiltration.

## 2. Assumed-Breach Narrative

> **Premise:** A GTCX engineer's laptop is compromised via a targeted phishing campaign. The adversary has obtained:
>
> - Valid VPN credentials (MFA bypassed via push fatigue).
> - Access to the engineer's email and Slack.
> - Source code access (GitHub) at the engineer's permission level.
>
> **Goal:** The adversary seeks to:
>
> 1. Escalate from developer access to production infrastructure.
> 2. Access the WORM audit bucket or tamper with the audit chain.
> 3. Exfiltrate customer KYC data.
> 4. Maintain persistence for > 30 days undetected.

## 3. Scope

### 3.1 In-Scope

| Domain       | Assets                            | Tactics                                            |
| ------------ | --------------------------------- | -------------------------------------------------- |
| **Identity** | AWS IAM, GitHub, VPN, Vault       | Credential abuse, MFA bypass, role assumption      |
| **Network**  | VPC, Kubernetes, NATS, PostgreSQL | Lateral movement, mesh bypass, sniffing            |
| **Compute**  | EKS pods, EC2 bastions, Lambda    | Container escape, pod compromise, serverless abuse |
| **Data**     | WORM S3, PostgreSQL, JetStream    | Exfiltration, tampering, encryption                |
| **CI/CD**    | GitHub Actions, Cosign, SLSA      | Supply chain, artifact poisoning, build tampering  |
| **Social**   | Slack, Email, PagerDuty           | Phishing, pretexting, escalation hijack            |

### 3.2 Out-of-Scope

| Item                                                  | Reason                                    |
| ----------------------------------------------------- | ----------------------------------------- |
| Physical access to offices/data centers               | Separate physical security assessment     |
| Denial-of-Service (DoS)                               | Operational continuity must be maintained |
| Third-party LLM providers (Anthropic, Google, OpenAI) | Out-of-band agreements                    |
| Production customer funds                             | Financial risk unacceptable               |
| GTCX staff personal devices                           | Privacy and legal constraints             |

### 3.3 Constraints

- **No data destruction:** The red team must not delete, corrupt, or encrypt production data.
- **No extortion simulation:** No ransomware deployment or ransom notes.
- **Business hours only:** Active operations 09:00–17:00 SAST to limit fatigue.
- **Kill switch:** GTCX can halt the exercise at any time with 15 minutes notice.
- **Reporting:** All critical findings reported within 24 hours of discovery.

## 4. Success Criteria

### 4.1 Red Team Wins (GTCX Fails)

| Objective                                           | Severity |
| --------------------------------------------------- | -------- |
| Achieves production admin access                    | CRITICAL |
| Tamper with or exfiltrate WORM audit records        | CRITICAL |
| Exfiltrate > 100 customer KYC records               | CRITICAL |
| Maintain persistence > 14 days undetected           | HIGH     |
| Compromise CI/CD to inject malicious artifact       | HIGH     |
| Escalate from developer to security team privileges | HIGH     |

### 4.2 Blue Team Wins (GTCX Passes)

| Objective                                 | Evidence                                |
| ----------------------------------------- | --------------------------------------- |
| Detect initial compromise within 24 hours | Alert fired, incident opened            |
| Contain lateral movement within 48 hours  | Compromised account isolated            |
| Prevent access to WORM bucket             | Access denied logs                      |
| Evict adversary within 72 hours           | All access revoked, credentials rotated |
| No data exfiltrated                       | DLP / network logs clean                |

## 5. Exercise Timeline

| Phase              | Duration | Activities                                                  |
| ------------------ | -------- | ----------------------------------------------------------- |
| **Planning**       | 2 weeks  | Scope finalization, legal review, tool provisioning         |
| **Reconnaissance** | 1 week   | OSINT, staff enumeration, infrastructure mapping            |
| **Initial Access** | 1 week   | Phishing, credential abuse, MFA bypass                      |
| **Execution**      | 2 weeks  | Lateral movement, privilege escalation, objective pursuit   |
| **Reporting**      | 2 weeks  | Findings report, containment narrative, remediation roadmap |
| **Retest**         | 1 week   | Verify critical findings remediated                         |

## 6. Deliverables

| Deliverable               | Format                  | Audience                   |
| ------------------------- | ----------------------- | -------------------------- |
| Executive summary         | One-page PDF            | Board Security Committee   |
| Technical findings report | PDF + encrypted JSON    | Security Engineering, CISO |
| Containment narrative     | Markdown                | Compliance, auditors       |
| Remediation roadmap       | Prioritized ticket list | Engineering, Security      |
| Lessons learned deck      | PDF                     | All staff (sanitized)      |

## 7. Vendor Selection

| Firm                          | Specialty                    | Notes                                 |
| ----------------------------- | ---------------------------- | ------------------------------------- |
| Orange Cyberdefense SensePost | African financial sector     | Recommended; knows GTCX from pen-test |
| Nclose                        | African red team / blue team | Strong assumed-breach experience      |
| Mandiant (Google Cloud)       | APT simulation               | Premium; overkill for current stage   |

**Recommendation:** Engage SensePost for continuity with pen-test knowledge.

## 8. Compliance Mapping

| Framework        | Control                            | Evidence                          |
| ---------------- | ---------------------------------- | --------------------------------- |
| Bank-Grade B.3   | Red team exercise (annual)         | This document + exercise report   |
| SOC 2 CC7.1      | Detection                          | Alert telemetry during exercise   |
| SOC 2 CC7.3      | Incident response                  | Incident timeline and containment |
| ISO 27001 A.12.6 | Technical vulnerability management | Findings and remediation          |

---

_Last updated: 2026-05-25_
