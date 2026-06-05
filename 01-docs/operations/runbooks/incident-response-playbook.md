---
title: 'Incident Response Playbook — GTCX Production'
status: 'current'
date: '2026-05-27'
owner: 'quality-evidence-lead'
role: 'quality-evidence-lead'
tier: 'critical'
tags: ['security', 'compliance', 'infrastructure', 'testing', 'api']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Incident Response Playbook — GTCX Production

**Classification:** INTERNAL — Platform Engineering & Security  
**Owner:** Platform Engineering  
**Last Updated:** 2026-05-13  
**Applies To:** `gtcx-production` (af-south-1), `gtcx-staging` (af-south-1)

---

## Severity Definitions

| Level  | Name     | Criteria                                                                                     | Response Time | Escalation         |
| ------ | -------- | -------------------------------------------------------------------------------------------- | ------------- | ------------------ |
| **P0** | Critical | Complete service outage; data breach; unauthorized admin access; financial settlement halted | 5 minutes     | CTO + CISO + Legal |
| **P1** | High     | Degraded service (>50% error rate); replay protection bypassed; WORM storage tampered        | 15 minutes    | CTO + CISO         |
| **P2** | Medium   | Elevated error rate (10–50%); single AZ failure; anomaly detector offline                    | 1 hour        | Platform Lead      |
| **P3** | Low      | Elevated latency; non-critical component failure; monitoring gap                             | 4 hours       | On-call engineer   |

---

## Response Roles

| Role                        | Responsibility                                          | Primary          | Secondary         |
| --------------------------- | ------------------------------------------------------- | ---------------- | ----------------- |
| **Incident Commander (IC)** | Overall coordination, comms, decision authority         | Platform Lead    | Senior SRE        |
| **Technical Lead (TL)**     | Technical diagnosis, remediation execution              | On-call engineer | Platform Engineer |
| **Communications Lead**     | External/stakeholder updates, status page               | Product Manager  | CTO               |
| **Security Lead**           | Forensic preservation, breach assessment, legal liaison | CISO             | Security Engineer |

---

## Phase 1: Detect & Alert (0–5 min)

### Alert Channels

- **PagerDuty** → P0/P1 pages on-call engineer + Platform Lead
- **Slack #gtcx-alerts** → All P2+ alerts
- **Email** → P3 alerts + daily digest

### Initial Triage Checklist

```bash
# 1. Confirm the incident is real (not test data or drill)
kubectl get pods -n gtcx --all-namespaces
aws eks describe-cluster --name gtcx-production --region af-south-1

# 2. Check if staging is also affected (infrastructure vs application)
kubectl get pods -n gtcx-staging --all-namespaces

# 3. Check AWS Service Health Dashboard
open https://health.aws.amazon.com/health/status

# 4. Check CloudWatch alarms
aws cloudwatch describe-alarms --state-value ALARM --region af-south-1
```

### Decision: Is This a Security Incident?

| Indicator                                          | Action                                      |
| -------------------------------------------------- | ------------------------------------------- |
| Unauthorized access logs                           | Escalate to CISO immediately; preserve logs |
| Data exfiltration patterns                         | Invoke breach protocol; notify Legal        |
| Replay protection disabled                         | P0 — potential settlement fraud             |
| Anomaly detector: `mutating_tool_without_approval` | P1 — inspect tool invocation chain          |
| WORM deletion attempt                              | P1 — preserve IAM CloudTrail                |

---

## Phase 2: Respond & Contain (5–30 min)

### P0: Complete Outage

**Symptoms:** EKS unreachable, RDS down, WAF blocking 100% traffic, settlement pipeline halted.

**Immediate Actions:**

```bash
# 1. Verify EKS control plane
aws eks describe-cluster --name gtcx-production --region af-south-1
# Look for: status = ACTIVE, endpoint accessible

# 2. Check node status
kubectl get nodes
# If nodes NotReady, check ASG:
aws autoscaling describe-scaling-activities \
  --auto-scaling-group-name gtcx-production-nodes \
  --region af-south-1

# 3. Check RDS status
aws rds describe-db-instances \
  --db-instance-identifier gtcx-production-operational \
  --region af-south-1
# Look for: DBInstanceStatus = available

# 4. If RDS is rebooting/upgrading, check maintenance window
aws rds describe-db-instances \
  --query 'DBInstances[0].PendingModifiedValues'

# 5. Check WAF — are we blocking our own traffic?
aws wafv2 get-sampled-requests \
  --web-acl-arn $(terraform output -raw waf_acl_arn) \
  --rule-name gtcx-rate-limit \
  --scope REGIONAL \
  --time-window StartTime=$(date -u -d '5 min ago' +%s),EndTime=$(date -u +%s) \
  --max-items 100 \
  --region af-south-1
```

**Containment Options:**

| Option                   | Command                                            | When to Use                     |
| ------------------------ | -------------------------------------------------- | ------------------------------- |
| Scale EKS nodes          | `aws eks update-nodegroup-config --desired-size 6` | Node exhaustion                 |
| Failover to staging      | DNS cutover to `gtcx-staging` endpoints            | Production unrecoverable        |
| Disable WAF rate limit   | Temporarily raise `rate_limit` to 50,000           | WAF blocking legitimate traffic |
| RDS reboot with failover | `aws rds reboot-db-instance --force-failover`      | Primary AZ failure              |

---

### P1: Security Incident

**Symptoms:** Unauthorized access, replay bypass, anomaly detector firing on admin actions, WORM tamper attempt.

**Immediate Actions:**

```bash
# 1. PRESERVE EVIDENCE FIRST
# Do NOT restart pods or delete resources before forensic capture

# 2. Capture pod state
kubectl get pods -n gtcx -o yaml > /tmp/incident-$(date +%s)-pods.yaml
kubectl describe pods -n gtcx > /tmp/incident-$(date +%s)-describe.txt

# 3. Capture logs (before they rotate)
kubectl logs -n gtcx --all-containers --prefix > /tmp/incident-$(date +%s)-logs.txt

# 4. Capture CloudTrail (last 1 hour)
aws cloudtrail lookup-events \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --region af-south-1 \
  > /tmp/incident-$(date +%s)-cloudtrail.json

# 5. Check IAM role assumption history
aws iam get-role --role-name gtcx-production-shared-deploy \
  --query 'Role.AssumeRolePolicyDocument'

# 6. Revoke compromised credentials (if applicable)
aws iam update-assume-role-policy \
  --role-name gtcx-production-shared-deploy \
  --policy-document file://emergency-revoke-policy.json
```

**Communication Template (Slack #gtcx-incidents):**

```
🚨 P1 SECURITY INCIDENT — gtcx-production
Incident Commander: @platform-lead
Detected: 2026-05-13 05:45 UTC
Symptoms: [brief description]
Impact: [affected services / users]
Containment: [actions taken]
Next update: +15 minutes
DO NOT deploy to production until all-clear.
```

---

### P2: Degraded Service

**Symptoms:** Error rate 10–50%, elevated latency, single component failure.

**Immediate Actions:**

```bash
# 1. Identify failing component
kubectl get pods -n gtcx
kubectl top pods -n gtcx

# 2. Check resource exhaustion
kubectl describe node $(kubectl get nodes -o jsonpath='{.items[0].metadata.name}')

# 3. Check RDS connections
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=gtcx-production-operational \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 \
  --statistics Average \
  --region af-south-1

# 4. If connection pool exhausted, restart application pods
kubectl rollout restart deployment/gtcx-auth-gateway -n gtcx

# 5. If node CPU/memory high, scale node group
aws eks update-nodegroup-config \
  --cluster-name gtcx-production \
  --nodegroup-name gtcx-production-nodes \
  --scaling-config minSize=3,maxSize=6,desiredSize=4 \
  --region af-south-1
```

---

## Phase 3: Eradicate & Recover (30 min–4 hours)

### Root Cause Analysis (RCA)

| Tool                     | Purpose                | Command                                                  |
| ------------------------ | ---------------------- | -------------------------------------------------------- |
| CloudWatch Logs Insights | Query log patterns     | `aws logs start-query`                                   |
| X-Ray traces             | Distributed tracing    | AWS Console → X-Ray                                      |
| Prometheus               | Metrics correlation    | `kubectl port-forward -n monitoring svc/prometheus 9090` |
| VPC Flow Logs            | Network-level analysis | Athena query on S3 Flow Logs                             |

### Recovery Verification

Before declaring "all clear," verify:

```bash
# 1. All pods healthy
kubectl get pods -n gtcx
# Expected: All pods Running, 0 CrashLoopBackOff

# 2. Error rate < 1%
# Check Prometheus: rate(intelligence_errors_total[5m]) / rate(intelligence_requests_total[5m]) < 0.01

# 3. Latency P95 < 500ms
# Check Prometheus: histogram_quantile(0.95, rate(intelligence_request_duration_ms_bucket[5m])) < 500

# 4. RDS connections stable
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=gtcx-production-operational \
  --start-time $(date -u -d '5 min ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 60 \
  --statistics Average \
  --region af-south-1

# 5. Anomaly detector passes
kubectl create job --from=cronjob/anomaly-detector anomaly-detector-verify -n gtcx
kubectl logs -n gtcx job/anomaly-detector-verify
# Expected: {"type":"anomaly.detector.healthy","rulesEvaluated":5}
```

---

## Phase 4: Post-Incident (4–72 hours)

### Required Artifacts

| Artifact            | Owner         | Deadline  | Storage                                                     |
| ------------------- | ------------- | --------- | ----------------------------------------------------------- |
| Incident Timeline   | IC            | +4 hours  | `01-docs/incidents/YYYY-MM-DD-title.md`                     |
| Root Cause Analysis | TL            | +24 hours | Same file, RCA section                                      |
| Remediation Tickets | IC            | +24 hours | GitHub Issues with `incident-followup` label                |
| Evidence Archive    | Security Lead | +24 hours | WORM S3: `gtcx-worm-audit-production-af-south-1/incidents/` |
| Retrospective Notes | IC            | +72 hours | Scheduled meeting + doc                                     |

### Evidence Preservation

All forensic evidence must be copied to WORM storage within 24 hours:

```bash
# Create incident folder in WORM bucket
aws s3api put-object \
  --bucket gtcx-worm-audit-production-af-south-1 \
  --key incidents/2026-05-13-outage/ \
  --region af-south-1

# Upload evidence
aws s3 cp /tmp/incident-*.yaml s3://gtcx-worm-audit-production-af-south-1/incidents/2026-05-13-outage/
aws s3 cp /tmp/incident-*.txt s3://gtcx-worm-audit-production-af-south-1/incidents/2026-05-13-outage/
aws s3 cp /tmp/incident-*.json s3://gtcx-worm-audit-production-af-south-1/incidents/2026-05-13-outage/

# Verify Object Lock
aws s3api get-object-retention \
  --bucket gtcx-worm-audit-production-af-south-1 \
  --key incidents/2026-05-13-outage/incident-logs.txt \
  --region af-south-1
```

### Retrospective Template

```markdown
# Incident Retrospective: [Title]

## Timeline

- 05:45 UTC — Anomaly detector alerts `query_rate_spike`
- 05:47 UTC — On-call engineer paged
- 05:52 UTC — Identified RDS connection pool exhaustion
- 06:15 UTC — Restarted auth-gateway pods, error rate dropped
- 06:30 UTC — All-clear declared

## Root Cause

RDS `max_connections` (100) exceeded by connection leak in auth-gateway v1.2.3.

## Impact

- 43 minutes of degraded service (P95 latency > 2s)
- 0 financial transactions affected (settlement queue buffered)
- 0 data loss

## What Went Well

- Anomaly detector caught spike within 2 minutes
- Staging environment validated fix before production deploy

## What Went Wrong

- Connection leak not caught in CI load tests
- No RDS connection alarm configured

## Action Items

| #   | Action                              | Owner         | Due        |
| --- | ----------------------------------- | ------------- | ---------- |
| 1   | Fix connection leak in auth-gateway | @backend-team | 2026-05-15 |
| 2   | Add RDS connection count alarm      | @platform     | 2026-05-14 |
| 3   | Load test with connection stress    | @qa           | 2026-05-17 |
```

---

## Emergency Contacts

| Role                            | Primary        | Secondary      | After Hours      |
| ------------------------------- | -------------- | -------------- | ---------------- |
| Platform Engineering Lead       | #gtcx-platform | @platform-lead | +27-XXX-XXXX     |
| CTO                             | @cto           | @cto-deputy    | +27-XXX-XXXX     |
| CISO                            | @ciso          | @security-lead | +27-XXX-XXXX     |
| AWS Enterprise Support          | Case: EXXXXXX  | —              | 24/7 via console |
| Orange Cyberdefense (SensePost) | Account Mgr    | —              | Business hours   |

---

## Appendix A: Emergency Commands

### Complete Service Shutdown (Nuclear Option)

```bash
# Only IC or CTO can authorize
aws eks update-nodegroup-config \
  --cluster-name gtcx-production \
  --nodegroup-name gtcx-production-nodes \
  --scaling-config minSize=0,maxSize=0,desiredSize=0 \
  --region af-south-1

# Restore
aws eks update-nodegroup-config \
  --cluster-name gtcx-production \
  --nodegroup-name gtcx-production-nodes \
  --scaling-config minSize=3,maxSize=6,desiredSize=3 \
  --region af-south-1
```

### WAF Emergency Allow-All

```bash
# Temporarily disable all WAF rules (last resort)
aws wafv2 update-web-acl \
  --name gtcx-production-waf-af-south-1 \
  --scope REGIONAL \
  --id $(terraform output -raw waf_acl_id) \
  --default-action Allow={} \
  --rules [] \
  --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=gtcx-production-waf \
  --region af-south-1
```

### RDS Emergency Snapshot & Restore

```bash
# Create immediate snapshot
aws rds create-db-snapshot \
  --db-instance-identifier gtcx-production-operational \
  --db-snapshot-identifier gtcx-production-operational-emergency-$(date +%s) \
  --region af-south-1

# Restore from snapshot (if needed)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier gtcx-production-operational-restored \
  --db-snapshot-identifier <snapshot-id> \
  --region af-south-1
```

---

_Playbook version: 1.0_  
_Drill schedule: Monthly (first Monday, 10:00 CAT)_  
_Next review: After first production incident or 2026-06-13_
