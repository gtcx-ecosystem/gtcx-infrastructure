---
title: 'Coordination — gtcx-infrastructure (Protocol 24)'
status: current
date: 2026-06-08
owner: gtcx-infrastructure
document_id: COORD-REPO-001
protocol: gtcx-docs/docs/governance/protocols/24-cross-repo-coordination/protocol.md
tags: ['coordination', 'cross-repo', 'protocol-24']
review_cycle: on-change
---

# Coordination — gtcx-infrastructure

**Cross-repo handoffs for this repository.** Execution SoR for the ecosystem: [gtcx-protocols cross-repo-agent-bridge](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/docs/operations/coordination/cross-repo-agent-bridge.md).

---

## Agent procedure (every cross-repo session)

| Step | Action                                                                                                                                                     |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | [Unblock playbook](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/docs/operations/coordination/ecosystem-unblock-playbook-2026-06.md) — F1–F10 |
| 2    | [Protocols bridge](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/docs/operations/coordination/cross-repo-agent-bridge.md) — latest updates    |
| 3    | This repo [`remaining-work.md`](remaining-work.md)                                                                                                         |
| 4    | Implement in **owner repo** — switch workspace if `owner_repo` ≠ here                                                                                      |
| 5    | Append [protocols log](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/docs/operations/coordination/cross-repo-agent-log.md)                    |

**Forbidden:** Chat-only handoffs · duplicate bridge tables · whole-repo freeze on EXT-INF.

---

## Folder layout

| Path                                     | Use                                                 |
| ---------------------------------------- | --------------------------------------------------- |
| [`outbound/`](outbound/README.md)        | **This repo → sibling** tickets (`to-<owner>-*.md`) |
| [`inbound/`](inbound/README.md)          | **Sibling → this repo** acks (`from-<sender>-*.md`) |
| [`remaining-work.md`](remaining-work.md) | Open XR / dependencies for **this repo only**       |

**Legacy archive:** If present, [`../operations/coordination/`](../operations/coordination/) — do not move; link from remaining-work.

---

## Raise human gates to hub

Class **S** assurance blockers → gtcx-agentic:

```text
docs/coordination/outbound/to-gtcx-agentic-<topic>-YYYY-MM-DD.md
```

Procedure: [`../assurance/coordination/README.md`](../assurance/coordination/README.md).

---

## Commands

```bash
pnpm agent:coordination:check    # when wired in repo
pnpm agent:next-work             # P22 — after coordination ack
```

---

## Ecosystem indexes (read-only)

| Artifact            | Owner                                                  |
| ------------------- | ------------------------------------------------------ |
| Sprint workplan     | gtcx-protocols `cross-repo-sprint-workplan-2026-06.md` |
| Blocker index       | baseline-os `workstream/index/blockers.md`             |
| Hub inbound archive | gtcx-docs `docs/gtm/inbound-tickets/`                  |

<!-- gtcx-external-workspace-v1 -->
