# {Service Name} — Compliance Requirements

**Document ID**: {SVC}-COMPLIANCE-001
**Version**: 1.0
**Date**: {Month Year}
**Status**: Active

---

## Regulatory Landscape

{Service Name} must satisfy compliance requirements from three perspectives:

1. **Platform Compliance** — {Service Name} itself must meet platform security and data handling standards
2. **Client Compliance** — {Service Name} helps clients achieve regulatory compliance in their jurisdictions
3. **Credential Compliance** — Any credentials or attestations issued must meet applicable standards

---

## Platform Compliance Requirements

### SOC 2 Type II

| Trust Service Criteria     | {Service Name} Controls                                             |
| -------------------------- | ------------------------------------------------------------------- |
| Security (CC6)             | OAuth 2.0, RBAC, TLS 1.3, encryption at rest, network policies      |
| Availability (CC7)         | {SLA target}, auto-scaling, health checks, circuit breakers         |
| Processing Integrity (CC8) | Deterministic operations, idempotent writes, audit trail            |
| Confidentiality (CC9)      | Tenant data isolation, encryption, access controls                  |
| Privacy                    | Minimal PII collection, consent management, data retention policies |

### ISO 27001

- Information Security Management System (ISMS) documentation
- Risk assessment and treatment plan
- Asset inventory (APIs, databases, credentials, keys)
- Access control policy enforcement
- Incident response procedures
- Business continuity planning

### GDPR

- Data processing agreements with all sub-processors
- Right to erasure ({data-type} and evidence data)
- Data portability (export tenant data as JSON)
- Breach notification within 72 hours
- Data Protection Impact Assessment (DPIA) completed
- Data residency controls per tenant

---

## Client Framework Support

{Service Name} supports scoring or verification against the following compliance frameworks:

| Framework        | Profile ID   | Controls |       Status       |
| ---------------- | ------------ | :------: | :----------------: |
| {Framework Name} | {PROFILE_ID} | {count}  | {Active / Planned} |
| {Framework Name} | {PROFILE_ID} | {count}  | {Active / Planned} |
| {Framework Name} | {PROFILE_ID} | {count}  | {Active / Planned} |

**Common framework examples** (adapt to your jurisdiction):

- IFC Performance Standards — supply chain / environmental & social
- OECD Due Diligence Guidance — responsible mineral sourcing
- ISO 14001 / ISO 45001 — environmental and occupational health management
- GDPR / CCPA — data privacy
- SOC 2 / ISO 27001 — information security
- Basel III — banking capital and collateral

---

## Data Retention

| Data Type       | Retention | Justification                 |
| --------------- | --------- | ----------------------------- |
| {data-type}     | {period}  | {reason}                      |
| {data-type}     | {period}  | {reason}                      |
| Audit logs      | 7 years   | SOC 2 / ISO 27001 requirement |
| Cache data      | TTL-based | No long-term retention        |
| API access logs | 2 years   | Security monitoring           |

---

## Credential Standards

Where {Service Name} issues digital credentials or attestations, they should align with:

- **W3C Verifiable Credentials Data Model** — Credential structure and proof format
- **DID (Decentralized Identifiers)** — Issuer and subject identification
- **JSON-LD** — Linked data context for credential semantics
- **Ed25519 / SHA-256** — Signing algorithm for integrity and authenticity

---

**Document Status**: Active
**Review Cycle**: Quarterly
**Owner**: {Service Name} Compliance Team
