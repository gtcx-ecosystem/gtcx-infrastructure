---
title: 'Zero Trust Assessment — GTCX Infrastructure'
status: 'current'
date: '2026-05-27'
owner: 'crypto-security-engineer'
role: 'crypto-security-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'architecture', 'infrastructure']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Zero Trust Assessment — GTCX Infrastructure

**Framework:** CISA Zero Trust Maturity Model v2.0
**Date:** 2026-05-08
**Assessor:** Infrastructure Security Team
**Next reassessment:** 2027-05-08

---

## Executive Summary

GTCX infrastructure is at **Intermediate** maturity across the five CISA Zero Trust pillars. Identity and Network controls are the strongest areas. Device posture and Data classification are the primary gaps requiring investment.

| Pillar       | Current Maturity | Target Maturity | Gap Severity |
| ------------ | ---------------- | --------------- | ------------ |
| Identity     | Advanced         | Optimal         | Medium       |
| Devices      | Traditional      | Advanced        | High         |
| Networks     | Advanced         | Optimal         | Low          |
| Applications | Intermediate     | Advanced        | Medium       |
| Data         | Intermediate     | Advanced        | Medium       |

---

## Pillar 1: Identity

### Current State

| Control                               | Status          | Details                                                                                    |
| ------------------------------------- | --------------- | ------------------------------------------------------------------------------------------ |
| IRSA (IAM Roles for Service Accounts) | Implemented     | All K8s workloads use IRSA; no static AWS credentials in pods                              |
| OIDC federation                       | Implemented     | GitHub Actions OIDC for CI/CD; no long-lived tokens                                        |
| mTLS service identity                 | Implemented     | Linkerd mesh provides SPIFFE-based identity for all service-to-service calls               |
| MFA for human access                  | Implemented     | Required for AWS console, kubectl proxy, and GitHub                                        |
| Continuous authentication             | Not implemented | Sessions are validate-once; no re-authentication on privilege escalation or context change |
| Behavioral analytics (UEBA)           | Not implemented | No runtime analysis of access patterns to detect compromised identities                    |

### Target State

- Continuous authentication: re-validate identity on sensitive operations (config changes, data exports, privilege escalation)
- UEBA integration: anomaly detection on API access patterns, impossible travel, unusual resource access
- Passwordless authentication for developer access (WebAuthn/FIDO2)

### Gap Analysis

| Gap                           | Risk                                                       | Remediation                                               | Priority | Timeline |
| ----------------------------- | ---------------------------------------------------------- | --------------------------------------------------------- | -------- | -------- |
| No continuous auth            | Compromised session token usable for full session lifetime | Implement step-up authentication for sensitive operations | High     | Q3 2026  |
| No UEBA                       | Compromised credentials undetected until manual review     | Deploy behavioral analytics on identity access logs       | Medium   | Q4 2026  |
| Password-based developer auth | Phishing risk                                              | Migrate to WebAuthn/FIDO2 for developer access            | Low      | Q1 2027  |

---

## Pillar 2: Devices

### Current State

| Control                  | Status          | Details                                                                                       |
| ------------------------ | --------------- | --------------------------------------------------------------------------------------------- |
| Device inventory         | Partial         | Corporate laptops tracked; BYOD and contractor devices not enrolled                           |
| Device posture checks    | Not implemented | No verification of OS version, disk encryption, or endpoint protection before granting access |
| MDM enrollment           | Not implemented | No mobile device management for accessing GTCX systems                                        |
| Endpoint detection (EDR) | Partial         | Deployed on corporate devices; not enforced as access condition                               |

### Target State

- Device posture as an access condition: deny access from devices that fail health checks (OS patched, disk encrypted, EDR active)
- Device certificate-based authentication for machine identity
- Conditional access policies: high-sensitivity resources require managed device

### Gap Analysis

| Gap                      | Risk                                                          | Remediation                                                         | Priority | Timeline |
| ------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------- | -------- | -------- |
| No device posture checks | Compromised or unpatched device can access production systems | Implement device trust verification (e.g., Beyond Identity, Kolide) | High     | Q3 2026  |
| No MDM                   | Unmanaged devices accessing sensitive resources               | Deploy MDM with conditional access integration                      | High     | Q3 2026  |
| EDR not enforced as gate | Device with disabled EDR can still access systems             | Integrate EDR status into access policy engine                      | Medium   | Q4 2026  |

---

## Pillar 3: Networks

### Current State

| Control                     | Status      | Details                                                                                           |
| --------------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| Default-deny network policy | Implemented | Kubernetes NetworkPolicy denies all ingress/egress by default; explicit allowlists per service    |
| Linkerd mTLS                | Implemented | All in-mesh traffic encrypted and authenticated via mTLS; mutual identity verification            |
| WAF                         | Implemented | Cloudflare WAF with OWASP CRS; rate limiting per client                                           |
| Network segmentation        | Partial     | VPC subnets separate public/private/database tiers; no micro-segmentation within application tier |
| DNS security                | Implemented | DNSSEC enabled; private DNS for internal services                                                 |

### Target State

- Micro-segmentation: per-service network policies that restrict lateral movement within the application tier
- Network traffic analytics: baseline normal traffic patterns, alert on anomalies
- Encrypted DNS (DoH/DoT) for all internal resolution

### Gap Analysis

| Gap                                   | Risk                                                     | Remediation                                                               | Priority | Timeline |
| ------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------- | -------- | -------- |
| No micro-segmentation within app tier | Lateral movement possible after initial compromise       | Implement per-service Cilium or Calico network policies with L7 filtering | Medium   | Q3 2026  |
| No network traffic analytics          | Anomalous traffic patterns (C2, exfiltration) undetected | Deploy network flow analysis (e.g., Cilium Hubble)                        | Low      | Q4 2026  |

---

## Pillar 4: Applications

### Current State

| Control          | Status          | Details                                                                                      |
| ---------------- | --------------- | -------------------------------------------------------------------------------------------- |
| replay-guard     | Implemented     | Nonce-based replay protection for all transaction endpoints                                  |
| WAF at edge      | Implemented     | OWASP CRS rules block common injection patterns                                              |
| Input validation | Implemented     | Schema validation on all API endpoints                                                       |
| RASP             | Not implemented | No runtime application self-protection (see `01-docs/09-security/rasp-integration-guide.md`) |
| SBOM generation  | Partial         | Dependency lockfiles exist; no formal SBOM in SPDX/CycloneDX format                          |
| SLSA provenance  | In progress     | Workflow defined; not yet enforced as deployment gate                                        |

### Target State

- RASP deployed in monitor mode on replay-guard, then all Node.js services
- SBOM generated for every release in CycloneDX format
- SLSA L3 provenance verification required before any production deployment
- Application-level anomaly detection (unusual API call patterns)

### Gap Analysis

| Gap               | Risk                                         | Remediation                                              | Priority | Timeline |
| ----------------- | -------------------------------------------- | -------------------------------------------------------- | -------- | -------- |
| No RASP           | Zero-day application exploits bypass WAF     | Deploy RASP per integration guide; 30-day monitor period | High     | Q3 2026  |
| No formal SBOM    | Supply chain visibility gap; compliance risk | Generate CycloneDX SBOM in CI pipeline                   | Medium   | Q3 2026  |
| SLSA not enforced | Tampered artifacts could reach production    | Enable SLSA verification as deployment gate              | Medium   | Q3 2026  |

---

## Pillar 5: Data

### Current State

| Control                    | Status          | Details                                                         |
| -------------------------- | --------------- | --------------------------------------------------------------- |
| Encryption at rest         | Implemented     | AES-256-GCM via AWS KMS for all databases and object storage    |
| Encryption in transit      | Implemented     | TLS 1.3 minimum for all external connections; mTLS for internal |
| Backup encryption          | Implemented     | All backups encrypted with customer-managed keys                |
| Data classification labels | Not implemented | No automated or manual classification of data assets            |
| DLP                        | Not implemented | No data loss prevention controls on egress paths                |
| Data access logging        | Partial         | Database audit logs exist; no unified data access audit trail   |

### Target State

- Data classification taxonomy applied to all databases, object stores, and API responses
- DLP rules at network egress to detect sensitive data leaving the perimeter
- Unified data access audit trail across all storage systems
- Automated PII detection and redaction in non-production environments

### Gap Analysis

| Gap                          | Risk                                                       | Remediation                                    | Priority | Timeline |
| ---------------------------- | ---------------------------------------------------------- | ---------------------------------------------- | -------- | -------- |
| No classification labels     | Cannot enforce data-level access policies; compliance risk | Define taxonomy and label all data stores      | High     | Q3 2026  |
| No DLP                       | Sensitive data exfiltration undetected                     | Deploy DLP on network egress and API responses | Medium   | Q4 2026  |
| No unified data access trail | Forensic investigation gaps                                | Centralize data access logs in SIEM            | Medium   | Q4 2026  |

---

## Cross-Cutting: Visibility and Analytics

| Control                    | Status          | Details                                                        |
| -------------------------- | --------------- | -------------------------------------------------------------- |
| Centralized logging        | Implemented     | Structured logs aggregated in SIEM                             |
| Metrics and alerting       | Implemented     | Prometheus + Grafana with alert rules                          |
| Distributed tracing        | Partial         | Linkerd provides TCP-level tracing; no application-level spans |
| Security event correlation | Not implemented | No automated correlation of events across pillars              |

---

## Reassessment Schedule

| Assessment                 | Frequency                | Next Date             | Owner                        |
| -------------------------- | ------------------------ | --------------------- | ---------------------------- |
| Full Zero Trust assessment | Annual                   | 2027-05-08            | Infrastructure Security Team |
| Pillar-specific deep dive  | Quarterly (rotating)     | 2026-08-08 (Identity) | Security Champion            |
| Control validation         | Continuous               | Ongoing               | Automated via CI             |
| Post-incident reassessment | After any P1/P2 incident | As needed             | Incident Commander           |

### Annual Reassessment Process

1. Review all five pillars against the latest CISA maturity model
2. Update current state based on controls deployed since last assessment
3. Validate that remediation items from the previous assessment were completed
4. Identify new gaps introduced by architecture changes
5. Update target state and timelines
6. Present findings to security steering committee
7. Publish updated assessment to `01-docs/09-security/zero-trust-assessment.md`

---

## References

- CISA Zero Trust Maturity Model v2.0: https://www.cisa.gov/zero-trust-maturity-model
- NIST SP 800-207 (Zero Trust Architecture): https://csrc.nist.gov/publications/detail/sp/800-207/final
- GTCX security architecture: `01-docs/09-security/security-architecture.md`
- GTCX RASP integration guide: `01-docs/09-security/rasp-integration-guide.md`
