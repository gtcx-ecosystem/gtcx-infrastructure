---
title: 'Linkerd Mesh Canary Rollout Strategy'
status: 'current'
date: '2026-05-17'
owner: 'platform-engineering'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['linkerd', 'mtls', 'mesh', 'canary', 'rollout', 'deployment']
review_cycle: 'quarterly'
---

# Linkerd Mesh Canary Rollout Strategy

**Objective:** Deploy Linkerd mTLS mesh without disrupting production traffic.  
**Risk tolerance:** Zero-downtime required for financial transaction paths.  
**Duration:** 2-week phased rollout.

---

## 1. Pre-Flight Checks

Before any mesh injection:

| Check                 | Command                                                     | Pass Criteria                      |
| --------------------- | ----------------------------------------------------------- | ---------------------------------- |
| Linkerd CLI installed | `linkerd version`                                           | Client + server versions match     |
| Cluster supports CNI  | `kubectl get pods -n kube-system`                           | Linkerd CNI or default CNI healthy |
| Control plane ready   | `linkerd check --pre`                                       | All checks pass                    |
| Backup current state  | `kubectl get deploy -n gtcx -o yaml > pre-mesh-backup.yaml` | File created and validated         |

---

## 2. Rollout Phases

### Phase 1: Non-Critical Services (Days 1–2)

Inject Linkerd sidecars into observability and infrastructure services first.

| Namespace | Service        | Impact if Failure              |
| --------- | -------------- | ------------------------------ |
| gtcx      | promtail       | Low — log shipping delayed     |
| gtcx      | otel-collector | Low — metrics buffer in memory |
| gtcx      | cloudflared    | Medium — tunnel reconnection   |

**Action:**

```bash
kubectl annotate namespace gtcx linkerd.io/inject=enabled
kubectl rollout restart deployment/promtail -n gtcx
kubectl rollout restart deployment/otel-collector -n gtcx
```

**Validation:**

```bash
linkerd viz stat deploy -n gtcx
# Expect: meshed=true, mTLS=100% for restarted pods
```

**Rollback:**

```bash
kubectl annotate namespace gtcx linkerd.io/inject- disabled
kubectl rollout restart deployment/promtail -n gtcx
```

---

### Phase 2: Read-Only Services (Days 3–5)

Inject sidecars into services that serve read-only or idempotent traffic.

| Service                 | Traffic Type                  |
| ----------------------- | ----------------------------- |
| gtcx-compliance-gateway | Read-heavy compliance queries |
| gtcx-protocols          | Idempotent verification calls |

**Action:**

```bash
kubectl rollout restart deployment/gtcx-compliance-gateway -n gtcx
kubectl rollout restart deployment/gtcx-protocols -n gtcx
```

**Validation:**

- Load test via `tools/load-tests/run-load-tests.sh`
- Verify p99 latency increase < 10ms

---

### Phase 3: Critical Services (Days 6–8)

Inject sidecars into transaction-path services.

| Service           | Traffic Type                        |
| ----------------- | ----------------------------------- |
| gtcx-agx          | API gateway — all user traffic      |
| gtcx-platform     | Platform backend — settlement logic |
| gtcx-replay-guard | Security verifier — nonce checking  |

**Action:**

```bash
kubectl rollout restart deployment/gtcx-agx -n gtcx
kubectl rollout restart deployment/gtcx-platform -n gtcx
kubectl rollout restart deployment/gtcx-replay-guard -n gtcx
```

**Validation:**

- Chaos test: `tools/chaos/` network partition simulation
- Replay guard integration test must pass
- Compliance gateway integration test must pass

---

### Phase 4: Stateful Services (Days 9–10)

Inject sidecars into databases and stateful workloads.

| Service             | Notes                                                       |
| ------------------- | ----------------------------------------------------------- |
| gtcx-postgres       | Ensure pgBouncer or connection pooler handles sidecar proxy |
| gtcx-postgres-audit | Same as above                                               |

**Action:**

```bash
kubectl rollout restart statefulset/gtcx-postgres -n gtcx
kubectl rollout restart statefulset/gtcx-postgres-audit -n gtcx
```

**Validation:**

- DR test: `bash infra/scripts/dr-test.sh production`
- Connection pool metrics stable

---

## 3. Authorization Policy Activation

After all pods are meshed and stable for 48 hours:

1. Apply `default-deny` MeshTLSAuthentication
2. Apply allowlist policies one by one
3. Monitor `linkerd viz tap` for denied connections
4. If unexpected denials occur, remove default-deny and investigate

```bash
kubectl apply -f infra/kubernetes/overlays/production/linkerd/mesh-policies.yaml
```

---

## 4. Observability

| Metric              | Source      | Alert Threshold           |
| ------------------- | ----------- | ------------------------- |
| Sidecar memory      | Prometheus  | > 50 Mi per pod           |
| Sidecar CPU         | Prometheus  | > 50m per pod             |
| mTLS rate           | Linkerd viz | < 100% for any meshed pod |
| Request latency p99 | Prometheus  | > baseline + 20ms         |
| Connection errors   | Linkerd tap | > 0.1% of total           |

---

## 5. Emergency Rollback

If critical service degradation is detected:

```bash
# 1. Remove injection annotation
kubectl annotate namespace gtcx linkerd.io/inject- disabled

# 2. Restart all deployments to remove sidecars
kubectl rollout restart deployment -n gtcx

# 3. Verify no sidecars present
kubectl get pods -n gtcx -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].name}{"\n"}{end}' | grep linkerd-proxy
# Should return nothing
```

---

## 6. Acceptance Criteria

- [ ] All pods in `gtcx` namespace show `linkerd-proxy` container
- [ ] `linkerd viz stat deploy -n gtcx` shows 100% mTLS for all meshed pods
- [ ] p99 latency increase < 10ms for all critical services
- [ ] Authorization policies applied with zero unexpected denials
- [ ] Rollback procedure tested and documented (this doc)
