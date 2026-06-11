---
title: Legal-as-a-Service (LEGALaaS)
status: current
date: 2026-06-10
owner: fabric-os
protocol: P44-FABRIC-CONSUMPTION
initiative: INIT-GTCX-SERVICE-FABRIC
---

# Legal-as-a-Service — GTCX Service Fabric

**Normative:** `canon-os/docs/governance/protocols/44-fabric-consumption/protocol.md`  
**Machine spec:** `bridge-os/pm/spec/service-fabric.json`  
**Friction SoR:** `pm/legal-friction-register.json`

## Obligation

Class **S** legal gates (pen-test SOW, sovereign sign-off) live in the **fabric friction register** — product repos hold **manifest links only**. `blocksIR: false` by default; **Approval needed** does not freeze engineering.

## Product interface

1. `ops/legal/manifest.json` → `fabricRegister` href to this repo
2. Status Update **Approval needed** pulls register item status — never duplicate legal narrative in `pm/`
3. Sovereign items: witness in `pm/sovereign-approval-register.json`

## Operator entry

```bash
pnpm agent:next-work
cat pm/legal-friction-register.json
pnpm fabric:assurance:run
```
