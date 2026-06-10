---
title: DevOps-as-a-Service — per-repo cards
status: current
date: 2026-06-10
owner: gtcx-infrastructure
protocol: P41-DEVOPS-AS-A-SERVICE
---

# DaaS per-repo cards

Machine-indexed operational cards for **gtcx-infrastructure** primary roadmap (DAAS-S2+).

| Card                                      | Friction   | Deploy mode       | Status      |
| ----------------------------------------- | ---------- | ----------------- | ----------- |
| [terminal-os](./cards/terminal-os.md)     | F1         | EKS static        | delivered   |
| [compliance-os](./cards/compliance-os.md) | F2         | EKS multi-service | in_progress |
| [gtcx-markets](./cards/gtcx-markets.md)   | XR-MKT-011 | EKS handoff       | delivered   |

**Harness:** `pnpm daas:cards:check` · witness `audit/evidence/daas-cards-check-latest.json`
