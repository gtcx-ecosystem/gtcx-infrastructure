# POL-17: Business Continuity

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

**Annex A Reference:** A.17 — Business Continuity
**Effective Date:** 2026-05-08
**Review Cycle:** Annual
**Owner:** CISO (co-owned with Head of Operations)
**Approved By:** Board Security Committee

## 1. Purpose

Ensure the continuity of information security and GTCX operations during adverse situations.

## 2. Scope

All GTCX critical business functions, information systems, and supporting infrastructure.

## 3. Policy Statement

1. **Redundancy.** Critical systems are deployed across multiple availability zones. Databases use automated failover with replication lag monitoring. RPO (Recovery Point Objective): 1 hour maximum for critical systems, 24 hours for non-critical. RTO (Recovery Time Objective): 4 hours for critical systems, 24 hours for non-critical.

2. **Backup strategy.** Automated backups run daily for all production databases. The operational database (`gtcx_development`, port 5432) and audit database (`gtcx_audit`, port 5433) are backed up independently — backups are never co-mingled. Backups are encrypted, stored in a separate region, and tested monthly via restore drills.

3. **Disaster recovery plan.** A documented DR plan covers: infrastructure recovery (Terraform re-provision), data restoration (from backups), application deployment (from CI/CD), and DNS failover. The plan designates a DR Coordinator and communication chain. DR plan is tested annually via full simulation.

4. **Key person dependencies.** No critical system or process depends on a single individual. Knowledge is documented, credentials are escrowed in the secrets manager, and backup personnel are trained for all critical roles. Key person risks are tracked in the risk register.

5. **Continuity testing.** Business continuity plans are tested: tabletop exercises quarterly, backup restore drills monthly, full DR simulation annually. Test results are documented with findings tracked to remediation.

## 4. Responsibilities

| Role              | Responsibility                                              |
| ----------------- | ----------------------------------------------------------- |
| CISO              | Maintain BC/DR plans, coordinate testing                    |
| DevOps            | Implement redundancy, manage backups, execute DR procedures |
| Engineering Leads | Ensure applications support failover                        |
| All Personnel     | Know their role in the BC plan                              |

## 5. Exceptions

RPO/RTO relaxations for non-critical systems require CISO approval and documented business justification.

## 6. Review

Reviewed annually. DR plan tested annually. Backup restore drills conducted monthly.
