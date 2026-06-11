---
title: 'Agent Authority Classification — Protocol 28 Reference'
status: current
protocol: canon-os/01-docs/governance/protocols/28-agent-authority-classification/
date: 2026-06-03
owner: fabric-os
---

# Agent Authority Classification — Protocol 28 Reference

This repo follows [Protocol 28 — Agent Authority Classification](https://github.com/gtcx-ecosystem/canon-os/blob/main/01-docs/governance/protocols/28-agent-authority-classification/protocol.md).

## Authority classes in this repo

| Class                      | Description                                                     | Examples in gtcx-infrastructure                                                   |
| -------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **S** — Sovereign human    | Human decides; agent stops                                      | Legal CSP countersign (H-03), founder/board **stop**, user says **do not commit** |
| **A** — Agent custody      | Prior authorization exists; agent executes + publishes evidence | `terraform apply` after XR-401-C, `gh issue comment`, SPKI export, evidence JSON  |
| **R** — Routine autonomous | No per-step authorization; agent runs                           | `lint`, `test`, `build`, `agent:next-work`, hub gates, cross-repo log append      |

## Proceed Brief addition

Every Proceed Brief in this repo must include:

```markdown
**Authority class:** <S | A | R>
**Authorization artifact:** <path or — for Class R>
```

## INF-86 reference map

| Step                                 | Class                | Executor                             | Evidence                                    |
| ------------------------------------ | -------------------- | ------------------------------------ | ------------------------------------------- |
| XR-401-A algorithm attestation       | A → done             | gtcx-agentic                         | protocols `inf-86-xr-401-*`                 |
| XR-401-B custodian roster            | A → done             | gtcx-agentic                         | protocols B evidence                        |
| XR-401-C ceremony authorization      | A → done             | gtcx-agentic                         | protocols C evidence                        |
| XR-402 terraform apply + SPKI export | A                    | gtcx-infrastructure custodian agents | `01-docs/05-audit/evidence/inf-86/gh-bog-*` |
| Post protocols #61                   | A                    | infra agent with `gh`                | issue comment URL                           |
| XR-403 bog.json production           | A (after SPKI ready) | gtcx-protocols                       | PR + checklist                              |
| H-03 legal CSP countersign           | **S**                | human                                | human-gates packet                          |

## Adoption artifacts

| Artifact       | Path                                                           |
| -------------- | -------------------------------------------------------------- |
| Cursor rule    | `.cursor/rules/protocol-28-agent-authority-classification.mdc` |
| This reference | `01-docs/04-ops/agent-authority-classification.md`             |
