---
title: 'Unified LLM cost router — infrastructure consumer'
status: current
date: 2026-06-03
owner: gtcx-infrastructure
---

# Compliance-gateway → baseline-os cost router

**Canonical routing:** [`baseline-os/01-docs/specs/runtime/cost-router.md`](https://github.com/gtcx-ecosystem/baseline-os/blob/main/01-docs/specs/runtime/cost-router.md)

## Shim

`03-platform/tools/compliance-gateway/src/cost-router-shim.mjs` imports `routeInferenceRequest()` from built `baseline-os/03-platform/packages/baselineos/dist/core/cost-router.js` when available.

`server.mjs` uses `selectProviderWithBaseline()` (async) before legacy `providers.mjs`.

## Build order (staging/prod)

```bash
cd ../baseline-os && pnpm --filter baselineos build
cd ../gtcx-infrastructure/03-platform/tools/compliance-gateway && pnpm start
```

## K8s keys

`04-ship/kubernetes/base/services/compliance-gateway.yaml` — optional `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY` from `compliance-gateway-secrets`.

Seed secrets: `04-ship/03-platform/scripts/init-secrets.sh`

## Budget

Gateway retains **principal daily budget** (`budget.mjs`) — routing is baseline-os; spend caps stay in infra.
