---
title: 'ISO 27001:2022 ISMS Scope and Statement of Applicability'
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

# ISO 27001:2022 ISMS Scope and Statement of Applicability

**Document ID**: GTCX-ISMS-SCOPE-001
**Version**: 1.0
**Date**: May 2026
**Classification**: Internal
**Owner**: CISO
**Remediation Plan Reference**: Phase 3.1, Item 3.1.3

---

## 1. ISMS Scope Statement

### 1.1 Scope Definition

The Information Security Management System (ISMS) applies to:

**The design, development, deployment, operation, and security of the GTCX trade compliance platform infrastructure**, including:

- Cloud infrastructure services (AWS EKS, RDS, S3, VPC networking)
- Kubernetes orchestration and container management
- CI/CD pipelines and deployment automation
- Monitoring, alerting, and incident response capabilities
- Cryptographic services (replay protection, digital signatures, encryption)
- Database management (operational and audit databases)
- Identity and access management for platform operators

### 1.2 Organizational Scope

- GTCX engineering and operations teams
- Security function (CISO, Security Engineers)
- Platform engineering function
- Third-party service providers within the supply chain (AWS, GitHub, monitoring vendors)

### 1.3 Geographic Scope

- Primary: AWS us-east-1 (N. Virginia)
- Secondary (planned): AWS eu-west-1 (Ireland)
- Development: Remote engineering team locations

### 1.4 Exclusions

| Excluded                             | Justification                                                       |
| ------------------------------------ | ------------------------------------------------------------------- |
| Physical office security             | Fully remote team; no GTCX-owned office premises                    |
| End-user devices (customer)          | Outside GTCX's control boundary; covered by customer responsibility |
| Third-party SaaS internal operations | Covered by vendor certifications (AWS SOC 2, GitHub SOC 2)          |

### 1.5 Interfaces

| Interface             | Direction     | Description                                |
| --------------------- | ------------- | ------------------------------------------ |
| gtcx-app (mobile)     | Inbound       | API requests from mobile application       |
| AGX/CRX/SGX platforms | Bidirectional | Platform services consuming infrastructure |
| AWS services          | Outbound      | Cloud provider infrastructure              |
| GitHub                | Outbound      | Source code management and CI/CD           |
| Monitoring vendors    | Outbound      | Metrics, logs, and alerting                |

---

## 2. Risk Assessment Methodology

### 2.1 Approach

Quantitative-qualitative hybrid using a 5x5 likelihood-impact matrix aligned with ISO 27005.

### 2.2 Likelihood Scale

| Level          | Score | Definition                   | Frequency                  |
| -------------- | ----- | ---------------------------- | -------------------------- |
| Rare           | 1     | Highly unlikely to occur     | Less than once per 5 years |
| Unlikely       | 2     | Could occur but not expected | Once per 2-5 years         |
| Possible       | 3     | Might occur at some point    | Once per 1-2 years         |
| Likely         | 4     | Will probably occur          | Multiple times per year    |
| Almost Certain | 5     | Expected to occur frequently | Monthly or more            |

### 2.3 Impact Scale

| Level      | Score | Definition         | Financial    | Operational         | Reputational                              |
| ---------- | ----- | ------------------ | ------------ | ------------------- | ----------------------------------------- |
| Negligible | 1     | Minimal impact     | < $10K       | < 1 hour downtime   | No external awareness                     |
| Minor      | 2     | Limited impact     | $10K - $50K  | 1-4 hours downtime  | Limited external awareness                |
| Moderate   | 3     | Significant impact | $50K - $250K | 4-24 hours downtime | Regional media coverage                   |
| Major      | 4     | Severe impact      | $250K - $1M  | 1-7 days downtime   | National media coverage                   |
| Critical   | 5     | Existential impact | > $1M        | > 7 days downtime   | International coverage, regulatory action |

### 2.4 Risk Matrix

|                        | Negligible (1) | Minor (2)  | Moderate (3)  | Major (4)     | Critical (5)  |
| ---------------------- | -------------- | ---------- | ------------- | ------------- | ------------- |
| **Almost Certain (5)** | 5 - Medium     | 10 - High  | 15 - Critical | 20 - Critical | 25 - Critical |
| **Likely (4)**         | 4 - Low        | 8 - Medium | 12 - High     | 16 - Critical | 20 - Critical |
| **Possible (3)**       | 3 - Low        | 6 - Medium | 9 - High      | 12 - High     | 15 - Critical |
| **Unlikely (2)**       | 2 - Low        | 4 - Low    | 6 - Medium    | 8 - Medium    | 10 - High     |
| **Rare (1)**           | 1 - Low        | 2 - Low    | 3 - Low       | 4 - Low       | 5 - Medium    |

### 2.5 Risk Treatment Options

| Treatment    | When Used                                                 |
| ------------ | --------------------------------------------------------- |
| **Mitigate** | Implement controls to reduce likelihood or impact         |
| **Transfer** | Insurance or contractual transfer to third party          |
| **Accept**   | Risk within appetite; documented acceptance by risk owner |
| **Avoid**    | Eliminate the activity that creates the risk              |

### 2.6 Risk Appetite

Risks scoring 12 or above (High/Critical) require active treatment. Risks scoring 8-11 (Medium) require documented acceptance by the CISO. Risks scoring 7 or below (Low) may be accepted by the control owner.

---

## 3. Statement of Applicability (SoA)

All 93 controls from ISO 27001:2022 Annex A, organized by the four themes.

### Status Legend

| Status      | Definition                                   |
| ----------- | -------------------------------------------- |
| IMPLEMENTED | Control fully operational with evidence      |
| PARTIAL     | Control exists but with documented gaps      |
| PLANNED     | Control designed, implementation scheduled   |
| N/A         | Not applicable with documented justification |

---

### 3.1 Organizational Controls (A.5)

| #      | Control                                                           | Applicable | Justification                 | Status      | Notes                                                                                |
| ------ | ----------------------------------------------------------------- | ---------- | ----------------------------- | ----------- | ------------------------------------------------------------------------------------ |
| A.5.1  | Policies for information security                                 | Yes        | Foundation for ISMS           | PLANNED     | Security policy library to be created (Phase 3.2)                                    |
| A.5.2  | Information security roles and responsibilities                   | Yes        | Clear accountability required | PARTIAL     | Roles exist informally; formal documentation needed                                  |
| A.5.3  | Segregation of duties                                             | Yes        | Prevents fraud and error      | PARTIAL     | separation-of-duties-matrix.md exists; enforcement gaps                              |
| A.5.4  | Management responsibilities                                       | Yes        | Tone from the top             | PARTIAL     | Board Security Committee Charter published; CISO role defined; named CISO pending    |
| A.5.5  | Contact with authorities                                          | Yes        | Regulatory obligations        | PARTIAL     | Regulatory contacts and relationship map published; SARB/FSCA engagement not started |
| A.5.6  | Contact with special interest groups                              | Yes        | Threat intelligence sharing   | PLANNED     | No current memberships (ISAC, FIRST)                                                 |
| A.5.7  | Threat intelligence                                               | Yes        | Proactive defense             | PLANNED     | No formal threat intel program                                                       |
| A.5.8  | Information security in project management                        | Yes        | Security by design            | PARTIAL     | Agent safety rules exist; no formal security gates in SDLC                           |
| A.5.9  | Inventory of information and other associated assets              | Yes        | Asset management required     | PARTIAL     | Repo map exists; no formal asset register                                            |
| A.5.10 | Acceptable use of information and other associated assets         | Yes        | User behavior expectations    | PLANNED     | No acceptable use policy                                                             |
| A.5.11 | Return of assets                                                  | Yes        | Offboarding control           | PLANNED     | No formal offboarding procedure                                                      |
| A.5.12 | Classification of information                                     | Yes        | Data handling standards       | PLANNED     | 4-tier classification designed (Phase 2.3)                                           |
| A.5.13 | Labelling of information                                          | Yes        | Enforce classification        | PLANNED     | No labelling mechanism                                                               |
| A.5.14 | Information transfer                                              | Yes        | Secure data exchange          | PARTIAL     | AES-256-GCM + Ed25519 for app-layer; no mTLS                                         |
| A.5.15 | Access control                                                    | Yes        | Core security control         | PARTIAL     | TradePass RBAC implemented; gaps in lockout/MFA                                      |
| A.5.16 | Identity management                                               | Yes        | User lifecycle                | IMPLEMENTED | DID-based identity with lifecycle (pending/active/suspended/revoked)                 |
| A.5.17 | Authentication information                                        | Yes        | Credential management         | PARTIAL     | Ed25519 keys; no formal credential management policy                                 |
| A.5.18 | Access rights                                                     | Yes        | Least privilege               | PARTIAL     | RoleConstraint with time/location/volume restrictions; no JIT access                 |
| A.5.19 | Information security in supplier relationships                    | Yes        | Supply chain risk             | GAP         | No vendor risk assessment program                                                    |
| A.5.20 | Addressing information security within supplier agreements        | Yes        | Contractual controls          | GAP         | No security clauses in vendor contracts                                              |
| A.5.21 | Managing information security in the ICT supply chain             | Yes        | Software supply chain         | PARTIAL     | SBOM planned; Cosign planned; pnpm audit in CI                                       |
| A.5.22 | Monitoring, review and change management of supplier services     | Yes        | Ongoing vendor oversight      | GAP         | No vendor monitoring program                                                         |
| A.5.23 | Information security for use of cloud services                    | Yes        | AWS-dependent infrastructure  | PARTIAL     | AWS Well-Architected practices partially followed; no formal cloud security policy   |
| A.5.24 | Information security incident management planning and preparation | Yes        | Incident readiness            | IMPLEMENTED | Incident Response Plan v1.0 published in 01-docs/08-gtm/regulatory/                  |
| A.5.25 | Assessment and decision on information security events            | Yes        | Triage capability             | PLANNED     | No formal triage process                                                             |
| A.5.26 | Response to information security incidents                        | Yes        | Incident handling             | PLANNED     | No formal response procedures                                                        |
| A.5.27 | Learning from information security incidents                      | Yes        | Continuous improvement        | PLANNED     | No post-incident review process                                                      |
| A.5.28 | Collection of evidence                                            | Yes        | Forensic readiness            | PLANNED     | Forensic readiness planned (Phase 2.4)                                               |
| A.5.29 | Information security during disruption                            | Yes        | Business continuity           | PLANNED     | No BCP documented                                                                    |
| A.5.30 | ICT readiness for business continuity                             | Yes        | DR capability                 | PLANNED     | Multi-region planned (Phase 2.2)                                                     |
| A.5.31 | Legal, statutory, regulatory and contractual requirements         | Yes        | Compliance obligations        | PARTIAL     | Regulatory framework documented; compliance requirements templated                   |
| A.5.32 | Intellectual property rights                                      | Yes        | IP protection                 | PARTIAL     | Code in private repos; no formal IP policy                                           |
| A.5.33 | Protection of records                                             | Yes        | Record integrity              | PARTIAL     | Audit chain hashing; volatile in-memory storage                                      |
| A.5.34 | Privacy and protection of PII                                     | Yes        | Data protection               | PLANNED     | GDPR requirements documented; implementation pending                                 |
| A.5.35 | Independent review of information security                        | Yes        | Objective assurance           | PLANNED     | Pen-test and SOC 2 audit planned (Phase 3.1)                                         |
| A.5.36 | Compliance with policies, rules and standards                     | Yes        | Policy enforcement            | PLANNED     | No compliance monitoring program                                                     |
| A.5.37 | Documented operating procedures                                   | Yes        | Operational consistency       | PARTIAL     | Agent workflows documented; production runbooks incomplete                           |

---

### 3.2 People Controls (A.6)

| #     | Control                                                    | Applicable | Justification                       | Status  | Notes                                                             |
| ----- | ---------------------------------------------------------- | ---------- | ----------------------------------- | ------- | ----------------------------------------------------------------- |
| A.6.1 | Screening                                                  | Yes        | Background checks for trusted roles | PLANNED | No formal screening process                                       |
| A.6.2 | Terms and conditions of employment                         | Yes        | Security obligations in contracts   | PLANNED | No security clauses in employment agreements                      |
| A.6.3 | Information security awareness, education and training     | Yes        | Human layer defense                 | PLANNED | Annual training + phishing simulation planned                     |
| A.6.4 | Disciplinary process                                       | Yes        | Policy enforcement                  | PLANNED | No formal disciplinary process for security violations            |
| A.6.5 | Responsibilities after termination or change of employment | Yes        | Data protection post-employment     | PLANNED | No formal offboarding security procedure                          |
| A.6.6 | Confidentiality or non-disclosure agreements               | Yes        | Information protection              | PLANNED | No standard NDA template for employees/contractors                |
| A.6.7 | Remote working                                             | Yes        | Fully remote team                   | PARTIAL | Remote work is standard; no formal remote working security policy |
| A.6.8 | Information security event reporting                       | Yes        | Incident detection                  | PLANNED | No formal reporting channel for security events                   |

---

### 3.3 Physical Controls (A.7)

| #      | Control                                               | Applicable | Justification                       | Status  | Notes                                          |
| ------ | ----------------------------------------------------- | ---------- | ----------------------------------- | ------- | ---------------------------------------------- |
| A.7.1  | Physical security perimeters                          | N/A        | Fully remote; no GTCX premises      | N/A     | AWS physical security inherited                |
| A.7.2  | Physical entry                                        | N/A        | No GTCX premises                    | N/A     | AWS SOC 2 covers data center access            |
| A.7.3  | Securing offices, rooms and facilities                | N/A        | No GTCX premises                    | N/A     | —                                              |
| A.7.4  | Physical security monitoring                          | N/A        | No GTCX premises                    | N/A     | AWS managed                                    |
| A.7.5  | Protecting against physical and environmental threats | N/A        | No GTCX premises                    | N/A     | AWS managed                                    |
| A.7.6  | Working in secure areas                               | N/A        | No GTCX premises                    | N/A     | —                                              |
| A.7.7  | Clear desk and clear screen                           | Yes        | Remote work security                | PLANNED | No clear desk/screen policy for remote workers |
| A.7.8  | Equipment siting and protection                       | N/A        | Cloud-hosted; no GTCX-owned servers | N/A     | AWS managed                                    |
| A.7.9  | Security of assets off-premises                       | Yes        | Laptops and mobile devices          | PLANNED | No device management policy                    |
| A.7.10 | Storage media                                         | Yes        | Encryption of local storage         | PLANNED | No endpoint encryption enforcement             |
| A.7.11 | Supporting utilities                                  | N/A        | AWS managed                         | N/A     | —                                              |
| A.7.12 | Cabling security                                      | N/A        | No GTCX premises                    | N/A     | —                                              |
| A.7.13 | Equipment maintenance                                 | N/A        | Cloud-hosted                        | N/A     | AWS managed                                    |
| A.7.14 | Secure disposal or re-use of equipment                | Yes        | Endpoint lifecycle                  | PLANNED | No equipment disposal procedure                |

---

### 3.4 Technological Controls (A.8)

| #      | Control                                                     | Applicable | Justification            | Status      | Notes                                                             |
| ------ | ----------------------------------------------------------- | ---------- | ------------------------ | ----------- | ----------------------------------------------------------------- |
| A.8.1  | User endpoint devices                                       | Yes        | Developer workstations   | PLANNED     | No endpoint security policy or MDM                                |
| A.8.2  | Privileged access rights                                    | Yes        | Admin access control     | PARTIAL     | Docker non-root; K8s RBAC planned; no PAM tool                    |
| A.8.3  | Information access restriction                              | Yes        | Data access controls     | PARTIAL     | RBAC via TradePass; database-level controls incomplete            |
| A.8.4  | Access to source code                                       | Yes        | IP protection            | IMPLEMENTED | Private GitHub repos; branch protection; PR reviews               |
| A.8.5  | Secure authentication                                       | Yes        | Strong authn required    | PARTIAL     | Ed25519 signatures; no MFA enforcement for ops access             |
| A.8.6  | Capacity management                                         | Yes        | Availability             | PLANNED     | K8s HPA planned; no capacity planning documentation               |
| A.8.7  | Protection against malware                                  | Yes        | Threat prevention        | PLANNED     | Container scanning in CI; no runtime protection                   |
| A.8.8  | Management of technical vulnerabilities                     | Yes        | Vulnerability management | PARTIAL     | pnpm audit in CI; no DAST; no formal vuln management process      |
| A.8.9  | Configuration management                                    | Yes        | Secure baselines         | PARTIAL     | Terraform/K8s manifests; no formal hardening baselines            |
| A.8.10 | Information deletion                                        | Yes        | Data lifecycle           | PLANNED     | Retention policy engine planned (Phase 2.3)                       |
| A.8.11 | Data masking                                                | Yes        | PII protection           | PLANNED     | Tokenization planned (Phase 2.3)                                  |
| A.8.12 | Data leakage prevention                                     | Yes        | Exfiltration prevention  | PLANNED     | No DLP controls                                                   |
| A.8.13 | Information backup                                          | Yes        | Data protection          | PARTIAL     | Database backups exist; no immutability; no tested restore        |
| A.8.14 | Redundancy of information processing facilities             | Yes        | Availability             | PLANNED     | Single-region; multi-region planned (Phase 2.2)                   |
| A.8.15 | Logging                                                     | Yes        | Detection and forensics  | PARTIAL     | Audit logging implemented; in-memory (volatile)                   |
| A.8.16 | Monitoring activities                                       | Yes        | Security monitoring      | PARTIAL     | Prometheus/Grafana; no SIEM; no SOC                               |
| A.8.17 | Clock synchronization                                       | Yes        | Log correlation          | PARTIAL     | Date.now() used; no NTP enforcement or skew detection             |
| A.8.18 | Use of privileged utility programs                          | Yes        | Restrict dangerous tools | PLANNED     | No restrictions on utility programs in containers                 |
| A.8.19 | Installation of software on operational systems             | Yes        | Change control           | PARTIAL     | Container images; no admission controller for unsigned images     |
| A.8.20 | Networks security                                           | Yes        | Network protection       | PARTIAL     | K8s network policies planned; no WAF; no IDS/IPS                  |
| A.8.21 | Security of network services                                | Yes        | Service protection       | PARTIAL     | Linkerd planned; no mTLS in production                            |
| A.8.22 | Segregation of networks                                     | Yes        | Network isolation        | PARTIAL     | VPC; separate subnets planned; no micro-segmentation              |
| A.8.23 | Web filtering                                               | Yes        | Outbound traffic control | PLANNED     | No web filtering or egress controls                               |
| A.8.24 | Use of cryptography                                         | Yes        | Core to platform         | PARTIAL     | Ed25519, AES-256-GCM, SHA-256; no HSM/KMS; no FIPS 140-2          |
| A.8.25 | Secure development life cycle                               | Yes        | Secure SDLC              | PARTIAL     | CI pipeline, SAST planned, code review; no formal SSDLC           |
| A.8.26 | Application security requirements                           | Yes        | Security requirements    | PARTIAL     | Agent safety rules; no formal security requirements per feature   |
| A.8.27 | Secure system architecture and engineering principles       | Yes        | Architecture security    | PARTIAL     | Microservice architecture; defense-in-depth gaps                  |
| A.8.28 | Secure coding                                               | Yes        | Code security            | PARTIAL     | PR reviews; no CodeQL custom queries; no secure coding guidelines |
| A.8.29 | Security testing in development and acceptance              | Yes        | Quality assurance        | PARTIAL     | Vitest tests; no security-specific test suite; no DAST            |
| A.8.30 | Outsourced development                                      | Yes        | Third-party code risk    | PLANNED     | No formal outsourced development security requirements            |
| A.8.31 | Separation of development, test and production environments | Yes        | Environment isolation    | PARTIAL     | Staging exists; environment parity incomplete                     |
| A.8.32 | Change management                                           | Yes        | Controlled changes       | PARTIAL     | Git/PR workflow; no formal CAB; no change risk classification     |
| A.8.33 | Test information                                            | Yes        | Test data management     | PLANNED     | No test data management policy; risk of production data in test   |
| A.8.34 | Protection of information systems during audit testing      | Yes        | Audit safety             | PLANNED     | No formal audit testing safeguards                                |

---

## 4. Internal Audit Schedule

| Quarter | Audit Focus                                 | Scope                             |
| ------- | ------------------------------------------- | --------------------------------- |
| Q1      | Access control and identity management      | A.5.15-A.5.18, A.8.2-A.8.5, CC6   |
| Q2      | Operations and incident management          | A.5.24-A.5.28, A.8.15-A.8.16, CC7 |
| Q3      | Development lifecycle and change management | A.8.25-A.8.34, CC8                |
| Q4      | Supplier management and compliance          | A.5.19-A.5.23, A.5.31-A.5.36, CC9 |

Each internal audit must:

- Be conducted by personnel independent of the area being audited
- Follow a documented audit program with checklists
- Produce a formal audit report with findings and recommendations
- Track remediation of findings to closure
- Report results to management review

---

## 5. Management Review Agenda Template

**Frequency**: Quarterly (minimum), or after significant security events

### Standing Agenda Items

1. **Review of previous meeting actions**
   - Status of open items from prior review
   - Overdue actions with root cause

2. **ISMS performance**
   - Internal audit results since last review
   - Non-conformities and corrective actions
   - Control effectiveness metrics (MTTR, vulnerability density, patch SLA compliance)

3. **Risk assessment update**
   - New risks identified
   - Changes to existing risk ratings
   - Risk treatment plan progress
   - Residual risk vs. risk appetite

4. **Security incidents**
   - Incidents since last review (count, severity, MTTR)
   - Lessons learned and implemented improvements
   - Near-misses and trends

5. **External assessment results**
   - Penetration test findings and remediation status
   - SOC 2 audit progress and findings
   - Regulatory feedback or examination results
   - Vendor risk assessment updates

6. **Resource adequacy**
   - Security team capacity and skills
   - Tool and technology needs
   - Budget utilization and forecast

7. **Interested party feedback**
   - Customer security questionnaire trends
   - Regulatory changes affecting ISMS scope
   - Industry threat landscape changes

8. **Continual improvement**
   - Opportunities for improvement
   - Policy and procedure updates needed
   - ISMS scope changes

9. **Decisions and actions**
   - Documented decisions with rationale
   - Action items with owners and due dates
   - Items requiring board escalation

### Meeting Record Requirements

- Attendees and absentees (with reason)
- Minutes distributed within 5 business days
- Action items tracked in central register
- Decisions recorded with supporting rationale
- Records retained for certification audit evidence (minimum 3 years)

---

## 6. Certification Timeline

| Phase                                     | Duration    | Description                                               |
| ----------------------------------------- | ----------- | --------------------------------------------------------- |
| ISMS establishment                        | Months 1-3  | Scope, risk assessment, SoA, policies, procedures         |
| ISMS operation                            | Months 4-6  | Controls operational, evidence collection, internal audit |
| Stage 1 audit (documentation review)      | Month 7     | Certification body reviews ISMS documentation             |
| Gap remediation                           | Month 8     | Address Stage 1 findings                                  |
| Stage 2 audit (implementation assessment) | Month 9     | On-site/remote assessment of ISMS effectiveness           |
| Corrective actions                        | Month 10    | Address any Stage 2 non-conformities                      |
| Certificate issuance                      | Month 10-11 | ISO 27001:2022 certificate issued (3-year validity)       |
| Surveillance audit 1                      | Month 22    | Annual surveillance audit                                 |
| Surveillance audit 2                      | Month 34    | Annual surveillance audit                                 |
| Recertification audit                     | Month 46    | Full recertification                                      |

---

## 7. Control Summary

| Category                | Total  | Applicable | N/A    | Implemented | Partial | Planned | GAP   |
| ----------------------- | ------ | ---------- | ------ | ----------- | ------- | ------- | ----- |
| A.5 Organizational (37) | 37     | 37         | 0      | 1           | 15      | 18      | 3     |
| A.6 People (8)          | 8      | 8          | 0      | 0           | 1       | 7       | 0     |
| A.7 Physical (14)       | 14     | 4          | 10     | 0           | 0       | 4       | 0     |
| A.8 Technological (34)  | 34     | 34         | 0      | 1           | 19      | 14      | 0     |
| **Total**               | **93** | **83**     | **10** | **2**       | **35**  | **43**  | **3** |

**Overall ISMS readiness: ~25%** — Significant policy, process, and technical control gaps require remediation before certification audit.
