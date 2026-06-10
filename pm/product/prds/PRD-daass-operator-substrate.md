---
title: PRD — DaaS operator substrate
status: current
date: 2026-06-10
initiative: INIT-GTCX-INFRA-DAAS
protocol: P41-DEVOPS-AS-A-SERVICE
uxRefs:
  personas: [platform-operator, sibling-integrator]
  jtbd: [JTBD-staging-substrate-ready, JTBD-fleet-health-witness]
  flows: [flow-staging-handoff, flow-fleet-health-witness]
  exrs: [EXR-001, EXR-002]
---

# PRD — DaaS operator substrate

## Problem

Sibling repos cannot own AWS/K8s control plane but need staging pilots on af-south-1 with auditable handoffs.

## Solution

DevOps-as-a-Service in gtcx-infrastructure: per-repo cards, staging scripts, fleet health witness, friction register.

## Success criteria

Copy from JTBD acceptanceCriteria:

**JTBD-staging-substrate-ready**

- Inbound acked; scripts applied; outbound seal; product prereq check

**JTBD-fleet-health-witness**

- Fleet health PASS; witness JSON; P0 friction zero; validate-all green

## Non-goals

- Product feature PM in this repo
- blocksIR true for staging friction

## Links

- `pm/daas-roadmap.json`
- `pm/ux/README.md`
- `docs/operations/daas/cards/`
