---
title: 'ADR-023: Testnet-Pilot WORM Bucket Architectural Exception'
status: 'accepted'
date: '2026-05-27'
owner: 'infrastructure-lead'
role: 'security-architect'
tier: 'critical'
tags: ['architecture', 'security', 'audit', 'worm', 'testnet-pilot', 'compliance']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# ADR-023: Testnet-Pilot WORM Bucket Architectural Exception

## Status

Accepted

## Date

2026-05-27

## Context

The testnet-pilot environment (`infra/terraform/environments/testnet-pilot/`) is an ephemeral evaluation substrate for bank and government tenants. It is explicitly tagged `Deployment = "TESTNET"` and `Purpose = "tenant-evaluation"`. Its sizing reflects this: one `t3.small` EKS node, a `db.t3.micro` RDS instance, and no multi-AZ redundancy.

The master audit (`docs/audit/master-audit-2026-05-27.md`) flagged the absence of `gtcx-worm-audit-testnet-pilot-af-south-1` as a P1 finding because the Terraform environment includes `module "worm_audit"` but the bucket has never been applied. The remediation plan (`docs/audit/10-10-remediation-plan-2026-05-27.md`) presents two valid paths:

1. Apply the module and create the bucket.
2. Explicitly document why testnet-pilot does not require its own WORM bucket.

This ADR records the decision for path 2.

Three constraints shaped the analysis:

1. **Evaluation environments are ephemeral by design.** Testnet-pilot exists so prospective tenants can validate protocol behavior before signing a production agreement. Its data lifecycle is days-to-weeks, not years.
2. **WORM retention is 2,557 days (7 years).** A COMPLIANCE-mode Object Lock bucket incurs real storage and KMS costs for the full retention period, regardless of when the environment is torn down.
3. **Staging WORM already exists and satisfies the audit substrate requirement.** The staging bucket (`gtcx-worm-audit-staging-af-south-1`) uses COMPLIANCE mode, 2557-day retention, KMS encryption with rotation, versioning, and public-access blocking. It is the canonical pre-production immutable audit store.

## Decision

Testnet-pilot **does not require a dedicated WORM audit bucket.** Its audit evidence is routed to the **staging WORM bucket** with an environment-specific S3 key prefix. Concretely:

1. The `audit-flush` deployment in testnet-pilot is configured with `AUDIT_S3_BUCKET = gtcx-worm-audit-staging-af-south-1` and an S3 key prefix of `audit/testnet-pilot/YYYY/MM/DD/`.
2. The testnet-pilot `audit_flush_irsa` module retains its IAM role, but the role's `s3:PutObject` grant targets the staging bucket ARN rather than a testnet-pilot-specific bucket.
3. No new KMS key is provisioned for testnet-pilot audit storage; the staging KMS key encrypts all prefixed objects.
4. The Terraform `module "worm_audit"` in `infra/terraform/environments/testnet-pilot/main.tf` is **commented out** (not destroyed) with a reference to this ADR, so it can be re-enabled if testnet-pilot's role changes from evaluation to long-term operational.
5. Testnet-pilot audit records remain signed by `@gtcx/audit-signer`, verifiable by `@gtcx/audit-signer@0.1.0`, and subject to the same Object Lock retention as staging records.

## Alternatives Considered

| Option                                                                            | Pros                                                                                                                                                | Cons                                                                                                                                                                      |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Apply `module "worm_audit"` and create `gtcx-worm-audit-testnet-pilot-af-south-1` | Satisfies the literal audit finding; each env has its own bucket                                                                                    | Unjustified cost for ephemeral eval environment; 7-year retention on data that ages out in weeks; one more KMS key to rotate and audit                                    |
| Route to production WORM bucket                                                   | Same bucket as live tenants; maximum compliance posture                                                                                             | Production WORM should not contain evaluation noise; pollution risk if eval tenants generate malformed or high-volume audit events                                        |
| **Route to staging WORM bucket with prefixed keys**                               | Staging already exists and is audited; cost-neutral; evaluation data is logically separated by prefix; aligns with staging's pre-production purpose | Slightly coarser isolation than per-env bucket (acceptable for ephemeral data)                                                                                            |
| Skip WORM entirely for testnet-pilot                                              | Cheapest                                                                                                                                            | Violates the institutional-controls-phase4 requirement that all audit events are immutable; testnet-pilot still produces signed audit records that must be durably stored |

## Consequences

**Positive:**

- Cost avoidance: no additional S3 bucket, KMS key, or 7-year retention liability for an evaluation environment
- Operational simplicity: one fewer bucket to monitor, audit, and include in disaster-recovery runbooks
- Consistent evidence chain: testnet-pilot audit records live in the same bucket as staging records, making cross-environment audit queries simpler
- The staging bucket's Object Lock, versioning, and KMS configuration already passes all auditor review criteria
- If a tenant graduates from testnet-pilot to production, their staging audit prefix becomes a historical reference; production creates a fresh prefix in the production bucket

**Negative:**

- Co-tenancy of staging + testnet-pilot audit data in one bucket requires careful prefix discipline. Mitigated by audit-flush's key-prefix configuration and the `AUDIT_S3_KEY_PREFIX` env var.
- A staging bucket compromise would expose testnet-pilot audit data as well. Mitigated by the same controls that protect staging: IAM least-privilege, IRSA, no public access, TLS-only, and Object Lock preventing deletion.
- If testnet-pilot is later promoted to a long-lived pre-production environment, this ADR should be revisited and the dedicated bucket should be created.

**Neutral:**

- The Terraform module remains in the codebase, commented out, so the decision is reversible without engineering work
- The `@gtcx/audit-signer` signature on every record makes the originating environment cryptographically verifiable regardless of which bucket stores the record
- Testnet-pilot's `Deployment = "TESTNET"` tag is already present in every audit record's metadata field

## References

- ADR-014 — NATS JetStream audit transport (audit-flush routing logic)
- `infra/terraform/environments/testnet-pilot/main.tf` — Terraform environment with commented `module "worm_audit"`
- `docs/audit/worm-runtime-evidence-2026-05-27.md` — staging WORM evidence and testnet-pilot gap analysis
- `docs/audit/10-10-remediation-plan-2026-05-27.md` — Phase 3, W3-001 (decide/create/document testnet-pilot WORM)
- `tools/audit-flush/src/s3-uploader.mjs` — S3 key prefix logic
- `tools/audit-signer/README.md` — signature verification independent of storage location
