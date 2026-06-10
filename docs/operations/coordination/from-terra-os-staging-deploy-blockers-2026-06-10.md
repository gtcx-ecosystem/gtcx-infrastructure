---
title: 'Inbound — TerraOS staging deploy blockers (from terra-os)'
status: current
date: 2026-06-10
from: terra-os
to: gtcx-infrastructure
owner: gtcx-infrastructure
priority: P1
work_id: CI-TERRA-20260609-02
blocking: true
canonical_source: terra-os/docs/operations/coordination/to-gtcx-infrastructure-terraos-staging-deploy-2026-06-10.md
---

# Inbound — TerraOS staging deploy (P1)

**Received:** 2026-06-10 · **Escalation:** `--escalate @gtcx-infrastructure`

**Canonical source:** [terra-os `to-gtcx-infrastructure-terraos-staging-deploy-2026-06-10.md`](https://github.com/gtcx-ecosystem/terra-os/blob/main/docs/operations/coordination/to-gtcx-infrastructure-terraos-staging-deploy-2026-06-10.md)

## TL;DR

TerraOS images and CI deploy job are **green**. Runtime blocked on **`gtcx-staging`**:

1. **CPU / pod saturation** — `terraos` pods `Pending` (`Insufficient cpu`, `Too many pods`)
2. **Missing SM secrets** — `terraos/staging/rds`, `terraos/staging/redis` (app-secrets exists)
3. **Ingress** (P2) — ALB host wiring after pods healthy

## Owner actions

| Priority | Action                                             | Module pattern                                           |
| -------- | -------------------------------------------------- | -------------------------------------------------------- |
| P1       | Warm/scale staging EKS or approve 1-replica deploy | `deploy/terraform/environments/staging` · `cost-profile` |
| P1       | RDS + `terraos/staging/rds` SM secret              | `modules/database` or new terra-os DB                    |
| P1       | Redis + `terraos/staging/redis` SM secret          | ElastiCache or shared redis                              |
| P1       | IRSA for `terraos` namespace ESO                   | `modules/secrets/terminal-os.tf`                         |
| P2       | ALB ingress host for terra staging                 | `modules/alb` / k8s overlays                             |

## Evidence

- Workflow: https://github.com/gtcx-ecosystem/terra-os/actions/runs/27247037287
- Namespace: `terraos` on cluster `gtcx-staging` (af-south-1)
- OIDC role in use: `arn:aws:iam::348389439381:role/gtcx-staging-shared-deploy`

## Closure witness

Reply: `to-terra-os-staging-deploy-witness-2026-06-10.md` with:

- `kubectl get pods -n terraos` (Running)
- `externalsecret` sync status
- `curl` /health on staging URL (when ingress wired)
