---
title: UX SoR — GTCX Infrastructure Control Plane
status: current
date: 2026-06-10
owner: gtcx-infrastructure
protocols: [P20-SEF, P21-UX-DOC-OPS, A1-PRODUCT-EXCELLENCE]
---

# UX — GTCX Infrastructure Control Plane

**Product:** GTCX Infrastructure — sovereign AWS/K8s control plane (DaaS + SECaaS)  
**Value proposition:** Sibling product repos ship staging pilots on af-south-1 with auditable deploy handoffs, fleet health witnesses, and parallel security evidence — without each team owning Terraform, WAF, or pen-test execution.

**Repo kind:** Control-plane / operator-surface (CLI, runbooks, docs-site, coordination seals). End-user commodity-trade journeys live in sibling repos (`compliance-os`, `gtcx-markets`, `terminal-os`). This SoR documents **operators and integrators**, not field inspectors or traders.

## Traceability map

| Persona                                                        | JTBD                                                                     | User flow                                                                  | EXR                                                                        | PRD                                                                             |
| -------------------------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [platform-operator](./personas/persona-platform-operator.md)   | [JTBD-staging-substrate-ready](./jtbd/jtbd-staging-substrate-ready.json) | [flow-staging-handoff](./user-flows/flow-staging-handoff.md)               | [EXR-001](../docs/specs/experiences/EXR-001-staging-handoff-to-witness.md) | [PRD-daass-operator-substrate](../product/prds/PRD-daass-operator-substrate.md) |
| [platform-operator](./personas/persona-platform-operator.md)   | [JTBD-fleet-health-witness](./jtbd/jtbd-fleet-health-witness.json)       | [flow-fleet-health-witness](./user-flows/flow-fleet-health-witness.md)     | [EXR-002](../docs/specs/experiences/EXR-002-fleet-health-probe.md)         | [PRD-daass-operator-substrate](../product/prds/PRD-daass-operator-substrate.md) |
| [security-operator](./personas/persona-security-operator.md)   | [JTBD-security-evidence-path](./jtbd/jtbd-security-evidence-path.json)   | [flow-secas-pentest-evidence](./user-flows/flow-secas-pentest-evidence.md) | [EXR-003](../docs/specs/experiences/EXR-003-secas-evidence-delivery.md)    | [PRD-secas-stack-security](../product/prds/PRD-secas-stack-security.md)         |
| [sibling-integrator](./personas/persona-sibling-integrator.md) | [JTBD-staging-substrate-ready](./jtbd/jtbd-staging-substrate-ready.json) | [flow-staging-handoff](./user-flows/flow-staging-handoff.md)               | [EXR-001](../docs/specs/experiences/EXR-001-staging-handoff-to-witness.md) | [PRD-daass-operator-substrate](../product/prds/PRD-daass-operator-substrate.md) |

## Owner roster

| Role               | Owner                                | Artifact                                        |
| ------------------ | ------------------------------------ | ----------------------------------------------- |
| Principal TPM      | gtcx-infrastructure                  | `pm/daas-roadmap.json`, `pm/secas-roadmap.json` |
| Platform architect | gtcx-infrastructure                  | `deploy/`, `platform/tools/control-plane/`      |
| Security operator  | gtcx-infrastructure + Human/Security | `pm/sovereign-approval-register.json`           |
| Design / UX        | Principal product designer (fleet)   | this tree                                       |

_Formal `pm/team/roster.json` not yet provisioned — roster inferred from program owners._

## Related SoR

| Artifact               | Path                                                                |
| ---------------------- | ------------------------------------------------------------------- |
| DaaS program           | `pm/daas-roadmap.json`, `docs/operations/daas/`                     |
| SECaaS program         | `pm/secas-roadmap.json`, `docs/operations/security-as-a-service.md` |
| EXR pack               | `docs/specs/experiences/exr-pack.yaml`                              |
| Operator journey spine | `docs/specs/operator-journey-map.md`                                |
| Institutional personas | gtcx-docs `docs/governance/institutional/personas/`                 |

## Verification

```bash
pnpm pm:sync
pnpm ops:check
# Fleet A1 probe (from bridge-os):
cd ../bridge-os && pnpm audit:five-core:run -- --repo gtcx-infrastructure --core A1 --write
```
