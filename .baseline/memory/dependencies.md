# Cross-Repo Dependencies

> Last updated: 2026-06-11

## Hard Dependencies (Blocking — XC / Class S)

| Needs | From Repo / Owner | Status | ETA | Blocking |
| --- | --- | --- | --- | --- |
| EXT-INF-002 pen-test SOW | Human Security + **gtcx-agentic** H-05 chase | **open** | 2026-06-13 | S2-13, live-stack pen-test |
| EXT-INF-013 ZWCMP pilot owner | GTM / Program Lead | **approved** | 2026-06-12 | EXT-INF-014 unblocked |
| EXT-INF-014 DPA + pilot agreement | Legal | **open** | 2026-06-21 | ZWCMP signature |
| EXT-INF-015 indemnified SLA | Legal | **open** | 2026-06-21 | Pilot agreement |
| EXT-INF-016 SOC 2 Type I auditor | CISO + Finance | **open** | TBD | Bank-grade B.1 |
| H-03 sovereign countersign | Human CSP (**gtcx-agentic** ceremony) | **awaiting-human** | TBD | XR-518, MA-003 / #61 scale |
| S4-03 PRD-002 Tier B contract | **gtcx-protocols** | **blocked-sibling** | TBD | Audit route Tier B |

**Agentic pickup:** [`to-gtcx-agentic-blockers-raise-2026-06-08.md`](../01-docs/04-ops/coordination/outbound/to-gtcx-agentic-blockers-raise-2026-06-08.md)

## Operator / Class A (not agentic code)

| Needs | Owner | Status |
| --- | --- | --- |
| ~~**Hub #17 prod W2 close**~~ | **gtcx-infrastructure** | **done** 2026-06-05 — `compliance.gtcx.trade` + `terminal.gtcx.trade`; baseline-os locker `7d98352b2` |
| **Hub #18 prod Postgres** | terminal-os + **gtcx-infrastructure** | **open** — prod audit `DATABASE_URL` + `workflow:persistence-proof` |
| EXT-INF-003 WORM recurrence on main | Infra operator | open |

## Program orchestration (fabric-os)

| Program | Originating handoff | Status | Evidence |
| --- | --- | --- | --- |
| **PROG-TOKENIZATION-001** / XR-MKT-FABRIC-001 | markets-os → fabric-os | **acknowledged** 2026-06-11 | `docs/operations/coordination/from-fabric-os-xr-mkt-fabric-001-ack-2026-06-11.md`, `xr-mkt-fabric-001-tokenization-execution-plan-2026-06-11.md` |

**Canonical identity:** `fabric-os` (legacy: `gtcx-infrastructure`) — `bridge-os/pm/spec/service-fabric.json`, ADR-0007.

## Soft Dependencies

| Needs | From Repo | Status |
| --- | --- | --- |
| XR-403 bog.json PR | gtcx-protocols | ready post H-03 |
| `COMPLIANCE_OS_INTAKE_API_KEY` | compliance-os | ready when asked |
| ledger-ui UI-GH-00 fixture track | ledger-ui | open — inbound pending |
| MKT-GH-00 contract freeze | markets-os | in progress (markets-os `03e4d46`) |

## Downstream Consumers (infra delivered)

| Repo | What They Need | Status |
| --- | --- | --- |
| gtcx-protocols | SPKI DER + SHA-256 (XR-402) | done 2026-06-03 |
| gtcx-intelligence | orchestrator manifest + cost router | done |
| gtcx-core | EXT-INF-002 vendor pack ack | done 2026-06-07 |

## Engineering witness (not XC blockers)

| Signal | Value |
| --- | ---: |
| validate-all | 50/50 |
| Lane 1 IR | 7.9 |
| backlogClear | true |
