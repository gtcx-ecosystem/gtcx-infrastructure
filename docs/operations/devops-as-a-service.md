---
title: DevOps-as-a-Service (DaaS)
status: current
date: 2026-06-10
owner: gtcx-infrastructure
protocol: P41-DEVOPS-AS-A-SERVICE
initiative: INIT-GTCX-INFRA-DAAS
---

# DevOps-as-a-Service — gtcx-infrastructure primary program

**Normative:** `gtcx-docs/.../41-devops-as-a-service/protocol.md`  
**Machine spec:** `bridge-os/pm/spec/devops-as-a-service.v1.json`  
**Friction SoR:** `pm/friction-register.json`  
**Roadmap SoR:** `pm/daas-roadmap.json`  
**Deploy choreography:** P40 (`bridge-os/pm/spec/deployment-choreography.v1.json`)

## Obligation

Infrastructure and DevOps are a **separate concern** from product engineering — parallel to security, compliance, and GTM. Product PM does **not** lead infra execution. **gtcx-infrastructure** owns deployability per repo and actively unblocks the fleet.

## Three-plane model

| Plane | Owner | Product engineering |
| ----- | ----- | ------------------- |
| **Engineering** | Product repo | Features, tests, `deployment:smoke` |
| **DaaS** | **gtcx-infrastructure** | Handoff only — never `kubectl apply` |
| **Assurance** | assurance / legal / protocols | Witness parallel (`blocksIR: false`) |

## Product interface

1. Maintain `docs/operations/deployment-profile.json`
2. On upstream failure → `to-gtcx-infrastructure-{topic}-YYYY-MM-DD.md` (P24)
3. Re-run smoke/capture when `from-gtcx-infrastructure-*` status **delivered**

## Infra interface

1. Triage inbound into `pm/friction-register.json`
2. Execute on `pm/daas-roadmap.json` sprints (DAAS-S*)
3. Seal with `from-gtcx-infrastructure-*` + `audit/evidence/*-latest.json`
4. Run `pnpm daas:friction:check` + `pnpm daas:fleet:health` each session

## Operator entry

```bash
pnpm agent:next-work          # P22 — infra primary roadmap
pnpm daas:friction:check      # open friction items
pnpm env:status               # staging warm/cold (via bridge-os when cwd sibling)
node platform/tools/scripts/cross-repo-health-probe.mjs
```

Verification path: agents execute probes in-session (P27); report command + exit code.
