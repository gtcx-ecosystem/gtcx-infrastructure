---
title: 'Outbound — S3-07 live RDS restore complete'
status: current
date: 2026-06-04
owner: gtcx-infrastructure
work_id: S3-07
tier: informational
tags: ['coordination', 's3-07', 'dr', 'evidence']
---

# Outbound — S3-07 live RDS restore (staging operational)

**Authority:** Class S operator step executed with AWS credentials in-session.

## Result

| Field              | Value                                              |
| ------------------ | -------------------------------------------------- |
| Source             | `gtcx-staging-operational`                         |
| Target (ephemeral) | `gtcx-staging-operational-restore-20260604-080937` |
| Region             | `af-south-1`                                       |
| RTO                | 1,209,000 ms (~20.15 min)                          |
| RPO                | 0 (PITR to latest restorable time)                 |
| Status             | `success`                                          |
| Cleanup            | Side instance deleted (`skip-final-snapshot`)      |

## Evidence

`01-docs/05-audit/evidence/rds-restore/rds-restore-operational-staging-20260604-080937.json`

## Script fixes (same session)

- Instance IDs aligned to Terraform (`gtcx-<env>-<type>`, not `-db` suffix)
- Subnet group + security groups copied from source describe
- macOS-compatible timing (`now_ms`)

## Protocols

Witness only — append hub log row; no protocols code change.
