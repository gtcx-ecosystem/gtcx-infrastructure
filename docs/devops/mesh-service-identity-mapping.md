---
title: 'Linkerd Mesh Service Identity Mapping'
status: 'current'
date: '2026-05-17'
owner: 'platform-engineering'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['linkerd', 'mtls', 'mesh', 'service-identity', 'security']
review_cycle: 'quarterly'
---

# Linkerd Mesh Service Identity Mapping

**Scope:** All services deployed to `gtcx` and `gtcx-staging` namespaces  
**Mesh:** Linkerd 2.x  
**Identity format:** `<namespace>.<service-account>.serviceaccount.identity.linkerd.cluster.local`

---

## 1. Service Inventory

| Service                 | Namespace | ServiceAccount          | Linkerd Identity                                                             |
| ----------------------- | --------- | ----------------------- | ---------------------------------------------------------------------------- |
| gtcx-agx                | gtcx      | gtcx-agx                | `gtcx.gtcx-agx.serviceaccount.identity.linkerd.cluster.local`                |
| gtcx-platform           | gtcx      | gtcx-platform           | `gtcx.gtcx-platform.serviceaccount.identity.linkerd.cluster.local`           |
| gtcx-protocols          | gtcx      | gtcx-protocols          | `gtcx.gtcx-protocols.serviceaccount.identity.linkerd.cluster.local`          |
| gtcx-replay-guard       | gtcx      | gtcx-replay-guard       | `gtcx.gtcx-replay-guard.serviceaccount.identity.linkerd.cluster.local`       |
| gtcx-compliance-gateway | gtcx      | gtcx-compliance-gateway | `gtcx.gtcx-compliance-gateway.serviceaccount.identity.linkerd.cluster.local` |
| gtcx-postgres           | gtcx      | gtcx-postgres           | `gtcx.gtcx-postgres.serviceaccount.identity.linkerd.cluster.local`           |
| gtcx-postgres-audit     | gtcx      | gtcx-postgres-audit     | `gtcx.gtcx-postgres-audit.serviceaccount.identity.linkerd.cluster.local`     |
| promtail                | gtcx      | promtail                | `gtcx.promtail.serviceaccount.identity.linkerd.cluster.local`                |
| cloudflared             | gtcx      | cloudflared             | `gtcx.cloudflared.serviceaccount.identity.linkerd.cluster.local`             |

---

## 2. Communication Matrix

| Source             | Destination    | Protocol | Purpose                       | Policy Name                            |
| ------------------ | -------------- | -------- | ----------------------------- | -------------------------------------- |
| replay-guard       | protocols      | HTTP     | Signature verification        | `replay-guard-to-protocols`            |
| protocols          | postgres       | TCP      | Operational DB queries        | `protocols-to-postgres`                |
| protocols          | postgres-audit | TCP      | Audit logging                 | `protocols-to-postgres-audit`          |
| agx                | protocols      | HTTP     | API → protocol execution      | `agx-to-protocols`                     |
| platform           | protocols      | HTTP     | Platform → protocol execution | `platform-to-protocols`                |
| compliance-gateway | protocols      | HTTP     | Compliance queries            | `compliance-gateway-to-protocols`      |
| compliance-gateway | postgres-audit | TCP      | Compliance audit read         | `compliance-gateway-to-postgres-audit` |
| promtail           | otel-collector | gRPC     | Log forwarding                | `promtail-to-otel`                     |

---

## 3. Service Accounts

Each service must run under a dedicated ServiceAccount. The mesh policies reference these accounts for identity-based authorization.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: gtcx-agx
  namespace: gtcx
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: gtcx-platform
  namespace: gtcx
```

> **Note:** If a Deployment does not specify `serviceAccountName`, it uses `default`. Mesh policies must be updated to match the actual ServiceAccount names.

---

## 4. Verification Commands

```bash
# Check mesh status for all pods
linkerd viz stat deploy -n gtcx

# Verify mTLS is active between two services
linkerd viz tap deploy/gtcx-agx -n gtcx --to deploy/gtcx-protocols

# Check authorization policy enforcement
linkerd authz -n gtcx
```

---

## 5. Rollout Checklist

- [ ] All Deployments specify `serviceAccountName` (not `default`)
- [ ] Namespace annotated with `linkerd.io/inject: enabled`
- [ ] Mesh policies applied with `kubectl apply -f mesh-policies.yaml`
- [ ] `linkerd check` passes
- [ ] `linkerd viz stat` shows mTLS for all targeted pods
