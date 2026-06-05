---
title: 'Program — legal / DPA (gtcx-infrastructure)'
status: current
date: 2026-06-08
owner: gtcx-infrastructure
program: legal-dpa
---

# Legal / DPA program — gtcx-infrastructure

| Field             | Value                                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Legal SoR**     | [gtcx-docs 01-docs/legal](https://github.com/gtcx-ecosystem/gtcx-docs/tree/main/01-docs/11-legal/)                         |
| **Hub packets**   | [gtcx-docs human-gates/packets](https://github.com/gtcx-ecosystem/gtcx-docs/tree/main/01-docs/08-gtm/human-gates/packets/) |
| **Pilot DPA/SLA** | **EXT-INF-014** / **EXT-INF-015** — Class **S**                                                                            |

## Repo layout

| Path                                             | Purpose                               |
| ------------------------------------------------ | ------------------------------------- |
| [`../../legal/README.md`](../../legal/README.md) | Pointer to hub or product terms       |
| `01-docs/11-legal/*.md`                          | Product-only ToS/privacy when shipped |

## Agent may (Class R)

- Link procurement index and templates
- Draft engineering references (non-binding)
- Queue legal in Status Update when EXT-INF-013 closes

## Agent may not (Class S)

- Sign DPA, SLA, LOI, or publish binding terms
- Claim legal review complete without counsel

## Dependency chain

```text
EXT-INF-013 (pilot owner) → EXT-INF-014 (DPA) → EXT-INF-015 (SLA)
```

<!-- gtcx-assurance-workspace-v1 -->
