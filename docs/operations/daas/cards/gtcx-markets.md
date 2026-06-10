---
title: DaaS card — gtcx-markets (pilot reference)
status: delivered
date: 2026-06-10
friction: XR-MKT-011
owner: gtcx-infrastructure
productOwner: gtcx-markets
protocol: P40 + P41
---

# DaaS card: gtcx-markets (XR-MKT-011 pilot)

## Profile

| Field                     | Value                                                          |
| ------------------------- | -------------------------------------------------------------- |
| `deployment-profile.json` | `gtcx-markets/docs/operations/deployment-profile.json`         |
| Pilot                     | `INIT-GTCX-INFRA-DEPLOY`                                       |
| Handoff                   | `to-gtcx-infrastructure-s39-01-authority-routes-2026-06-10.md` |

## Seal witness

| Gate                           | Result                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| `GET /api/health`              | **200**                                                                               |
| `pnpm authority:trace:capture` | **7/7** exit **0**                                                                    |
| Seal doc                       | `from-gtcx-infrastructure-s39-01-authority-routes-2026-06-10.md` status **delivered** |

Reference card for DAAS-S2 ingress matrix pattern.
