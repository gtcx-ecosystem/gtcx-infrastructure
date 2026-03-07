# Security Audit — {repo-name}

## Audit Info

| Field        | Value                                            |
| ------------ | ------------------------------------------------ |
| Date         | {audit-date}                                     |
| Auditor      | {auditor-name}                                   |
| Scope        | {scope-description}                              |
| Commit / Tag | {commit-sha-or-tag}                              |
| Tools Used   | {tools — Snyk, npm audit, Trivy, gitleaks, etc.} |

## Executive Summary

**Overall Risk Level**: {Low / Medium / High / Critical}

| Metric                       | Count |
| ---------------------------- | ----- |
| Critical findings            | {n}   |
| High findings                | {n}   |
| Medium findings              | {n}   |
| Low / informational findings | {n}   |

{1-2 paragraph narrative summary of the audit results and key concerns.}

## OWASP Top 10 Assessment

| #   | Category                                   | Status      | Finding          | Severity                    |
| --- | ------------------------------------------ | ----------- | ---------------- | --------------------------- |
| A01 | Broken Access Control                      | {Pass/Fail} | {finding-or-N/A} | {Critical/High/Med/Low/N/A} |
| A02 | Cryptographic Failures                     | {Pass/Fail} | {finding-or-N/A} | {Critical/High/Med/Low/N/A} |
| A03 | Injection                                  | {Pass/Fail} | {finding-or-N/A} | {Critical/High/Med/Low/N/A} |
| A04 | Insecure Design                            | {Pass/Fail} | {finding-or-N/A} | {Critical/High/Med/Low/N/A} |
| A05 | Security Misconfiguration                  | {Pass/Fail} | {finding-or-N/A} | {Critical/High/Med/Low/N/A} |
| A06 | Vulnerable and Outdated Components         | {Pass/Fail} | {finding-or-N/A} | {Critical/High/Med/Low/N/A} |
| A07 | Identification and Authentication Failures | {Pass/Fail} | {finding-or-N/A} | {Critical/High/Med/Low/N/A} |
| A08 | Software and Data Integrity Failures       | {Pass/Fail} | {finding-or-N/A} | {Critical/High/Med/Low/N/A} |
| A09 | Security Logging and Monitoring Failures   | {Pass/Fail} | {finding-or-N/A} | {Critical/High/Med/Low/N/A} |
| A10 | Server-Side Request Forgery (SSRF)         | {Pass/Fail} | {finding-or-N/A} | {Critical/High/Med/Low/N/A} |

## Dependency Vulnerabilities

| Package        | Severity                | CVE              | Fix Available | Status                    |
| -------------- | ----------------------- | ---------------- | ------------- | ------------------------- |
| {package-name} | {Critical/High/Med/Low} | {CVE-YYYY-NNNNN} | {Yes/No}      | {Open/Mitigated/Resolved} |

**Total**: {n} vulnerabilities ({n} critical, {n} high, {n} medium, {n} low)

## Secrets Scanning

| Finding               | Location              | Type                          | Status                 |
| --------------------- | --------------------- | ----------------------------- | ---------------------- |
| {finding-description} | {file:line-or-commit} | {API key/Token/Password/.env} | {Open/Revoked/Rotated} |

**Tool output**: {Attach or link to full gitleaks / truffleHog report.}

## Authentication & Authorization

- [ ] JWT tokens validated on every protected endpoint
- [ ] Token expiry set to a reasonable duration ({expiry-duration})
- [ ] Refresh token rotation implemented
- [ ] Role-based access control (RBAC) enforced at API layer
- [ ] Session management follows best practices (secure, httpOnly, sameSite cookies)
- [ ] Password policy enforced (minimum length, complexity, breach database check)
- [ ] Account lockout / rate limiting on login attempts
- [ ] Multi-factor authentication available for privileged accounts

## Data Protection

- [ ] Encryption at rest enabled for all data stores
- [ ] Encryption in transit enforced (TLS 1.2+ only)
- [ ] PII identified and classified
- [ ] PII access logged and auditable
- [ ] Data retention policy defined and enforced
- [ ] Backup encryption verified
- [ ] Data anonymization / pseudonymization applied where appropriate

## Infrastructure

- [ ] CORS configuration restricts origins to known domains
- [ ] Content Security Policy (CSP) header configured
- [ ] Rate limiting enabled on public-facing endpoints
- [ ] TLS version 1.2 or higher enforced (no SSLv3, TLS 1.0, TLS 1.1)
- [ ] Security headers present: `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`
- [ ] HTTP methods restricted to those required
- [ ] Error responses do not leak stack traces or internal details
- [ ] Logging does not capture sensitive data (tokens, passwords, PII)

## Remediation Plan

Prioritized by severity (Critical first, then High, Medium, Low).

| #   | Finding           | Severity   | Owner        | Proposed Fix      | Due Date     |
| --- | ----------------- | ---------- | ------------ | ----------------- | ------------ |
| 1   | {finding-summary} | {Critical} | {owner-name} | {fix-description} | {YYYY-MM-DD} |
| 2   | {finding-summary} | {High}     | {owner-name} | {fix-description} | {YYYY-MM-DD} |
| 3   | {finding-summary} | {Medium}   | {owner-name} | {fix-description} | {YYYY-MM-DD} |
| 4   | {finding-summary} | {Low}      | {owner-name} | {fix-description} | {YYYY-MM-DD} |

## Sign-off

| Role             | Name   | Date         |
| ---------------- | ------ | ------------ |
| Security Lead    | {name} | {YYYY-MM-DD} |
| Engineering Lead | {name} | {YYYY-MM-DD} |
| Product Owner    | {name} | {YYYY-MM-DD} |
