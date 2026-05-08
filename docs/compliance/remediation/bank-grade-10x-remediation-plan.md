# Bank-Grade 10/10 Remediation Plan

**Target:** Achieve 10/10 across all control domains under FFIEC, PCI-DSS, SOC 2, and ISO 27001 frameworks.
**Timeline:** 12 months (4 phases, 3 months each)
**Governance:** Quarterly board security committee review + monthly steering committee

---

## Executive Summary

| Current                | Target             | Timeline  | Investment Level                                                                       |
| ---------------------- | ------------------ | --------- | -------------------------------------------------------------------------------------- |
| 6.5/10 (fintech-ready) | 10/10 (bank-grade) | 12 months | High — requires dedicated security engineer, external auditors, HSM/KMS infrastructure |

**Critical path:** HSM/KMS → mTLS production → WORM audit storage → SOC 2 Type II audit → Pen-test remediation

---

## Phase 1: Foundation (Months 1–3)

### 1.1 Cryptographic Key Management (3.0 → 6.0)

| #     | Task                                                                                                             | Owner             | Acceptance Criteria                                                                                                           | Effort  |
| ----- | ---------------------------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------- |
| 1.1.1 | **AWS KMS integration** — Replace Web Crypto API signing with AWS KMS asymmetric keys (ECC_NIST_P256 or Ed25519) | Security Engineer | `aws kms sign` produces valid signatures; key policy restricts to replay-guard IAM role; key rotation every 90 days automated | 2 weeks |
| 1.1.2 | **Key ceremony documentation** — Dual-control key generation with 2-of-3 quorum                                  | CISO              | Documented ceremony with witness signatures; video recording stored in tamper-evident storage; HSM-backed if budget allows    | 1 week  |
| 1.1.3 | **Key rotation automation** — Automated 90-day rotation with backward compatibility                              | Platform Engineer | CI job rotates KMS key; old key remains valid for 30 days (grace period); zero-downtime rotation proven in staging            | 2 weeks |
| 1.1.4 | **Key access logging** — CloudTrail for every KMS API call                                                       | Security Engineer | CloudTrail log group with alarm on `Decrypt`/`Sign` from unexpected IAM roles; log retention 7 years                          | 3 days  |

**Phase 1 score target:** 6.0/10

---

### 1.2 Network Security (5.0 → 7.0)

| #     | Task                                                                             | Owner             | Acceptance Criteria                                                                                                                   | Effort  |
| ----- | -------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 1.2.1 | **Linkerd production deployment** — Control plane + data plane in all namespaces | Platform Engineer | `linkerd check` passes; `linkerd viz stat deploy -n gtcx` shows TLS=ok for 100% of pods; p99 latency delta <5ms vs baseline           | 2 weeks |
| 1.2.2 | **Mesh policy lockdown** — Deny-by-default + per-service allowlists              | Security Engineer | `AuthorizationPolicy` resources deployed; unauthorized cross-service calls return 403; policy violations logged to SIEM               | 1 week  |
| 1.2.3 | **AWS WAF v2** — Web Application Firewall in front of ALB                        | Security Engineer | OWASP Core Rule Set enabled; rate limiting (100 req/min per IP); geo-blocking for sanctioned countries; blocked requests logged to S3 | 1 week  |
| 1.2.4 | **VPC Flow Logs** — Enable and monitor with GuardDuty                            | Platform Engineer | Flow logs to S3 with 30-day retention; GuardDuty anomaly detection for port scanning / data exfiltration                              | 3 days  |

**Phase 1 score target:** 7.0/10

---

### 1.3 Access Control (5.0 → 6.5)

| #     | Task                                                                      | Owner             | Acceptance Criteria                                                                                                        | Effort  |
| ----- | ------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------- | ------- |
| 1.3.1 | **SoD matrix v1** — Document separation of duties for all critical roles  | CISO              | Matrix covers: deploy, sign, audit, infra admin; quarterly review calendar established; board-approved                     | 1 week  |
| 1.3.2 | **Break-glass procedure** — Emergency access with automatic alerting      | Security Engineer | Documented playbook; 15-minute max session; PagerDuty alert on every break-glass use; post-incident review mandatory       | 3 days  |
| 1.3.3 | **Just-in-Time (JIT) access** — Temporary privilege elevation for K8s/AWS | Platform Engineer | AWS IAM Identity Center + JIT roles; K8s RBAC with `kubectl-access` tool; sessions auto-expire after 4 hours               | 2 weeks |
| 1.3.4 | **MFA everywhere** — Enforce MFA for all AWS, GitHub, and VPN access      | Security Engineer | AWS IAM policy denies non-MFA API calls; GitHub organization MFA enforced; Okta/Auth0 or AWS SSO with hardware key support | 1 week  |

**Phase 1 score target:** 6.5/10

---

### 1.4 Code Security & SDLC (7.5 → 8.5)

| #     | Task                                                                   | Owner             | Acceptance Criteria                                                                                                                              | Effort  |
| ----- | ---------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| 1.4.1 | **SAST with custom queries** — CodeQL custom queries for crypto misuse | Security Engineer | Custom query detects: hardcoded keys, weak randomness, unverified JWTs; runs in CI on every PR; blocks merge on detection                        | 1 week  |
| 1.4.2 | **DAST pipeline** — OWASP ZAP automated scanning                       | Security Engineer | Weekly ZAP scan against staging; baseline established; new findings auto-ticketed; critical/high findings block release                          | 1 week  |
| 1.4.3 | **Signed container images** — Cosign + Sigstore keyless signing        | Platform Engineer | Every image signed with Fulcio/Rekor; admission controller (`kyverno` or `opa-gatekeeper`) rejects unsigned images; signature verification in CI | 2 weeks |
| 1.4.4 | **SBOM generation** — Syft/CycloneDX for every release                 | Platform Engineer | SBOM generated in CI and attached to GitHub release; vulnerability diff between versions; retention aligned with artifact retention              | 3 days  |
| 1.4.5 | **Signed Git commits** — Require GPG/SSH commit signing                | Security Engineer | GitHub branch protection rejects unsigned commits; all maintainers enrolled; YubiKey or hardware-backed signing keys                             | 3 days  |

**Phase 1 score target:** 8.5/10

---

## Phase 2: Hardening (Months 4–6)

### 2.1 Audit Trail Integrity (5.0 → 8.0)

| #     | Task                                                                | Owner             | Acceptance Criteria                                                                                                                                       | Effort  |
| ----- | ------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 2.1.1 | **WORM audit storage** — Deploy immudb or AWS QLDB for audit events | Platform Engineer | All replay-protection audit events written to immudb/QLDB; cryptographic proof (merkle root) generated every 60s; tamper detection alert if root mismatch | 3 weeks |
| 2.1.2 | **Audit event integrity API** — Endpoint to verify event inclusion  | Security Engineer | `/v1/audit/verify?eventId={id}` returns merkle proof; third party can independently verify without db access                                              | 1 week  |
| 2.1.3 | **7-year retention enforcement** — S3 Glacier + lifecycle policies  | Platform Engineer | Automated daily export from immudb to S3 Glacier Deep Archive; legal hold capability; deletion only after 7 years + legal review                          | 1 week  |
| 2.1.4 | **Real-time audit monitoring** — Anomaly detection on audit stream  | Security Engineer | ML-based anomaly detection (sudden volume drop, unusual DID patterns, off-hours activity); integrated with SIEM                                           | 2 weeks |

**Phase 2 score target:** 8.0/10

---

### 2.2 Operational Resilience (6.0 → 8.5)

| #     | Task                                                                    | Owner             | Acceptance Criteria                                                                                                                            | Effort  |
| ----- | ----------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 2.2.1 | **Multi-region active-active** — Deploy to secondary region (eu-west-1) | Platform Engineer | Traffic split 50/50 via Route53 latency routing; database replication lag <1s; failover automatic (<30s)                                       | 4 weeks |
| 2.2.2 | **Board-approved RTO/RPO** — Document and test quarterly                | CISO              | RTO: 5 minutes; RPO: 0 (synchronous replication); board resolution signed; quarterly DR test with regulator witness                            | 1 week  |
| 2.2.3 | **Production chaos engineering** — Litmus/Gremlin in production         | Platform Engineer | Monthly chaos experiments: pod kill, network partition, AZ failure; SLO-based abort criteria; post-experiment report published                 | 2 weeks |
| 2.2.4 | **Backup immutability** — Immutable backups with air-gap                | Platform Engineer | Daily snapshots to S3 with Object Lock (compliance mode); 30-day minimum retention; cross-region replication; annual restore-from-scratch test | 1 week  |

**Phase 2 score target:** 8.5/10

---

### 2.3 Data Protection (5.0 → 7.5)

| #     | Task                                                                 | Owner             | Acceptance Criteria                                                                                                                                          | Effort  |
| ----- | -------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| 2.3.1 | **Data classification labels** — Tag all data at rest and in transit | CISO              | 4-tier classification: Public, Internal, Confidential, Restricted; labels enforced in K8s (pod annotations), S3 (object tags), and DB (column tags)          | 2 weeks |
| 2.3.2 | **Tokenization for PII** — Replace sensitive fields with tokens      | Security Engineer | All PII fields tokenized via AWS Tokenization Vault or HashiCorp Vault; detokenization requires explicit authorization; audit trail for every detokenization | 3 weeks |
| 2.3.3 | **Encryption at rest everywhere** — Verify and enforce               | Platform Engineer | EBS encrypted (KMS CMK); RDS encrypted; S3 SSE-KMS; Redis AUTH + TLS; Terraform module enforces encryption on all new resources                              | 1 week  |
| 2.3.4 | **Automated retention & deletion** — GDPR/CCPA compliant             | CISO              | Retention policy engine: auto-delete after retention period; legal hold capability; deletion certificate generated; right-to-erasure API (<30 days)          | 2 weeks |

**Phase 2 score target:** 7.5/10

---

### 2.4 Incident Response (4.0 → 7.0)

| #     | Task                                                                            | Owner             | Acceptance Criteria                                                                                                                                     | Effort  |
| ----- | ------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 2.4.1 | **Formal IRP v1.0** — Board-approved incident response plan                     | CISO              | Document: severity classification, escalation matrix, regulatory notification SLAs, law enforcement liaison, PR/communications playbook; board sign-off | 2 weeks |
| 2.4.2 | **24/7 SOC capability** — Either internal or managed (e.g., Expel, Arctic Wolf) | CISO              | SOC monitors all alerts; 15-minute MTTR for critical; weekly threat intel brief; quarterly tabletop exercise with board observer                        | 4 weeks |
| 2.4.3 | **Forensic readiness** — Memory capture, packet capture, disk imaging           | Security Engineer | Automated memory dump on crash; VPC traffic mirroring to forensic VPC; disk snapshot retention 90 days; chain-of-custody procedure                      | 2 weeks |
| 2.4.4 | **Regulatory pre-notification** — Agreements with relevant regulators           | CISO              | Pre-negotiated notification timelines with central bank, data protection authority, and payment scheme; template notifications prepared                 | 1 week  |

**Phase 2 score target:** 7.0/10

---

## Phase 3: Compliance & Certification (Months 7–9)

### 3.1 External Validation

| #     | Task                                                                        | Owner | Acceptance Criteria                                                                                                                                   | Effort   |
| ----- | --------------------------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 3.1.1 | **Penetration test** — Engage accredited firm (e.g., NCC Group, Bishop Fox) | CISO  | Full-scope pen-test: network, application, mobile, social engineering; report with CVSS scoring; all critical/high findings remediated within 30 days | 4 weeks  |
| 3.1.2 | **SOC 2 Type II audit** — Engage CPA firm                                   | CISO  | Audit scope: Trust Services Criteria (Security, Availability, Confidentiality); 6-month observation period; clean opinion letter                      | 6 months |
| 3.1.3 | **ISO 27001 certification** — ISMS implementation + audit                   | CISO  | Scope statement, risk register, SoA, internal audit, stage 1 + stage 2 external audit; certificate issued                                             | 4 months |
| 3.1.4 | **PCI-DSS assessment** — If handling cardholder data                        | CISO  | SAQ-D or ROC (depending on volume); QSA engagement; ASV scan quarterly; clean attestation                                                             | 3 months |

### 3.2 Documentation & Governance

| #     | Task                                                                      | Owner | Acceptance Criteria                                                                                                                  | Effort  |
| ----- | ------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| 3.2.1 | **Security policies library** — 20+ policies aligned to ISO 27001 Annex A | CISO  | Access control, cryptography, physical security, supplier relationships, incident management, business continuity, etc.              | 4 weeks |
| 3.2.2 | **Risk register** — Quantified risk with treatment plans                  | CISO  | All risks rated (likelihood × impact); treatment: mitigate, transfer, accept, avoid; residual risk within appetite; quarterly review | 2 weeks |
| 3.2.3 | **Board security committee** — Quarterly reviews                          | CISO  | Charter approved; CISO reports quarterly; risk appetite reviewed annually; security budget approved                                  | 1 week  |
| 3.2.4 | **Vendor risk program** — Assess all critical suppliers                   | CISO  | All vendors scored (critical/high/medium/low); annual reassessment; contractual security requirements; right-to-audit clause         | 2 weeks |

---

## Phase 4: Continuous Excellence (Months 10–12)

### 4.1 Advanced Controls

| #     | Task                                                                         | Owner             | Acceptance Criteria                                                                                                                  | Effort  |
| ----- | ---------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| 4.1.1 | **Runtime application self-protection (RASP)** — Integrate with replay-guard | Security Engineer | RASP agent detects and blocks: SQL injection, command injection, deserialization attacks; zero false positives in 30-day observation | 2 weeks |
| 4.1.2 | **Threat modeling automation** — STRIDE per feature                          | Security Engineer | Every new feature requires threat model; automated STRIDE checklist in PR template; security champion sign-off                       | 1 week  |
| 4.1.3 | **Supply chain attestation (SLSA L3)** — Provenance for all artifacts        | Platform Engineer | SLSA provenance generated in CI; attestation verified on deployment; Rekor transparency log entry for every build                    | 2 weeks |
| 4.1.4 | **Zero Trust architecture review** — Independent assessment                  | CISO              | Third-party Zero Trust assessment; gap analysis; remediation plan; annual re-assessment                                              | 2 weeks |
| 4.1.5 | **Red team exercise** — Simulate advanced persistent threat                  | CISO              | Annual red team with assumed breach; purple team debrief; findings integrated into risk register; board briefing                     | 2 weeks |

### 4.2 Continuous Monitoring & Improvement

| #     | Task                                                          | Owner             | Acceptance Criteria                                                                                            | Effort  |
| ----- | ------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------- | ------- |
| 4.2.1 | **Security metrics dashboard** — Executive-level KPIs         | CISO              | MTTR, vulnerability density, patch latency, pen-test findings trend, audit coverage %; monthly board report    | 1 week  |
| 4.2.2 | **Automated compliance drift detection** — Terraform + OPA    | Platform Engineer | OPA/Gatekeeper policies prevent non-compliant resources; daily drift scan; auto-remediation for low-risk drift | 2 weeks |
| 4.2.3 | **Bug bounty program** — Public or invite-only                | CISO              | Program live on HackerOne or Bugcrowd; triage SLA; public disclosure policy; annual budget                     | 2 weeks |
| 4.2.4 | **Security culture program** — Training + phishing simulation | CISO              | Annual training for all staff; quarterly phishing simulation; <5% click rate; security champions per team      | Ongoing |

---

## Resource Requirements

| Role                                | FTE | Duration  | Cost Estimate    |
| ----------------------------------- | --- | --------- | ---------------- |
| CISO / Head of Security             | 1.0 | Permanent | $250K–$400K/yr   |
| Security Engineer (crypto + appsec) | 1.0 | Permanent | $180K–$280K/yr   |
| Platform Engineer (K8s / cloud)     | 0.5 | Permanent | $90K–$140K/yr    |
| External SOC (managed)              | —   | Permanent | $50K–$100K/yr    |
| Pen-test (annual)                   | —   | 4 weeks   | $50K–$100K       |
| SOC 2 Type II audit                 | —   | 6 months  | $40K–$80K        |
| ISO 27001 certification             | —   | 4 months  | $30K–$60K        |
| PCI-DSS QSA (if applicable)         | —   | 3 months  | $30K–$60K        |
| HSM / Cloud KMS                     | —   | Permanent | $10K–$30K/yr     |
| WORM storage (immudb/QLDB)          | —   | Permanent | $5K–$15K/yr      |
| **Total Year 1**                    |     |           | **~$750K–$1.3M** |

---

## Governance & Tracking

### Steering Committee (Monthly)

- CISO (chair)
- CTO
- Platform Engineering lead
- Security Engineer
- Compliance officer (external or internal)

### Board Security Committee (Quarterly)

- Independent director (chair)
- CEO
- CISO
- External security advisor

### KPI Dashboard

| Metric                            | Current | Month 3 | Month 6 | Month 9 | Month 12 |
| --------------------------------- | ------- | ------- | ------- | ------- | -------- |
| Overall score                     | 6.5     | 7.0     | 7.8     | 8.5     | 10.0     |
| Critical open findings            | TBD     | 0       | 0       | 0       | 0        |
| MTTR (critical)                   | —       | <4h     | <2h     | <1h     | <30min   |
| Pen-test findings (critical/high) | —       | —       | 0       | 0       | 0        |
| SOC 2 observations                | —       | —       | —       | 0       | Clean    |
| ISO 27001 non-conformities        | —       | —       | —       | 0       | 0        |
| Code coverage                     | —       | >80%    | >85%    | >90%    | >95%     |
| Vulnerability patch latency       | —       | <7d     | <3d     | <24h    | <4h      |

---

## Risk & Dependencies

| Risk                                        | Probability | Impact | Mitigation                                                        |
| ------------------------------------------- | ----------- | ------ | ----------------------------------------------------------------- |
| Key engineer departure                      | Medium      | High   | Document everything; cross-train; retain with equity              |
| Audit findings require architecture changes | Medium      | High   | Early engagement with auditor; pre-assessment in Month 2          |
| Mobile client cannot support KMS signing    | Low         | High   | Maintain Web Crypto API fallback with clear risk acceptance       |
| Budget constraints                          | Medium      | Medium | Phase 1–2 are mandatory; Phase 3–4 can be phased based on revenue |
| Regulatory scope creep                      | Medium      | Medium | Clear scope definition; legal review of all commitments           |

---

## Evidence Package for Final Audit

At Month 12, the auditor should receive:

1. **Cryptography:** KMS key policies, key ceremony video, rotation logs, FIPS mode evidence
2. **Network:** Linkerd TLS=ok screenshots, WAF rules, VPC flow analysis, pen-test report
3. **Audit:** immudb/QLDB merkle proofs, 7-year retention evidence, integrity verification API demo
4. **Access:** SoD matrix, JIT access logs, break-glass post-mortems, MFA enrollment report
5. **Resilience:** Multi-region failover demo, RTO/RPO test results, chaos engineering reports
6. **Code:** Signed commits, signed containers, SBOMs, SAST/DAST reports, SLSA provenance
7. **Compliance:** SOC 2 Type II report, ISO 27001 certificate, PCI-DSS AOC, IRP test logs
8. **Governance:** Board minutes, risk register, security metrics dashboard, vendor assessments

---

_Last updated: 2026-05-08_
_Next review: 2026-06-08 (monthly steering committee)_
