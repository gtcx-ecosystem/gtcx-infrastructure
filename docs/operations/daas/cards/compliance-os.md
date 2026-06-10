---
title: DaaS card — compliance-os
status: in_progress
date: 2026-06-10
friction: F2
owner: gtcx-infrastructure
productOwner: compliance-os
protocol: P41-DEVOPS-AS-A-SERVICE
---

# DaaS card: compliance-os (F2)

## Profile

| Field                     | Value                                                   |
| ------------------------- | ------------------------------------------------------- |
| `deployment-profile.json` | `compliance-os/docs/operations/deployment-profile.json` |
| Deploy mode               | `eks-service` (multi-workload)                          |
| Matrix ref                | `INF-PER-REPO-001#compliance-os`                        |
| Namespace                 | `compliance-os-staging`                                 |

## Infra obligation

1. GHCR `imagePullSecret` via ESO (`compliance-os-ghcr-pull` ← `gtcx/compliance-os/staging/ghcr-pull-token`)
2. Non-W2 service secrets (api, caas, core12, via, vxa, minio) via ESO
3. Attach `imagePullSecrets: [compliance-os-ghcr-pull]` on **all** GHCR deployments

## Apply path

```bash
bash platform/scripts/staging/populate-compliance-os-staging-sm.sh   # SM populate
kubectl apply -k deploy/kubernetes/overlays/staging/compliance-os/
kubectl get externalsecret -n compliance-os-staging
```

## Verification (2026-06-10)

| Probe                                    | Result                                                          |
| ---------------------------------------- | --------------------------------------------------------------- |
| `compliance-os-ghcr-pull` ExternalSecret | **SecretSynced True**                                           |
| `staging-web-app`                        | **1/1 Running** (imagePullSecret attached)                      |
| `staging-compliance-api-app`             | **ImagePullBackOff** — missing `imagePullSecrets` on deployment |
| Product gate                             | `pnpm w2:staging-prereq-check` (compliance-os)                  |

## Next infra action

Patch GHCR-backed deployments (compliance-api, caas, core12, via, vxa) to reference `compliance-os-ghcr-pull`. Witness after all app pods **Running**.

## Product handback

Hub #17 steps 2–5 when web + API pods Ready.
