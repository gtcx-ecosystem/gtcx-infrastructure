# Runbook: Disaster Recovery

> **Owner**: Platform Engineering
> **Last reviewed**: 2026-03-18
> **Severity**: P0

---

## Recovery Objectives

| Metric                             | Target    | Current Capability                    |
| ---------------------------------- | --------- | ------------------------------------- |
| **RTO** (Recovery Time Objective)  | < 4 hours | ~2 hours (RDS restore + EKS redeploy) |
| **RPO** (Recovery Point Objective) | < 1 hour  | ~5 minutes (RDS automated backups)    |

---

## Failure Scenarios

### 1. Single AZ Failure

**Impact**: Partial service degradation
**Recovery**: Automatic — Multi-AZ RDS failover + Pod anti-affinity reschedules

```bash
# Verify pods redistributed
kubectl get pods -n gtcx -o wide

# Check RDS failover
aws rds describe-db-instances --db-instance-identifier gtcx-${ENV}-operational \
  --query 'DBInstances[0].AvailabilityZone'
```

### 2. Database Corruption / Accidental Deletion

**Impact**: Data loss
**Recovery**: Restore from automated snapshot

```bash
# List available snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier gtcx-${ENV}-operational \
  --query 'DBSnapshots[*].[DBSnapshotIdentifier,SnapshotCreateTime]' \
  --output table

# Restore to new instance
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier gtcx-${ENV}-operational-restored \
  --db-snapshot-identifier <snapshot-id> \
  --db-subnet-group-name gtcx-${ENV}-database \
  --vpc-security-group-ids <sg-id>

# Verify data, then swap DNS / update secrets
```

**Audit database**: Same process, separate instance (`gtcx-${ENV}-audit`).

### 3. Full Cluster Loss (EKS)

**Impact**: Complete outage
**Recovery**: Terraform recreate + deploy

```bash
cd infra/terraform/environments/${ENV}

# Recreate EKS cluster
terraform apply -target=module.eks

# Redeploy services
kubectl apply -k infra/kubernetes/overlays/${ENV}/

# Verify health
kubectl get pods -n gtcx --watch
```

### 4. Region Failure

**Impact**: Total loss of Zimbabwe pilot
**Recovery**: Deploy to secondary region from Terraform

```bash
# Use template to deploy to new region
cp -r infra/terraform/environments/template infra/terraform/environments/zimbabwe-failover

# Update region and VPC CIDR in main.tf
# terraform init && terraform apply
```

**Note**: Cross-region database replication not yet configured. RPO for region failure = last backup export.

---

## Backup Verification Schedule

| Resource             | Backup Method           | Retention  | Verification            |
| -------------------- | ----------------------- | ---------- | ----------------------- |
| Operational DB       | RDS automated snapshots | 35 days    | Monthly restore test    |
| Audit DB             | RDS automated snapshots | 35 days    | Monthly restore test    |
| Terraform state      | S3 versioning (pending) | Indefinite | On each apply           |
| Kubernetes manifests | Git (source of truth)   | Indefinite | CI validates on push    |
| Secrets              | AWS Secrets Manager     | Versioned  | Rotation test quarterly |

---

## Escalation

| Time    | Action                                                  |
| ------- | ------------------------------------------------------- |
| T+0     | On-call acknowledges, begins triage                     |
| T+15min | If P0: notify engineering lead                          |
| T+30min | If no progress: notify CTO                              |
| T+1hr   | Status update to all stakeholders                       |
| T+4hr   | If unresolved: engage AWS support (Business/Enterprise) |
