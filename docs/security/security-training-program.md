---
title: 'GTCX Security Training Program'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'architecture', 'infrastructure']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# GTCX Security Training Program

## Program Objectives

Establish a continuous security education program that reduces human-factor risk, builds security into the development lifecycle, and meets compliance requirements for financial services and trade infrastructure.

## Annual Mandatory Training

All GTCX staff complete the following modules annually. Training resets each January and must be completed by February 28.

### Core Modules (All Staff)

| Module                           | Duration | Frequency | Passing Score  |
| -------------------------------- | -------- | --------- | -------------- |
| Security Awareness Fundamentals  | 45 min   | Annual    | 80%            |
| Phishing and Social Engineering  | 30 min   | Annual    | 80%            |
| Data Handling and Classification | 30 min   | Annual    | 80%            |
| Incident Reporting Procedures    | 20 min   | Annual    | 80%            |
| Acceptable Use Policy            | 15 min   | Annual    | Acknowledgment |
| Physical Security and Clean Desk | 15 min   | Annual    | Acknowledgment |

### Completion Requirements

- All modules must be completed within the training window
- Employees who do not complete training by the deadline have system access suspended until completion
- New hires must complete core modules within their first 7 calendar days
- Contractors and temporary staff complete core modules before access provisioning

## Role-Specific Training

### Developers and Engineers

| Module                                                  | Duration  | Frequency |
| ------------------------------------------------------- | --------- | --------- |
| OWASP Top 10 (current year edition)                     | 2 hours   | Annual    |
| Secure Code Review Practices                            | 1.5 hours | Annual    |
| Secrets Management and Key Handling                     | 1 hour    | Annual    |
| Supply Chain Security (dependency management, signing)  | 1 hour    | Annual    |
| Secure API Design                                       | 1 hour    | Annual    |
| Cryptographic Primitives (hashing, signing, encryption) | 1 hour    | Annual    |

Developers must also complete at least one hands-on CTF exercise per quarter (internal or external).

### Platform and Infrastructure Engineers

| Module                                      | Duration  | Frequency |
| ------------------------------------------- | --------- | --------- |
| Kubernetes Security Hardening               | 2 hours   | Annual    |
| Infrastructure as Code Security             | 1.5 hours | Annual    |
| Cloud Security (AWS security services, IAM) | 2 hours   | Annual    |
| Container Security and Image Signing        | 1 hour    | Annual    |
| Network Security and Zero Trust             | 1.5 hours | Annual    |
| Incident Response for Infrastructure        | 1 hour    | Annual    |

### Management and Leadership

| Module                                              | Duration | Frequency |
| --------------------------------------------------- | -------- | --------- |
| Risk Awareness and Governance                       | 1 hour   | Annual    |
| Incident Response Decision Making                   | 1 hour   | Annual    |
| Regulatory Compliance Overview (NIST 800-53, SOC 2) | 1 hour   | Annual    |
| Security Budget and Resource Planning               | 45 min   | Annual    |
| Third-Party and Vendor Risk Management              | 45 min   | Annual    |

## Quarterly Phishing Simulation

### Program Design

- Simulated phishing campaigns run quarterly, targeting all staff
- Campaigns use realistic scenarios relevant to GTCX operations (trade confirmations, compliance alerts, HR notifications)
- Campaigns rotate across email, SMS, and messaging vectors

### Performance Targets

| Metric                     | Target | Escalation Threshold                        |
| -------------------------- | ------ | ------------------------------------------- |
| Click rate                 | < 5%   | > 10% triggers mandatory remedial training  |
| Report rate                | > 60%  | < 40% triggers awareness campaign           |
| Credential submission rate | < 2%   | > 5% triggers department-level intervention |

### Remediation

- Staff who click a simulated phishing link receive immediate just-in-time training (2-minute micro-lesson)
- Staff who fail two consecutive simulations complete a 30-minute remedial phishing awareness module
- Staff who fail three consecutive simulations have their case reviewed by their manager and the security team
- Department-level failure rates above 10% trigger a team-specific awareness session

## Security Champions Program

### Structure

- One security champion per engineering team (minimum)
- Champions are senior engineers or tech leads with demonstrated security interest
- Appointment is voluntary, with manager approval

### Responsibilities

- Serve as the first point of contact for security questions within their team
- Participate in monthly security champions meetup (1 hour)
- Review team PRs for security-sensitive changes
- Escalate potential vulnerabilities to the security team
- Promote secure coding practices and tooling adoption

### Monthly Meetup Agenda

- Threat landscape update (10 min)
- Recent incident review and lessons learned (15 min)
- Policy or tooling change walkthrough (15 min)
- Open discussion and Q&A (20 min)

### Additional Training

Champions receive the following beyond standard role-specific training:

| Module                                | Duration | Frequency |
| ------------------------------------- | -------- | --------- |
| Threat Modeling Workshop              | 3 hours  | Biannual  |
| Penetration Testing Fundamentals      | 2 hours  | Annual    |
| Security Architecture Review          | 2 hours  | Annual    |
| Vulnerability Triage and CVSS Scoring | 1 hour   | Annual    |

## New Hire Onboarding

### Week 1 Security Checklist

| Day     | Activity                                                                     |
| ------- | ---------------------------------------------------------------------------- |
| Day 1   | Acceptable Use Policy acknowledgment, MFA enrollment, password manager setup |
| Day 1-2 | Core security awareness modules (all 6 modules)                              |
| Day 3-5 | Role-specific security training (developer, platform, or management track)   |
| Day 5   | Security onboarding quiz (must score 80%+)                                   |
| Day 5   | Access provisioned only after quiz completion                                |

### Onboarding Materials

- Security handbook (internal wiki)
- Incident reporting contact card
- Approved tools and services list
- Data classification guide
- Security team office hours schedule

## Certification Support

GTCX sponsors professional security certifications for eligible staff. Sponsorship covers exam fees and preparation materials.

### Supported Certifications

| Certification                                               | Relevance                         | Eligibility                                                     |
| ----------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------- |
| OSCP (Offensive Security Certified Professional)            | Penetration testing, red team     | Security engineers, champions with 1+ year tenure               |
| CISSP (Certified Information Systems Security Professional) | Security management, architecture | Senior engineers, security team, management with 2+ year tenure |
| AWS Security Specialty                                      | Cloud security                    | Platform engineers, DevOps with 1+ year tenure                  |
| CKS (Certified Kubernetes Security Specialist)              | Container orchestration security  | Platform engineers with CKA or equivalent                       |
| GIAC certifications (GSEC, GPEN, GCIH)                      | Various security domains          | Case-by-case based on role alignment                            |

### Sponsorship Terms

- GTCX covers exam fee (first attempt and one retake)
- Up to $500 for preparation materials per certification
- 5 business days of study leave per certification attempt
- Employee must remain at GTCX for 12 months post-certification or reimburse pro-rated costs

## Tracking and Compliance Reporting

### Learning Management System (LMS)

All training is tracked through the organization's LMS with the following capabilities:

- Automated enrollment based on role and department
- Completion tracking with deadline enforcement
- Quiz scoring and pass/fail recording
- Certificate generation for completed modules
- Manager dashboard for team compliance visibility

### Compliance Reporting

| Report                                 | Audience                  | Frequency          |
| -------------------------------------- | ------------------------- | ------------------ |
| Training completion rate by department | Security team, HR         | Monthly            |
| Phishing simulation results            | Security team, management | Quarterly          |
| Overdue training summary               | Department managers       | Weekly (automated) |
| Annual compliance certification        | Executive team, auditors  | Annual             |
| Certification program utilization      | HR, security team         | Quarterly          |

### Metrics and KPIs

| Metric                               | Target                    |
| ------------------------------------ | ------------------------- |
| Annual training completion rate      | 100% by deadline          |
| Average quiz score                   | > 85%                     |
| Phishing click rate                  | < 5%                      |
| Security champion coverage           | 100% of engineering teams |
| New hire training completion (Day 5) | 100%                      |
| Certification pass rate (sponsored)  | > 75%                     |

### Audit Trail

- All training completions are logged with timestamp, user ID, module ID, and score
- Phishing simulation results are retained for 3 years
- Records are available for SOC 2 and regulatory audits
- Training records are included in the annual security posture report
