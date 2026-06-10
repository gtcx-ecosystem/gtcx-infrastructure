---
title: Seal — terminal-os EKS staging (F1)
status: delivered
date: 2026-06-10
from: gtcx-infrastructure
to: terminal-os
friction: F1
protocol: P41-DEVOPS-AS-A-SERVICE
blocksIR: false
---

# Infra seal (delivered): terminal-os EKS + secret mirror

## Witness

| Probe                                 | Result                                                                  |
| ------------------------------------- | ----------------------------------------------------------------------- |
| Namespace `terminal-os-staging`       | Active                                                                  |
| ExternalSecret `terminal-os-secrets`  | **SecretSynced True**                                                   |
| Deployment `terminal-os`              | **1/1 Running**                                                         |
| Ingress `terminal-staging.gtcx.trade` | ALB assigned — HTTP **403** (WAF; origin live)                          |
| Image                                 | `348389439381.dkr.ecr.af-south-1.amazonaws.com/gtcx-terminal-os:latest` |

## DaaS card

`docs/operations/daas/cards/terminal-os.md`

## Product follow-up

Run hub webhook / W2 smoke when compliance cross-origin keys verified.
