---
title: 'GTCX Infrastructure — Penetration Test Scope & RFP'
status: 'draft'
date: '2026-05-12'
owner: 'crypto-security-engineer'
role: 'crypto-security-engineer'
tier: 'critical'
tags: ['security', 'compliance', 'infrastructure', 'testing', 'api']
review_cycle: 'quarterly'
---

# GTCX Infrastructure — Penetration Test Scope & RFP

**Status:** Vendor shortlist complete — awaiting leadership selection & RFP send
**Shortlist:** See [`pen-test-vendor-shortlist.md`](./pen-test-vendor-shortlist.md)  
**Owner:** Security/Leadership  
**Date:** 2026-05-11
**Engagement type:** Black-box + grey-box hybrid
**Target completion:** 2026-06-30
**Budget estimate:** $25,000–$45,000 USD
**Accreditation required:** CREST, OSCP-led team, or equivalent

---

## 1. Executive Summary

GTCX Protocol requires an independent, accredited penetration test of its infrastructure before any regulated pilot deployment. This document defines the scope, methodology, acceptance criteria, and deliverables for the engagement.

**Business context:** GTCX is an AI-native compliance gateway for African commodity trade. It handles verifiable credentials, custody chains, settlement execution, and attestation networks. A successful pen-test is a hard gate for SOC 2 Type II observation and central-bank-adjacent pilot agreements.

---

## 2. Scope

### 2.1 In-Scope Assets

| Asset                                         | Type             | Environment       | Notes                                                                                                                |
| --------------------------------------------- | ---------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| `api.gtcx.trade` / `api.testnet.gtcx.trade`   | Web API          | Testnet + Staging | All protocol handlers (`/v1/tradepass/*`, `/v1/vaultmark/*`, `/v1/pvp/*`, `/v1/panx/*`, `/v1/gci/*`, `/v1/geotag/*`) |
| Compliance Gateway (`/v1/query`, `/v1/tools`) | AI Gateway       | Staging           | Natural-language to protocol routing; auth boundary is critical                                                      |
| Replay Protection (`/v1/replay/verify`)       | Security Service | Staging           | Signed-request contract verification                                                                                 |
| gtcx-platforms                                | Core Service     | Production        | KMS signing integration, IRSA token flow, container security hardening                                               |
| Kubernetes ingress + ALB                      | Infrastructure   | Staging           | AWS ALB, WAF rules, TLS termination                                                                                  |
| PostgreSQL (primary + audit)                  | Database         | Staging           | Data at rest, access controls, privilege escalation                                                                  |
| Redis (nonce store)                           | Cache/Store      | Staging           | Key exposure, unauthorized access                                                                                    |
| ECR container images                          | Supply Chain     | Registry          | Image tampering, secret leakage                                                                                      |
| CI/CD pipeline                                | DevOps           | GitHub Actions    | Artifact integrity, secret exfiltration                                                                              |

### 2.2 Out-of-Scope

- Third-party LLM providers (OpenAI, Anthropic, Google) — their security is their responsibility
- Physical security of AWS data centers
- Social engineering against GTCX employees
- Mobile applications (gtcx-mobile) — separate engagement

### 2.3 Grey-Box Credentials (Provided to Tester)

| Credential                                  | Purpose                       | TTL    |
| ------------------------------------------- | ----------------------------- | ------ |
| Read-only API token                         | Test read-only boundary       | 7 days |
| Mutate-capable API token + approval headers | Test mutation gating          | 7 days |
| Kubernetes read-only role                   | Review manifests, not execute | 7 days |
| Staging DB read-only credentials            | Verify constraint enforcement | 7 days |

---

## 3. Methodology

### 3.1 OWASP Testing Guide v4.2

All in-scope web APIs must be tested against:

- **OTG-INFO-001** through **OTG-INFO-010** — Information gathering
- **OTG-AUTHN-001** through **OTG-AUTHN-004** — Authentication testing
- **OTG-AUTHZ-001** through **OTG-AUTHZ-004** — Authorization testing
- **OTG-INPVAL-001** through **OTG-INPVAL-014** — Input validation
- **OTG-BUSLOGIC-001** through **OTG-BUSLOGIC-009** — Business logic
- **OTG-CLIENT-001** through **OTG-CLIENT-012** — Client-side testing
- **OTG-CONFIG-001** through **OTG-CONFIG-011** — Configuration testing

### 3.2 AI-Specific Attack Vectors

| Vector                                      | Target                            | Expected Defense                        |
| ------------------------------------------- | --------------------------------- | --------------------------------------- |
| Prompt injection to bypass tool segregation | `/v1/query`                       | Runtime policy prompt should refuse     |
| Tool enumeration without auth               | `/v1/tools`                       | 401/403                                 |
| Mutating tool invocation without approval   | `/v1/query` with mutating payload | 403 or policy refusal                   |
| Exfiltration via tool callbacks             | Protocol handlers                 | NetworkPolicy egress restrictions       |
| Model context poisoning                     | LLM routing chain                 | No direct user control of system prompt |

### 3.3 Infrastructure Attack Vectors

| Vector                            | Target        | Expected Defense                          |
| --------------------------------- | ------------- | ----------------------------------------- |
| Container escape                  | K8s pods      | Non-root, read-only rootfs, seccomp       |
| Pod-to-pod lateral movement       | K8s namespace | NetworkPolicy restrictions                |
| Secret exfiltration from env vars | K8s pods      | Secrets mounted via secretKeyRef, not env |
| Privilege escalation via RBAC     | K8s API       | Principle of least privilege              |
| RDS credential brute-force        | PostgreSQL    | IAM auth, no password auth                |
| Redis command injection           | Redis         | No exposed Redis port, auth required      |

---

## 4. Acceptance Criteria

### 4.1 Critical Findings (Block Release)

Any of the following findings will block the pilot packet:

- Unauthenticated access to mutating protocol endpoints
- Bypass of approval gating for consequential operations
- Container escape to host
- RDS credential exposure or privilege escalation
- Supply chain compromise (unsigned images, compromised dependencies)
- Secret exfiltration from CI/CD pipeline

### 4.2 Severity Mapping

| Severity      | CVSS Range | Response Time | Fix Before                |
| ------------- | ---------- | ------------- | ------------------------- |
| Critical      | 9.0–10.0   | 24 hours      | Pilot launch blocked      |
| High          | 7.0–8.9    | 72 hours      | Pilot launch blocked      |
| Medium        | 4.0–6.9    | 2 weeks       | SOC 2 observation start   |
| Low           | 0.1–3.9    | 30 days       | Type II report submission |
| Informational | 0.0        | 90 days       | Continuous improvement    |

---

## 5. Deliverables

| #   | Deliverable                               | Format      | Due                    |
| --- | ----------------------------------------- | ----------- | ---------------------- |
| 1   | Executive summary (non-technical)         | PDF         | Day 5 of report phase  |
| 2   | Technical findings report                 | PDF + JSON  | Day 7 of report phase  |
| 3   | Remediation roadmap                       | Spreadsheet | Day 7 of report phase  |
| 4   | Re-test evidence (if critical/high fixed) | PDF         | Day 14 of report phase |
| 5   | Signed attestation letter                 | PDF         | Day 14 of report phase |

### 5.1 Technical Report Structure

Each finding must include:

- CWE and CVE references (if applicable)
- Affected asset and version
- Proof-of-concept ( sanitized, no production data)
- Risk rating with CVSS v3.1 vector
- Remediation recommendation with effort estimate
- Screenshot or terminal output evidence

---

## 6. Timeline

| Phase                    | Duration | Activities                                                   |
| ------------------------ | -------- | ------------------------------------------------------------ |
| Kickoff                  | 2 days   | Scope confirmation, credential handover, rules of engagement |
| Reconnaissance           | 3 days   | OSINT, service enumeration, dependency mapping               |
| Vulnerability Assessment | 5 days   | Automated scanning + manual verification                     |
| Exploitation             | 5 days   | Controlled exploitation of confirmed vulnerabilities         |
| Post-Exploitation        | 3 days   | Lateral movement, pivoting, impact analysis                  |
| Reporting                | 5 days   | Draft report, client review, final report                    |
| Re-test (if needed)      | 3 days   | Verify critical/high remediation                             |

**Total engagement:** ~26 business days (5–6 weeks)

---

## 7. Rules of Engagement

1. **No production testing** — staging and testnet only
2. **Business hours** — 08:00–18:00 SAST (UTC+2) for any disruptive tests
3. **Notification required** — 24 hours notice before AZ-failure or cluster-wide tests
4. **Data handling** — no PII, no production data, all findings encrypted at rest
5. **Communication** — Slack channel `#security-pentest-2026` for real-time coordination
6. **Abort signal** — GTCX can abort any test via `@pentest-abort` in Slack

---

## 8. Contact

| Role                       | Name                 | Channel                        |
| -------------------------- | -------------------- | ------------------------------ |
| Engagement lead            | TBD                  | security@gtcx.trade            |
| Technical point of contact | Platform Engineering | `#security-pentest-2026`       |
| Escalation                 | CISO                 | security-escalation@gtcx.trade |

---

## 9. Evidence & Tracking

- Engagement letter: `docs/audit/pen-test-engagement-letter-2026.pdf` (to be added)
- Findings tracker: GitHub Issues with `security/pen-test` label
- Remediation tracker: GitHub Projects board `Security Remediation Q3 2026`
- Final attestation: `docs/audit/pen-test-attestation-2026.pdf` (to be added)
