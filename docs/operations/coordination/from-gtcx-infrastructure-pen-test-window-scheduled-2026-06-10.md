---
title: Pen-test window scheduled — SECAS-S2-01
status: current
date: 2026-06-10
owner: gtcx-infrastructure
program: INIT-GTCX-INFRA-SECAS
storyId: SECAS-S2-01
authorityClass: A
tags: ['coordination', 'pen-test', 'secas-s2']
---

# Pen-test window scheduled

**Witness:** [`audit/evidence/pen-test-window-2026-06-10.json`](../../../audit/evidence/pen-test-window-2026-06-10.json)

## Window

| Field       | Value               |
| ----------- | ------------------- |
| Start       | 2026-06-17          |
| End         | 2026-06-21          |
| TZ          | Africa/Johannesburg |
| Environment | staging             |

## Prerequisites met

| Check                               | Status                                                       |
| ----------------------------------- | ------------------------------------------------------------ |
| EXT-INF-002 sovereign + countersign | approved 2026-06-10                                          |
| Fleet health                        | PASS 4/4 @ 2026-06-10T09:27:04Z                              |
| Intake pack                         | `audit/pen-test-scope-2026.md`, `audit/pen-test-rfp-2026.md` |

## Remaining

| Step                            | Owner               | Status         |
| ------------------------------- | ------------------- | -------------- |
| Vendor executes live-stack test | Vendor              | during window  |
| Report ingest                   | gtcx-infrastructure | pending        |
| Close SEC-PENTEST-01            | gtcx-infrastructure | pending report |
