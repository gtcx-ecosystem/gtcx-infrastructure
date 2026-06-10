---
title: Stakeholder map — GTCX Infrastructure
date: 2026-06-10
---

# Stakeholder map

| Stakeholder                                                                         | Interest                                                   | Influence | Personas                                | Implications for this repo                                                     |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------- | --------- | --------------------------------------- | ------------------------------------------------------------------------------ |
| **Sibling product engineering** (compliance-os, markets, terminal-os, intelligence) | Staging unblocked fast; clear handoff seals                | High      | `sibling-integrator`                    | DaaS cards, ingress matrix, `from-gtcx-infrastructure-*` coordination docs     |
| **Platform / infra custodian**                                                      | Fleet health, Terraform convergence, agent execution (P27) | High      | `platform-operator`                     | `validate-all`, fleet probe, staging scripts under `platform/scripts/staging/` |
| **Human / Security (sovereign)**                                                    | Pen-test SOW, SOC 2 auditor engagement                     | High      | `security-operator`, `compliance-buyer` | Class S in `pm/sovereign-approval-register.json` — **Approval needed only**    |
| **Human / Procurement**                                                             | Vendor countersign, auditor MSA                            | Medium    | `compliance-buyer`                      | Post-approval actions on EXT-INF-002, BL-SOC2-01 — not engineering blockers    |
| **Regulator / external auditor**                                                    | Evidence traceability, no false attestation                | Medium    | `compliance-buyer`                      | `audit/evidence/*`, master audit, deployment-proof-index links                 |
| **GTM / pilot leadership**                                                          | ZWCMP pilot substrate for GR-T2                            | Medium    | `compliance-buyer` (economic)           | Launch focus north star; parallel EXT-INF-013 (pilot owner) — hub Class S      |
| **Ecosystem repos** (gtcx-protocols, gtcx-agentic, baseline-os)                     | Normative protocols, vault, five-core audits               | Medium    | `platform-operator`                     | P22/P27/P42 adoption; bridge-os A1 probe harness                               |

## Class S gates (stakeholder-linked)

| Gate ID                           | Stakeholder                   | Status              | blocksIR |
| --------------------------------- | ----------------------------- | ------------------- | -------- |
| EXT-INF-002 (pen-test SOW)        | Human / Security              | approved 2026-06-10 | false    |
| BL-SOC2-01 (SOC 2 Type I auditor) | Human / Legal, CISO + Finance | approved 2026-06-10 | false    |
| EXT-INF-013 (ZWCMP pilot owner)   | GTM / Leadership              | open (hub)          | false    |
| Vendor pen-test countersign       | Human / Procurement           | pending             | false    |

Engineering stories must **not** encode sovereign signature work — link stakeholder row instead.
