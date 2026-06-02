---
title: 'Kubernetes Manifests & Deployment Topology'
status: current
date: '2026-06-02'
owner: devops
tags: ['kubernetes', 'kustomize', 'deployments', 'linkerd']
---

# Kubernetes Manifests & Deployment Topology

This directory contains the Kubernetes source of truth for all GTCX environments.

## Structure

| Path                        | Purpose                                                             |
| --------------------------- | ------------------------------------------------------------------- |
| `base/`                     | Shared manifests: Deployments, Services, ConfigMaps, Ingress        |
| `overlays/development/`     | Local/minikube overlay with debug images and host mounts            |
| `overlays/staging/`         | Staging overlay: EKS `gtcx-staging`, Linkerd mesh, WAF ingress      |
| `overlays/production/`      | Production overlay: EKS `gtcx-prod`, hardened policies, HSM anchors |
| `overlays/staging/linkerd/` | Service mesh policies: mTLS, authorization, canary rollouts         |

## Key Services

| Service                      | Namespace      | Image                                  | Port |
| ---------------------------- | -------------- | -------------------------------------- | ---- |
| `compliance-gateway-staging` | `gtcx-staging` | `compliance-gateway:audit-<sha>-amd64` | 8500 |
| `gtcx-protocols-staging`     | `gtcx-staging` | `protocols:v0.4.5`                     | 8300 |
| `gtcx-agx-staging`           | `gtcx-staging` | `agx:latest`                           | 8200 |

## Deployment

```bash
# Staging (OIDC auth required)
kubectl apply -k infra/kubernetes/overlays/staging/

# Dry-run validation
kubectl kustomize infra/kubernetes/overlays/staging/ | kubectl apply --dry-run=client -f -
```

## Mesh & Security

- Linkerd service mesh enforces mTLS between all pods.
- Kyverno policies validate image signatures and resource limits.
- NetworkPolicies restrict egress to known endpoints only.
