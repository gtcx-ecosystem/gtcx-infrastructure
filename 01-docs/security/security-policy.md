---
title: 'Security Policy'
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

# Security Policy

---

## 1. Access Control

### Principle of Least Privilege

Every user, service, and agent is granted the minimum access required to perform its function. Access is explicit — never inherited by default.

| Role                  | Access Level                             | Review Frequency |
| --------------------- | ---------------------------------------- | ---------------- |
| Engineer              | Dev and staging; production read-only    | Quarterly        |
| Senior Engineer       | Dev, staging, production read            | Quarterly        |
| On-call Engineer      | Production write (time-limited, audited) | Per incident     |
| Admin                 | Full production access                   | Monthly          |
| CI/CD Service Account | Deploy permissions only; no data read    | Quarterly        |
| Agent / Automation    | API scopes only; no database access      | Monthly          |

### Authentication Requirements

| Surface                          | Method                          | MFA Required                            |
| -------------------------------- | ------------------------------- | --------------------------------------- |
| Developer access (cloud console) | SSO via [Identity Provider]     | Yes — hardware key or authenticator app |
| Production database              | Bastion host + certificate auth | Yes                                     |
| API (external)                   | API key or OAuth 2.0            | N/A                                     |
| Internal service-to-service      | mTLS or short-lived tokens      | N/A                                     |
| Admin panel                      | SSO + MFA                       | Yes                                     |

### Secret Management

- All secrets stored in [Secret Manager — e.g., GCP Secret Manager / AWS Secrets Manager]
- No secrets in code, config files, or environment variable files committed to git
- Secrets rotated every [N] days for high-privilege credentials; annually for standard
- Shared secrets prohibited — each service has its own credentials

---

## 2. Data Handling and Encryption

### Encryption Standards

| Data State      | Requirement                                 | Standard                           |
| --------------- | ------------------------------------------- | ---------------------------------- |
| At rest         | Always encrypted                            | AES-256                            |
| In transit      | Always encrypted                            | TLS 1.2 minimum; TLS 1.3 preferred |
| Backups         | Encrypted before storage                    | AES-256                            |
| PII in database | Field-level encryption for sensitive fields | AES-256-GCM                        |

### Data Retention

| Data Class         | Retention Period                | Deletion Method        |
| ------------------ | ------------------------------- | ---------------------- |
| User personal data | [N] years after account closure | Secure deletion        |
| Audit logs         | [N] years                       | Archived, then deleted |
| Application logs   | [N] days                        | Automated deletion     |
| Backups            | [N] days                        | Automated deletion     |
| Financial records  | [N] years (statutory)           | Archived               |

### PII Handling Rules

- PII is never logged in application logs
- PII is never included in error messages or stack traces
- PII fields are masked in non-production environments
- Access to production PII is audited and restricted to need-to-know

---

## 3. Vulnerability Management

### CVE Response SLAs

| Severity              | Response Time               | Remediation Target     |
| --------------------- | --------------------------- | ---------------------- |
| Critical (CVSS ≥9.0)  | Acknowledge within 4 hours  | Patch within 24 hours  |
| High (CVSS 7.0–8.9)   | Acknowledge within 24 hours | Patch within 7 days    |
| Medium (CVSS 4.0–6.9) | Acknowledge within 72 hours | Patch within 30 days   |
| Low (CVSS <4.0)       | Acknowledge within 1 week   | Next scheduled release |

### Vulnerability Identification Sources

- Automated dependency scanning on every CI run
- Container image scanning before deployment
- SAST (static analysis) on every PR
- DAST (dynamic analysis) on staging weekly
- Annual penetration test by external firm

---

## 4. Dependency Audit Procedures

### Supply Chain Security

- All dependencies pinned to exact versions in production
- `pnpm audit` / `pip audit` / equivalent run on every CI build
- No new dependencies merged without reviewer approval
- Dependency licenses reviewed — no GPL in production services
- Transitive dependencies reviewed for known malicious packages

### Dependency Review Checklist

Before adding any new dependency:

- [ ] Package has active maintenance (commits within [N] months)
- [ ] No known critical CVEs
- [ ] License is compatible with commercial use
- [ ] Downloads/week > [N] (community validation)
- [ ] Source code reviewed for suspicious behavior
- [ ] Pinned to exact version

---

## 5. Penetration Testing

### Scope and Schedule

| Scope                                     | Frequency       | Provider                 |
| ----------------------------------------- | --------------- | ------------------------ |
| External attack surface (web, API)        | Annual          | [External security firm] |
| Internal network and privilege escalation | Annual          | [External security firm] |
| Mobile application                        | Annual          | [External security firm] |
| Red team exercise                         | Every [N] years | [External security firm] |

### Finding Classification and Response

| Severity | Disclosure Window    | Fix Target         |
| -------- | -------------------- | ------------------ |
| Critical | Immediate (24 hours) | 7 days             |
| High     | 7 days               | 30 days            |
| Medium   | 30 days              | 90 days            |
| Low      | 90 days              | Next release cycle |

All penetration test reports are stored in [secure location] and access is restricted to security team and C-suite.

---

## 6. Incident Response Overview

For full incident response procedures see `../../../5-devops/2-runbooks/`.

Summary of security incident classification:

| Level         | Definition                                              | First Response                |
| ------------- | ------------------------------------------------------- | ----------------------------- |
| P0 — Critical | Active data breach, ransomware, full service compromise | CTO + CISO within 1 hour      |
| P1 — High     | Unauthorized access discovered, credentials exposed     | Security lead within 4 hours  |
| P2 — Medium   | Suspicious activity, failed attack attempt              | Security team within 24 hours |
| P3 — Low      | Policy violation, minor misconfiguration                | Tracked in security backlog   |

---

## 7. Security Review Gates

| Trigger                          | Required Review               |
| -------------------------------- | ----------------------------- |
| New service going to production  | Full security review          |
| New external-facing API endpoint | Security review               |
| New data store or database       | Data classification review    |
| New third-party integration      | Vendor security due diligence |
| Major dependency upgrade         | CVE check + change review     |
| Infrastructure change            | Security architecture review  |

---

_Security is a baseline requirement, not a feature. All code and infrastructure must pass security review before reaching production._
