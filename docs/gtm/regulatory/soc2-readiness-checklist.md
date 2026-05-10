# SOC 2 Type II Readiness Checklist

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

**Document ID**: GTCX-SOC2-READY-001
**Version**: 1.0
**Date**: May 2026
**Classification**: Internal
**Owner**: CISO
**Remediation Plan Reference**: Phase 3.1, Item 3.1.2

---

## 1. Overview

This checklist maps GTCX's current posture against the AICPA Trust Services Criteria for a SOC 2 Type II examination. The audit scope covers the GTCX infrastructure platform: deployment pipelines, monitoring, security controls, and the replay-guard API service.

**Observation period**: Minimum 6 months (target: months 4-9 of remediation plan)
**Target audit firm engagement**: Month 7
**Target report issuance**: Month 12

---

## 2. Trust Services Criteria Mapping

### Status Legend

| Status      | Meaning                                                   |
| ----------- | --------------------------------------------------------- |
| IMPLEMENTED | Control exists, evidence available, operating effectively |
| PARTIAL     | Control exists but gaps remain; remediation in progress   |
| PLANNED     | Control designed but not yet implemented                  |
| GAP         | No control in place                                       |

---

### CC1 — Control Environment

| Ref   | Criterion                              | What We Have                                      | What's Missing                                       | Remediation Action                                                    | Owner | Status  |
| ----- | -------------------------------------- | ------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------- | ----- | ------- |
| CC1.1 | CISO/board oversight of security       | Remediation plan with board governance model      | No formal board security committee charter           | Draft charter, obtain board approval, schedule quarterly reviews      | CISO  | PLANNED |
| CC1.2 | Management commitment to competence    | Engineering team with crypto/infra expertise      | No formal security training program                  | Implement annual security training + quarterly phishing simulation    | CISO  | PLANNED |
| CC1.3 | Organizational structure               | Repo-per-domain architecture with clear ownership | No formal org chart with security responsibilities   | Document security org structure, assign security champions per team   | CISO  | PLANNED |
| CC1.4 | Commitment to attract/retain personnel | Competitive hiring practices                      | No documented security role descriptions             | Formalize CISO and Security Engineer JDs with required certifications | CISO  | PLANNED |
| CC1.5 | Accountability for internal control    | Controls matrix exists (controls-matrix.md)       | No formal control owner assignment or review cadence | Assign control owners in matrix, establish quarterly review cycle     | CISO  | PARTIAL |

**Evidence the auditor will request:**

- Board security committee charter and meeting minutes
- Organizational chart with security reporting lines
- Security training records and completion rates
- Job descriptions for security-relevant roles
- Code of conduct / acceptable use policy

---

### CC2 — Communication and Information

| Ref   | Criterion                                    | What We Have                                                    | What's Missing                                                       | Remediation Action                                                     | Owner             | Status  |
| ----- | -------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------- | ------- |
| CC2.1 | Quality information for internal control     | Audit event logging (InMemoryAuditLog), SOC 2 evidence pipeline | In-memory storage is volatile; no persistent SIEM                    | Deploy WORM audit storage (Phase 2.1); integrate with SIEM             | Platform Engineer | PARTIAL |
| CC2.2 | Internal communication of control objectives | CLAUDE.md, agent safety rules, separation-of-duties matrix      | No formal security policy library communicated to all staff          | Publish security policy library (Phase 3.2); annual acknowledgment     | CISO              | PARTIAL |
| CC2.3 | External communication                       | Regulatory framework documented                                 | No external-facing security page, no vulnerability disclosure policy | Publish security.txt, responsible disclosure policy, trust center page | CISO              | PLANNED |

**Evidence the auditor will request:**

- Security policy documents and distribution records
- Employee acknowledgment of security policies
- External security disclosures (security.txt, trust page)
- Communication records for security incidents

---

### CC3 — Risk Assessment

| Ref   | Criterion                            | What We Have                                      | What's Missing                                           | Remediation Action                                                                      | Owner             | Status  |
| ----- | ------------------------------------ | ------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------- | ------- |
| CC3.1 | Risk objectives defined              | Compliance requirements doc, regulatory framework | No formal risk appetite statement approved by board      | Draft risk appetite statement; board approval                                           | CISO              | PLANNED |
| CC3.2 | Risk identification and analysis     | Controls matrix identifies gaps                   | No formal risk register with likelihood x impact scoring | Create risk register with 5x5 matrix (see ISO 27001 scope doc)                          | CISO              | PLANNED |
| CC3.3 | Fraud risk assessment                | N/A — not formally assessed                       | No fraud risk assessment                                 | Conduct fraud risk assessment covering: replay attacks, identity fraud, insider threats | CISO              | GAP     |
| CC3.4 | Identification of significant change | Git-based change management, PR reviews           | No formal change risk assessment process                 | Integrate change risk classification into PR template                                   | Platform Engineer | PLANNED |

**Evidence the auditor will request:**

- Risk register with scoring methodology
- Risk appetite / tolerance statement (board-approved)
- Fraud risk assessment documentation
- Change management risk assessment records

---

### CC4 — Monitoring Activities

| Ref   | Criterion                | What We Have                                          | What's Missing                                         | Remediation Action                                                | Owner             | Status  |
| ----- | ------------------------ | ----------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------- | ----------------- | ------- |
| CC4.1 | Ongoing monitoring       | Prometheus metrics, Grafana dashboards, health checks | No automated control effectiveness monitoring; no SIEM | Deploy SIEM; create control monitoring dashboards; SOC capability | Security Engineer | PARTIAL |
| CC4.2 | Deficiency communication | GitHub issues for security findings                   | No formal deficiency tracking with SLA and escalation  | Implement security finding tracker with severity-based SLAs       | CISO              | PLANNED |

**Evidence the auditor will request:**

- Monitoring dashboards and alert configurations
- Alert response records (who responded, when, resolution)
- Control deficiency tracking and remediation records
- Internal audit reports

---

### CC5 — Control Activities

| Ref   | Criterion                       | What We Have                                       | What's Missing                                                  | Remediation Action                                             | Owner             | Status  |
| ----- | ------------------------------- | -------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------- | ----------------- | ------- |
| CC5.1 | Selection of control activities | Controls matrix with NIST/ISO/SOC 2 mapping        | Controls matrix is partially populated; not all controls tested | Complete controls matrix; establish testing schedule           | Security Engineer | PARTIAL |
| CC5.2 | Technology general controls     | CI/CD pipeline, Docker non-root, branch protection | No formal ITGC documentation; no change approval board          | Document ITGCs; formalize CAB for production changes           | Platform Engineer | PARTIAL |
| CC5.3 | Deployment through policies     | Agent safety rules, approval workflows             | No formal security policy library (20+ policies)                | Create policy library aligned to ISO 27001 Annex A (Phase 3.2) | CISO              | PLANNED |

**Evidence the auditor will request:**

- IT General Controls documentation
- Change management records (PRs, approvals, deployments)
- Access provisioning and de-provisioning records
- Segregation of duties matrix and enforcement evidence

---

### CC6 — Logical and Physical Access Controls

| Ref   | Criterion                        | What We Have                                            | What's Missing                                                | Remediation Action                                                      | Owner             | Status  |
| ----- | -------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------- | ------- |
| CC6.1 | Logical access security          | TradePass DID-based identity, RBAC with hasPermission() | No account lockout; no MFA enforcement documented             | Implement account lockout; enforce MFA across AWS/GitHub/VPN            | Security Engineer | PARTIAL |
| CC6.2 | Access provisioning              | Role-based access with time-bounded assignments         | No formal access request/approval workflow                    | Implement JIT access with approval workflow (Phase 1.3)                 | Platform Engineer | PLANNED |
| CC6.3 | Access removal                   | Role expiration via expiresAt                           | No automated deprovisioning on termination; no access reviews | Implement quarterly access reviews; automated deprovisioning            | Security Engineer | PLANNED |
| CC6.4 | Restriction of privileged access | Docker non-root, RoleConstraint restrictions            | No break-glass procedure; no privileged access monitoring     | Deploy break-glass with alerting (Phase 1.3); PAM tool                  | Security Engineer | PARTIAL |
| CC6.5 | Network access restrictions      | Kubernetes network policies (planned)                   | No WAF; no VPC flow log monitoring; no geo-blocking           | Deploy AWS WAF v2, enable VPC flow logs (Phase 1.2)                     | Platform Engineer | PLANNED |
| CC6.6 | Physical access controls         | AWS managed (shared responsibility)                     | No documentation of physical security inheritance from AWS    | Document AWS shared responsibility model mapping                        | CISO              | PLANNED |
| CC6.7 | Data transmission protection     | AES-256-GCM encryption, Ed25519 signing                 | No mTLS in production; application-layer only                 | Deploy Linkerd service mesh with mTLS (Phase 1.2)                       | Platform Engineer | PARTIAL |
| CC6.8 | Protection against malware       | Container scanning in CI                                | No runtime malware detection; no endpoint protection          | Deploy Falco for runtime security; endpoint protection for workstations | Security Engineer | PLANNED |

**Evidence the auditor will request:**

- User access lists (all systems: AWS, GitHub, K8s, databases)
- Access provisioning and removal tickets
- Quarterly access review records
- MFA enrollment records
- Network diagrams and firewall/security group rules
- Encryption configuration evidence (TLS, at-rest)

---

### CC7 — System Operations

| Ref   | Criterion                     | What We Have                                 | What's Missing                                                  | Remediation Action                                                    | Owner             | Status  |
| ----- | ----------------------------- | -------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------- | ----------------- | ------- |
| CC7.1 | Detection of anomalies        | Prometheus alerting, replay cache monitoring | No SIEM; no correlation of security events                      | Deploy SIEM with correlation rules; integrate all log sources         | Security Engineer | PARTIAL |
| CC7.2 | Monitoring for anomalies      | Audit event logging, health checks           | In-memory audit logs; no persistent monitoring; no SOC          | Deploy WORM storage (Phase 2.1); establish SOC capability (Phase 2.4) | Security Engineer | PARTIAL |
| CC7.3 | Evaluation of security events | GitHub issues for tracking                   | No formal incident classification or triage process             | Implement IRP with severity classification (Phase 2.4)                | CISO              | PLANNED |
| CC7.4 | Incident response             | Basic incident procedures                    | No board-approved IRP; no regulatory notification SLAs          | Complete IRP v1.0 with regulatory notification playbooks              | CISO              | PLANNED |
| CC7.5 | Recovery from incidents       | Docker-based redeployment capability         | No formal disaster recovery plan; no tested recovery procedures | Document and test DR plan; quarterly DR exercises                     | Platform Engineer | PLANNED |

**Evidence the auditor will request:**

- Incident response plan (board-approved)
- Incident tickets and resolution records
- Vulnerability scan reports and remediation records
- Change management records
- Backup and recovery test records

---

### CC8 — Change Management

| Ref   | Criterion                 | What We Have                                                      | What's Missing                                                          | Remediation Action                                               | Owner             | Status  |
| ----- | ------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------- | ------- |
| CC8.1 | Change management process | Git-based workflow, PR reviews, CI/CD pipeline, branch protection | No formal CAB; no change risk classification; no rollback documentation | Formalize change management policy; implement CAB for production | Platform Engineer | PARTIAL |

**Evidence the auditor will request:**

- Change management policy
- PR/merge request records with approvals
- CI/CD pipeline configuration and logs
- Rollback procedures and test records
- Emergency change records

---

### CC9 — Risk Mitigation

| Ref   | Criterion                  | What We Have                      | What's Missing                                                 | Remediation Action                                                  | Owner | Status  |
| ----- | -------------------------- | --------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------- | ----- | ------- |
| CC9.1 | Risk mitigation activities | Controls matrix, remediation plan | No formal risk treatment tracking; no residual risk acceptance | Implement risk register with treatment plans; board risk acceptance | CISO  | PLANNED |
| CC9.2 | Vendor risk management     | N/A — not formally assessed       | No vendor risk assessment program                              | Implement vendor risk program (Phase 3.2)                           | CISO  | GAP     |

**Evidence the auditor will request:**

- Risk register with treatment plans
- Vendor assessment records
- Insurance coverage documentation
- Business continuity / disaster recovery plans

---

### A1 — Availability

| Ref  | Criterion                | What We Have                                    | What's Missing                                              | Remediation Action                                             | Owner             | Status  |
| ---- | ------------------------ | ----------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------- | ----------------- | ------- |
| A1.1 | Availability commitments | Health check endpoints, Docker restart policies | No formal SLA; no RTO/RPO documented                        | Define and publish SLAs; document RTO/RPO (Phase 2.2)          | Platform Engineer | PARTIAL |
| A1.2 | Capacity management      | Kubernetes HPA (planned)                        | No capacity planning documentation; no load testing         | Implement HPA; conduct load testing; document capacity plan    | Platform Engineer | PLANNED |
| A1.3 | Recovery objectives      | Docker-based redeployment                       | No multi-region; no tested failover; no backup immutability | Deploy multi-region (Phase 2.2); immutable backups (Phase 2.2) | Platform Engineer | PLANNED |

**Evidence the auditor will request:**

- SLA documentation
- Uptime records and SLA compliance reports
- Capacity plans and utilization trends
- Backup configuration and test records
- Disaster recovery test results

---

### C1 — Confidentiality

| Ref  | Criterion                                  | What We Have                                      | What's Missing                                                   | Remediation Action                                          | Owner | Status  |
| ---- | ------------------------------------------ | ------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------- | ----- | ------- |
| C1.1 | Identification of confidential information | Compliance requirements doc identifies data types | No formal data classification policy; no data inventory          | Implement 4-tier classification (Phase 2.3); data inventory | CISO  | PARTIAL |
| C1.2 | Disposal of confidential information       | N/A                                               | No data retention/disposal policy; no secure deletion procedures | Implement retention policy engine (Phase 2.3)               | CISO  | GAP     |

**Evidence the auditor will request:**

- Data classification policy
- Data inventory / data flow diagrams
- Retention and disposal policy
- Encryption configuration (at rest and in transit)
- Access controls for confidential data

---

## 3. Evidence Collection Guide

### 3.1 Automated Evidence Sources

| Evidence Type         | Source                               | Collection Method                           | Frequency  |
| --------------------- | ------------------------------------ | ------------------------------------------- | ---------- |
| Audit events          | audit_events table                   | `scripts/compliance/export-audit-events.sh` | Monthly    |
| Access control config | OAuth registry, RBAC config          | Config snapshot export                      | Quarterly  |
| Change management     | Git history, PR records              | GitHub API export                           | Continuous |
| Vulnerability scans   | pnpm audit, SAST reports             | CI pipeline artifacts                       | Per build  |
| Monitoring config     | Prometheus rules, Grafana dashboards | Dashboard JSON export                       | Quarterly  |
| Infrastructure config | Terraform state, K8s manifests       | Terraform plan output, kubectl export       | Quarterly  |

### 3.2 Manual Evidence Collection

| Evidence Type             | Responsible       | Collection Method                | Frequency    |
| ------------------------- | ----------------- | -------------------------------- | ------------ |
| Board meeting minutes     | CISO              | Meeting notes archive            | Quarterly    |
| Security training records | CISO              | LMS export                       | Annually     |
| Access review records     | Security Engineer | Review spreadsheet with sign-off | Quarterly    |
| Incident response records | Security Engineer | Incident ticket export           | Per incident |
| Vendor assessments        | CISO              | Assessment questionnaire archive | Annually     |
| Risk register updates     | CISO              | Risk register spreadsheet        | Quarterly    |

---

## 4. Observation Period Plan

| Month   | Key Activities                                                                      |
| ------- | ----------------------------------------------------------------------------------- |
| Month 1 | Begin evidence collection; all automated pipelines operational; controls documented |
| Month 2 | First quarterly access review; first set of monitoring evidence collected           |
| Month 3 | Internal audit of CC6 (access controls) and CC7 (operations); remediate findings    |
| Month 4 | Mid-period check: review evidence completeness; second access review                |
| Month 5 | Internal audit of CC1-CC5 and CC8-CC9; remediate findings                           |
| Month 6 | Final evidence collection; pre-assessment gap analysis; auditor readiness review    |

---

## 5. Auditor Engagement Timeline

| Phase                    | Timing   | Description                                                          |
| ------------------------ | -------- | -------------------------------------------------------------------- |
| Auditor selection        | Month 5  | RFP to 3 CPA firms; select based on fintech experience and cost      |
| Pre-assessment           | Month 6  | Auditor reviews readiness; identifies gaps before formal observation |
| Observation period start | Month 7  | Formal observation begins (6 months minimum through Month 12)        |
| Interim testing          | Month 9  | Auditor performs interim fieldwork; tests controls mid-period        |
| Final testing            | Month 12 | Auditor completes testing; reviews full observation period           |
| Report issuance          | Month 13 | SOC 2 Type II report issued                                          |

### 5.1 Auditor Selection Criteria

- Licensed CPA firm with AICPA SOC practice
- Minimum 5 fintech / SaaS SOC 2 engagements in past 2 years
- Named practitioners with CISA or equivalent certification
- Familiarity with cloud-native (AWS/K8s) infrastructure
- Competitive pricing with fixed-fee engagement

### 5.2 Target Audit Firms

- Deloitte / EY / PwC / KPMG (Big 4 — if budget allows)
- BDO, Grant Thornton, RSM (mid-tier — recommended for cost/quality balance)
- Coalfire, A-LIGN, Schellman (specialist SOC 2 firms — strong for startups/scale-ups)

---

## 6. Pre-Assessment Checklist (Internal Audit)

Complete before engaging external auditor:

### 6.1 Documentation

- [ ] Security policy library published and acknowledged by all staff
- [ ] Risk register populated with scoring and treatment plans
- [ ] Incident response plan approved by board
- [ ] Business continuity / disaster recovery plan documented and tested
- [ ] Vendor risk assessment program operational
- [ ] Data classification policy implemented
- [ ] Change management policy formalized

### 6.2 Technical Controls

- [ ] MFA enforced on all administrative access (AWS, GitHub, K8s, databases)
- [ ] Quarterly access reviews completed (minimum 2 cycles before audit)
- [ ] Encryption at rest verified for all data stores
- [ ] mTLS operational for inter-service communication
- [ ] WAF deployed and configured
- [ ] Vulnerability scanning running continuously with remediation SLAs met
- [ ] Audit log pipeline operational with persistent storage (not in-memory)

### 6.3 Evidence

- [ ] 6 months of continuous monitoring data available
- [ ] 6 months of access review records
- [ ] 6 months of change management records
- [ ] 6 months of incident response records (or documented absence of incidents)
- [ ] 6 months of vulnerability scan results and remediation records
- [ ] Backup test records (minimum 2 tests)
- [ ] Disaster recovery test records (minimum 1 test)

### 6.4 People

- [ ] Security roles formally assigned (CISO, Security Engineer, Security Champions)
- [ ] Annual security training completed by all staff
- [ ] Security awareness program operational (phishing simulation results available)
- [ ] Board security committee operational with meeting minutes

---

## 7. Gap Summary

| Priority          | Count                                                                   | Areas                                                                               |
| ----------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Critical (GAP)    | 3                                                                       | Fraud risk assessment (CC3.3), vendor risk management (CC9.2), data disposal (C1.2) |
| High (PLANNED)    | 18                                                                      | Board governance, risk register, IRP, DR, access reviews, policy library            |
| Medium (PARTIAL)  | 14                                                                      | Access controls, monitoring, change management, encryption, audit logs              |
| Low (IMPLEMENTED) | 0 controls fully ready for audit without additional evidence collection |                                                                                     |

**Overall readiness: ~35%** — Significant work required in Phases 1-2 of the remediation plan before SOC 2 observation period can begin.
