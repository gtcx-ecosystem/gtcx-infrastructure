---
title: 'Intelligence Staging Ingress — Provision Response'
status: current
date: '2026-06-02'
owner: infrastructure-security-engineer
tier: critical
tags: ['ingress', 'staging', 'intelligence', 'dns']
review_cycle: on-change
---

# Intelligence Staging Ingress — Provision Response

> Requested by: gtcx-intelligence team  
> Date: 2026-06-02  
> Repo: gtcx-infrastructure  
> Commit: TBD

## Request Summary

Provision a resolvable staging hostname for the Intelligence orchestrator with working `/health`, `/ready`, `/live`, `/metrics` endpoints.

## What Was Provisioned (in-repo)

### 1. Staging Intelligence Overlay

**Path:** `infra/kubernetes/overlays/staging/intelligence/`

| File                 | Purpose                                           |
| -------------------- | ------------------------------------------------- |
| `kustomization.yaml` | Overlay definition (namespace: intelligence)      |
| `namespace.yaml`     | Namespace with restricted pod-security policy     |
| `ingress.yaml`       | ALB ingress for `intelligence-staging.gtcx.trade` |

**Ingress details:**

- Host: `intelligence-staging.gtcx.trade`
- Backend: `intelligence-orchestrator:8200` (ClusterIP)
- Path: `/` (Prefix) — covers `/health`, `/ready`, `/live`, `/metrics`
- ALB health check: `/health`
- TLS: ACM certificate (see prerequisite below)
- DNS: managed by external-dns annotation

**Apply command:**

```bash
kubectl apply -k infra/kubernetes/overlays/staging/intelligence/
```

### 2. Deploy Workflow Updated

**File:** `.github/workflows/deploy-staging.yml`

- Added `kubectl apply -k infra/kubernetes/overlays/staging/intelligence/` step
- Added `intelligence-orchestrator` rollout check in the `intelligence` namespace

## Prerequisites Before DNS Resolves

| Prerequisite                                                           | Status    | Owner             |
| ---------------------------------------------------------------------- | --------- | ----------------- |
| ACM certificate covers `intelligence-staging.gtcx.trade`               | ⚠️ Verify | ops / AWS admin   |
| `intelligence-orchestrator` service exists in `intelligence` namespace | ⚠️ Verify | gtcx-intelligence |
| `intelligence-orchestrator` deployment is running in staging           | ⚠️ Verify | gtcx-intelligence |
| external-dns is deployed and has Route53 write access                  | ⚠️ Verify | ops               |

## Verification Commands (for gtcx-intelligence)

Once the above prerequisites are met and the overlay is applied:

```bash
# DNS resolution
dig intelligence-staging.gtcx.trade +short

# Health probe
curl -s https://intelligence-staging.gtcx.trade/health

# Readiness / liveness / metrics
curl -s https://intelligence-staging.gtcx.trade/ready
curl -s https://intelligence-staging.gtcx.trade/live
curl -s https://intelligence-staging.gtcx.trade/metrics

# Full smoke (from gtcx-intelligence repo)
pnpm evidence:deployment-smoke -- --base-url https://intelligence-staging.gtcx.trade
```

## Known Issues / Risks

1. **ACM certificate coverage**: The ingress uses the same certificate ARN as the base intelligence ingress (`5fa25ba3-82ea-47de-80d8-fc68e0722d01`). If this certificate does not cover `*.gtcx.trade` or `intelligence-staging.gtcx.trade` specifically, HTTPS will fail with a certificate error. Verify in AWS ACM or request a new certificate.

2. **Backend service existence**: The ingress routes to `intelligence-orchestrator:8200`. If this Service does not exist in the `intelligence` namespace, the ALB target group will show all targets as unhealthy and return 503.

3. **external-dns not running**: If external-dns is not installed in the cluster, the Route53 A record will not be created automatically. Manual DNS entry or external-dns installation required.

## Rollback

```bash
kubectl delete -k infra/kubernetes/overlays/staging/intelligence/
```

## Agent Attestation

- [x] Staging intelligence overlay created
- [x] Ingress manifest with external-dns annotation created
- [x] Deploy workflow updated to apply overlay
- [x] Rollout check added for intelligence-orchestrator
- [ ] ACM certificate verified (requires AWS console access)
- [ ] Backend service verified (requires cluster access)
- [ ] DNS resolution confirmed (requires external-dns + Route53)
