---
title: MCP / RAG setup (Model B)
status: current
date: 2026-06-08
owner: gtcx-infrastructure
---

# MCP / RAG setup — gtcx-infrastructure

**Topology:** Model B (`rag.topology: local`)

## Validate

```bash
pnpm validate:rag-config
```

## Index (local)

```bash
export BASELINE_PROJECT_ROOT=$(pwd)
node ../baseline-os/platform/packages/baselineos/dist/cli/bin.js index -f
```

## Eval smoke

```bash
pnpm rag:eval
```

Witness: `audit/evidence/rag-model-b-gtcx-infrastructure-latest.json`
