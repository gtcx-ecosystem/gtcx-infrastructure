---
title: Compliance-as-a-Service (COMPLIANCEaaS)
status: current
date: 2026-06-10
owner: gtcx-infrastructure
protocol: P44-FABRIC-CONSUMPTION
initiative: INIT-GTCX-SERVICE-FABRIC
programPartner: compliance-os
---

# Compliance-as-a-Service — GTCX Service Fabric

**Normative:** `gtcx-docs/docs/governance/protocols/44-fabric-consumption/protocol.md`  
**Machine spec:** `bridge-os/pm/spec/service-fabric.v1.json`  
**Friction SoR:** `pm/compliance-friction-register.json`

## Obligation

Fleet compliance friction (SOC 2 queue, assurance witnesses) is owned by fabric-os with **compliance-os** as program partner. Product repos link manifests; assurance evidence sinks in owner repo `audit/evidence/`.

## Product interface

1. `ops/compliance/manifest.json` → `fabricRegister` href
2. Normative compliance prose: **compliance-os** + **gtcx-docs** — not duplicated per product
3. `blocksIR: false` unless explicitly documented in register item

## Operator entry

```bash
pnpm agent:next-work
cat pm/compliance-friction-register.json
pnpm secas:friction:check
```
