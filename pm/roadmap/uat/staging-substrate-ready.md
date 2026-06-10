---
jtbdId: JTBD-staging-substrate-ready
flowId: flow-staging-handoff
generator: uatFromJtbd
status: draft
---

# UAT — Staging substrate ready

Derived from `pm/ux/user-flows/flow-staging-handoff.md` §UAT outline.

| #   | Scenario                                       | Expected                                              |
| --- | ---------------------------------------------- | ----------------------------------------------------- |
| 1   | File test inbound handoff for one sibling repo | Inbound doc under `docs/operations/coordination/`     |
| 2   | Agent runs populate + apply sequence           | All commands exit 0; recorded in Status Update        |
| 3   | Outbound seal published                        | `from-gtcx-infrastructure-*` links evidence JSON      |
| 4   | Sibling prereq check from owner repo           | Product check passes (e.g. `w2:staging-prereq-check`) |
