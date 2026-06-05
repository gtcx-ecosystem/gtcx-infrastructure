# RDS Restore Evidence

This directory contains evidence from live RDS point-in-time recovery (PITR) exercises, used to validate disaster-recovery capabilities and meet S3-07 (operational resilience) requirements.

## Files

| File                                                   | Description                                                                  |
| ------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `rds-restore-operational-staging-20260604-080937.json` | S3-07 operational exercise — staging operational DB restored to new instance |

## See also

- [`04-ship/03-platform/scripts/rds-live-restore.sh`](../../../../04-ship/03-platform/scripts/rds-live-restore.sh) — Live restore script
- [`01-docs/05-audit/execution-roadmap.md`](../../execution-roadmap.md) — S3-07 story tracking
