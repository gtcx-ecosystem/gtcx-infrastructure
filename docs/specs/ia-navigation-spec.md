---
title: IA navigation spec — control plane
date: 2026-06-10
---

# IA navigation spec

**Surfaces:** CLI/scripts, coordination docs, Astro docs-site — no single customer web app in this repo.

## Primary navigation (operator mental model)

| Zone           | Entry                                     | Contents                                          |
| -------------- | ----------------------------------------- | ------------------------------------------------- |
| **Execute**    | `package.json` scripts, `gtcx-ctl`        | `daas:fleet:health`, `secas:*`, `agent:next-work` |
| **Deploy**     | `deploy/terraform/`, `deploy/kubernetes/` | Staging overlays, modules                         |
| **Coordinate** | `docs/operations/coordination/`           | Inbound/outbound seals                            |
| **Witness**    | `audit/evidence/`                         | JSON probes, approval checks                      |
| **Plan**       | `pm/`                                     | DaaS, SECaaS, UX SoR                              |

## Docs-site (Astro)

Information architecture mirrors operator zones under `docs/operations/` and `docs/specs/` — not consumer marketing IA.

## Cross-repo

Integrators land from sibling repo inbound tickets → `docs/operations/coordination/to-gtcx-infrastructure-*` → outbound seal.
