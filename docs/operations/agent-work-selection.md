---
title: 'Agent Work Selection Manifest'
status: current
date: 2026-06-03
owner: gtcx-infrastructure
role: platform-architect
tier: critical
tags: ['protocol-22', 'agent', 'work-selection']
review_cycle: on-change
document_id: OPS-AWS-001
protocol: gtcx-docs/docs/governance/protocols/22-agent-work-selection/protocol.md
adoption_status: pilot
---

# Agent Work Selection — gtcx-infrastructure

> **Protocol:** [Protocol 22 — Agent Work Selection](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/docs/governance/protocols/22-agent-work-selection/protocol.md) (AGENT-WORK-SEL)
> **Rule:** Agents compute next work from the execution roadmap and work register. **Never ask the operator which story to pick.**

## Canonical paths

| Artifact                           | Path                              |
| ---------------------------------- | --------------------------------- |
| Execution roadmap (story register) | `docs/audit/execution-roadmap.md` |
| Session pointer                    | `docs/audit/auto-dev-state.md`    |
| Baseline session memory            | `.baseline/memory/session.md`     |
| Selection script                   | `scripts/agent-next-work.mjs`     |

## Commands

```bash
pnpm agent:next-work

# Regulatory-audit frame (prefer evidence / assurance work when automatable)
AGENT_FRAME=regulatory-audit pnpm agent:next-work
```

## Active phase

**Sprint 2: M2 Hardening (IR-2) + S-XR-2 cross-repo coordination**

When `pnpm agent:next-work` returns a story ID, execute it. When `backlogClear: true`, run **witness** (`node tools/scripts/validate-all.mjs`) + refresh evidence gates — do not idle.

| Artifact          | Path                                                                   |
| ----------------- | ---------------------------------------------------------------------- |
| Cross-repo bridge | `docs/operations/coordination/cross-repo-agent-bridge.md`              |
| Remaining work    | `docs/operations/coordination/remaining-cross-repo-work-2026-06-03.md` |
| Latest audit      | `docs/audit/master-audit-2026-06-02.md`                                |

**Cross-repo:** S-XR-1 **closed** — XR-301/302 done, INT-S3-08 done. S-XR-2 in progress.
**Blocked (external class — skip in development frame):** S1-09 (human selection), S4-03 (protocols contract), INF-86/XR-401–405 (CISO), XR-507 (DNS), XR-508 (Supabase).

## Work register (Protocol 22 — explicit backlog)

| ID           | Title                                                          | P   | Status  | Class    |
| ------------ | -------------------------------------------------------------- | --- | ------- | -------- |
| IR-2.1       | Dependabot tier-3 merges                                       | P2  | blocked | external |
| IR-2.2       | AI SDK v5→v6 migration branch + eval regression                | P1  | pending | code     |
| IR-2.3       | CodeQL/Trivy SARIF upload graceful when Code Security disabled | P0  | done    | code     |
| IR-3.1       | WORM upload workflow                                           | P1  | pending | code     |
| IR-3.2       | Document operator live path for runtime-evidence-check         | P1  | pending | ops-docs |
| IR-3.5       | Refresh DR fire-drill dated artifact                           | P1  | pending | ops-docs |
| IR-5.1       | Cross-repo-contract token                                      | P2  | pending | code     |
| S2-13        | Pen-test SOW signature                                         | P0  | blocked | external |
| S4-03        | PRD-002 Tier B: align TradePass DID doc resolver contract      | P1  | blocked | external |
| P22-INFRA-01 | Protocol 22 adoption — manifest + script + CI                  | P0  | done    | ops-docs |

## Implementation classes

| Class                | Detection                                                            | Development frame |
| -------------------- | -------------------------------------------------------------------- | ----------------- |
| **code**             | Scripts, tests, gates, CI workflows, Terraform, K8s manifests        | **Select**        |
| **ops-docs**         | Author `docs/`, manifest, Protocol 22, roadmap reconcile, runbooks   | **Select**        |
| **evidence-capture** | Manual UAT, staging probe with live credentials                      | Skip              |
| **external**         | Human SOW signature, CISO decision, Supabase unpause, DNS zone:write | Skip              |

## Status sources

1. **Work register** (this file) — authoritative for `IR-*` and `P22-*` items.
2. **`execution-roadmap.md`** — sprint tables (`S1-*`, `S2-*`, `S3-*`, `S4-*`); `**done**` / `**closed**` → done.
3. **`.baseline/memory/session.md`** — active session state and next recommendations.

## Forbidden

- Asking the user which story to pick when this manifest and roadmap exist.
- Starting external-class stories (S1-09, S2-13, S4-03, INF-86 chain) without explicit human authorization.
- Silently skipping a story that is implementable in the current frame.

## After each story

1. Mark done in work register and/or `docs/audit/execution-roadmap.md`.
2. Run `pnpm agent:next-work` for the next ID.
3. Refresh `docs/audit/auto-dev-state.md` and `.baseline/memory/session.md`.
4. Micro-commit; run `node tools/scripts/validate-all.mjs` when touching repo gates.
