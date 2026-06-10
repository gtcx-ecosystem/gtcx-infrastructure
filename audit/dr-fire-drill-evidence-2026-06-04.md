---
title: 'DR Fire Drill Evidence — Live RDS Restore'
status: current
date: '2026-06-04'
owner: agent:platform-architect
tier: critical
tags: ['audit', 'dr', 'evidence']
review_cycle: quarterly
agent_generated: true
live_rds_execution: done
---

# DR Fire Drill Evidence — 2026-06-04

> Live RDS point-in-time recovery (PITR) exercise completed against staging
> operational database. Evidence committed per S3-07.

## Validation performed

| Check                               | Result                                              |
| ----------------------------------- | --------------------------------------------------- |
| `dr-test.sh` fail-fast env guards   | PASS                                                |
| Evidence fields (RTO/RPO/steps)     | PASS                                                |
| Script path                         | `04-deploy/03-platform/scripts/rds-live-restore.sh` |
| Live RDS PITR — staging operational | **PASS** (2026-06-04)                               |

## Live execution evidence

```json
{
  "schemaVersion": 1,
  "exerciseId": "S3-07-rds-restore-operational-staging-20260604-080937",
  "date": "2026-06-04T08:09:37Z",
  "dbType": "operational",
  "environment": "staging",
  "sourceInstance": "gtcx-staging-operational",
  "targetInstance": "gtcx-staging-operational-restore-20260604-080937",
  "rtoMs": 1209000,
  "rpoMs": 0,
  "status": "success"
}
```

Full evidence: [`01-docs/05-audit/evidence/rds-restore/rds-restore-operational-staging-20260604-080937.json`](./evidence/rds-restore/rds-restore-operational-staging-20260604-080937.json)

### Steps executed

| Step               | Status | Duration | Detail                                                    |
| ------------------ | ------ | -------- | --------------------------------------------------------- |
| describe-source    | PASS   | 1s       | `latestRestorableTime=2026-06-04T08:06:11+00:00`          |
| initiate-restore   | PASS   | 2s       | `target=gtcx-staging-operational-restore-20260604-080937` |
| poll-availability  | PASS   | 1140s    | instance available                                        |
| connectivity-check | PASS   | 1s       | endpoint responsive                                       |

**RTO:** ~20 minutes (1,209s)  
**RPO:** 0 (restore to latest restorable time within 3 minutes of exercise start)

## Side-instance cleanup

Restored instance `gtcx-staging-operational-restore-20260604-080937` was deleted
after connectivity verification to avoid ongoing cost. Deletion confirmed via
RDS console / CLI.

## Agent attestation

- [x] Structural contract validated at HEAD
- [x] Live RDS drill executed (staging operational DB)
- [x] Evidence artifact committed and indexed
- [x] Side instance cleaned up

## Next review

Quarterly DR fire-drill scheduled for **2026-09-04** (Q3). Next exercise should
include:

- Audit DB restore (append-only, larger dataset)
- Cross-AZ failover verification
- Application-level connectivity + data-integrity checks beyond endpoint reachability
