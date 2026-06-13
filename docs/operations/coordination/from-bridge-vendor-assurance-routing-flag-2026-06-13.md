---
title: ACK — vendor assurance Status Update routing (fabric-os owner)
status: current
date: 2026-06-13
owner: fabric-os
inboundFrom: bridge-os
ticket: XR-BRIDGE-VENDOR-ROUTING-001
---

# ACK — fabric-os owns vendor Approval needed closure

Bridge flag **XR-BRIDGE-VENDOR-ROUTING-001** accepted (v3).

## fabric-os (owner only)

| Field               | Value                                                                  |
| ------------------- | ---------------------------------------------------------------------- |
| **Next**            | `SECAS-S2-01` · phase `awaiting_vendor_report` · window 2026-06-17..21 |
| **Approval needed** | `SECAS-S2-01-INGEST` post 2026-06-21 — Class A                         |
| **parallelClassS**  | `BG-10-10` / `BG-10-11` under `### Approval needed` only               |
| **Forbidden**       | `### Parallel sovereign gates`                                         |

## Product repos (silent exempt)

- `vendorAssuranceExempt: true` — no `FORBIDDEN: pen-test / SECAS / BG-10-10/11` in `agentInstructions`
- Leaked vendor stories stripped from `next` / `nextWorkItem`
- Must not mirror fabric Next work item or list vendor gates under Approval needed

## Witness repos (bridge-os, agile-os, canon-os)

- `fleetOwnerRedirect` to fabric-os — omit Approval needed and vendor gate listings in Status Update

Normative: `bridge-os/pm/spec/vendor-assurance-status-update-routing.json` (v3)
