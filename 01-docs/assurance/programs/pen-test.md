---
title: 'Program — pen-test (gtcx-infrastructure)'
status: current
date: 2026-06-08
owner: gtcx-infrastructure
program: pen-test
---

# Pen-test program — gtcx-infrastructure

| Field                | Value                                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Process SoR**      | [gtcx-protocols pen-test/process](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/01-docs/08-gtm/pen-test/process.md) |
| **Active wave**      | [pen-test-2026-08](https://github.com/gtcx-ecosystem/gtcx-protocols/tree/main/01-docs/05-audit/pen-test-2026-08/)                |
| **Human gate**       | **H-05** / **EXT-INF-002** — Class **S**, `blocksIR: false`                                                                      |
| **Repo scope slice** | [`../../gtm/pen-test/README.md`](../../gtm/pen-test/README.md)                                                                   |

## Repo scope (edit)

| Component | In Wave 1 scope | Notes |
| --------- | --------------- | ----- |
| _TBD_     |                 |       |

## Agent may (Class R)

- Update scope table in `01-docs/08-gtm/pen-test/README.md`
- Link intake evidence in `evidence-index.md`
- Assemble H-05 packet pointers (hub: gtcx-agentic)
- Continue implement/witness queue in parallel

## Agent may not (Class S)

- Select vendor or sign SOW
- Claim "pen-test complete" without protocols findings path
- Copy RFP/score matrix into this repo

## When H-05 closes

1. Add redacted SOW witness JSON to `evidence-index.md` (if repo holds intake copy)
2. Update `gates.local.json` — remove or mark gate done
3. Hub register row → witness only (gtcx-agentic)

<!-- gtcx-assurance-workspace-v1 -->
