---
title: 'K8s Manifest Ownership — Infrastructure vs Protocols'
status: 'current'
date: '2026-05-27'
owner: 'quality-evidence-lead'
role: 'quality-evidence-lead'
tier: 'standard'
tags: ['security', 'compliance', 'infrastructure', 'testing', 'api']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# K8s Manifest Ownership — Infrastructure vs Protocols

**Status:** Action required
**Date:** 2026-05-10
**Finding source:** Infrastructure repo audit (8.4/10 — cross-repo duplication flagged)

---

## Problem

Two repos ship K8s manifests for the same services, creating conflicting sources of truth:

```
gtcx-infrastructure/04-ship/kubernetes/     ← Platform team
gtcx-protocols/deploy/                    ← Application team
```

### Specific conflicts

| Resource              | Infrastructure repo                                           | Protocols repo                               | Conflict                                             |
| --------------------- | ------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------- |
| **Service mesh**      | `overlays/production/linkerd/` (Linkerd mTLS)                 | `deploy/k8s/istio-mtls.yaml` (Istio mTLS)    | Two different service meshes. Can't run both.        |
| **Network policy**    | `overlays/production/network-policies.yaml`                   | `deploy/k8s/network-policy.yaml`             | Two policy sets, likely overlapping or contradicting |
| **Prometheus alerts** | `04-ship/monitoring/alerts/protocol-alerts.yml`               | `deploy/monitoring/prometheus-alerts.yaml`   | Duplicate alert definitions for same service         |
| **SLO rules**         | `04-ship/monitoring/rules/slo-recording-rules.yml`            | `deploy/monitoring/slo-recording-rules.yaml` | Duplicate recording rules                            |
| **Deployment**        | `04-ship/kubernetes/base/services/api.yaml`                   | `deploy/k8s/deployment.yaml`                 | Two deployment manifests for protocols               |
| **Service**           | `04-ship/kubernetes/base/services/protocols.yaml` (ClusterIP) | `deploy/k8s/service.yaml`                    | Two service definitions                              |
| **HPA**               | Defined in `base/services/api.yaml`                           | `deploy/k8s/hpa.yaml`                        | Duplicate autoscaling config                         |
| **PDB**               | Defined in `base/services/api.yaml`                           | `deploy/k8s/pdb.yaml`                        | Duplicate disruption budget                          |

### Risk

- Deploy from infrastructure repo → uses Linkerd, one set of alerts
- Deploy from protocols repo → uses Istio, different alerts
- Neither is canonical — whoever deploys last wins
- Alert drift means incidents get missed or double-fired

---

## Proposed Ownership Model

### Principle: App teams own app manifests. Platform team owns platform boundaries.

| Concern                                | Owner              | Repo                                                                  | Rationale                                             |
| -------------------------------------- | ------------------ | --------------------------------------------------------------------- | ----------------------------------------------------- |
| Deployment spec (replicas, image, env) | **Protocols**      | `gtcx-protocols/deploy/k8s/deployment.yaml`                           | App team knows resource needs, startup args, env vars |
| Service definition                     | **Protocols**      | `gtcx-protocols/deploy/k8s/service.yaml`                              | App team knows which ports to expose                  |
| HPA (autoscaling)                      | **Protocols**      | `gtcx-protocols/deploy/k8s/hpa.yaml`                                  | App team knows scaling characteristics                |
| PDB (disruption budget)                | **Protocols**      | `gtcx-protocols/deploy/k8s/pdb.yaml`                                  | App team knows availability requirements              |
| ConfigMap                              | **Protocols**      | `gtcx-protocols/deploy/k8s/configmap.yaml`                            | App-specific configuration                            |
| Migration job                          | **Protocols**      | `gtcx-protocols/deploy/k8s/migration-job.yaml`                        | App owns schema migrations                            |
| Prometheus alerts                      | **Protocols**      | `gtcx-protocols/deploy/monitoring/prometheus-alerts.yaml`             | App team knows what to alert on                       |
| Namespace                              | **Infrastructure** | `gtcx-infrastructure/04-ship/kubernetes/base/`                        | Platform owns namespace lifecycle                     |
| Network policy                         | **Infrastructure** | `gtcx-infrastructure/04-ship/kubernetes/overlays/`                    | Platform owns security boundaries                     |
| Service mesh (Linkerd)                 | **Infrastructure** | `gtcx-infrastructure/04-ship/kubernetes/overlays/production/linkerd/` | Platform decision — one mesh for all services         |
| SLO recording rules                    | **Infrastructure** | `gtcx-infrastructure/04-ship/monitoring/rules/`                       | Platform owns SLO definitions                         |
| Ingress / tunnel routing               | **Infrastructure** | `gtcx-infrastructure/04-ship/kubernetes/base/services/cloudflared/`   | Platform owns external routing                        |
| Kyverno admission policies             | **Infrastructure** | `gtcx-infrastructure/04-ship/kubernetes/base/policies/`               | Platform owns admission control                       |
| Resource quotas                        | **Infrastructure** | `gtcx-infrastructure/04-ship/kubernetes/overlays/`                    | Platform owns capacity limits                         |

---

## Actions Required

### In gtcx-protocols (app team)

1. **Delete `deploy/k8s/istio-mtls.yaml`** — we use Linkerd, not Istio. This file is dead code.

2. **Delete `deploy/k8s/namespace.yaml`** — infrastructure owns namespace creation.

3. **Delete `deploy/k8s/network-policy.yaml`** — infrastructure owns network policies. If protocols needs specific egress rules, add them to `deploy/k8s/` with a clear comment that they're additive to the platform policy, and coordinate with infrastructure.

4. **Delete `deploy/k8s/resource-quota.yaml`** — infrastructure sets quotas at the namespace level.

5. **Keep and own:**
   - `deployment.yaml` — this is the canonical deployment spec
   - `service.yaml` — this is the canonical service definition
   - `hpa.yaml`, `pdb.yaml` — app-level scaling and disruption
   - `configmap.yaml`, `secret.yaml`, `external-secret.yaml`
   - `migration-job.yaml`
   - `ingress.yaml` — app-level ingress annotations (but routing is via Cloudflare Tunnel now)
   - `argo-rollout.yaml`, `argo-analysis.yaml` — if using Argo for canary
   - `workload-identity.yaml` — app-specific IRSA binding

6. **Keep `deploy/monitoring/prometheus-alerts.yaml`** — this is the canonical alert definition for protocols. Infrastructure will delete its duplicate.

7. **Delete `deploy/monitoring/slo-recording-rules.yaml`** — SLO definitions are platform-level, owned by infrastructure.

8. **Review `deploy/security/falco-rules.yaml`** — if Falco is deployed, coordinate with infrastructure to ensure rules don't conflict.

9. **Review `deploy/waf/`** — WAF rules are now managed via Terraform ALB module in infrastructure. If protocols has WAF overrides, coordinate.

### In gtcx-infrastructure (platform team)

1. **Delete `04-ship/kubernetes/base/services/api.yaml`** — protocols repo owns the deployment. Infrastructure was maintaining a duplicate.

2. **Delete `04-ship/monitoring/alerts/protocol-alerts.yml`** — protocols repo owns its alerts. Infrastructure will consume them via Prometheus federation or shared rules path.

3. **Keep and own:**
   - `04-ship/kubernetes/base/services/cloudflared/` — tunnel routing
   - `04-ship/kubernetes/base/services/nats.yaml` — NATS is platform infrastructure
   - `04-ship/kubernetes/base/services/otel-collector.yaml` — observability infra
   - `04-ship/kubernetes/base/policies/` — all Kyverno admission policies
   - `04-ship/kubernetes/overlays/production/linkerd/` — service mesh
   - `04-ship/kubernetes/overlays/production/network-policies.yaml` — security boundaries
   - `04-ship/monitoring/rules/slo-recording-rules.yml` — platform SLO definitions

---

## Deployment Flow (After Reconciliation)

```
Developer pushes to gtcx-protocols
  → CI builds container image, pushes to ECR (via infrastructure build-push-ecr.yml)
  → Protocols deploy/ manifests applied to cluster
  → Infrastructure overlays (network policy, Linkerd, quotas) already in place

Platform engineer updates infrastructure
  → Terraform applies (VPC, EKS, RDS, KMS)
  → Kustomize overlays applied (policies, mesh, quotas)
  → Does NOT touch protocol deployment/service definitions
```

---

## Service Mesh Decision

**Decision:** Linkerd (not Istio)

**Rationale:**

- Linkerd is already deployed and configured in infrastructure repo
- Lighter weight than Istio (lower resource overhead on t3.small nodes)
- mTLS is automatic via proxy injection
- Protocols repo `istio-mtls.yaml` was never deployed (no Istio control plane exists)

**Action:** Delete `deploy/k8s/istio-mtls.yaml` in protocols repo. If mTLS annotations are needed, use Linkerd annotations:

```yaml
metadata:
  annotations:
    linkerd.io/inject: enabled
```

---

## Questions for Protocols Team

1. Is `deploy/k8s/ingress.yaml` still needed? We now route via Cloudflare Tunnel, not ALB Ingress.
2. Are Argo Rollouts (`argo-rollout.yaml`, `argo-analysis.yaml`) actively used? Argo Workflows is deployed but Rollouts controller may not be.
3. Is `deploy/k8s/multi-region-dr.yaml` active? DR is handled via infrastructure Terraform (multi-region module).
4. What's in `deploy/chaos/` and `deploy/cost-management/`? May overlap with infrastructure chaos-test workflow and compliance cost tracking.
5. Is `deploy/gitops/` a Flux/ArgoCD config? Infrastructure doesn't use GitOps operators — manifests are applied via CI.

---

_Document for cross-team alignment. Share with protocols team for review before making changes in either repo._
