---
title: 'Separation of Duties Matrix'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'infrastructure', 'api']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Separation of Duties Matrix

**Classification:** Internal — Restricted  
**Owner:** CISO  
**Effective date:** 2026-05-08  
**Review cycle:** Quarterly  
**Regulatory alignment:** SOC 2 Type II (CC6.1, CC6.3), ISO 27001 A.6.1.2, NIST 800-53 AC-5

---

## 1. Role Definitions

| Role                      | Description                                                                                        |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| **CISO**                  | Chief Information Security Officer. Owns security policy, risk acceptance, and compliance posture. |
| **Security Engineer**     | Implements and operates security controls, key management, incident response tooling.              |
| **Platform Engineer**     | Manages infrastructure (Terraform, K8s, CI/CD pipelines, database operations).                     |
| **Application Developer** | Writes and tests application code. No production infrastructure access by default.                 |
| **Auditor (External)**    | Third-party auditor with read-only access for compliance evidence collection.                      |
| **Board Observer**        | Board-level oversight. No operational access. Receives summary reports only.                       |

---

## 2. Duties Matrix

Legend:

- **P** = Perform (executes the action)
- **A** = Approve (authorizes the action before or after execution)
- **R** = Review (reviews evidence/logs; no execution or approval authority)
- **--** = No Access

| Critical Function                      | CISO | Security Engineer | Platform Engineer | Application Developer | Auditor (External) | Board Observer |
| -------------------------------------- | ---- | ----------------- | ----------------- | --------------------- | ------------------ | -------------- |
| Deploy to production                   | A    | R                 | P                 | --                    | R                  | --             |
| Sign cryptographic keys (KMS)          | A    | P                 | --                | --                    | R                  | --             |
| Access audit database (read)           | R    | R                 | --                | --                    | R                  | --             |
| Modify audit database (write)          | --   | --                | --                | --                    | --                 | --             |
| Infrastructure admin (Terraform apply) | A    | R                 | P                 | --                    | R                  | --             |
| Approve code changes (PR merge)        | R    | A                 | A                 | P                     | R                  | --             |
| Rotate secrets                         | A    | P                 | --                | --                    | R                  | --             |
| Break-glass emergency access           | A    | P                 | P                 | --                    | R                  | --             |
| View financial data                    | A    | --                | --                | --                    | R                  | R              |
| Modify RBAC policies                   | A    | P                 | --                | --                    | R                  | --             |

### Key constraints

1. **Audit database write is prohibited for all human actors.** Write access is restricted to the application service account (`svc-audit-writer`) operating through the append-only audit pipeline. Manual writes are a finding.
2. **No single person may both deploy to production AND approve the code change being deployed.** The performer of `Deploy to production` must differ from the approver of `Approve code changes` for the same change set.
3. **KMS key signing and secret rotation require CISO approval** before execution by the Security Engineer. Approval must be recorded in the ticketing system with a reference ID.
4. **Break-glass access requires post-incident CISO review** within 48 hours. See `docs/security/break-glass-procedure.md`.
5. **External Auditors never receive write or execute permissions.** All auditor access is read-only and scoped to evidence buckets and log aggregation.
6. **Board Observers** receive quarterly summary reports only. No console, CLI, or database access of any kind.

---

## 3. Conflict-of-Interest Controls

The following role combinations are prohibited on the same individual:

| Prohibited combination                    | Rationale                                                                 |
| ----------------------------------------- | ------------------------------------------------------------------------- |
| CISO + Platform Engineer                  | Policy maker must not be infrastructure operator                          |
| Security Engineer + Application Developer | Security control implementer must not write application code under review |
| Platform Engineer + Auditor               | Infrastructure operator must not audit their own work                     |
| Any role + External Auditor               | External auditors must be organizationally independent                    |

---

## 4. Quarterly Review Calendar

| Quarter  | Review window    | Lead              | Deliverable                                   |
| -------- | ---------------- | ----------------- | --------------------------------------------- |
| Q1 (Jan) | Jan 15 -- Jan 31 | CISO              | Annual role re-certification + matrix update  |
| Q2 (Apr) | Apr 15 -- Apr 30 | Security Engineer | Access log audit + conflict-of-interest check |
| Q3 (Jul) | Jul 15 -- Jul 31 | CISO              | Mid-year compliance posture review            |
| Q4 (Oct) | Oct 15 -- Oct 31 | Security Engineer | Pre-audit readiness check + evidence package  |

### Review procedure

1. Export current IAM roles, K8s RBAC bindings, and GitHub org permissions.
2. Compare against this matrix. Flag any drift as a finding.
3. Remediate all findings within 14 calendar days.
4. Record review completion in the compliance tracking system with reviewer signature and date.
5. Retain evidence for 7 years per regulatory retention requirements.

---

## 5. Exception Process

Exceptions to this matrix require:

1. Written justification filed as a compliance ticket (type: `SoD-Exception`).
2. CISO approval with documented risk acceptance.
3. Maximum exception duration: 90 days, non-renewable without fresh justification.
4. All exceptions logged in the audit database automatically.
5. External auditor notification within 5 business days.

---

## 6. Regulatory Traceability

| Control              | SOC 2 | ISO 27001 | NIST 800-53 |
| -------------------- | ----- | --------- | ----------- |
| Separation of duties | CC6.1 | A.6.1.2   | AC-5        |
| Least privilege      | CC6.3 | A.9.2.3   | AC-6        |
| Access reviews       | CC6.2 | A.9.2.5   | AC-2(3)     |
| Audit log integrity  | CC7.2 | A.12.4.2  | AU-9        |
