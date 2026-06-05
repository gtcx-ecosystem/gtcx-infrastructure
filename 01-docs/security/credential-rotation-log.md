---
title: 'Credential Rotation Log'
status: 'current'
date: '2026-05-27'
owner: 'platform-engineering'
role: 'security-engineer'
tier: 'critical'
tags: ['security', 'audit', 'credentials', 'rotation']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Credential Rotation Log

Authoritative log of every long-lived credential rotation across the substrate. Each row is an append-only event — corrections happen as new rows, never as edits.

This log is read-only evidence in support of SOC 2 CC6.1 and is referenced by:

- ADR-021 — npm publish discipline
- `audit-signing-key-rotation.md` runbook
- `aws-security-monitoring.md`

## Schedule

| Credential                                        | Cadence  | Owner                | Trigger                                                        |
| ------------------------------------------------- | -------- | -------------------- | -------------------------------------------------------------- |
| Audit-signer Ed25519 keypair (production)         | 365 days | platform-engineering | Scheduled; compromise-suspected; personnel change              |
| Audit-signer Ed25519 keypair (staging)            | 365 days | platform-engineering | Scheduled                                                      |
| npm publish granular token (`@gtcx/audit-signer`) | 90 days  | platform-engineering | Scheduled; reissue after any publish from a non-CI environment |
| Gateway auth tokens (per-principal)               | 90 days  | platform-engineering | Scheduled; immediate on principal offboarding                  |
| KMS CMK rotation (auto)                           | 365 days | AWS                  | AWS-managed automatic rotation                                 |
| Database master passwords                         | 180 days | platform-engineering | Scheduled                                                      |

## Log

| Date       | Credential                                | Trigger              | Operator     | Ticket           | Notes                                                                                                                                       |
| ---------- | ----------------------------------------- | -------------------- | ------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-22 | npm granular token (`@gtcx/audit-signer`) | Compromise-suspected | amanianai    | GTCX-PUBLISH-001 | Token was briefly exposed in a chat transcript during initial @gtcx/audit-signer@0.1.0 publish; rotated immediately after publish completed |
| 2026-05-22 | Audit-signer Ed25519 keypair (staging)    | Initial provisioning | platform-eng | GTCX-STAGE-AUDIT | First staging-environment keypair; recorded as baseline                                                                                     |

New rows append below this table. Never edit a prior row; corrections go as a new row referencing the prior date.

## Forward-looking targets

| Quarter | Target rotations                                                                 |
| ------- | -------------------------------------------------------------------------------- |
| 2026-Q3 | First scheduled audit-signer staging rotation (anniversary of initial provision) |
| 2026-Q3 | First scheduled npm token rotation (90 days from 2026-05-22)                     |
| 2026-Q4 | First scheduled gateway auth-token rotation (90 days from initial issuance)      |

## Related

- [`audit-signing-key-rotation.md`](../operations/runbooks/audit-signing-key-rotation.md) — procedure for the keypair rotation
- [`secrets-management.md`](./secrets-management.md) — secret-storage architecture
- ADR-021 — npm publish discipline (rule 1 ties rotation cadence to granular-token TTL)
