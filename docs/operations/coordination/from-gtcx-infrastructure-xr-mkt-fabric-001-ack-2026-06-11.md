---
title: 'outbound-ack — XR-MKT-FABRIC-001 tokenization program'
status: current
date: 2026-06-11
from: fabric-os
canonical_repo: fabric-os
to: markets-os, ledger-ui, bridge-os, baseline-os
ticket: XR-MKT-FABRIC-001
program: PROG-TOKENIZATION-001
protocol: P24
authorityClass: R
responds_to: markets-os/docs/operations/coordination/to-fabric-os-tokenization-platform-scope-2026-06-11.md
---

# outbound-ack — XR-MKT-FABRIC-001

## Fabric canonical identity

| Field                     | Value                                                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Canonical repo id**     | `fabric-os`                                                                                                                                 |
| **Legacy id**             | `gtcx-infrastructure` (resolves via ecosystem alias registry)                                                                               |
| **GitHub**                | `https://github.com/gtcx-ecosystem/fabric-os`                                                                                               |
| **Machine spec**          | `bridge-os/pm/spec/service-fabric.v1.json`                                                                                                  |
| **Protocol**              | [P44 Fabric Consumption](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/docs/governance/protocols/44-fabric-consumption/protocol.md) |
| **Program office**        | `bridge-os` (ZenHub orchestration, fleet harnesses)                                                                                         |
| **Durable inbound path**  | `fabric-os/docs/operations/coordination/from-markets-os-*`                                                                                  |
| **Durable outbound path** | `fabric-os/docs/operations/coordination/from-gtcx-infrastructure-*` (legacy filename prefix)                                                |

**ADR:** `docs/reference/adr/ADR-0007-fabric-os-repo-rename.md` — GitHub renamed 2026-06-12.

## Acknowledgement

Fabric acknowledges **XR-MKT-FABRIC-001** on 2026-06-11.

- **Inbound received:** [`to-fabric-os-tokenization-platform-scope-2026-06-11.md`](https://github.com/gtcx-ecosystem/markets-os/blob/main/docs/operations/coordination/to-fabric-os-tokenization-platform-scope-2026-06-11.md)
- **Program identifier:** `PROG-TOKENIZATION-001`
- **Orchestration role:** dependency graph, parallel workplan, milestone tracking,
  acceptance evidence — **not** SoR for identity, title, compliance decisions,
  custody, settlement finality, or Markets transaction state
- **Execution plan:** [`xr-mkt-fabric-001-tokenization-execution-plan-2026-06-11.md`](./xr-mkt-fabric-001-tokenization-execution-plan-2026-06-11.md)

## Acceptance criteria (handoff §)

| #   | Criterion                                         | Status                                 |
| --- | ------------------------------------------------- | -------------------------------------- |
| 1   | Durable inbound with owner and program identifier | **met** — this ack + plan              |
| 2   | Cross-repo dependency graph                       | **met** — execution plan §2            |
| 3   | Parallel Markets backend + ledger-ui workplan     | **met** — execution plan §3            |
| 4   | Named owners for live dependencies                | **met** — execution plan §4            |
| 5   | Phase 0 and Phase 1 stories with evidence         | **met** — execution plan §5–6          |
| 6   | Human/legal gates register                        | **met** — execution plan §7            |
| 7   | No false production or partner claims             | **met** — explicit assumptions in plan |

## Immediate fabric actions (Class R)

| Action                                                 | Owner                 | Status                                                         |
| ------------------------------------------------------ | --------------------- | -------------------------------------------------------------- |
| Publish cross-repo execution plan                      | fabric-os             | **done** — linked above                                        |
| Register hub identity under `fabric-os`                | fabric-os             | **done** — ADR-0007 + alias registry                           |
| Delegate Phase 0 contract freeze witness to markets-os | fabric-os             | **open** — markets owns API contracts                          |
| Open ledger-ui design track inbound                    | fabric-os → ledger-ui | **open** — see plan §3b                                        |
| Assurance trigger at Phase 0 seal                      | fabric-os             | **scheduled** — `pnpm fabric:assurance:run` at contract freeze |

## Hub mirror

Report under `fabric-os`:

> XR-MKT-FABRIC-001 acknowledged; PROG-TOKENIZATION-001 execution plan published.
