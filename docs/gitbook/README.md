---
title: 'GitBook — External Product Documentation'
status: 'current'
date: '2026-05-24'
owner: 'product-lead'
role: 'product-lead'
tier: 'standard'
tags: ['external', 'gitbook', 'docs-site', 'distribution']
review_cycle: 'on-change'
---

# GitBook — External Product Documentation

> **For external readers, integrators, and customers.**

This folder is the canonical entry-point for the external-facing product documentation per Protocol 1 v2.0 §`gitbook/`. In this repo, the actual build configuration and markdown source live one level deeper, in two complementary locations:

| Location                                                             | Purpose                                                               |
| -------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [`../external/docs-site/`](../external/docs-site/README.md)          | Markdown source-of-truth — what the public site renders               |
| [`../../tools/docs-site/README.md`](../../tools/docs-site/README.md) | Astro Starlight build configuration — how it gets rendered + deployed |

## Why this split exists

The substrate predates the Protocol 1 v2.0 standardization. Our public docs originally lived at `docs/external/docs-site/` (markdown) with the build config at `tools/docs-site/` (Astro). When Protocol 1 v2.0 named `gitbook/` as the canonical folder, we chose to keep the existing paths rather than churn them — and this README acts as the canonical entry-point at the v2.0 location.

The choice is reversible: the markdown source is portable and could be moved into `docs/gitbook/` directly in a future cleanup sprint if Protocol 1 v2.0 strict-path compliance becomes a hard requirement.

## What's here

External-facing product pages currently rendered to https://gtcx.io/compliance:

| Page                           | Source                                                                                               | Audience               |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- | ---------------------- |
| Overview                       | [`../external/docs-site/index.md`](../external/docs-site/index.md)                                   | All                    |
| `@gtcx/audit-signer`           | [`../external/docs-site/audit-signer.md`](../external/docs-site/audit-signer.md)                     | Engineers, auditors    |
| `terraform-aws-compliance-db`  | [`../external/docs-site/compliance-db.md`](../external/docs-site/compliance-db.md)                   | DevOps, infra teams    |
| `@gtcx/compliance-gateway-mcp` | [`../external/docs-site/compliance-gateway-mcp.md`](../external/docs-site/compliance-gateway-mcp.md) | AI agent runtimes      |
| Architecture                   | [`../external/docs-site/architecture.md`](../external/docs-site/architecture.md)                     | Architects, evaluators |

Build + deploy: see [`../../tools/docs-site/README.md`](../../tools/docs-site/README.md).

## Editorial rules

- **No internal-only paths.** External docs must not link to `audit/`, `engineering/`, or `operations/` directories. Curate the content into the external page instead.
- **Honest scores.** External docs use the same honest scores as internal docs.
- **Tone:** technical, no marketing fluff.
- **Code examples copy-paste-clean** on Node 20.

Full editorial conventions: [`../external/docs-site/README.md`](../external/docs-site/README.md).

## Related documents

- [`../external/docs-site/`](../external/docs-site/README.md) — markdown source
- [`../../tools/docs-site/README.md`](../../tools/docs-site/README.md) — Astro Starlight build
- [`../README.md`](../README.md) — docs index (audience-keyed)
- [`../documentation-governance.md`](../documentation-governance.md) — repo-local deviation rationale
