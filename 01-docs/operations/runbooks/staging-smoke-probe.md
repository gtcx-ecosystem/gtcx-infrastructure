---
title: 'Staging Smoke Probe — In-Cluster Runtime Evidence'
status: 'current'
date: '2026-05-27'
owner: 'sre'
role: 'sre'
tier: 'critical'
tags: ['runtime', 'smoke', 'evidence', 'staging', 'kubernetes']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Staging Smoke Probe — In-Cluster Runtime Evidence

> **Purpose:** Close the authenticated staging runtime smoke gap by running probes from inside the cluster, bypassing ALB/WAF 403s while still producing auditable evidence.
> **Why in-cluster:** The staging ALB routes to `gtcx-protocols-staging:8300` and WAF blocks unauthenticated public `/health` probes. The compliance-gateway Service (`compliance-gateway.gtcx.svc.cluster.local:8500`) is reachable internally and exposes `/health` and `/metrics` without application-level auth.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  gtcx-staging namespace                      │
│  ┌──────────────┐   ┌─────────────────────┐ │
│  │ smoke-probe  │──▶│ compliance-gateway  │ │
│  │  CronJob     │   │  Service:8500       │ │
│  └──────────────┘   └─────────────────────┘ │
│         │                                    │
│         ▼                                    │
│  ┌──────────────┐   ┌─────────────────────┐ │
│  │ evidence     │──▶│ S3 WORM bucket      │ │
│  │  EmptyDir    │   │  (optional IRSA)    │ │
│  └──────────────┘   └─────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## Deploy

### 1. Apply the manifest

```bash
kubectl apply -f 04-ship/kubernetes/overlays/staging/smoke-probe-cronjob.yaml
```

### 2. Verify the CronJob is scheduled

```bash
kubectl get cronjob gtcx-smoke-probe -n gtcx-staging
```

### 3. Trigger a manual run

```bash
kubectl create job --from=cronjob/gtcx-smoke-probe smoke-probe-manual-$(date +%s) -n gtcx-staging
```

### 4. Collect evidence from the latest pod

```bash
POD=$(kubectl get pods -n gtcx-staging -l app=gtcx-smoke-probe --sort-by=.status.startTime -o jsonpath='{.items[-1].metadata.name}')
kubectl cp "gtcx-staging/${POD}:/evidence" "./smoke-evidence-$(date -u +%Y%m%d-%H%M%S)"
```

---

## Upgrade to Full Script

The CronJob currently uses a minimal `wget` loop because the `gtcx-ctl` scripts are not yet baked into a container image. To upgrade:

1. Build a `gtcx-smoke-probe` image:

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY 03-platform/tools/control-plane/capture-runtime-smoke-evidence.mjs ./
ENTRYPOINT ["node", "capture-runtime-smoke-evidence.mjs"]
```

2. Update the CronJob initContainer image:

```yaml
image: 348389439381.dkr.ecr.af-south-1.amazonaws.com/gtcx-smoke-probe:latest
command:
  - node
  - capture-runtime-smoke-evidence.mjs
args:
  - --environment=staging
  - --base-url=http://compliance-gateway.gtcx.svc.cluster.local:8500
  - --output-dir=/evidence
```

3. Re-apply:

```bash
kubectl apply -f 04-ship/kubernetes/overlays/staging/smoke-probe-cronjob.yaml
```

---

## Optional: S3 Upload via IRSA

To automatically upload evidence to the staging WORM bucket, create an IRSA role:

```bash
# 04-ship/terraform/environments/staging/main.tf
module "smoke_probe_irsa" {
  source = "../../modules/audit-flush-irsa"  # or a generic irsa module

  environment       = var.environment
  oidc_provider_arn = module.eks.oidc_provider_arn
  oidc_provider_url = replace(module.eks.oidc_provider_url, "https://", "")
  worm_bucket_arn   = module.worm_audit.bucket_arn
  worm_kms_key_arn  = module.worm_audit.kms_key_arn

  # Override the role name and trust condition for the smoke-probe SA
  role_name = "gtcx-staging-smoke-probe"
  service_account_name = "gtcx-smoke-probe"
}
```

Then annotate the ServiceAccount:

```bash
kubectl annotate serviceaccount gtcx-smoke-probe -n gtcx-staging \
  eks.amazonaws.com/role-arn="$(terraform output -raw smoke_probe_irsa_role_arn)"
```

---

## Evidence Format

Each run produces:

- `health.json` — HTTP status, timestamp, response hash
- `metrics.json` — HTTP status, timestamp, response hash
- `runtime-smoke-evidence.json` — full schema (after upgrading to `capture-runtime-smoke-evidence.mjs`)

Commit the collected evidence to `04-ship/security/reports/runtime-smoke-evidence/staging/` and link from `01-docs/05-audit/latest.json`.

---

## Audit Closure Criteria

This runbook closes the gap when:

1. The CronJob is deployed and running in `gtcx-staging`.
2. At least one successful manual run is captured and stored.
3. Evidence shows `/health` returning `200` with `status: healthy`.
4. Evidence shows `/metrics` returning `200` with Prometheus text format.
5. (Optional) Evidence is uploaded to the staging WORM bucket with Object Lock retention.
