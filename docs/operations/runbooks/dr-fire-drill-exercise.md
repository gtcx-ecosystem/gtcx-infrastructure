---
title: 'DR / Fire-Drill Exercise Runbook'
status: 'current'
date: '2026-05-27'
owner: 'sre'
role: 'sre'
tier: 'critical'
tags: ['dr', 'disaster-recovery', 'fire-drill', 'exercise', 'rto', 'rpo']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# DR / Fire-Drill Exercise Runbook

> **Purpose:** Produce auditor-grade evidence that GTCX Infrastructure can recover from realistic failure scenarios within declared RTO/RPO targets.
> **Target RTO:** 4 hours | **Target RPO:** 15 minutes
> **Frequency:** Quarterly (minimum) or after any infrastructure change that affects the data plane.

---

## Exercise Types

| ID   | Scenario                      | Frequency | RTO Target | RPO Target | Evidence Required                                        |
| ---- | ----------------------------- | --------- | ---------- | ---------- | -------------------------------------------------------- |
| DR-1 | Single AZ failure             | Quarterly | 1h         | 0          | ASG recovery, pod reschedule, RDS failover               |
| DR-2 | RDS primary failure           | Quarterly | 30m        | 0          | Multi-AZ failover, connection pool recovery              |
| DR-3 | WORM evidence recovery        | Quarterly | 2h         | 0          | Bucket access, version retrieval, signature verification |
| DR-4 | Audit query availability loss | Quarterly | 1h         | 0          | NATS JetStream replay, store rebuild                     |
| DR-5 | Complete region failure       | Annually  | 4h         | 15m        | Cross-region restore or redeploy from Terraform          |
| DR-6 | Accidental Terraform destroy  | Annually  | 4h         | 0          | State recovery, `terraform plan` drift check             |

---

## Pre-Exercise Checklist

- [ ] Maintenance window announced (if production involved).
- [ ] Exercise lead assigned and has `kubectl` + AWS CLI access.
- [ ] Baseline metrics captured (error rate, p95 latency, pod count, RDS lag).
- [ ] Communication channel established (Slack, PagerDuty, or equivalent).
- [ ] Rollback plan documented and ready.
- [ ] Auditor/evidence observer invited (optional but recommended).

---

## Exercise Template

### Header

```yaml
exercise_id: 'DR-YYYY-MM-DD-N'
date: 'YYYY-MM-DD'
start_time_utc: 'HH:MM:SS'
exercise_lead: 'name@gtcx.trade'
observers: []
environment: 'staging' # or production, testnet-pilot
scenario: 'DR-1 Single AZ failure'
```

### Timeline (capture as it happens)

| Elapsed | Timestamp (UTC) | Action                        | Owner      | Evidence                           |
| ------- | --------------- | ----------------------------- | ---------- | ---------------------------------- |
| T+0m    |                 | Exercise declared started.    | Lead       | Screenshot of announcement         |
| T+2m    |                 | Failure injected.             | Lead       | Command + output                   |
| T+5m    |                 | Detection alert fired.        | Monitoring | Alert screenshot / PagerDuty event |
| T+10m   |                 | Response team assembled.      | Lead       | Call log / chat transcript         |
| T+15m   |                 | Mitigation applied.           | Engineer   | Command + output                   |
| T+20m   |                 | Service recovery confirmed.   | Engineer   | Smoke evidence output              |
| T+25m   |                 | Evidence captured and stored. | Lead       | WORM upload receipt                |
| T+30m   |                 | Exercise declared ended.      | Lead       | Closing announcement               |

### Measurements

| Metric                      | Target        | Actual | Pass/Fail |
| --------------------------- | ------------- | ------ | --------- |
| Detection time (MTTD)       | < 5 min       |        |           |
| Response time (MTTR)        | < RTO         |        |           |
| Data loss                   | < RPO         |        |           |
| Error rate during recovery  | < 5%          |        |           |
| P95 latency during recovery | < 2x baseline |        |           |

### Defects Log

| ID  | Description | Severity | Owner | Fix Required By | Status |
| --- | ----------- | -------- | ----- | --------------- | ------ |
|     |             |          |       |                 |        |

### Evidence Artifacts

1. `exercise-timeline.md` — this template, filled in.
2. `metrics-baseline.json` — Prometheus/Grafana snapshot before injection.
3. `metrics-recovery.json` — Prometheus/Grafana snapshot after recovery.
4. `smoke-evidence/` — `capture-runtime-smoke-evidence.mjs` output post-recovery.
5. `worm-receipt.json` — S3 version ID + Object Lock retention of the evidence bundle.
6. `retrospective.md` — Team retrospective notes (blameless).

---

## DR-1: Single AZ Failure — Detailed Steps

### Injection

```bash
# Identify the AZ to fail
TARGET_AZ="af-south-1a"

# Cordon all nodes in the target AZ
for node in $(kubectl get nodes -l topology.kubernetes.io/zone="$TARGET_AZ" -o name); do
  kubectl cordon "$node"
done

# Drain workloads (simulate AZ loss)
for node in $(kubectl get nodes -l topology.kubernetes.io/zone="$TARGET_AZ" -o name); do
  kubectl drain "$node" --ignore-daemonsets --delete-emptydir-data --force
done
```

### Expected Response

1. **ASG** launches replacement nodes in healthy AZs.
2. **Pods** reschedule automatically.
3. **RDS Multi-AZ** fails over if the primary was in the target AZ.

### Verification

```bash
# Node health
kubectl get nodes -o wide

# Pod distribution
kubectl get pods -n gtcx -o wide

# RDS endpoint
aws rds describe-db-instances \
  --db-instance-identifier "gtcx-${ENVIRONMENT}-operational" \
  --region af-south-1 \
  --query 'DBInstances[0].AvailabilityZone'

# Smoke evidence
pnpm ctl evidence runtime-smoke \
  --environment="${ENVIRONMENT}" \
  --base-url="https://api.${ENVIRONMENT}.gtcx.trade"
```

### Recovery

```bash
# Uncordon nodes when the exercise ends
for node in $(kubectl get nodes -l topology.kubernetes.io/zone="$TARGET_AZ" -o name); do
  kubectl uncordon "$node"
done
```

---

## DR-3: WORM Evidence Recovery — Detailed Steps

### Objective

Prove that audit evidence stored in WORM can be retrieved, verified, and used for incident reconstruction even if the primary cluster is lost.

### Steps

1. **Identify a target object** in the WORM bucket:

```bash
aws s3api list-object-versions \
  --bucket "gtcx-worm-audit-${ENVIRONMENT}-af-south-1" \
  --prefix "remediation-evidence/" \
  --query 'Versions[0].{Key:Key,VersionId:VersionId}'
```

2. **Retrieve the object** and its Object Lock metadata:

```bash
aws s3api get-object \
  --bucket "gtcx-worm-audit-${ENVIRONMENT}-af-south-1" \
  --key "<Key>" \
  --version-id "<VersionId>" \
  recovered-evidence.ndjson

aws s3api get-object-retention \
  --bucket "gtcx-worm-audit-${ENVIRONMENT}-af-south-1" \
  --key "<Key>" \
  --version-id "<VersionId>"
```

3. **Verify the signature** using `@gtcx/audit-signer`:

```bash
node -e "
const { verifyAuditBody } = require('@gtcx/audit-signer');
const fs = require('fs');
const lines = fs.readFileSync('recovered-evidence.ndjson', 'utf8').trim().split('\n');
for (const line of lines) {
  const record = JSON.parse(line);
  const result = verifyAuditBody(record);
  console.log(record.type, result.valid ? 'VALID' : 'INVALID', result.error || '');
}
"
```

4. **Reconstruct the audit chain**:

```bash
# Extract chain hashes and verify continuity
jq -r '.chainHash' recovered-evidence.ndjson | nl
```

### Pass Criteria

- Object is retrievable by version ID.
- Object Lock retention is active and not expired.
- Every audit record signature verifies with `@gtcx/audit-signer`.
- Chain hashes form a continuous sequence (no gaps, no tampering).

---

## DR-4: Audit Query Availability Loss — Detailed Steps

### Objective

Prove that audit query functionality can be restored from NATS JetStream if the in-memory or local NDJSON store is lost.

### Steps

1. **Identify the JetStream stream**:

```bash
nats stream info gtcx_audit_compliance_gateway
```

2. **Simulate store loss** (in staging only):

```bash
kubectl delete pod -n gtcx -l app=compliance-gateway
```

3. **Wait for replacement pod** and verify query results:

```bash
# The new pod should rebuild its in-memory chain from NATS
kubectl logs -n gtcx -l app=compliance-gateway --tail=50 | grep audit.chain.replay
```

4. **Run an audit query** and compare against expected record count:

```bash
curl -s "https://api.${ENVIRONMENT}.gtcx.trade/v1/audit/chain" \
  -H "Authorization: Bearer ${AUDIT_READ_TOKEN}"
```

### Pass Criteria

- Pod restarts and reconnects to NATS JetStream.
- In-memory chain replays to the latest checkpoint.
- `/v1/audit/chain` returns records with continuous hashes.
- No data loss compared to pre-failure record count.

---

## Post-Exercise Evidence Storage

1. Bundle all artifacts into a single directory:

```bash
EXERCISE_ID="dr-exercise-$(date -u +%Y%m%d-%H%M%S)"
mkdir -p "infra/security/reports/dr-exercises/${EXERCISE_ID}"
# Copy all evidence files into this directory
```

2. Generate a signed release evidence bundle (see `pnpm ctl evidence release-bundle --help` for the full flag set — required: `--environment`, `--version`, `--commit`, and either `--build-only` or both `--smoke-base-url` + `--rollback-target`):

```bash
pnpm ctl evidence release-bundle \
  --environment="${ENVIRONMENT}" \
  --version="${EXERCISE_ID}" \
  --commit="$(git rev-parse HEAD)" \
  --build-only \
  --image=gateway="$(yq -r '.images[0].newName' infra/kubernetes/overlays/${ENVIRONMENT}/kustomization.yaml):$(yq -r '.images[0].newTag' infra/kubernetes/overlays/${ENVIRONMENT}/kustomization.yaml)" \
  --evidence=dr-exercise="infra/security/reports/dr-exercises/${EXERCISE_ID}" \
  --output-dir="infra/security/reports/dr-exercises/${EXERCISE_ID}"
```

3. Upload to WORM (when AWS credentials are available). `worm-upload` consumes the manifest written by `release-bundle`:

```bash
pnpm ctl evidence worm-upload \
  --manifest="infra/security/reports/dr-exercises/${EXERCISE_ID}/worm-upload.json"
```

4. Update `docs/audit/latest.json` with the exercise ID and WORM object key.

---

## Sign-Off

| Role            | Name | Date | Signature / Approval |
| --------------- | ---- | ---- | -------------------- |
| Exercise Lead   |      |      |                      |
| SRE Lead        |      |      |                      |
| Security Lead   |      |      |                      |
| Compliance Lead |      |      |                      |
