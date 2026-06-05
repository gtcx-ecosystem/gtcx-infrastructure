---
title: 'Inbound coordination — gtcx-infrastructure'
status: current
date: 2026-06-08
owner: gtcx-infrastructure
tags: ['coordination', 'inbound']
---

# Inbound — siblings → gtcx-infrastructure

**Naming:** `from-<sender-repo>-<topic>-YYYY-MM-DD.md`

## On pickup

1. Ack in this folder (or gtcx-agentic inbound for hub-only raises)
2. Update [`../remaining-work.md`](../remaining-work.md)
3. Append [protocols log](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/docs/operations/coordination/cross-repo-agent-log.md)
4. `pnpm agent:next-work` if implement queue open

## Legacy inbound

Files under `docs/operations/coordination/from-*.md` remain valid — index here when touched.

<!-- gtcx-external-workspace-v1 -->
