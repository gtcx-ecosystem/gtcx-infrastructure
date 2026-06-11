---
title: GTM-as-a-Service (GTMaaS)
status: current
date: 2026-06-10
owner: fabric-os
protocol: P44-FABRIC-CONSUMPTION
initiative: INIT-GTCX-SERVICE-FABRIC
---

# GTM-as-a-Service — GTCX Service Fabric

**Normative:** `canon-os/docs/governance/protocols/44-fabric-consumption/protocol.md`  
**Machine spec:** `bridge-os/pm/spec/service-fabric.json`  
**Friction SoR:** `pm/gtm-friction-register.json`

## Obligation

GTM friction (LOI, design-partner, sales enablement) is centralized in fabric-os. Product repos link `ops/gtm/manifest.json` — no duplicate GTM backlog in product `pm/`.

## Product interface

1. `ops/gtm/manifest.json` → `fabricRegister` href
2. Inbound/outbound tickets remain in product `ops/gtm/` — coordination only
3. Class S gates: **Approval needed** only (`blocksIR: false`)

## Operator entry

```bash
pnpm agent:next-work
cat pm/gtm-friction-register.json
pnpm ecosystem:fabric:check   # from bridge-os cwd sibling
```
