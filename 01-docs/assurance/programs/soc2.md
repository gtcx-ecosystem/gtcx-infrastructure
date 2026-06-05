---
title: 'Program — SOC 2 (gtcx-infrastructure)'
status: current
date: 2026-06-08
owner: gtcx-infrastructure
program: soc2
---

# SOC 2 program — gtcx-infrastructure

| Field                | Value                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Process SoR**      | [gtcx-protocols soc/process](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/01-docs/08-gtm/soc/process.md)                     |
| **Type II index**    | [soc2-type2/evidence-index](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/01-docs/10-compliance/soc2-type2/evidence-index.md) |
| **Human gate**       | Auditor engagement — Class **S**, `blocksIR: false`                                                                                        |
| **Repo scope slice** | [`../../gtm/soc/README.md`](../../gtm/soc/README.md)                                                                                       |

## Repo-owned controls (edit)

| TSC   | Control | Evidence path | Command |
| ----- | ------- | ------------- | ------- |
| _TBD_ |         |               |         |

## Agent may (Class R)

- Gap assessment narratives (repo-specific)
- Link CI/monitoring evidence in `evidence-index.md`
- Map controls in `01-docs/08-gtm/soc/README.md`

## Agent may not (Class S)

- Claim SOC 2 Type I/II attested without auditor letter
- Fabricate control test results

## Parallel tracks (ecosystem)

| ID          | Owner repo          |
| ----------- | ------------------- |
| INT-S12-03  | gtcx-intelligence   |
| BL-SOC2-01  | baseline-os         |
| EXT-INF-016 | gtcx-infrastructure |

<!-- gtcx-assurance-workspace-v1 -->
