# POL-14: System Acquisition, Development and Maintenance

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

**Annex A Reference:** A.14 — System Development Controls
**Effective Date:** 2026-05-08
**Review Cycle:** Annual
**Owner:** CISO (co-owned with Head of Engineering)
**Approved By:** Board Security Committee

## 1. Purpose

Ensure information security is integrated into the development lifecycle of all GTCX systems.

## 2. Scope

All software development, system acquisition, and maintenance activities across the GTCX ecosystem (17 repositories).

## 3. Policy Statement

1. **Security requirements.** Security requirements are defined at project inception and tracked alongside functional requirements. Every system handling Confidential or Restricted data must have a documented threat model before development begins.

2. **Secure development.** Code is developed following OWASP secure coding guidelines. All code undergoes peer review (minimum one reviewer) before merge. Static analysis (linting, type checking) runs in CI for every pull request. Dependency vulnerabilities are scanned automatically; critical/high CVEs block merge.

3. **Testing.** Security testing is integrated into CI/CD: unit tests, integration tests, and where applicable, fuzz testing. Production deployments require all tests to pass. Penetration testing is conducted annually by an external firm. Findings are tracked to remediation.

4. **Separation of environments.** Development, staging, and production environments are strictly separated. Code promotion follows: dev -> staging -> production. Direct commits to production branches are prohibited. Infrastructure changes follow the same promotion path via IaC.

5. **Third-party software.** Acquired software and open-source dependencies are assessed for security before adoption. Approved dependencies are tracked in lockfiles (pnpm-lock.yaml). License compliance is validated. End-of-life dependencies are replaced within 90 days of EOL announcement.

## 4. Responsibilities

| Role                | Responsibility                                               |
| ------------------- | ------------------------------------------------------------ |
| Head of Engineering | Enforce SDLC, approve architecture decisions                 |
| CISO                | Define security requirements, review threat models           |
| Engineers           | Write secure code, conduct peer reviews, fix vulnerabilities |
| QA                  | Execute security test plans, validate remediation            |

## 5. Exceptions

Bypassing CI checks for emergency hotfixes requires CISO approval and a post-deploy review within 24 hours. The bypass and its justification are logged.

## 6. Review

Reviewed annually. Secure coding guidelines updated as new threat patterns emerge.
