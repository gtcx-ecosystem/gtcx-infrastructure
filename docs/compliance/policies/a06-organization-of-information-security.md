# POL-06: Organization of Information Security

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

**Annex A Reference:** A.6 — Organizational Controls
**Effective Date:** 2026-05-08
**Review Cycle:** Annual
**Owner:** CISO
**Approved By:** Board Security Committee

## 1. Purpose

Define roles, responsibilities, and segregation of duties for information security across GTCX.

## 2. Scope

All GTCX organizational units, personnel, contractors, and third-party service providers.

## 3. Policy Statement

1. **Separation of duties.** No single individual may control all phases of a critical process. The separation of duties matrix (`docs/compliance/separation-of-duties-matrix.md`) governs access to production systems, code deployment, financial transactions, and audit logs. At minimum: code author cannot approve their own PR; deployer cannot modify production secrets; DBA cannot alter audit database records.

2. **Security roles.** The following roles are formally assigned and documented: CISO, Security Engineer, Incident Commander, Data Protection Officer, Compliance Lead. Each role has a documented backup.

3. **Contact with authorities.** The CISO maintains documented relationships with relevant regulatory bodies, law enforcement, and CERT teams in all operating jurisdictions. Contact procedures are tested annually.

4. **Mobile and remote working.** All remote access requires VPN or zero-trust network access. Mobile devices accessing GTCX systems must be enrolled in MDM with encryption enabled and remote wipe capability.

5. **Project security.** Every new project or significant change undergoes a security review before production deployment. The review covers threat modeling, data classification, and control adequacy.

## 4. Responsibilities

| Role          | Responsibility                                           |
| ------------- | -------------------------------------------------------- |
| CISO          | Maintain organizational security structure, assign roles |
| HR            | Ensure security responsibilities in job descriptions     |
| Project Leads | Initiate security reviews for new projects               |
| All Personnel | Operate within assigned authority, escalate concerns     |

## 5. Exceptions

Deviations from the separation of duties matrix require dual CISO + CEO approval and are time-limited to 30 days maximum.

## 6. Review

Reviewed annually. Role assignments reviewed upon any organizational restructuring.
