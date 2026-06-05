---
title: 'Runbook: Database Failover'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['compliance', 'architecture', 'infrastructure', 'testing', 'api']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Runbook: Database Failover

---

## Architecture

GTCX uses dual PostgreSQL databases (per AUDITABLE principle):

| Database    | Purpose                             | Instance ID               | Multi-AZ |
| ----------- | ----------------------------------- | ------------------------- | -------- |
| Operational | Trade data, identities, settlements | `gtcx-${ENV}-operational` | Yes      |
| Audit       | Append-only audit trail             | `gtcx-${ENV}-audit`       | Yes      |

---

## Automatic Failover (Multi-AZ)

RDS Multi-AZ failover is automatic. Typical duration: 60-120 seconds.

**Triggers**: AZ outage, instance failure, storage failure, OS patching

**Monitoring**:

```bash
# Check current primary AZ
aws rds describe-db-instances \
  --db-instance-identifier gtcx-${ENV}-operational \
  --query 'DBInstances[0].[AvailabilityZone,DBInstanceStatus,MultiAZ]'

# Check RDS events for recent failovers
aws rds describe-events \
  --source-identifier gtcx-${ENV}-operational \
  --source-type db-instance \
  --duration 1440
```

---

## Manual Failover (Planned Maintenance)

```bash
# Trigger failover (for testing or maintenance)
aws rds reboot-db-instance \
  --db-instance-identifier gtcx-${ENV}-operational \
  --force-failover

# Monitor progress
watch -n 5 "aws rds describe-db-instances \
  --db-instance-identifier gtcx-${ENV}-operational \
  --query 'DBInstances[0].[DBInstanceStatus,AvailabilityZone]'"
```

---

## Connection Recovery

Applications should use connection pooling with retry logic. Verify:

```bash
# Check application pods reconnected
kubectl logs -n gtcx -l app=gtcx-api --tail=50 | grep -i "database\|connection\|pool"

# Check readiness probes
kubectl get pods -n gtcx -l app=gtcx-api -o wide
```

---

## Post-Failover Checklist

- [ ] Verify both operational and audit databases are accessible
- [ ] Check application health endpoints (`/health/ready`)
- [ ] Verify Prometheus metrics show normal latency
- [ ] Check Grafana dashboard for connection pool status
- [ ] Confirm no data loss (compare latest audit trail entries)
- [ ] Update incident log with failover details
