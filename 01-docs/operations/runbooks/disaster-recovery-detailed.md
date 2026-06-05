---
title: 'Disaster Recovery Runbook — GTCX Production'
status: 'current'
date: '2026-05-27'
owner: 'crypto-security-engineer'
role: 'crypto-security-engineer'
tier: 'critical'
tags: ['crypto', 'compliance', 'infrastructure', 'testing', 'api']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Disaster Recovery Runbook — GTCX Production

**Classification:** INTERNAL — Platform Engineering & SRE  
**Owner:** Platform Engineering  
**Last Updated:** 2026-05-13  
**RTO Target:** 4 hours (Recovery Time Objective)  
**RPO Target:** 15 minutes (Recovery Point Objective)  
**Applies To:** `gtcx-production` (af-south-1)

---

## DR Scenarios

| #   | Scenario                         | Probability | Impact          | RTO | RPO                        |
| --- | -------------------------------- | ----------- | --------------- | --- | -------------------------- |
| 1   | **Single AZ failure**            | Medium      | High (degraded) | 1h  | 0                          |
| 2   | **RDS primary failure**          | Low         | Critical        | 30m | 0 (Multi-AZ auto-failover) |
| 3   | **EKS control plane failure**    | Very Low    | Critical        | 2h  | 0 (managed)                |
| 4   | **Complete region failure**      | Very Low    | Catastrophic    | 4h  | 15m                        |
| 5   | **Data corruption / ransomware** | Very Low    | Catastrophic    | 4h  | 15m                        |
| 6   | **Accidental Terraform destroy** | Low         | Critical        | 4h  | 0 (redeploy from state)    |

---

## Scenario 1: Single AZ Failure

**Symptoms:** Nodes in one AZ become NotReady, RDS failover triggers, latency spikes.

### Detection

```bash
# Check node AZ distribution
kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.metadata.labels.topology\.kubernetes\.io/zone}{"\n"}{end}'

# Check AZ health
aws ec2 describe-availability-zones --region af-south-1 \
  --query 'AvailabilityZones[].{Name:ZoneName,State:State}'
```

### Response

```bash
# 1. Verify ASG is launching replacement nodes in healthy AZs
aws autoscaling describe-scaling-activities \
  --auto-scaling-group-name gtcx-production-nodes \
  --region af-south-1

# 2. If nodes don't recover automatically, force ASG to replace
aws autoscaling start-instance-refresh \
  --auto-scaling-group-name gtcx-production-nodes \
  --strategy Rolling \
  --region af-south-1

# 3. Verify pod rescheduling
kubectl get pods -n gtcx -o wide
# Pods should reschedule to nodes in healthy AZs

# 4. Verify RDS failover completed
aws rds describe-db-instances \
  --db-instance-identifier gtcx-production-operational \
  --region af-south-1 \
  --query 'DBInstances[0].AvailabilityZone'
# Should show AZ different from failed one
```

### Verification

- [ ] All nodes Ready in 2+ AZs
- [ ] RDS operational endpoint responds
- [ ] RDS audit endpoint responds
- [ ] Application pods Running
- [ ] Error rate < 1%

---

## Scenario 2: RDS Primary Failure

**Symptoms:** `gtcx-production-operational` unavailable, connection timeouts, application errors.

### Detection

```bash
aws rds describe-db-instances \
  --db-instance-identifier gtcx-production-operational \
  --region af-south-1 \
  --query 'DBInstances[0].{Status:DBInstanceStatus,AZ:AvailabilityZone,MultiAZ:MultiAZ}'
```

### Automatic Response (Multi-AZ)

RDS Multi-AZ automatically fails over to standby. No manual action required for operational DB.

**Audit DB:** Already Multi-AZ — automatic failover.

### Manual Failover (if auto-failover doesn't occur)

```bash
# Force failover for operational DB
aws rds reboot-db-instance \
  --db-instance-identifier gtcx-production-operational \
  --force-failover \
  --region af-south-1

# Monitor failover progress
aws rds describe-db-instances \
  --db-instance-identifier gtcx-production-operational \
  --region af-south-1 \
  --query 'DBInstances[0].DBInstanceStatus'
# Wait for "available"
```

### Verification

- [ ] RDS status = `available`
- [ ] AZ changed to standby AZ
- [ ] Application can connect
- [ ] No data loss (compare row counts with last backup)

---

## Scenario 3: EKS Control Plane Failure

**Symptoms:** `kubectl` commands fail, AWS Console shows cluster status = `FAILED` or `DEGRADED`.

### Detection

```bash
aws eks describe-cluster --name gtcx-production --region af-south-1 \
  --query 'cluster.status'
```

### Response

**Option A: Wait for AWS auto-recovery**

- EKS is managed — AWS will attempt auto-recovery within 30 minutes.
- Monitor: `aws eks describe-cluster --name gtcx-production`

**Option B: Restore from Terraform (if cluster is unrecoverable)**

```bash
cd 04-ship/terraform/environments/production

# Taint the failed cluster resource
terraform taint module.eks.aws_eks_cluster.main

# Re-apply (creates new cluster, preserves other resources)
terraform apply -auto-approve

# Re-deploy all workloads
kubectl apply -f 04-ship/kubernetes/base/services/
```

**Option C: Failover to staging**

```bash
# Emergency DNS cutover to staging
# Update Route53 or external DNS to point to staging ALB
# Notify: This is degraded service, not full recovery
```

---

## Scenario 4: Complete Region Failure

**Symptoms:** All af-south-1 services unreachable. AWS Health Dashboard confirms regional issue.

### Response: Activate Cross-Region DR

**Prerequisites (already configured):**

- WORM audit data replicated to `us-east-1`
- Terraform state in `us-east-1` S3
- Container images in ECR (single region, but can be replicated)

**Step 1: Assess Impact**

```bash
# Check AWS Service Health Dashboard
open https://health.aws.amazon.com/health/status

# Verify region is down (not just our VPC)
aws ec2 describe-instances --region af-south-1 2>&1
# Expected: timeout or service error
```

**Step 2: Bootstrap DR Region**

```bash
# Target region: us-east-1
export AWS_REGION=us-east-1

# 1. Create emergency VPC in us-east-1
# (Use Terraform with region override)
cd 04-ship/terraform/environments/production
terraform apply -var='region=us-east-1' -target=module.vpc -auto-approve

# 2. Restore RDS from cross-region snapshot
# (Note: RDS snapshots are NOT automatically cross-region — this is a gap)
# Manual step: Create snapshot in af-south-1, copy to us-east-1, restore
aws rds create-db-snapshot \
  --db-instance-identifier gtcx-production-operational \
  --db-snapshot-identifier gtcx-dr-operational-$(date +%s) \
  --region af-south-1

# 3. Copy snapshot to us-east-1
aws rds copy-db-snapshot \
  --source-db-snapshot-identifier arn:aws:rds:af-south-1:348389439381:snapshot:gtcx-dr-operational-... \
  --target-db-snapshot-identifier gtcx-dr-operational-us-east-1 \
  --source-region af-south-1 \
  --region us-east-1

# 4. Restore from snapshot in us-east-1
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier gtcx-dr-operational \
  --db-snapshot-identifier gtcx-dr-operational-us-east-1 \
  --region us-east-1
```

**Step 3: Verify WORM Data in DR Region**

```bash
# WORM audit data is already in us-east-1 via S3 replication
aws s3 ls s3://gtcx-worm-audit-production-replica-us-east-1/ --region us-east-1
```

---

## Scenario 5: Data Corruption / Ransomware

**Symptoms:** Widespread data anomalies, WORM deletion attempts logged, unexpected encryption.

### Immediate Response

```bash
# 1. PRESERVE EVIDENCE
# Capture CloudTrail before it rotates
aws cloudtrail lookup-events \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --region af-south-1 \
  > /tmp/incident-cloudtrail-$(date +%s).json

# 2. Check WORM tamper attempts
aws s3api get-bucket-policy --bucket gtcx-worm-audit-production-af-south-1 --region af-south-1

# 3. Verify WORM Object Lock is intact
aws s3api get-object-retention \
  --bucket gtcx-worm-audit-production-af-south-1 \
  --key <latest-audit-object> \
  --region af-south-1
```

### Recovery from Last Known Good State

```bash
# 1. Identify last known good snapshot
aws rds describe-db-snapshots \
  --db-instance-identifier gtcx-production-operational \
  --region af-south-1 \
  --query 'DBSnapshots[*].{ID:DBSnapshotIdentifier,Time:SnapshotCreateTime}' \
  | jq 'sort_by(.Time) | reverse | .[0:5]'

# 2. Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier gtcx-production-operational-recovered \
  --db-snapshot-identifier <last-good-snapshot> \
  --region af-south-1

# 3. Verify data integrity
# Run application health checks, compare critical table row counts
```

---

## Scenario 6: Accidental Terraform Destroy

**Symptoms:** Someone ran `terraform destroy`, critical resources are being deleted.

### Emergency Stop

```bash
# 1. If destroy is still running, CANCEL IT
# Terraform does not have a built-in cancel, but you can:
# - Kill the terraform process
# - Or let it finish and re-create

# 2. Check what was deleted
terraform show
# Or check AWS Console
```

### Recovery

```bash
# Option A: Terraform state is intact — just re-apply
cd 04-ship/terraform/environments/production
terraform plan
terraform apply -auto-approve

# Option B: State file corrupted — restore from S3 versioning
aws s3api list-object-versions \
  --bucket gtcx-terraform-state-production \
  --prefix environments/production/terraform.tfstate \
  --region us-east-1

# Restore previous version
aws s3api get-object \
  --bucket gtcx-terraform-state-production \
  --key environments/production/terraform.tfstate \
  --version-id <previous-version-id> \
  --region us-east-1 \
  terraform.tfstate

# Then re-initialize and apply
terraform init
terraform apply -auto-approve
```

---

## Backup & Recovery Reference

### RDS Snapshots

```bash
# Automated snapshots (daily, 30-day retention)
aws rds describe-db-snapshots \
  --snapshot-type automated \
  --db-instance-identifier gtcx-production-operational \
  --region af-south-1

# Manual snapshot (before risky operations)
aws rds create-db-snapshot \
  --db-instance-identifier gtcx-production-operational \
  --db-snapshot-identifier pre-change-$(date +%Y%m%d-%H%M%S) \
  --region af-south-1
```

### EKS State

```bash
# EKS cluster is managed — AWS handles control plane backups
# For workload state, rely on:
# - GitOps (manifests in git)
# - RDS for application state
# - S3 for object storage
# - WORM for audit logs
```

### S3 WORM Audit Data

```bash
# Primary: af-south-1
aws s3 ls s3://gtcx-worm-audit-production-af-south-1/ --region af-south-1

# Replica: us-east-1 (cross-region replication)
aws s3 ls s3://gtcx-worm-audit-production-replica-us-east-1/ --region us-east-1

# Object Lock prevents deletion
aws s3api get-object-lock-configuration \
  --bucket gtcx-worm-audit-production-af-south-1 \
  --region af-south-1
```

---

## Post-Recovery Checklist

- [ ] All AWS resources show `ACTIVE` / `available` / `Running`
- [ ] EKS nodes: 3 Ready
- [ ] RDS endpoints respond to connection test
- [ ] WAF blocking rate normal (< 5%)
- [ ] Flow Logs active
- [ ] Anomaly detector CronJob scheduled
- [ ] Application error rate < 1%
- [ ] P95 latency < 500ms
- [ ] Cost anomaly check: no unexpected charges
- [ ] Incident report filed to WORM storage
- [ ] Retrospective scheduled within 72 hours

---

## Known Gaps (Post-Launch Tasks)

| #   | Gap                                           | Priority | Effort  | Owner    |
| --- | --------------------------------------------- | -------- | ------- | -------- |
| 1   | RDS cross-region snapshot replication         | High     | 2 days  | Platform |
| 2   | ECR cross-region replication                  | Medium   | 1 day   | Platform |
| 3   | Automated DR region bootstrapping             | Medium   | 1 week  | Platform |
| 4   | Route53 health checks + failover              | Medium   | 3 days  | Platform |
| 5   | Chaos engineering (region failure simulation) | Low      | 2 weeks | SRE      |

---

_Runbook version: 1.0_  
_Drill schedule: Quarterly (next: 2026-08-13)_  
_Next review: After first DR event or 2026-08-13_
