---
title: DaaS card — terminal-os
status: delivered
date: 2026-06-10
friction: F1
owner: gtcx-infrastructure
productOwner: terminal-os
protocol: P41-DEVOPS-AS-A-SERVICE
---

# DaaS card: terminal-os (F1)

## Profile

| Field                     | Value                                                 |
| ------------------------- | ----------------------------------------------------- |
| `deployment-profile.json` | `terminal-os/docs/operations/deployment-profile.json` |
| Deploy mode               | `static` on EKS                                       |
| Matrix ref                | `INF-PER-REPO-001#terminal-os`                        |
| Namespace                 | `terminal-os-staging`                                 |

## Infra obligation

1. EKS namespace + IRSA (`terminal-os-aws-secrets` SecretStore)
2. ExternalSecret mirror for `COMPLIANCE_OS_TERMINAL_API_KEY` from AWS SM
3. ALB ingress `terminal-staging.gtcx.trade`
4. ECR image `gtcx-terminal-os:latest`

## Apply path

```bash
kubectl apply -k deploy/kubernetes/overlays/staging/terminal-os/
kubectl get externalsecret -n terminal-os-staging
kubectl get pods -n terminal-os-staging
```

## Verification (2026-06-10)

| Probe                                      | Result                           |
| ------------------------------------------ | -------------------------------- |
| `terminal-os-secrets` ExternalSecret       | **SecretSynced True**            |
| Pod `terminal-os-*`                        | **1/1 Running**                  |
| `GET https://terminal-staging.gtcx.trade/` | **403** (WAF — origin reachable) |

## Product handback

When seal **delivered**: terminal-os runs `pnpm ops:check` and hub webhook smoke per W2 hosting decision.

## Seal

`from-gtcx-infrastructure-terminal-os-eks-2026-06-10.md` — status **delivered**
