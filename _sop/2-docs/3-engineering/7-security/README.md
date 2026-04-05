# Security

Security policies, threat models, vulnerability management, and compliance mappings.

## Contents

| File                                                   | Description                                                                                                                                        |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`security-policy.md`](security-policy.md)             | Access control, encryption, vulnerability management, dependency audits, pen testing                                                               |
| [`security-architecture.md`](security-architecture.md) | Defense in depth layers, auth architecture, RBAC/ABAC, data classification, DLP, network segmentation, SIEM, incident response, secrets management |
| [`threat-model.md`](threat-model.md)                   | STRIDE analysis, DREAD scoring, attack trees, threat actors, security controls mapping, risk heat map                                              |
| [`fips-assessment.md`](fips-assessment.md)             | FIPS 140-2 cryptographic assessment: RDS/S3/EKS/ALB encryption, AWS KMS HSM validation, TLS enforcement                                            |
| [`nist-800-53-mapping.md`](nist-800-53-mapping.md)     | NIST 800-53 Rev 5 control mapping: 53 controls across AC, AU, CM, CP, IA, PE, SC, SI families with file path evidence                              |
| [`defense-readiness.md`](defense-readiness.md)         | Air-gap deployment assessment, CMMC Level 2 mapping (30 practices), SBOM per container image, disconnected operation procedures                    |
| [`stig-compliance.md`](stig-compliance.md)             | DISA STIG mapping: Container Platform SRG, Kubernetes STIG, PostgreSQL STIG, Network STIG (40 controls with evidence)                              |

## What belongs here

- **Security policies** — Access control standards, data handling rules, and encryption requirements
- **Threat models** — Attack surface analysis, risk assessments, and mitigation strategies
- **Vulnerability management processes** — CVE tracking, patch timelines, and remediation workflows
- **Penetration testing guidelines** — Scope definitions, testing schedules, and finding templates
- **Dependency audit procedures** — Supply chain security, license compliance, and update policies

## What does NOT belong here

- **Authentication architecture** — Auth flows, token strategies, identity provider design (→ `../2-system-design/`)
- **Compliance requirements** — Regulatory frameworks, audit evidence, certification tracking (→ `../5-compliance/`)

---
