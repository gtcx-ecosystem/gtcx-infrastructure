## Ecosystem agent learning card (normative — read every session)

**Canonical SoR:** [ecosystem-agent-learning-card-2026-06.md](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/01-docs/04-ops/coordination/ecosystem-agent-learning-card-2026-06.md) (gtcx-protocols).

### Read order

| Step | Link                                                                                                                                                                                    |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | [Unblock playbook F1–F10](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/01-docs/04-ops/coordination/ecosystem-unblock-playbook-2026-06.md)                                 |
| 2    | [P26 Status Update + post-pilot gating](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/01-docs/04-ops/coordination/agent-status-update-and-post-pilot-gating-2026-06-06.md) |
| 3    | [Human-external register](https://github.com/gtcx-ecosystem/gtcx-agentic/blob/main/01-docs/04-ops/coordination/human-external-blocker-register-2026-06.md)                              |
| 4    | [Cross-repo bridge — Latest updates](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/01-docs/04-ops/coordination/cross-repo-agent-bridge.md)                                 |
| 5    | This repo `01-docs/04-ops/agent-work-selection.md` · `01-docs/05-audit/auto-dev-state.md`                                                                                               |

**End of turn:** one P26 Status Update (not a menu) → append [cross-repo-agent-log](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/01-docs/04-ops/coordination/cross-repo-agent-log.md) if state changed.

### Rules (all repos)

- **`backlogClear`** on a sibling (e.g. gtcx-protocols) does **not** stop IR in **this** repo.
- **Class S** (H-03, DTF-5.5.4 LOI, pen-test SOW, …) → **Approval needed** only — never execute from wrong repo.
- **Class R** (tests, manifests, capture scripts) → run in-session; never list under Approval needed.
- **Never** execute H-03 countersign or XR-518 `--confirm` unless owner repo + Class A artifact says so.
