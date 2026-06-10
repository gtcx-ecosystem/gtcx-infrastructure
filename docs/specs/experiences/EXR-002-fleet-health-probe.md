---
exrId: EXR-002
title: Fleet health probe
status: p0
jtbdId: JTBD-fleet-health-witness
flowId: flow-fleet-health-witness
personaId: platform-operator
---

# EXR-002 — Fleet health probe

## Intent

Prove cross-repo staging health before sealing DaaS work or claiming substrate ready for pilot.

## Acceptance (from JTBD)

- `pnpm daas:fleet:health` exit 0
- Witness JSON refreshed
- Open P0 friction zero or explicitly owned
- validate-all pass count current

## UX refs

- Flow: `pm/ux/user-flows/flow-fleet-health-witness.md`
- PRD: `pm/product/prds/PRD-daass-operator-substrate.md`

## Engineering anchors

- `platform/tools/scripts/cross-repo-health-probe.mjs`
- `audit/evidence/cross-repo-health/`
- `pm/friction-register.json`
