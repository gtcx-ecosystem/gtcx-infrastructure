---
title: 'Agent Work Selection Manifest'
status: current
date: 2026-06-05
owner: fabric-os
role: platform-architect
tier: critical
tags: ['protocol-22', 'agent', 'work-selection']
review_cycle: on-change
document_id: OPS-AWS-001
protocol: canon-os/01-docs/governance/protocols/22-agent-work-selection/protocol.md
adoption_status: pilot
---

# Agent Work Selection — fabric-os

> **Protocol:** [Protocol 22 — Agent Work Selection](https://github.com/gtcx-ecosystem/canon-os/blob/main/01-docs/governance/protocols/22-agent-work-selection/protocol.md) (AGENT-WORK-SEL)
> **Rule:** Agents compute next work from the execution roadmap and work register. **Never ask the operator which story to pick.**

## Canonical paths

| Artifact                           | Path                                      |
| ---------------------------------- | ----------------------------------------- |
| Execution roadmap (story register) | `01-docs/audit/execution-roadmap.md`      |
| Session pointer                    | `01-docs/audit/auto-dev-state.md`         |
| Baseline session memory            | `.baseline/memory/session.md`             |
| Selection script                   | `03-platform/scripts/agent-next-work.mjs` |

## Commands

```bash
pnpm agent:next-work

# Regulatory-audit frame (prefer evidence / assurance work when automatable)
AGENT_FRAME=regulatory-audit pnpm agent:next-work
```

## Active phase

**Co-primary programs (2026-06-12):** DAAS **complete** · **SECAS-S2 in_progress** (pen-test window 2026-06-17..21). IR implement queue nearly drained — **S4-07** (P2 flake) remains.

When `pnpm agent:next-work` returns a story ID, execute it. When `backlogClear: true`, run **witness** (`node 03-platform/tools/scripts/validate-all.mjs`) + refresh evidence gates — do not idle. **Human gates (XC)** run parallel — do not block IR implement queue.

**LAUNCH-PLAN-01/02/03 are done** — do not re-select; zwcmp-unblock work lives in `.baseline/launch-focus.json` workSet.

| Artifact          | Path                                                     |
| ----------------- | -------------------------------------------------------- |
| Cross-repo bridge | `01-docs/04-ops/coordination/cross-repo-agent-bridge.md` |
| Latest audit      | `01-docs/05-audit/engineering-audit-2026-06-07.md`       |
| GTM audit         | `01-docs/05-audit/gtm-audit-2026-06-05.md`               |

**Cross-repo:** S-XR-1 **closed** — XR-101/201 done. S-XR-2 **closed** — XR-202/301/302 done. S-XR-3: XR-401 **done**, XR-402 **ready**, XR-405 **done**. S-XR-4: XR-507 **done**, XR-508 **done**.
**Approval needed (Class S — parallel, `blocksIR: false`):** EXT-INF-002/013/014/015/016 — do **not** freeze implement queue. Nav: [human-gate-navigation](https://github.com/gtcx-ecosystem/gtcx-agentic/blob/main/01-docs/04-ops/human-gate-navigation.md).  
**Non-selectable in P22 (external class):** same IDs + S4-03, XR-403–404 — agents skip **that story ID**, not all IR.

## Work register (Protocol 22 — explicit backlog)

| ID                        | Title                                                          | P   | Status      | Class    |
| ------------------------- | -------------------------------------------------------------- | --- | ----------- | -------- |
| IR-2.1                    | Dependabot tier-3 merges                                       | P2  | blocked     | external |
| IR-2.2                    | AI SDK v5→v6 migration branch + eval regression                | P1  | done        | code     |
| IR-2.3                    | CodeQL/Trivy SARIF upload graceful when Code Security disabled | P0  | done        | code     |
| IR-3.1                    | WORM upload workflow                                           | P1  | done        | code     |
| IR-3.2                    | Document operator live path for runtime-evidence-check         | P1  | done        | ops-docs |
| IR-3.4                    | Expand `gtcx-ctl validate-environment` in CI                   | P1  | done        | code     |
| IR-3.5                    | Refresh DR fire-drill dated artifact                           | P1  | done        | ops-docs |
| IR-4.1                    | USSD path soak test in CI                                      | P1  | done        | code     |
| IR-5.1                    | Cross-repo-contract token                                      | P2  | done        | code     |
| IR-5.2                    | Re-run ecosystem-repo-review; ledger ≥9.0 matrix green         | P2  | done        | ops-docs |
| LAUNCH-PLAN-01            | Reconcile execution-roadmap + work register                    | P1  | done        | plan     |
| LAUNCH-PLAN-02            | Refresh auto-dev-state for launch/GTM                          | P1  | done        | plan     |
| LAUNCH-PLAN-03            | Global South 10x plan status row update                        | P1  | done        | plan     |
| GTM-AUDIT                 | Lane-5 GTM completeness audit                                  | P1  | done        | plan     |
| S2-13                     | Pen-test SOW signature                                         | P0  | blocked     | external |
| S4-03                     | PRD-002 Tier B: align TradePass DID doc resolver contract      | P1  | blocked     | external |
| P22-INFRA-01              | Protocol 22 adoption — manifest + script + CI                  | P0  | done        | ops-docs |
| S4-04                     | deployment-guard typecheck regression                          | P1  | done        | code     |
| S4-05                     | audit-signer + compliance-gateway lint regressions             | P1  | done        | code     |
| S4-06                     | README gaps (12 dirs) per repo-hygiene audit                   | P0  | done        | code     |
| S4-07                     | pnpm test quick 1/359 flake investigation                      | P2  | done        | code     |
| SECAS-S2-01               | Live-stack pen-test execution window                           | P0  | in_progress | ops-docs |
| XR-FABRIC-SPRINT-AUTH-001 | Sprint authority L2 read contract witness                      | P1  | done        | ops-docs |

## Implementation classes

| Class                | Detection                                                             | Development frame                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **code**             | Scripts, tests, gates, CI workflows, Terraform, K8s manifests         | **Select**                                                                                                                                              |
| **ops-docs**         | Author `01-docs/`, manifest, Protocol 22, roadmap reconcile, runbooks | **Select**                                                                                                                                              |
| **evidence-capture** | Manual UAT, staging probe with live credentials                       | Skip                                                                                                                                                    |
| **external**         | Human SOW signature, CISO decision, Supabase unpause, DNS zone:write  | Skip **story ID** — repo IR/witness continues ([nav](https://github.com/gtcx-ecosystem/gtcx-agentic/blob/main/01-docs/04-ops/human-gate-navigation.md)) |

## Status sources

1. **Work register** (this file) — authoritative for `IR-*` and `P22-*` items.
2. **`execution-roadmap.md`** — sprint tables (`S1-*`, `S2-*`, `S3-*`, `S4-*`); `**done**` / `**closed**` → done.
3. **`.baseline/memory/session.md`** — active session state and next recommendations.

## Forbidden

- Asking the user which story to pick when this manifest and roadmap exist.
- Starting external-class stories (EXT-INF-002/013/014/015/016, S4-03, INF-86 post-ceremony) without explicit human authorization.
- Silently skipping a story that is implementable in the current frame.

## After each story

1. Mark done in work register and/or `01-docs/05-audit/execution-roadmap.md`.
2. Run `pnpm agent:next-work` for the next ID.
3. Refresh `01-docs/05-audit/auto-dev-state.md` and `.baseline/memory/session.md`.
4. Micro-commit; run `node 03-platform/tools/scripts/validate-all.mjs` when touching repo gates.
