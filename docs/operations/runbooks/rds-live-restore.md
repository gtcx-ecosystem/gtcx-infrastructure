---
title: 'Live RDS Restore — Operator Runbook (S3-07)'
status: 'current'
date: '2026-06-05'
owner: 'sre'
role: 'sre'
tier: 'critical'
tags: ['dr', 'rds', 'restore', 'pit', 'evidence']
review_cycle: 'quarterly'
---

# Live RDS Restore — Operator Runbook (S3-07)

> **Purpose:** Perform a live point-in-time restore (PITR) of an RDS instance and produce auditor-grade evidence.
> **Scope:** Operational or audit RDS in staging or production.
> **Frequency:** Quarterly or after any infrastructure change affecting RDS.

---

## Preconditions

- [ ] AWS CLI authenticated with `rds:RestoreDBInstanceToPointInTime` and `rds:DescribeDBInstances` permissions.
- [ ] `jq`, `psql`, and `bc` installed locally.
- [ ] Maintenance window announced (if production).
- [ ] Incident commander designated (production only).
- [ ] Vault credentials available for database user/password (for psql verification step).

---

## Quick Start

```bash
# Staging operational DB
ENV=staging DB_TYPE=operational \
  ./infra/scripts/rds-live-restore.sh operational staging

# Staging audit DB
ENV=staging DB_TYPE=audit \
  ./infra/scripts/rds-live-restore.sh audit staging
```

---

## Procedure

### 1. Describe source instance

The script automatically queries the latest restorable time:

```bash
aws rds describe-db-instances \
  --db-instance-identifier gtcx-staging-operational-db \
  --region af-south-1
```

Record the `LatestRestorableTime`. This is the PITR target.

### 2. Initiate restore

The script creates a **new** DB instance from the PITR snapshot:

```bash
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier gtcx-staging-operational-db \
  --target-db-instance-identifier gtcx-staging-operational-db-restore-YYYYMMDD-HHMMSS \
  --restore-time <LatestRestorableTime> \
  --db-instance-class db.t3.medium \
  --vpc-security-group-ids sg-staging-rds-restore \
  --db-subnet-group-name gtcx-staging-db-subnet-group \
  --no-publicly-accessible \
  --region af-south-1
```

**Important:** The original instance is **not** modified. The restore creates a side instance.

### 3. Poll for availability

RDS provisioning typically takes 10–30 minutes. The script polls every 30 seconds until `DBInstanceStatus = available`.

### 4. Verify connectivity

Once the instance is available, verify with `psql`:

```bash
psql -h <restored-endpoint> -U <user> -d <db> -c 'SELECT 1;'
```

Credentials are sourced from the vault (`gtcx-secrets-staging` or `gtcx-secrets-production`).

### 5. Validate schema and data

Run the schema validation and smoke test suite against the restored instance:

```bash
POSTGRES_HOST=<restored-endpoint> \
POSTGRES_USER=<user> \
POSTGRES_DB=<db> \
POSTGRES_PASSWORD=<password> \
  pnpm db:validate
```

### 6. Capture evidence

The script automatically writes a JSON evidence file to:

```
docs/audit/evidence/rds-restore/rds-restore-<dbType>-<env>-<timestamp>.json
```

Commit this file to the repo:

```bash
git add docs/audit/evidence/rds-restore/
git commit -m "docs(audit): S3-07 live RDS restore evidence — <dbType> <env>"
```

### 7. Clean up

Delete the restored instance to avoid ongoing charges:

```bash
aws rds delete-db-instance \
  --db-instance-identifier gtcx-staging-operational-db-restore-YYYYMMDD-HHMMSS \
  --skip-final-snapshot \
  --region af-south-1
```

---

## Evidence Schema

Each restore produces a JSON artifact:

```json
{
  "schemaVersion": 1,
  "exerciseId": "S3-07-rds-restore-operational-staging-20260605-143022",
  "date": "2026-06-05T14:30:22Z",
  "dbType": "operational",
  "environment": "staging",
  "sourceInstance": "gtcx-staging-operational-db",
  "targetInstance": "gtcx-staging-operational-db-restore-20260605-143022",
  "steps": [
    {
      "name": "describe-source",
      "status": "PASS",
      "durationMs": 1240,
      "detail": "latestRestorableTime=2026-06-05T14:25:00Z"
    },
    {
      "name": "initiate-restore",
      "status": "PASS",
      "durationMs": 3420,
      "detail": "target=gtcx-staging-operational-db-restore-20260605-143022"
    },
    {
      "name": "poll-availability",
      "status": "PASS",
      "durationMs": 892000,
      "detail": "elapsed=892s"
    },
    {
      "name": "connectivity-check",
      "status": "PASS",
      "durationMs": 450,
      "detail": "endpoint=gtcx-staging-operational-db-restore-...af-south-1.rds.amazonaws.com"
    }
  ],
  "rtoMs": 897110,
  "rpoMs": 0,
  "status": "success"
}
```

---

## RTO / RPO Targets

| DB Type     | RTO Target | RPO Target | Notes                                    |
| ----------- | ---------- | ---------- | ---------------------------------------- |
| Operational | 30 min     | 5 min      | Multi-AZ failover preferred for prod     |
| Audit       | 1 hour     | 5 min      | Snapshot restore only; never delete data |

---

## Troubleshooting

| Symptom                              | Cause                    | Fix                                                               |
| ------------------------------------ | ------------------------ | ----------------------------------------------------------------- |
| `DBInstanceStatus` hangs on creating | RDS provisioning delay   | Wait up to 1 hour; script polls automatically                     |
| `UnauthorizedOperation`              | Missing IAM permission   | Add `rds:RestoreDBInstanceToPointInTime`                          |
| `InvalidRestoreTime`                 | PITR window expired      | Use a more recent `LatestRestorableTime`                          |
| psql connection refused              | Security group misconfig | Verify `sg-staging-rds-restore` allows port 5432 from operator IP |

---

## Cross-references

- `infra/scripts/rds-live-restore.sh` — Automated restore script
- `docs/operations/runbooks/disaster-recovery.md` — General DR runbook
- `docs/operations/runbooks/dr-fire-drill-exercise.md` — DR exercise template
- `tools/scripts/dr-fire-drill-evidence.mjs` — Structural DR evidence gate
