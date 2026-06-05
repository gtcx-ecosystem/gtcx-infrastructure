---
title: 'Human gate navigation — how repos should read Class S gates'
status: current
date: 2026-06-05
owner: gtcx-agentic
document_id: AGENTIC-HG-NAV-001
tags: ['agents', 'protocol-22', 'protocol-26', 'protocol-28', 'EXT-INF-002']
review_cycle: on-change
---

# Human gate navigation

**Problem:** Repos treat **EXT-INF-002** (pen-test SOW), **H-03**, and other Class **S** gates as **whole-repo blocked** — idle agents, frozen IR, or stories parked in **Deferred**. That is wrong for almost all ecosystem gates.

**SoR:** [`human-gates.manifest.json`](../coordination/human-gates.manifest.json) — field **`blocksIR: false`** is normative.

---

## Decision tree (read on every session)

```
pnpm agent:next-work
        │
        ├─► storyId returned (implement / witness)?
        │       YES → Class R work — START NOW (human gates parallel)
        │
        ├─► backlogClear: true ?
        │       YES → witness / PLAN / coordination (Class R) — NOT idle
        │
        └─► humanOnly / approvalNeeded in JSON?
                YES → Status Update **Approval needed** only
                      FORBIDDEN: next.blocked:true for whole repo
                      FORBIDDEN: "waiting on EXT-INF before we can code"
```

---

## Three lanes (never conflate)

| Lane                | Who                         | Blocks code merges?        | Blocks claims?          | P26 bucket                               |
| ------------------- | --------------------------- | -------------------------- | ----------------------- | ---------------------------------------- |
| **Implement**       | Agent Class R               | No                         | No                      | **Next priority**                        |
| **Witness**         | Agent Class R in owner repo | No                         | No                      | **Next priority** or **Sibling witness** |
| **Approval needed** | Human Class S/A             | **No** (`blocksIR: false`) | Yes — named claims only | **Approval needed**                      |

**`blocked` in a work register** on an EXT-INF row means **do not auto-select that story ID** — it does **not** mean stop other IR/witness work.

---

## Exemplar: EXT-INF-002 / H-05 / INT-S12-01 (pen-test SOW)

| Field             | Value                                                                  |
| ----------------- | ---------------------------------------------------------------------- |
| **Class**         | **S** — Security/founder signs vendor SOW                              |
| **blocksIR**      | **`false`** — IR and witness continue in parallel                      |
| **blocksClaims**  | `"pen-test complete"` only — not deploy, not staging, not Protocol 22  |
| **Agent may**     | H-05 packet, register rows, hub witness, intelligence **INT-R5** drain |
| **Agent may not** | Select vendor, sign SOW, mark pen-test done                            |

### Correct Status Update snippet

```markdown
### Next priority

- **Owner:** gtcx-infrastructure (or current repo)
- **Action:** Continue **IR-\*** / witness queue per `agent:next-work`
- **Because:** Implement queue not blocked — pen-test is parallel Class S

### Approval needed

- **EXT-INF-002 / H-05** — Security: sign pen-test SOW per [H-05 packet](docs/operations/coordination/ext-inf-002-pen-test-h05-packet-2026-06-05.md)
```

### Forbidden phrases (any repo)

| Wrong                                       | Right                                                     |
| ------------------------------------------- | --------------------------------------------------------- |
| "Blocked on EXT-INF-002" (repo-wide)        | "Approval needed: EXT-INF-002 parallel"                   |
| "Cannot merge until pen-test SOW"           | "Cannot **claim** pen-test complete until SOW"            |
| "Skip development frame — EXT-INF open"     | "Skip **selecting** EXT-INF story; drain implement queue" |
| EXT-INF in **Deferred** with no `dependsOn` | EXT-INF in **Approval needed** only                       |
| `backlogClear` → stop session               | `backlogClear` → witness / PLAN (Class R)                 |

---

## Per-repo quick reference

| Repo                    | When EXT-INF open, agents should                                                                                                                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **gtcx-agentic**        | Hub packets + register; `backlogClear` → witness                                                                                                                                                                  |
| **gtcx-infrastructure** | Continue **IR-\*** / validate-all witness; S2-13 = human only                                                                                                                                                     |
| **gtcx-intelligence**   | Drain **INT-R5-03/02** — [bank-grade ceiling unblock](https://github.com/gtcx-ecosystem/gtcx-intelligence/blob/main/docs/operations/coordination/from-gtcx-intelligence-bank-grade-ceiling-unblock-2026-06-06.md) |
| **gtcx-protocols**      | validate / index / P22 cadence — H-05 under Approval needed                                                                                                                                                       |
| **baseline-os**         | `backlogClear` → BL-WITNESS-\* or hub; BL-O-01 parallel                                                                                                                                                           |
| **gtcx-mobile**         | Maestro/i18n = Approval needed; code stories continue until register clear                                                                                                                                        |

---

## Wiring checklist (repo maintainers)

1. `human-gates.manifest.json` gate has **`blocksIR: false`**.
2. `agent:next-work` — Class S gates in **`humanOnly`** / **`approvalNeeded`**, not `next.blocked: true` for whole repo.
3. Work register **external** class = **non-selectable story**, not **repo frozen**.
4. Status Update uses **four buckets** — [`human-gates-system.md`](human-gates-system.md) §2.
5. Stale docs saying "block all IR merges" on INT-S12-01 — **delete or correct** (see protocols learning card errata).

```bash
# gtcx-agentic validation
pnpm agent:human-gates:check    # exit 0
```

---

## Related

| Doc             | Path                                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Manifest        | [`human-gates.manifest.json`](../coordination/human-gates.manifest.json)                                                                                                             |
| Register        | [`human-external-blocker-register-2026-06.md`](coordination/human-external-blocker-register-2026-06.md)                                                                              |
| H-05 packet     | [`ext-inf-002-pen-test-h05-packet-2026-06-05.md`](coordination/ext-inf-002-pen-test-h05-packet-2026-06-05.md)                                                                        |
| Playbook F1–F7  | [ecosystem-unblock-playbook](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/docs/operations/coordination/ecosystem-unblock-playbook-2026-06-06.md)                       |
| Operating model | [human-assurance-gates-operating-model](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/docs/operations/coordination/human-assurance-gates-operating-model-2026-06-06.md) |
