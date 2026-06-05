---
title: 'Assurance workspace — gtcx-infrastructure'
status: current
date: 2026-06-08
owner: gtcx-infrastructure
document_id: ASSURANCE-REPO-START
tags: ['assurance', 'agents', 'pen-test', 'soc2', 'pilot']
review_cycle: on-change
---

# Assurance workspace — gtcx-infrastructure

**Agent entry for pen-test, SOC 2, pilot, attestation, and legal gates in this repo.**

Read this folder **every session** when external assurance touches the repo. Ecosystem framework: [gtcx-agentic assurance-agent-framework](https://github.com/gtcx-ecosystem/gtcx-agentic/blob/main/01-docs/04-ops/assurance-agent-framework.md).

---

## Quick start (60 seconds)

| Step | Action                                                                              |
| ---- | ----------------------------------------------------------------------------------- |
| 1    | Read [`gates.local.json`](gates.local.json) — open gates for **this** repo          |
| 2    | Read [`evidence-index.md`](evidence-index.md) — where to write witnesses            |
| 3    | Read [`programs/README.md`](programs/README.md) — program cards                     |
| 4    | Run `pnpm agent:next-work` — implement lane is **not** frozen by Class S gates      |
| 5    | End with Status Update — template: `01-docs/04-ops/agent-status-update-template.md` |

**Navigation:** [`01-docs/04-ops/human-gate-navigation.md`](../operations/human-gate-navigation.md) — `blocksIR: false` = parallel witness, not repo blocked.

---

## Procedure (five steps)

### 1. Classify

| Class | Meaning                                      | Agent                                  |
| ----- | -------------------------------------------- | -------------------------------------- |
| **S** | Human signature / vendor / legal             | Status Update **Approval needed** only |
| **A** | Custody (attestation write, authorized `gh`) | Execute when artifact says so          |
| **R** | Engineering, packets, indexes                | Self-execute                           |

### 2. Lane

- **Implement** — P22 story in this repo
- **Witness** — evidence JSON, audit rows, coordination docs
- **Sibling witness** — code done here; owner repo owes E2E (see `gates.local.json`)
- **Hub raise** — new blocker → [`coordination/README.md`](coordination/README.md)

### 3. Programs

| Program           | Card                                                 |
| ----------------- | ---------------------------------------------------- |
| Pen-test          | [`programs/pen-test.md`](programs/pen-test.md)       |
| SOC 2             | [`programs/soc2.md`](programs/soc2.md)               |
| Pilot / field     | [`programs/pilot.md`](programs/pilot.md)             |
| Trust attestation | [`programs/attestation.md`](programs/attestation.md) |
| Legal / DPA       | [`programs/legal-dpa.md`](programs/legal-dpa.md)     |

### 4. Evidence

Only paths listed in [`evidence-index.md`](evidence-index.md). No secrets, no unsigned legal PDFs, no PII in git.

### 5. Handoff

- P26 Status Update at end of turn
- Cross-repo: outbound → gtcx-agentic → inbound ack on hub

---

## Ecosystem SoR (read-only)

| Resource          | URL                                                                                                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hub manifest      | [human-gates.manifest.json](https://github.com/gtcx-ecosystem/gtcx-agentic/blob/main/01-docs/06-coordination/human-gates.manifest.json)                                    |
| Hub register      | [human-external-blocker-register-2026-06](https://github.com/gtcx-ecosystem/gtcx-agentic/blob/main/01-docs/04-ops/coordination/human-external-blocker-register-2026-06.md) |
| Assurance index   | [gtcx-protocols assurance](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/01-docs/08-gtm/assurance/README.md)                                                  |
| Pen-test wave     | [pen-test-2026-08](https://github.com/gtcx-ecosystem/gtcx-protocols/tree/main/01-docs/05-audit/pen-test-2026-08/)                                                          |
| SOC Type II index | [soc2-type2/evidence-index](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/01-docs/10-compliance/soc2-type2/evidence-index.md)                                 |

## Repo slices (buyer layout)

| Slice          | Path                                                     |
| -------------- | -------------------------------------------------------- |
| GTM hub        | [`../gtm/README.md`](../gtm/README.md)                   |
| Pen-test scope | [`../gtm/pen-test/README.md`](../gtm/pen-test/README.md) |
| SOC scope      | [`../gtm/soc/README.md`](../gtm/soc/README.md)           |
| Legal pointer  | [`../legal/README.md`](../legal/README.md)               |

---

## Forbidden (any program)

| Wrong                                       | Right                                                            |
| ------------------------------------------- | ---------------------------------------------------------------- |
| "Repo blocked on EXT-INF"                   | "Approval needed — implement queue continues"                    |
| Sign SOW / DPA as agent                     | Packet + escalate Class S                                        |
| Claim pen-test or SOC done without evidence | Update `gates.local.json` + hub register only when witness filed |
| Duplicate RFP/findings in this repo         | Link gtcx-protocols SoR                                          |

<!-- gtcx-assurance-workspace-v1 -->
