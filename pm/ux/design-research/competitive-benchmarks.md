---
title: Competitive benchmarks — platform control planes
date: 2026-06-10
---

# Competitive benchmarks

World-class **internal platform** experience in regulated environments:

| Benchmark               | What "good" looks like                        | GTCX infra posture                                |
| ----------------------- | --------------------------------------------- | ------------------------------------------------- |
| **Backstage / IDP**     | Self-service templates with default witnesses | DaaS cards + staging scripts per sibling repo     |
| **Terraform Cloud**     | Plan/apply audit trail                        | `audit/evidence/*-terraform-apply-*.json`         |
| **SOC 2 program tools** | Sovereign approval separated from engineering | `pm/sovereign-approval-register.json` (P42)       |
| **GitOps (Argo/Flux)**  | Declarative drift visibility                  | Kustomize overlays + manual agent apply (staging) |

**Not competing on:** developer portal UI richness — this repo optimizes **agent-executed reliability** and **audit traceability** for a small custodian team.
