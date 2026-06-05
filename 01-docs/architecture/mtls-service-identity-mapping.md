---
title: 'mTLS Service Identity Mapping'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'platform-engineer'
tier: 'critical'
tags: ['security', 'mtls', 'linkerd', 'service-mesh', 'identity']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# mTLS Service Identity Mapping

**Scope:** All services deployed to the GTCX EKS cluster  
**Mesh:** Linkerd 2.16+  
**Identity format:** `<namespace>.<service-account>.serviceaccount.identity.linkerd.cluster.local`

---

## 1. Identity Format

Linkerd derives service identities from Kubernetes ServiceAccounts:

```
<namespace>.<service-account-name>.serviceaccount.identity.linkerd.cluster.local
```

Every pod that participates in the mesh must:

1. Run with a dedicated ServiceAccount (not `default`)
2. Have the `linkerd.io/inject: enabled` annotation on its namespace or pod
3. Have a corresponding MeshTLSAuthentication resource for cross-service calls

---

## 2. Service Inventory

### Production Namespace (`gtcx`)

| Service                 | ServiceAccount          | Linkerd Identity                                                             | Mesh Policy |
| ----------------------- | ----------------------- | ---------------------------------------------------------------------------- | ----------- |
| gtcx-replay-guard       | gtcx-replay-guard       | `gtcx.gtcx-replay-guard.serviceaccount.identity.linkerd.cluster.local`       | ✅          |
| gtcx-agx                | gtcx-agx                | `gtcx.gtcx-agx.serviceaccount.identity.linkerd.cluster.local`                | ✅          |
| gtcx-platform           | gtcx-platform           | `gtcx.gtcx-platform.serviceaccount.identity.linkerd.cluster.local`           | ✅          |
| gtcx-compliance-gateway | gtcx-compliance-gateway | `gtcx.gtcx-compliance-gateway.serviceaccount.identity.linkerd.cluster.local` | ✅          |
| gtcx-protocols          | gtcx-protocols          | `gtcx.gtcx-protocols.serviceaccount.identity.linkerd.cluster.local`          | ✅          |
| gtcx-postgres           | gtcx-postgres           | `gtcx.gtcx-postgres.serviceaccount.identity.linkerd.cluster.local`           | ✅          |
| gtcx-postgres-audit     | gtcx-postgres-audit     | `gtcx.gtcx-postgres-audit.serviceaccount.identity.linkerd.cluster.local`     | ✅          |
| anomaly-detector        | anomaly-detector        | `gtcx.anomaly-detector.serviceaccount.identity.linkerd.cluster.local`        | ✅          |
| ussd-handler            | ussd-handler            | `gtcx.ussd-handler.serviceaccount.identity.linkerd.cluster.local`            | ✅          |
| promtail                | promtail                | `gtcx.promtail.serviceaccount.identity.linkerd.cluster.local`                | ✅          |
| cloudflared             | cloudflared             | `gtcx.cloudflared.serviceaccount.identity.linkerd.cluster.local`             | ✅          |
| vault                   | vault                   | `gtcx.vault.serviceaccount.identity.linkerd.cluster.local`                   | ✅          |
| prometheus              | prometheus              | `gtcx.prometheus.serviceaccount.identity.linkerd.cluster.local`              | ✅          |
| grafana                 | grafana                 | `gtcx.grafana.serviceaccount.identity.linkerd.cluster.local`                 | ✅          |
| otel-collector          | otel-collector          | `gtcx.otel-collector.serviceaccount.identity.linkerd.cluster.local`          | ✅          |

### Staging Namespace (`gtcx-staging`)

| Service                         | ServiceAccount                  | Linkerd Identity                                                                             | Mesh Policy |
| ------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------- | ----------- |
| gtcx-replay-guard-staging       | gtcx-replay-guard-staging       | `gtcx-staging.gtcx-replay-guard-staging.serviceaccount.identity.linkerd.cluster.local`       | ✅          |
| gtcx-agx-staging                | gtcx-agx-staging                | `gtcx-staging.gtcx-agx-staging.serviceaccount.identity.linkerd.cluster.local`                | ✅          |
| gtcx-platform-staging           | gtcx-platform-staging           | `gtcx-staging.gtcx-platform-staging.serviceaccount.identity.linkerd.cluster.local`           | ✅          |
| gtcx-compliance-gateway-staging | gtcx-compliance-gateway-staging | `gtcx-staging.gtcx-compliance-gateway-staging.serviceaccount.identity.linkerd.cluster.local` | ✅          |
| gtcx-protocols-staging          | gtcx-protocols-staging          | `gtcx-staging.gtcx-protocols-staging.serviceaccount.identity.linkerd.cluster.local`          | ✅          |
| gtcx-postgres-staging           | gtcx-postgres-staging           | `gtcx-staging.gtcx-postgres-staging.serviceaccount.identity.linkerd.cluster.local`           | ✅          |
| gtcx-postgres-audit-staging     | gtcx-postgres-audit-staging     | `gtcx-staging.gtcx-postgres-audit-staging.serviceaccount.identity.linkerd.cluster.local`     | ✅          |
| anomaly-detector-staging        | anomaly-detector-staging        | `gtcx-staging.anomaly-detector-staging.serviceaccount.identity.linkerd.cluster.local`        | ✅          |
| ussd-handler-staging            | ussd-handler-staging            | `gtcx-staging.ussd-handler-staging.serviceaccount.identity.linkerd.cluster.local`            | ✅          |
| promtail-staging                | promtail-staging                | `gtcx-staging.promtail-staging.serviceaccount.identity.linkerd.cluster.local`                | ✅          |
| cloudflared-staging             | cloudflared-staging             | `gtcx-staging.cloudflared-staging.serviceaccount.identity.linkerd.cluster.local`             | ✅          |
| vault-staging                   | vault-staging                   | `gtcx-staging.vault-staging.serviceaccount.identity.linkerd.cluster.local`                   | ✅          |
| prometheus-staging              | prometheus-staging              | `gtcx-staging.prometheus-staging.serviceaccount.identity.linkerd.cluster.local`              | ✅          |
| grafana-staging                 | grafana-staging                 | `gtcx-staging.grafana-staging.serviceaccount.identity.linkerd.cluster.local`                 | ✅          |
| otel-collector-staging          | otel-collector-staging          | `gtcx-staging.otel-collector-staging.serviceaccount.identity.linkerd.cluster.local`          | ✅          |

---

## 3. Authorization Matrix

### Allowed Communication Paths

| Source             | Destination        | Purpose                         |
| ------------------ | ------------------ | ------------------------------- |
| replay-guard       | protocols          | Verify signed replay payloads   |
| agx                | protocols          | Execute commodity trades        |
| platform           | protocols          | Query trade status              |
| compliance-gateway | protocols          | Policy enforcement              |
| protocols          | postgres           | Operational data read/write     |
| protocols          | postgres-audit     | Audit log writes                |
| compliance-gateway | postgres-audit     | Compliance queries              |
| anomaly-detector   | prometheus         | Metrics scraping                |
| ussd-handler       | protocols          | USSD session routing            |
| promtail           | loki               | Log forwarding                  |
| otel-collector     | jaeger             | Trace export                    |
| cloudflared        | compliance-gateway | Edge-to-origin proxy            |
| vault              | —                  | Secrets retrieval (egress only) |

### Deny-by-Default

Any communication path not explicitly listed above is denied by the default-deny MeshTLSAuthentication resource.

---

## 4. Canary Rollout Strategy

See `04-ship/kubernetes/overlays/{staging,production}/linkerd/canary-rollout.yaml` for phased rollout manifests.

**Phase 1:** Observability stack only (prometheus, grafana, jaeger) — no business impact  
**Phase 2:** Non-critical services (promtail, cloudflared, otel-collector)  
**Phase 3:** Core services (protocols, postgres, postgres-audit)  
**Phase 4:** Critical path (replay-guard, compliance-gateway, agx, platform)  
**Phase 5:** Apply deny-by-default authorization policies

Each phase requires:

- `linkerd check` passes
- p99 latency delta < 5ms vs. baseline
- Zero 5xx increase for 30 minutes

---

## 5. Verification

```bash
# Check mesh status for all pods
node 03-platform/tools/03-platform/scripts/verify-mesh-injection.mjs

# Check authorization policies
linkerd authz -n gtcx

# Check TLS status per pod
linkerd viz stat -n gtcx --from deploy/
```

---

## 6. References

- ADR-007: Kustomize over Helm
- `04-ship/kubernetes/overlays/production/linkerd/mesh-policies.yaml`
- `04-ship/kubernetes/overlays/staging/linkerd/mesh-policies.yaml`
- Linkerd docs: https://linkerd.io/2.16/features/automatic-mtls/
