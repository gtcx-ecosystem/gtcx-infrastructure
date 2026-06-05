---
title: 'Specs'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'informational'
tags: ['specs', 'reference']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 95
autonomy_level: 'sovereign'
---

# Specs

Substrate specifications — repo-local conventions and frameworks that don't fit elsewhere in the v2.0 standard taxonomy. Each spec is a substantive document (>140 lines) describing a system-level concern.

For architecture decisions, see [`../decisions/README.md`](../architecture/decisions/README.md). For API contracts, see [`../api/README.md`](../api/README.md). For runbooks, see [`../operations/runbooks/README.md`](../operations/runbooks/README.md).

## Contents

| File                                                             | Purpose                                        |
| ---------------------------------------------------------------- | ---------------------------------------------- |
| [`cicd-pipeline.md`](./cicd-pipeline.md)                         | CI/CD stages, quality gates, security scanning |
| [`data-governance.md`](./data-governance.md)                     | Data classification, PII handling, sovereignty |
| [`observability-framework.md`](./observability-framework.md)     | Metrics, logging, tracing, SLOs                |
| [`resilience-framework.md`](./resilience-framework.md)           | RTO/RPO, SPOF, degradation tiers               |
| [`scalability-framework.md`](./scalability-framework.md)         | HPA, caching, load testing                     |
| [`testing-framework.md`](./testing-framework.md)                 | Test taxonomy, coverage targets, CI gates      |
| [`ussd-protocol.md`](./ussd-protocol.md)                         | USSD-mode interaction specification            |
| [`vault-dynamic-credentials.md`](./vault-dynamic-credentials.md) | HashiCorp Vault credential rotation            |

## What was removed

The `frontend/`, `design/`, `product/`, `data/`, `testing/`, and `project-specification.md` template stubs were removed in the 2026-05-24 cleanup — they were never-filled-in placeholders (`{Product Name}`, `[Project Name]`) inherited from a template that didn't apply to the substrate-runtime nature of this repo. Rationale recorded in the docs-standard self-attestation on the `01-docs/v2-standard-alignment` branch (PR #57).
