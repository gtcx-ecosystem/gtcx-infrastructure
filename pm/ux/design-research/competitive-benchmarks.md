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

## Ecosystem convergence comps (trade lane session 2026-06-12)

GTCX is a **full-stack sovereign commodity trade ecosystem** — proof is the rail, not the product category.

| Comp                                       | GTCX lane  | What we borrow                                                               |
| ------------------------------------------ | ---------- | ---------------------------------------------------------------------------- |
| **Apple**                                  | A + X + C  | GTCX ID continuity; trade object Handoff across surfaces; hardware edge (L1) |
| **AWS**                                    | I (fabric) | Org/landing zone, CloudTrail-style witnesses, trust cloud for deploy         |
| **HashiCorp**                              | I + A      | Terraform/Vault workflow — fabric control plane + baseline vault             |
| **Google Workspace**                       | U + B      | Admin desk analogue — bridge + agile fleet coordination                      |
| **Stripe / Bloomberg / Palantir / M-Pesa** | L2–L4b     | Partial comps per domain — not fleet-wide category                           |

**fabric-os posture:** Optimize **I-tier** agent-executed reliability and audit traceability — not consumer portal richness.

**Not competing on:** developer portal UI richness — this repo optimizes **agent-executed reliability** and **audit traceability** for a small custodian team.
