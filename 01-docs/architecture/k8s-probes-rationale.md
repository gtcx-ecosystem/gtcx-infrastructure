---
title: 'K8s Health Probes — Rationale and Coverage'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['security', 'compliance', 'architecture', 'infrastructure', 'api']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# K8s Health Probes — Rationale and Coverage

## Verified Coverage (2026-05)

All **Deployments** in `04-ship/kubernetes/base/services/` have liveness + readiness probes:

| Resource                                | Kind        | livenessProbe | readinessProbe | startupProbe |
| --------------------------------------- | ----------- | ------------- | -------------- | ------------ |
| `api.yaml`                              | Deployment  | ✅            | ✅             | —            |
| `exporters.yaml`                        | Deployment  | ✅            | ✅             | —            |
| `monitoring.yaml`                       | Deployment  | ✅ (×4)       | ✅ (×4)        | —            |
| `nats.yaml`                             | Deployment  | ✅            | ✅             | ✅           |
| `otel-collector.yaml`                   | Deployment  | ✅            | ✅             | —            |
| `postgres-audit.yaml`                   | StatefulSet | ✅            | ✅             | ✅           |
| `protocols.yaml`                        | Deployment  | ✅            | ✅             | ✅           |
| `promtail.yaml`                         | Deployment  | ✅            | ✅             | —            |
| `replay-guard.yaml`                     | Deployment  | ✅            | ✅             | —            |
| `replay-guard-sidecar-integration.yaml` | Deployment  | ✅            | ✅             | —            |

## Resources Intentionally Without Container Probes

The following files are **not** Deployments/StatefulSets; they are routing or identity resources and therefore do not run containers that accept K8s probes:

| Resource                            | Kind                          | Why Probes Are N/A                                                                                                                                                                                    |
| ----------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `platform.yaml`                     | ServiceAccount                | No containers; used for IRSA pod identity only.                                                                                                                                                       |
| `intelligence-ingress.yaml`         | Ingress                       | AWS ALB ingress resource; health checks are configured via ALB annotations (`alb.ingress.kubernetes.io/healthcheck-path: /health`).                                                                   |
| `intelligence-shadow.yaml`          | Gateway + HTTPRoute + Service | Gateway API routing resource; health checks belong on the backend Deployments (`intelligence-cortex-stable`, `intelligence-cortex-candidate`, `intelligence-orchestrator`), not on the routing layer. |
| `replay-guard-external-secret.yaml` | ExternalSecret                | External Secrets Operator custom resource; health is managed by the ESO controller.                                                                                                                   |

## Conclusion

All container workloads have probes. The three files flagged in the audit (`platform.yaml`, `intelligence-ingress.yaml`, `intelligence-shadow.yaml`) are non-container resources and correctly do not define K8s container probes.
