# GTCX Risk Register

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

**Owner:** CISO
**Last Updated:** 2026-05-08
**Review Cycle:** Quarterly
**Approved By:** Board Security Committee

## Risk Appetite Statement

GTCX adopts a **conservative** risk appetite for information security, data protection, and regulatory compliance. The organization accepts **no** residual risk rated Critical (score 20-25) and tolerates High residual risk (score 12-19) only with documented compensating controls, Board approval, and active remediation plans. Medium residual risk (score 6-11) is acceptable when monitored quarterly. Low residual risk (score 1-5) is accepted and reviewed annually.

**Risk scoring:** Likelihood (1-5) x Impact (1-5) = Risk Score (1-25)

| Score Range | Rating   | Treatment Required                      |
| ----------- | -------- | --------------------------------------- |
| 20-25       | Critical | Immediate action, Board notification    |
| 12-19       | High     | Active mitigation plan within 30 days   |
| 6-11        | Medium   | Monitored quarterly, mitigation planned |
| 1-5         | Low      | Accepted, reviewed annually             |

---

## Risk Register

| ID    | Category       | Description                                                                                                                                                   | L   | I   | Score | Treatment | Controls / Actions                                                                                                                                                 | Residual L | Residual I | Residual Score | Owner        | Review Date |
| ----- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | --- | ----- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ---------- | -------------- | ------------ | ----------- |
| R-001 | Personnel      | **Key engineer departure.** Loss of critical knowledge holder for protocol cryptography or infrastructure. Single points of failure in the 17-repo ecosystem. | 4   | 4   | 16    | Mitigate  | Knowledge documentation, pair programming, credential escrow in secrets manager, backup personnel training, bus-factor > 2 for all critical systems                | 2          | 4          | 8              | CISO         | 2026-08-08  |
| R-002 | Compliance     | **Audit findings.** SOC 2 or ISO 27001 audit identifies material non-conformities, delaying customer trust or regulatory approvals.                           | 3   | 4   | 12    | Mitigate  | SOC 2 evidence pipeline (automated), controls matrix, quarterly internal audits, pre-audit gap assessments                                                         | 2          | 4          | 8              | CISO         | 2026-08-08  |
| R-003 | Regulatory     | **Regulatory change.** New data protection, AML, or financial services regulations in East Africa / Global South markets requiring system changes.            | 3   | 4   | 12    | Mitigate  | Regulatory register reviewed quarterly by Legal, modular compliance architecture, DPO monitors legislative pipeline                                                | 2          | 3          | 6              | Legal        | 2026-08-08  |
| R-004 | Cyber          | **DDoS attack.** Volumetric or application-layer attack disrupts production services and API availability.                                                    | 4   | 3   | 12    | Mitigate  | Cloud-native DDoS mitigation (AWS Shield), rate limiting at API gateway, auto-scaling, geographic distribution, incident response playbook                         | 2          | 3          | 6              | DevOps       | 2026-08-08  |
| R-005 | Cyber          | **Data breach.** Unauthorized access to Confidential or Restricted data (PII, financial records, cryptographic keys).                                         | 2   | 5   | 10    | Mitigate  | Encryption at rest and in transit, least privilege access, MFA, audit logging, DLP monitoring, incident response plan, 72-hour breach notification process         | 1          | 5          | 5              | CISO         | 2026-08-08  |
| R-006 | Supply Chain   | **Supply chain compromise.** Malicious code introduced through compromised dependency, container image, or CI/CD pipeline.                                    | 3   | 5   | 15    | Mitigate  | Dependency lockfiles (pnpm-lock.yaml), automated CVE scanning in CI, SBOM generation, container image signing, signed commits, dependency review before adoption   | 2          | 5          | 10             | Security Eng | 2026-08-08  |
| R-007 | Infrastructure | **Cloud provider outage.** AWS region-level outage affecting production services.                                                                             | 2   | 5   | 10    | Mitigate  | Multi-AZ deployment, database failover, backup region recovery plan, RPO 1h / RTO 4h, DR simulation tested annually                                                | 1          | 4          | 4              | DevOps       | 2026-08-08  |
| R-008 | Personnel      | **Insider threat.** Malicious or negligent actions by personnel with privileged access.                                                                       | 2   | 5   | 10    | Mitigate  | Separation of duties, privileged access monitoring, JIT access, background checks, security awareness training, audit log tamper protection (append-only audit DB) | 1          | 5          | 5              | CISO         | 2026-08-08  |
| R-009 | Cyber          | **Credential compromise.** Stolen or leaked credentials used to access GTCX systems.                                                                          | 3   | 4   | 12    | Mitigate  | MFA on all systems, SSO, 90-day token rotation, secrets manager (never in code), stale account auto-disable at 90 days, breach credential monitoring               | 2          | 4          | 8              | Security Eng | 2026-08-08  |
| R-010 | Operational    | **Deployment failure.** Bad deployment causes production outage or data corruption.                                                                           | 3   | 4   | 12    | Mitigate  | CI/CD pipeline with mandatory tests, IaC validation, canary deployments, automated rollback, staging environment validation, change management process             | 2          | 3          | 6              | DevOps       | 2026-08-08  |
| R-011 | Data           | **Data loss.** Accidental or malicious deletion of production data.                                                                                           | 2   | 5   | 10    | Mitigate  | Daily automated backups, separate backup region, monthly restore drills, RBAC on delete operations, soft-delete patterns, audit database is append-only            | 1          | 4          | 4              | DevOps       | 2026-08-08  |
| R-012 | Crypto         | **Cryptographic key compromise.** Private keys for protocol signatures (Ed25519) or encryption are exposed.                                                   | 2   | 5   | 10    | Mitigate  | Keys in KMS only, key rotation schedule (12/24 months), DID-based verification, hardware security module for root keys, access logging on key operations           | 1          | 5          | 5              | Security Eng | 2026-08-08  |
| R-013 | Compliance     | **License violation.** Use of open-source software in violation of license terms.                                                                             | 2   | 3   | 6     | Mitigate  | SBOM generation, license scanning in CI, approved license whitelist, legal review for copyleft dependencies                                                        | 1          | 3          | 3              | Legal        | 2026-08-08  |
| R-014 | Operational    | **Secrets exposure in code.** Credentials, API keys, or tokens committed to version control.                                                                  | 3   | 4   | 12    | Mitigate  | Pre-commit hooks for secret detection, CI scanning, secrets manager enforcement, .gitignore hardening, developer training                                          | 1          | 4          | 4              | Security Eng | 2026-08-08  |
| R-015 | Third Party    | **Critical vendor lock-in.** Over-dependence on AWS or GitHub creating migration risk or negotiating weakness.                                                | 2   | 3   | 6     | Accept    | IaC abstraction (Terraform), container-based workloads (portable), Git-based workflows (provider-agnostic), multi-cloud DR option documented                       | 2          | 3          | 6              | CTO          | 2026-08-08  |
| R-016 | Cyber          | **API abuse.** Automated attacks against public APIs (brute force, scraping, injection).                                                                      | 4   | 3   | 12    | Mitigate  | Rate limiting, input validation, WAF rules, replay protection (nonce + timestamp), API authentication required, monitoring and alerting                            | 2          | 3          | 6              | DevOps       | 2026-08-08  |
| R-017 | Regulatory     | **Sanctions screening failure.** Failure to properly screen counterparties leads to regulatory enforcement action.                                            | 2   | 5   | 10    | Mitigate  | Sentinel screening service, automated screening in transaction pipeline, screening list updates within 24h, manual review for fuzzy matches, audit trail           | 1          | 5          | 5              | Compliance   | 2026-08-08  |
| R-018 | Operational    | **Certificate expiry.** TLS or signing certificates expire, causing service disruption or verification failures.                                              | 3   | 3   | 9     | Mitigate  | Automated certificate rotation (90-day TLS), monitoring with 30/14/7-day alerts, certificate inventory maintained                                                  | 1          | 3          | 3              | DevOps       | 2026-08-08  |
| R-019 | Data           | **Database integrity.** Corruption or unauthorized modification of operational or audit database.                                                             | 2   | 5   | 10    | Mitigate  | Audit DB is append-only (never cross-write), RBAC on DBA operations, checksums on backups, replication monitoring, migration policy (never modify run migrations)  | 1          | 4          | 4              | DBA          | 2026-08-08  |
| R-020 | Personnel      | **Security training gap.** Personnel unaware of current threats or policies, leading to preventable incidents.                                                | 3   | 3   | 9     | Mitigate  | Mandatory onboarding training (14-day deadline), annual refresher, phishing simulations quarterly, access suspended for non-compliance after 30 days               | 2          | 2          | 4              | HR / CISO    | 2026-08-08  |

---

## Quarterly Review Process

1. **Preparation (Week 1).** CISO compiles incident data, control effectiveness metrics, and external threat intelligence since last review.
2. **Risk owner updates (Week 2).** Each risk owner reviews their assigned risks, updates likelihood/impact scores, and reports on treatment progress.
3. **Committee review (Week 3).** Board Security Committee reviews the updated register, approves score changes, and directs new treatments.
4. **Documentation (Week 4).** Updated register is committed to version control. New risks are added, resolved risks are archived (not deleted). Summary report is distributed to all risk owners.

## Archive

Resolved or retired risks are moved to `docs/compliance/risk-register-archive.md` with the date retired and the rationale. Risk IDs are never reused.
