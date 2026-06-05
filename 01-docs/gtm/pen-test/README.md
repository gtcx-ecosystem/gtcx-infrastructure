---
title: 'Pen-test — gtcx-infrastructure slice'
status: current
date: 2026-06-06
owner: gtcx-infrastructure
tier: standard
tags: ['gtm', 'pen-test', 'assurance']
review_cycle: on-change
---

# Pen-test — gtcx-infrastructure

**Process:** [gtcx-protocols pen-test process](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/01-docs/08-gtm/pen-test/process.md)  
**Active wave:** [pen-test-2026-08](https://github.com/gtcx-ecosystem/gtcx-protocols/tree/main/01-docs/05-audit/pen-test-2026-08/)

## Repo scope

| Component                    | Wave 1                                                                                    | Notes                                            |
| ---------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Staging EKS / ingress / IRSA | In scope                                                                                  | Prerequisites per protocols wave README          |
| K8s pen-test overlay         | [`04-ship/kubernetes/overlays/pen-test/`](../../../04-ship/kubernetes/overlays/pen-test/) | Isolated targets when needed                     |
| Legacy RFP scope             | [`regulatory/pentest-scope-rfp.md`](../regulatory/pentest-scope-rfp.md)                   | Infra-specific scope; canonical RFP in protocols |

## Evidence in this repo

| Artifact                | Path                                                                              |
| ----------------------- | --------------------------------------------------------------------------------- |
| Pen-test intake witness | `01-docs/04-ops/coordination/pen-test-intake-evidence-2026-05-31.md` (if present) |
| Staging topology        | CI `pnpm check:staging-topology` (protocols index)                                |

Findings SoR: **gtcx-protocols** `01-docs/05-audit/pen-test-2026-08/findings/`.
