---
title: 'Anomaly Detector — Operations Runbook'
status: 'current'
date: '2026-05-27'
owner: 'quality-evidence-lead'
role: 'quality-evidence-lead'
tier: 'standard'
tags: ['security', 'compliance', 'architecture', 'infrastructure', 'testing']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Anomaly Detector — Operations Runbook

**Service:** `anomaly-detector`  
**Namespace:** `gtcx` (staging), `gtcx-production` (production)  
**Workload Type:** CronJob (runs every 5 minutes)  
**Image:** `348389439381.dkr.ecr.af-south-1.amazonaws.com/gtcx-anomaly-detector:latest`  
**Last Updated:** 2026-05-13

---

## Architecture

The anomaly detector is a batch evaluation tool that queries Prometheus for metrics and applies 5 rule-based checks. It is **not** a long-running service — it evaluates rules and exits. This is why it runs as a `CronJob` rather than a `Deployment`.

```
┌─────────────────┐     ┌─────────────┐     ┌─────────────────┐
│  CronJob (5min) │────▶│  Prometheus │────▶│  Alert Webhook  │
│  anomaly-detector│     │  (monitoring)│     │  (PagerDuty/Slack)│
└─────────────────┘     └─────────────┘     └─────────────────┘
```

### Rules Evaluated

| #   | Rule                             | Description                                | Threshold                  |
| --- | -------------------------------- | ------------------------------------------ | -------------------------- |
| 1   | `query_rate_spike`               | Sudden increase in compliance query rate   | > 10× baseline             |
| 2   | `mutating_tool_without_approval` | Tool mutation without approval context     | Any occurrence             |
| 3   | `replay_rejection_rate`          | Replay protection rejecting valid requests | > 5% rejection             |
| 4   | `unknown_did_frequency`          | Unrecognized DIDs appearing in traffic     | > 3 unique unknown/min     |
| 5   | `off_hours_admin_access`         | Admin actions outside business hours (CAT) | Any occurrence 18:00–06:00 |

---

## Quick Reference

### Check Current Status

```bash
# List recent jobs
kubectl get jobs -n gtcx -l app=anomaly-detector

# View CronJob schedule
kubectl get cronjob anomaly-detector -n gtcx

# Check latest job logs
kubectl logs -n gtcx -l app=anomaly-detector --tail=50
```

### Manual Trigger

```bash
kubectl create job --from=cronjob/anomaly-detector anomaly-detector-manual -n gtcx
kubectl logs -n gtcx job/anomaly-detector-manual --follow
```

### View Prometheus Metrics

```bash
# Port-forward Prometheus
kubectl port-forward -n monitoring svc/prometheus 9090:9090

# Query in browser: http://localhost:9090
```

---

## Alerting

The detector sends alerts via the `ALERT_WEBHOOK_URL` environment variable (configured as a Kubernetes secret `gtcx-secrets`).

### Alert Format

```json
{
  "level": "warning",
  "type": "anomaly.detector.alert",
  "rule": "query_rate_spike",
  "message": "Query rate 15× above baseline",
  "timestamp": "2026-05-13T05:40:00Z",
  "value": 15.3,
  "threshold": 10
}
```

### When an Alert Fires

1. **Verify it's not a false positive:**
   - Check if a known deployment or load test is running
   - Review Prometheus metrics for the time window
   - Check if the spike is sustained (> 1 evaluation cycle)

2. **Escalation path:**
   - **P1 (Critical):** `mutating_tool_without_approval`, `replay_rejection_rate` → Page on-call immediately
   - **P2 (High):** `query_rate_spike`, `unknown_did_frequency` → Notify #gtcx-alerts Slack
   - **P3 (Medium):** `off_hours_admin_access` → Log for SOC 2 review, notify security team

3. **Triage checklist:**
   - [ ] Check EKS node health: `kubectl top nodes`
   - [ ] Check RDS connection count: CloudWatch `DatabaseConnections`
   - [ ] Check WAF blocked requests: AWS Console → WAF → Sampled requests
   - [ ] Check for DDoS: VPC Flow Logs → unusually high source IP count
   - [ ] Review auth gateway logs: `kubectl logs -n gtcx deployment/gtcx-auth-gateway`

---

## Common Issues

### Issue: Job stays in `Pending` or `ContainerCreating`

**Symptoms:** CronJob schedule missed, no logs produced.

**Diagnosis:**

```bash
kubectl describe pod -n gtcx -l app=anomaly-detector
```

**Common causes:**

- Node resource exhaustion (CPU/memory)
- Image pull failure (ECR auth or network)
- PVC binding delay (not applicable — uses emptyDir)

**Resolution:**

```bash
# Check node resources
kubectl top nodes

# If nodes are full, scale EKS node group
aws eks update-nodegroup-config \
  --cluster-name gtcx-staging \
  --nodegroup-name gtcx-staging-nodes \
  --scaling-config minSize=3,maxSize=6,desiredSize=4
```

---

### Issue: `CrashLoopBackOff` (historic — now resolved)

>

---

### Issue: Prometheus unreachable (`getaddrinfo ENOTFOUND`)

**Symptoms:** Logs show:

```json
{
  "level": "error",
  "type": "anomaly.detector.error",
  "message": "getaddrinfo ENOTFOUND prometheus.monitoring.svc.cluster.local"
}
```

**Diagnosis:**

```bash
kubectl get svc prometheus -n monitoring
kubectl get pods -n monitoring -l app=prometheus
```

**Resolution:**

```bash
# If Prometheus is missing, redeploy
kubectl apply -f 04-ship/kubernetes/base/services/monitoring.yaml

# If namespace is wrong, verify service DNS:
kubectl get svc -n monitoring
# Expected: prometheus.monitoring.svc.cluster.local:9090
```

---

### Issue: False positives after deployment

**Symptoms:** Spurious alerts for `query_rate_spike` or `replay_rejection_rate`.

**Cause:** Baseline metrics are calculated over a 5-minute window. A sudden traffic shift (e.g., new partner onboarding, marketing campaign) can trigger thresholds.

**Resolution:**

1. Temporarily raise the threshold (requires image rebuild):

   ```bash
   # Edit detector.mjs threshold value, rebuild, push
   cd 03-platform/tools/anomaly-detector
   # Update THRESHOLD constant
   pnpm test
   git commit -am "chore(anomaly): raise threshold for X"
   git push origin main  # Triggers CI build
   ```

2. Or suppress alerts via webhook filter (faster):
   ```bash
   # Add annotation to suppress specific rule for N minutes
   kubectl annotate cronjob anomaly-detector -n gtcx \
     anomaly.gtcx.trade/suppress-rule=query_rate_spike \
     anomaly.gtcx.trade/suppress-until=$(date -u -d '+30 minutes' +%Y-%m-%dT%H:%M:%SZ)
   ```

---

## Maintenance

### Update Image

The image tag is `latest` with `imagePullPolicy: Always`. To deploy a new version:

```bash
# 1. Push changes to main (triggers CI build)
git push origin main

# 2. Verify image in ECR
aws ecr describe-images \
  --repository-name gtcx-anomaly-detector \
  --image-ids imageTag=latest \
  --region af-south-1

# 3. Trigger manual job to verify
kubectl create job --from=cronjob/anomaly-detector anomaly-detector-verify -n gtcx
kubectl logs -n gtcx job/anomaly-detector-verify --follow
```

### Modify Schedule

```bash
# Edit CronJob schedule (e.g., every 2 minutes for testing)
kubectl patch cronjob anomaly-detector -n gtcx \
  --type merge \
  -p '{"spec":{"schedule":"*/2 * * * *"}}'

# Revert to production schedule
kubectl patch cronjob anomaly-detector -n gtcx \
  --type merge \
  -p '{"spec":{"schedule":"*/5 * * * *"}}'
```

### Rotate Alert Webhook Secret

```bash
# Update ALERT_WEBHOOK_URL in gtcx-secrets
kubectl patch secret gtcx-secrets -n gtcx \
  --type merge \
  -p '{"stringData":{"ALERT_WEBHOOK_URL":"https://hooks.new-url.com/..."}}'
```

---

## Scaling Considerations

| Metric                           | Threshold                        | Action                                         |
| -------------------------------- | -------------------------------- | ---------------------------------------------- |
| Job duration > 4 minutes         | Approaching CronJob interval     | Scale Prometheus or reduce rule complexity     |
| Prometheus scrape failures > 10% | Monitoring degraded              | Check Prometheus resource limits               |
| Alert firing rate > 50/day       | Threshold too sensitive          | Review and tune rule parameters                |
| No alerts for 7 days             | Detector may be silently failing | Verify CronJob is scheduling and jobs complete |

---

## Production Deployment Checklist

When promoting from staging to production:

- [ ] Change namespace from `gtcx` to `gtcx-production`
- [ ] Update Prometheus URL to production monitoring stack
- [ ] Verify `ALERT_WEBHOOK_URL` points to production PagerDuty/Slack
- [ ] Ensure `gtcx-secrets` exists in production namespace
- [ ] Verify EKS node group has capacity (minimum 3 nodes)
- [ ] Test manual job before enabling CronJob schedule
- [ ] Set `concurrencyPolicy: Forbid` to prevent overlapping runs
- [ ] Configure `successfulJobsHistoryLimit: 7` (retain 1 week of history)

---

## Contact

| Role                 | Contact              | Escalation |
| -------------------- | -------------------- | ---------- |
| Platform Engineering | #gtcx-platform Slack | CTO        |
| Security On-Call     | PagerDuty rotation   | CISO       |
| SRE (out of hours)   | +27-XXX-XXXX         | CTO        |

---

_Runbook version: 1.0_  
_Review cycle: Monthly or after any incident_
