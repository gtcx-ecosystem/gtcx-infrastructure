---
title: AI CODEOWNER fleet rollout
status: current
date: 2026-06-12
owner: fabric-os
initiative: INIT-AGENT-TOOL-SCOUT
pilot: PILOT-CODEOWNER-FLEET
---

# AI CODEOWNER fleet rollout

Extends [baseline-os dual-AI CODEOWNER pattern](https://github.com/gtcx-ecosystem/baseline-os/blob/main/.github/workflows/ai-codeowner-review.yml) to tier-1 product repos. Workflows are **non-blocking** (`continue-on-error: true`).

## Fleet targets (Phase B)

| Repo          | Workflow                                    | Status   |
| ------------- | ------------------------------------------- | -------- |
| markets-os    | `.github/workflows/ai-codeowner-review.yml` | deployed |
| ledger-ui     | `.github/workflows/ai-codeowner-review.yml` | deployed |
| compliance-os | `.github/workflows/ai-codeowner-review.yml` | deployed |

## Operator setup

1. Add org secret `ANTHROPIC_API_KEY` (optional for fleet pilot — fallback comment posts when unset).
2. Ensure PRs from forks are excluded (`head.repo.full_name == github.repository`).
3. Human CODEOWNER approval remains mandatory before merge.

## Witness

`audit/evidence/tool-scout-codeowner-fleet-pilot.json`
