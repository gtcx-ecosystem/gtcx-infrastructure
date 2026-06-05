---
title: 'Assurance evidence index — gtcx-infrastructure'
status: current
date: 2026-06-08
owner: gtcx-infrastructure
tags: ['assurance', 'evidence']
review_cycle: on-change
---

# Assurance evidence index — gtcx-infrastructure

Redacted witnesses and coordination evidence **for this repo only**. Canonical findings and auditor letters live in **gtcx-protocols** or **gtcx-docs** — link, do not duplicate.

## Write paths (agents may create)

| Kind              | Path                                    | Format        |
| ----------------- | --------------------------------------- | ------------- |
| CI / gate witness | `01-docs/04-ops/evidence/*.json`        | Redacted JSON |
| Audit closure     | `01-docs/05-audit/evidence/*.json`      | Redacted JSON |
| Coordination ack  | `01-docs/04-ops/coordination/from-*.md` | Markdown      |

## Read paths (this repo)

| Artifact                        | Path | Status |
| ------------------------------- | ---- | ------ |
| _Add rows as evidence is filed_ |      |        |

## Forbidden in git

- Raw API keys, tokens, `.env` dumps
- Unsigned SOW/DPA/LOI PDFs with commercial terms
- PII from field pilots (PRD-003 captures)
- Pen-test raw findings (use protocols SoR)

## After filing evidence

1. Add row to this index
2. Update `gates.local.json` status if gate closed
3. Re-run `pnpm agent:next-work`
4. Status Update with commit SHA

<!-- gtcx-assurance-workspace-v1 -->
